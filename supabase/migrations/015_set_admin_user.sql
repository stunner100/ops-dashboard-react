-- Set patrickannor35@gmail.com as admin (Head of Operations)
UPDATE profiles 
SET role = 'admin', 
    full_name = COALESCE(full_name, 'Patrick Annor')
WHERE email = 'patrickannor35@gmail.com';

-- Also update user metadata for consistency
-- Note: User metadata is stored in auth.users which is managed by Supabase Auth
