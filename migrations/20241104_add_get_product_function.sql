-- Create a function to get product by ID with flexible type handling
CREATE OR REPLACE FUNCTION get_product_by_id(p_table text, p_id text)
RETURNS SETOF json AS $$
DECLARE
  v_result json;
  v_numeric_id bigint;
BEGIN
  -- First try exact match
  EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE id::text = %L', p_table, p_id) INTO v_result;
  
  IF v_result IS NOT NULL THEN
    RETURN NEXT v_result;
    RETURN;
  END IF;
  
  -- If ID is numeric, try to find by numeric part
  BEGIN
    v_numeric_id := p_id::bigint;
    
    -- Try to find by numeric part of UUID
    EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE id::text LIKE %L', 
                  p_table, 
                  '%' || v_numeric_id || '%')
    INTO v_result;
    
    IF v_result IS NOT NULL THEN
      RETURN NEXT v_result;
      RETURN;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    -- Not a numeric ID, continue
    NULL;
  END;
  
  -- If still not found, return empty result
  RETURN;
END;
$$ LANGUAGE plpgsql;
