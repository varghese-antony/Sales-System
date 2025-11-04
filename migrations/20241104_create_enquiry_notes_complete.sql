-- Ensure the required extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop the table if it exists to avoid conflicts
DROP TABLE IF EXISTS public.enquiry_notes CASCADE;

-- Create the enquiry_notes table
CREATE TABLE public.enquiry_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id BIGINT NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_enquiry_notes_enquiry_id ON public.enquiry_notes(enquiry_id);
CREATE INDEX idx_enquiry_notes_user_id ON public.enquiry_notes(user_id);

-- Enable Row Level Security
ALTER TABLE public.enquiry_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users"
  ON public.enquiry_notes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON public.enquiry_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for note creators"
  ON public.enquiry_notes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable delete for note creators and admins"
  ON public.enquiry_notes
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type IN ('admin', 'super_admin')
    )
  );

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_enquiry_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS set_enquiry_notes_updated_at ON public.enquiry_notes;

-- Create the trigger
CREATE TRIGGER set_enquiry_notes_updated_at
BEFORE UPDATE ON public.enquiry_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_enquiry_notes_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enquiry_notes TO authenticated;