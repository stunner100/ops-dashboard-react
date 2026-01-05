-- Allow admin users to update any profile (for user approvals)
-- This is needed for the User Management feature where admins approve users

-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policy for admins to update any profile
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
