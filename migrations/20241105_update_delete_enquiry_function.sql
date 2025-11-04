-- Update the deleteEnquiry function to use the RLS bypass function
CREATE OR REPLACE FUNCTION delete_enquiry(p_enquiry_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result BOOLEAN;
    v_error_message TEXT;
    v_enquiry_id_to_use UUID;
    v_enquiry_id_str TEXT;
    v_enquiry_id_num BIGINT;
    v_enquiry_exists BOOLEAN;
    v_enquiry_record RECORD;
BEGIN
    -- First, check if the enquiry exists
    SELECT EXISTS (
        SELECT 1 
        FROM public.enquiries 
        WHERE id = p_enquiry_id
    ) INTO v_enquiry_exists;

    -- If not found by direct UUID match, try to find by string representation
    IF NOT v_enquiry_exists THEN
        v_enquiry_id_str := p_enquiry_id::TEXT;
        
        -- Try to find by numeric ID if the UUID was converted from a number
        BEGIN
            v_enquiry_id_num := v_enquiry_id_str::BIGINT;
            
            SELECT id, * INTO v_enquiry_record
            FROM public.enquiries
            WHERE id::TEXT = v_enquiry_id_str
               OR (id::TEXT LIKE v_enquiry_id_str || '%' AND LENGTH(v_enquiry_id_str) >= 8)
               OR (id = v_enquiry_id_num)  -- Try matching as numeric ID if it was converted
            LIMIT 1;
            
            IF v_enquiry_record.id IS NOT NULL THEN
                v_enquiry_id_to_use := v_enquiry_record.id;
                v_enquiry_exists := true;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- If conversion to BIGINT fails, continue with other methods
            NULL;
        END;
        
        -- If still not found, try to find by customer name or other identifiers
        IF NOT v_enquiry_exists THEN
            -- Log the attempt to find by other means
            RAISE NOTICE 'Enquiry not found by ID, trying to find by other means...';
            
            -- This is a fallback that might need adjustment based on your actual schema
            SELECT id, * INTO v_enquiry_record
            FROM public.enquiries
            WHERE id::TEXT LIKE '%' || v_enquiry_id_str || '%'
               OR customer_name ILIKE '%' || v_enquiry_id_str || '%'
               OR email ILIKE '%' || v_enquiry_id_str || '%'
            LIMIT 1;
            
            IF v_enquiry_record.id IS NOT NULL THEN
                v_enquiry_id_to_use := v_enquiry_record.id;
                v_enquiry_exists := true;
                RAISE NOTICE 'Found possible match: ID=%, Customer=%, Email=%', 
                    v_enquiry_record.id, v_enquiry_record.customer_name, v_enquiry_record.email;
            END IF;
        END IF;
        
        IF NOT v_enquiry_exists THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', format('Enquiry not found with ID: %s', p_enquiry_id::TEXT),
                'suggestions', (
                    SELECT jsonb_agg(jsonb_build_object(
                        'id', id,
                        'customer_name', customer_name,
                        'email', email,
                        'created_at', created_at
                    ))
                    FROM public.enquiries
                    WHERE created_at > NOW() - INTERVAL '30 days'
                    ORDER BY created_at DESC
                    LIMIT 5
                )
            );
        END IF;
    ELSE
        v_enquiry_id_to_use := p_enquiry_id;
    END IF;
    
    -- Try to delete using the RLS bypass function
    BEGIN
        v_result := delete_enquiry_bypass_rls(v_enquiry_id_to_use);
        
        IF v_result THEN
            RETURN jsonb_build_object(
                'success', true,
                'message', 'Enquiry deleted successfully',
                'deleted_id', v_enquiry_id_to_use
            );
        ELSE
            RETURN jsonb_build_object(
                'success', false,
                'error', format('Failed to delete enquiry with ID: %s', v_enquiry_id_to_use::TEXT)
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_error_message := SQLERRM;
        
        -- If RLS bypass failed, try a direct delete (will respect RLS)
        BEGIN
            DELETE FROM public.enquiries WHERE id = v_enquiry_id_to_use;
            GET DIAGNOSTICS v_result = ROW_COUNT;
            
            IF v_result > 0 THEN
                -- Also delete related notes
                DELETE FROM public.enquiry_notes WHERE enquiry_id = v_enquiry_id_to_use;
                
                RETURN jsonb_build_object(
                    'success', true,
                    'message', 'Enquiry deleted successfully (using direct delete)',
                    'deleted_id', v_enquiry_id_to_use,
                    'warning', 'RLS bypass failed, but direct delete worked.'
                );
            ELSE
                RETURN jsonb_build_object(
                    'success', false,
                    'error', format('Direct delete failed for ID: %s', v_enquiry_id_to_use::TEXT),
                    'original_error', v_error_message
                );
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', format('Error deleting enquiry: %s', SQLERRM),
                'original_error', v_error_message
            );
        END;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION delete_enquiry(UUID) TO authenticated;

-- Update the function to handle string IDs as well
CREATE OR REPLACE FUNCTION delete_enquiry(p_enquiry_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_enquiry_id_uuid UUID;
    v_enquiry_id_num BIGINT;
    v_result JSONB;
    v_error_message TEXT;
BEGIN
    -- First try to convert to UUID
    BEGIN
        v_enquiry_id_uuid := p_enquiry_id::UUID;
        RETURN delete_enquiry(v_enquiry_id_uuid);
    EXCEPTION WHEN OTHERS THEN
        v_error_message := SQLERRM;
    END;
    
    -- If that fails, try to convert to BIGINT
    BEGIN
        v_enquiry_id_num := p_enquiry_id::BIGINT;
        
        -- Find the UUID for this numeric ID
        SELECT id INTO v_enquiry_id_uuid
        FROM public.enquiries
        WHERE id = v_enquiry_id_num
           OR id::TEXT = p_enquiry_id
        LIMIT 1;
        
        IF v_enquiry_id_uuid IS NOT NULL THEN
            RETURN delete_enquiry(v_enquiry_id_uuid);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_error_message := v_error_message || '; ' || SQLERRM;
    END;
    
    -- If we get here, we couldn't find the enquiry
    RETURN jsonb_build_object(
        'success', false,
        'error', format('Could not find or delete enquiry with ID: %s', p_enquiry_id),
        'details', v_error_message
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION delete_enquiry(TEXT) TO authenticated;
