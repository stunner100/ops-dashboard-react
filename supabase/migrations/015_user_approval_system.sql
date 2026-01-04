-- Add user approval system columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);

-- Auto-approve existing admin users
UPDATE profiles SET is_approved = true WHERE role = 'admin';

-- Create index for faster approval status queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON profiles(is_approved);

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_approved IS 'Whether the user has been approved by an admin to access the platform';
COMMENT ON COLUMN profiles.approved_at IS 'Timestamp when the user was approved';
COMMENT ON COLUMN profiles.approved_by IS 'UUID of the admin who approved the user';
