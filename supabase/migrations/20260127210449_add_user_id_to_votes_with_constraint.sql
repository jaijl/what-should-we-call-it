/*
  # Add user_id to votes table with unique constraint

  1. Changes
    - Add `user_id` column to `votes` table that references auth.users
    - Add unique constraint on (user_id, poll_id, option_id) to prevent duplicate votes
    - This ensures each user can only vote once per option per poll
  
  2. Security
    - Update RLS policies to require authentication for voting
    - Users can only delete their own votes
*/

-- Add user_id column to votes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'votes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE votes ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add unique constraint to prevent duplicate votes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'votes_user_poll_option_unique'
  ) THEN
    ALTER TABLE votes 
    ADD CONSTRAINT votes_user_poll_option_unique 
    UNIQUE (user_id, poll_id, option_id);
  END IF;
END $$;

-- Drop existing vote policies to recreate them
DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Anyone can create votes" ON votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;

-- Create new policies for authenticated voting
CREATE POLICY "Authenticated users can view all votes"
  ON votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create votes"
  ON votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
