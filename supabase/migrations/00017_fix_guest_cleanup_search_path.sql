-- Fix Function Search Path Mutable warning: set explicit search_path for SECURITY DEFINER function.
CREATE OR REPLACE FUNCTION get_guest_unpurchased_generation_ids(older_than timestamptz)
RETURNS TABLE(id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT g.id
  FROM generations g
  LEFT JOIN auth.users u ON u.id::text = g.session_id
  WHERE u.id IS NULL
    AND g.is_purchased = false
    AND g.created_at < older_than;
$$;
