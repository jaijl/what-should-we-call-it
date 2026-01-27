/*
  # Add user_id to options table with RLS policies

  1. Changes
    - Add `user_id` column to `options` table that references auth.users
    - This allows anyone to add options, but only edit/delete their own
  
  2. Security Updates
    - Update RLS policies to allow authenticated users to add options
    - Users can only update/delete their own options
    - Everyone can view all options
*/

-- Add user_id column to options table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'options' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE options ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop existing option policies to recreate them
DROP POLICY IF EXISTS "Anyone can view options" ON options;
DROP POLICY IF EXISTS "Anyone can create options" ON options;
DROP POLICY IF EXISTS "Users can update their own options" ON options;
DROP POLICY IF EXISTS "Users can delete their own options" ON options;

-- Create new policies for options
CREATE POLICY "Authenticated users can view all options"
  ON options
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create options"
  ON options
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own options"
  ON options
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own options"
  ON options
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
