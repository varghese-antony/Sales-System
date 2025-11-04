-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create id_mapping table
CREATE TABLE IF NOT EXISTS public.id_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    old_id TEXT NOT NULL,
    uuid UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('indoor', 'outdoor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_old_id_type UNIQUE (old_id, type)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_id_mapping_old_id ON public.id_mapping(old_id);
CREATE INDEX IF NOT EXISTS idx_id_mapping_uuid ON public.id_mapping(uuid);
CREATE INDEX IF NOT EXISTS idx_id_mapping_type ON public.id_mapping(type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_id_mapping_modtime ON public.id_mapping;
CREATE TRIGGER update_id_mapping_modtime
BEFORE UPDATE ON public.id_mapping
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Create a function to help with ID resolution
CREATE OR REPLACE FUNCTION resolve_product_id(p_old_id TEXT, p_type TEXT)
RETURNS UUID AS $$
DECLARE
    v_uuid UUID;
BEGIN
    -- First try to find in id_mapping table
    SELECT uuid INTO v_uuid 
    FROM public.id_mapping 
    WHERE old_id = p_old_id AND type = p_type
    LIMIT 1;
    
    -- If not found, check if the ID is already a valid UUID
    IF v_uuid IS NULL THEN
        BEGIN
            v_uuid := p_old_id::UUID;
            RETURN v_uuid;
        EXCEPTION WHEN OTHERS THEN
            -- Not a valid UUID, continue
            NULL;
        END;
    END IF;
    
    RETURN v_uuid;
END;
$$ LANGUAGE plpgsql;
