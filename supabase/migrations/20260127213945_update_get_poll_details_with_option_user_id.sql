/*
  # Update get_poll_details function to include option user_id
  
  ## Changes
  - Drop and recreate `get_poll_details` function
  - Add `option_user_id` to the return type
  - Update the SELECT statement to include `o.user_id` as `option_user_id`
  
  This enables the UI to show edit/delete buttons only for options created by the current user.
*/

DROP FUNCTION IF EXISTS get_poll_details(uuid);

CREATE FUNCTION get_poll_details(poll_uuid uuid)
RETURNS TABLE (
  poll_id uuid,
  poll_title text,
  poll_user_id uuid,
  poll_created_at timestamptz,
  poll_updated_at timestamptz,
  option_id uuid,
  option_name text,
  option_created_at timestamptz,
  option_user_id uuid,
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
    o.user_id as option_user_id,
    COUNT(v.id) as vote_count
  FROM polls p
  LEFT JOIN options o ON p.id = o.poll_id
  LEFT JOIN votes v ON o.id = v.option_id
  WHERE p.id = poll_uuid
  GROUP BY p.id, p.title, p.user_id, p.created_at, p.updated_at, 
           o.id, o.name, o.created_at, o.user_id
  ORDER BY o.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION get_poll_details(uuid) TO authenticated;