/*
  # Add Update Policy for Votes

  1. Security Changes
    - Add UPDATE policy for votes table
    - Maintains open access model for team collaboration

  This migration adds the missing UPDATE policy for the votes table.
*/

CREATE POLICY "Anyone can update votes"
  ON votes FOR UPDATE
  USING (true)
  WITH CHECK (true);