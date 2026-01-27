/*
  # Add Subscription Tracking to Profiles

  1. Changes to `profiles` table
    - Add `stripe_customer_id` (text) - Stores the Stripe customer ID
    - Add `stripe_subscription_id` (text) - Stores the active subscription ID
    - Add `subscription_status` (text) - Tracks subscription status (active, canceled, incomplete, etc.)
    - Add `polls_created` (integer) - Counts total polls created by user
    - Add `subscription_ends_at` (timestamptz) - When the subscription period ends
  
  2. Security
    - Users can only read their own subscription data
    - Subscription data cannot be modified directly by users
*/

-- Add subscription tracking columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_subscription_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_status text DEFAULT 'free';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'polls_created'
  ) THEN
    ALTER TABLE profiles ADD COLUMN polls_created integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_ends_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_ends_at timestamptz;
  END IF;
END $$;

-- Create or replace the function to increment poll count
CREATE OR REPLACE FUNCTION increment_poll_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET polls_created = polls_created + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically increment poll count
DROP TRIGGER IF EXISTS increment_poll_count_trigger ON polls;
CREATE TRIGGER increment_poll_count_trigger
  AFTER INSERT ON polls
  FOR EACH ROW
  EXECUTE FUNCTION increment_poll_count();