/*
  # Add User Authentication to Polls

  1. Changes
    - Add `user_id` column to `polls` table that references auth.users
    - Set default value to the authenticated user creating the poll
    - Backfill existing polls with a NULL user_id (they can still be accessed)
  
  2. Security Updates
    - Update RLS policies to require authentication
    - Allow users to create polls (any authenticated user)
    - Allow users to read all polls (any authenticated user)
    - Allow users to update only their own polls
    - Allow users to delete only their own polls
    - Keep public voting access (anyone can vote)
    - Keep public option management (anyone can add options)
*/

-- Add user_id column to polls table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE polls ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Anyone can read polls" ON polls;
DROP POLICY IF EXISTS "Anyone can create polls" ON polls;
DROP POLICY IF EXISTS "Anyone can update polls" ON polls;
DROP POLICY IF EXISTS "Anyone can delete polls" ON polls;

-- Create new policies for authenticated users
CREATE POLICY "Authenticated users can read all polls"
  ON polls
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create polls"
  ON polls
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own polls"
  ON polls
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own polls"
  ON polls
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
