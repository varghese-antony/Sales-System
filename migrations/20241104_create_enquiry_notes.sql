-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the enquiry_notes table
CREATE TABLE IF NOT EXISTS public.enquiry_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enquiry_id UUID NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on enquiry_notes
ALTER TABLE public.enquiry_notes ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_enquiry_notes_enquiry_id ON public.enquiry_notes(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_enquiry_notes_user_id ON public.enquiry_notes(user_id);

-- Create policies for enquiry_notes
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

CREATE POLICY "Enable delete for note creators"
  ON public.enquiry_notes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_enquiry_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_enquiry_notes_updated_at
BEFORE UPDATE ON public.enquiry_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_enquiry_notes_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enquiry_notes TO authenticated;
