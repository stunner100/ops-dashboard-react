-- Allow authenticated users to view all profiles
-- This is needed for DM functionality (selecting users to message)
-- and for seeing member names/avatars in chat channels

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a new policy that allows viewing all profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Keep the original own-profile policy for update operations
-- (already exists as "Users can update own profile")
