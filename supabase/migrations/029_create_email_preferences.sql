-- Email Preferences Table
-- Stores user notification preferences

CREATE TABLE IF NOT EXISTS public.email_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- Notification triggers
    task_assigned BOOLEAN DEFAULT true,
    task_due_soon BOOLEAN DEFAULT true,
    task_completed BOOLEAN DEFAULT false,
    task_comment BOOLEAN DEFAULT true,
    -- Digest options
    daily_digest BOOLEAN DEFAULT false,
    weekly_summary BOOLEAN DEFAULT true,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- One record per user
    CONSTRAINT unique_user_email_prefs UNIQUE (user_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_email_prefs_user ON public.email_preferences(user_id);

-- Enable RLS
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own preferences
CREATE POLICY "Users can view own email preferences"
    ON public.email_preferences FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences"
    ON public.email_preferences FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences"
    ON public.email_preferences FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to auto-create preferences on new user
CREATE OR REPLACE FUNCTION public.create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.email_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences when profile is created
DROP TRIGGER IF EXISTS trigger_create_email_preferences ON public.profiles;
CREATE TRIGGER trigger_create_email_preferences
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_email_preferences();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_email_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_email_prefs_updated_at ON public.email_preferences;
CREATE TRIGGER trigger_email_prefs_updated_at
    BEFORE UPDATE ON public.email_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_email_prefs_updated_at();
