-- Add delete policies for enquiries table
-- This allows admins and super_admins to delete enquiries

-- Admins can delete enquiries
DROP POLICY IF EXISTS "Admins can delete all enquiries" ON public.enquiries;
CREATE POLICY "Admins can delete all enquiries" ON public.enquiries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Super admins can delete enquiries
DROP POLICY IF EXISTS "Super admins can delete all enquiries" ON public.enquiries;
CREATE POLICY "Super admins can delete all enquiries" ON public.enquiries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'super_admin'
    )
  );
