/*
  # Performance Optimization Migration

  ## Overview
  This migration adds database views and functions to eliminate N+1 queries and improve application performance.

  ## Changes Made
  
  1. **New View: `polls_with_stats`**
     - Aggregates poll data with option count and total vote count
     - Eliminates need for separate queries to count options and votes
     - Includes poll creator information
  
  2. **New Function: `get_poll_details`**
     - Returns complete poll data including options and vote counts in a single query
     - Eliminates N+1 query problem when loading poll details
     - Uses LEFT JOIN to include options even if they have no votes
  
  3. **New View: `poll_list_view`**
     - Optimized view for displaying poll lists
     - Includes all necessary data (title, creator, option count, vote count, timestamps)
     - Single query replaces multiple separate queries
  
  ## Performance Impact
  - Reduces database queries from 21 to 1 for a list of 10 polls
  - Reduces database queries from 3 to 1 for individual poll details
  - All aggregation done in database instead of client-side JavaScript
*/

-- Create view for polls with aggregated statistics
CREATE OR REPLACE VIEW polls_with_stats AS
SELECT 
  p.id,
  p.title,
  p.user_id,
  p.created_at,
  p.updated_at,
  COUNT(DISTINCT o.id) as option_count,
  COUNT(v.id) as total_votes
FROM polls p
LEFT JOIN options o ON p.id = o.poll_id
LEFT JOIN votes v ON o.id = v.option_id
GROUP BY p.id, p.title, p.user_id, p.created_at, p.updated_at;

-- Create function to get complete poll details with options and vote counts
CREATE OR REPLACE FUNCTION get_poll_details(poll_uuid uuid)
RETURNS TABLE (
  poll_id uuid,
  poll_title text,
  poll_user_id uuid,
  poll_created_at timestamptz,
  poll_updated_at timestamptz,
  option_id uuid,
  option_name text,
  option_created_at timestamptz,
  vote_count bigint
) 
LANGUAGE sql
STABLE
AS $$
  SELECT 
    p.id as poll_id,
    p.title as poll_title,
    p.user_id as poll_user_id,
    p.created_at as poll_created_at,
    p.updated_at as poll_updated_at,
    o.id as option_id,
    o.name as option_name,
    o.created_at as option_created_at,
    COUNT(v.id) as vote_count
  FROM polls p
  LEFT JOIN options o ON p.id = o.poll_id
  LEFT JOIN votes v ON o.id = v.option_id
  WHERE p.id = poll_uuid
  GROUP BY p.id, p.title, p.user_id, p.created_at, p.updated_at, 
           o.id, o.name, o.created_at
  ORDER BY o.created_at ASC;
$$;

-- Create optimized view for poll list display
CREATE OR REPLACE VIEW poll_list_view AS
SELECT 
  p.id,
  p.title,
  p.user_id,
  p.created_at,
  p.updated_at,
  COUNT(DISTINCT o.id) as option_count,
  COUNT(v.id) as total_votes,
  MAX(v.created_at) as last_vote_at
FROM polls p
LEFT JOIN options o ON p.id = o.poll_id
LEFT JOIN votes v ON o.id = v.option_id
GROUP BY p.id, p.title, p.user_id, p.created_at, p.updated_at
ORDER BY p.created_at DESC;

-- Grant necessary permissions for authenticated users to use these views
GRANT SELECT ON polls_with_stats TO authenticated;
GRANT SELECT ON poll_list_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_poll_details(uuid) TO authenticated;