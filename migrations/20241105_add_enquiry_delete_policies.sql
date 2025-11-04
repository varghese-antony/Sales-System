-- Create function to bypass RLS for admin users
CREATE OR REPLACE FUNCTION delete_enquiry_bypass_rls(p_enquiry_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_deleted BOOLEAN := FALSE;
    v_enquiry_exists BOOLEAN;
    v_enquiry_id UUID;
    v_enquiry_id_str TEXT;
    v_enquiry_id_num BIGINT;
BEGIN
    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1 
        FROM auth.users
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'admin'
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Only administrators can delete enquiries';
    END IF;

    -- Check if enquiry exists
    SELECT EXISTS (
        SELECT 1 
        FROM public.enquiries 
        WHERE id = p_enquiry_id
    ) INTO v_enquiry_exists;

    IF NOT v_enquiry_exists THEN
        -- Try to find by string representation
        v_enquiry_id_str := p_enquiry_id::TEXT;
        
        -- Try to find by numeric ID if the UUID was converted from a number
        BEGIN
            v_enquiry_id_num := v_enquiry_id_str::BIGINT;
            
            SELECT id INTO v_enquiry_id
            FROM public.enquiries
            WHERE id::TEXT = v_enquiry_id_str
               OR (id::TEXT LIKE v_enquiry_id_str || '%' AND LENGTH(v_enquiry_id_str) >= 8)
               OR (id = v_enquiry_id_num)  -- Try matching as numeric ID if it was converted
            LIMIT 1;
            
            IF v_enquiry_id IS NOT NULL THEN
                -- Found by alternative method
                DELETE FROM public.enquiries WHERE id = v_enquiry_id;
                GET DIAGNOSTICS v_deleted = ROW_COUNT;
                RETURN v_deleted > 0;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- If conversion to BIGINT fails, continue with other methods
            NULL;
        END;
        
        -- If we get here, no match was found
        RAISE EXCEPTION 'Enquiry not found with ID: %', p_enquiry_id;
    END IF;

    -- If we get here, the enquiry exists and user is admin
    DELETE FROM public.enquiries WHERE id = p_enquiry_id;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    
    -- Also delete related notes
    DELETE FROM public.enquiry_notes WHERE enquiry_id = p_enquiry_id;
    
    RETURN v_deleted > 0;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error deleting enquiry: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION delete_enquiry_bypass_rls(UUID) TO authenticated;

-- Create function to get RLS policies
CREATE OR REPLACE FUNCTION get_rls_policies(p_table_name TEXT)
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
        CASE pol.polpermissive WHEN 't' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END AS permissive,
        pg_catalog.array_to_string(ARRAY(
            SELECT pg_roles.rolname
            FROM pg_catalog.unnest(COALESCE(pol.polroles, ARRAY[0]::oid[])) AS role_id
            JOIN pg_roles ON pg_roles.oid = role_id
        ), ', ')::TEXT[] AS roles,
        CASE pol.polcmd
            WHEN 'r' THEN 'SELECT'
            WHEN 'a' THEN 'INSERT'
            WHEN 'w' THEN 'UPDATE'
            WHEN 'd' THEN 'DELETE'
            WHEN '*' THEN 'ALL'
        END AS cmd,
        pg_catalog.pg_get_expr(pol.polqual, pol.polrelid) AS qual,
        pg_catalog.pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
    FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON pol.polrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = p_table_name
    ORDER BY 1, 2, 3;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create function to check current user permissions
CREATE OR REPLACE FUNCTION current_user_permissions()
RETURNS TABLE (
    role_name TEXT,
    is_admin BOOLEAN,
    can_delete_enquiries BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(
            (SELECT raw_user_meta_data->>'role' 
             FROM auth.users 
             WHERE id = auth.uid()),
            'anonymous'
        )::TEXT AS role_name,
        
        COALESCE(
            (SELECT raw_user_meta_data->>'role' = 'admin' 
             FROM auth.users 
             WHERE id = authuid()),
            false
        )::BOOLEAN AS is_admin,
        
        COALESCE(
            (SELECT raw_user_meta_data->>'role' IN ('admin', 'manager')
             FROM auth.users 
             WHERE id = auth.uid()),
            false
        )::BOOLEAN AS can_delete_enquiries;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_rls_policies(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_permissions() TO authenticated;
