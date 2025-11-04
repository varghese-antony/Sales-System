-- Create a function to delete an enquiry bypassing RLS
CREATE OR REPLACE FUNCTION delete_enquiry_bypass_rls(enquiry_id_param BIGINT)
RETURNS SETOF enquiries AS $$
BEGIN
  -- This function requires superuser privileges to bypass RLS
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_user AND rolsuper) THEN
    RAISE EXCEPTION 'Only superusers can bypass RLS';
  END IF;
  
  -- First delete related notes
  DELETE FROM enquiry_notes WHERE enquiry_id = enquiry_id_param;
  
  -- Then delete the enquiry
  RETURN QUERY
  DELETE FROM enquiries 
  WHERE id = enquiry_id_param
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION delete_enquiry_bypass_rls(BIGINT) TO authenticated;

-- Also create a function to check RLS policies
CREATE OR REPLACE FUNCTION get_rls_policies(table_name TEXT)
RETURNS TABLE (
  schemaname TEXT,
  tablename TEXT,
  policyname TEXT,
  permissive TEXT,
  roles TEXT[],
  cmd TEXT,
  qual TEXT,
  with_check TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.nspname::TEXT AS schemaname,
    c.relname::TEXT AS tablename,
    pol.polname::TEXT AS policyname,
    CASE WHEN pol.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END AS permissive,
    ARRAY(
      SELECT pg_get_userbyid(roleid) 
      FROM unnest(pol.polroles) AS roleid
    ) AS roles,
    CASE pol.polcmd
      WHEN 'r' THEN 'SELECT'
      WHEN 'a' THEN 'INSERT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE'
      WHEN '*' THEN 'ALL'
    END AS cmd,
    pg_get_expr(pol.polqual, pol.polrelid) AS qual,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
  FROM pg_policy pol
  JOIN pg_class c ON pol.polrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relname = table_name
    AND n.nspname = 'public';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check current user permissions
CREATE OR REPLACE FUNCTION current_user_permissions()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'is_authenticated', (SELECT current_setting('role') = 'authenticated'),
    'is_superuser', (SELECT rolsuper FROM pg_roles WHERE rolname = current_user),
    'current_user', current_user,
    'current_role', current_role,
    'session_user', session_user,
    'current_database', current_database(),
    'in_recovery', (SELECT pg_is_in_recovery()),
    'has_table_privilege', (
      SELECT jsonb_object_agg(
        priv,
        has_table_privilege(current_user, 'enquiries', priv)
      )
      FROM unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) AS priv
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_rls_policies(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_permissions() TO authenticated;
