/*
  # Add Subscription and Generation Tracking

  1. New Tables
    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `stripe_customer_id` (text, unique)
      - `stripe_subscription_id` (text)
      - `subscription_status` (text) - 'active', 'canceled', 'past_due', etc.
      - `current_period_end` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `generation_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `generation_count` (integer) - tracks total generations used
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can read their own subscription data
    - Users can read their own generation usage
    - Only service role can update subscription data (via webhooks)
    - Generation count updated via edge function with service role

  3. Indexes
    - Index on user_id for fast lookups
    - Unique constraint on user_id in generation_usage
*/

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text,
  subscription_status text DEFAULT 'free',
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create generation_usage table
CREATE TABLE IF NOT EXISTS generation_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_usage_user_id ON generation_usage(user_id);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for generation_usage
CREATE POLICY "Users can view own generation usage"
  ON generation_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically create generation_usage record for new users
CREATE OR REPLACE FUNCTION create_generation_usage_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO generation_usage (user_id, generation_count)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create generation_usage when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_generation_usage_for_new_user();

-- Function to check if user can generate (has premium or < 2 free generations)
CREATE OR REPLACE FUNCTION can_user_generate(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_generation_count integer;
  v_subscription_status text;
BEGIN
  -- Get generation count
  SELECT generation_count INTO v_generation_count
  FROM generation_usage
  WHERE user_id = p_user_id;
  
  -- If no record exists, create one
  IF v_generation_count IS NULL THEN
    INSERT INTO generation_usage (user_id, generation_count)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    v_generation_count := 0;
  END IF;
  
  -- Check if user has premium subscription
  SELECT subscription_status INTO v_subscription_status
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND subscription_status = 'active'
  AND (current_period_end IS NULL OR current_period_end > now());
  
  -- Premium users can always generate
  IF v_subscription_status = 'active' THEN
    RETURN true;
  END IF;
  
  -- Free users get 2 generations
  RETURN v_generation_count < 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment generation count
CREATE OR REPLACE FUNCTION increment_generation_count(p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO generation_usage (user_id, generation_count, updated_at)
  VALUES (p_user_id, 1, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    generation_count = generation_usage.generation_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;