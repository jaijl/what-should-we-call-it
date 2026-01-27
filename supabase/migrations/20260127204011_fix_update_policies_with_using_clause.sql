/*
  # Fix Update Policies with Proper USING Clause

  1. Issue
    - UPDATE policies were missing the USING clause (qual)
    - This prevents any updates from working because rows can't be selected for update

  2. Changes
    - Drop existing UPDATE policies
    - Recreate them with both USING and WITH CHECK clauses
    - USING clause determines which rows can be selected for update
    - WITH CHECK clause validates the new values
*/

-- Fix options UPDATE policy
DROP POLICY IF EXISTS "Anyone can update options" ON options;

CREATE POLICY "Anyone can update options"
  ON options FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Fix polls UPDATE policy  
DROP POLICY IF EXISTS "Anyone can update polls" ON polls;

CREATE POLICY "Anyone can update polls"
  ON polls FOR UPDATE
  USING (true)
  WITH CHECK (true);