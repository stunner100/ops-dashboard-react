-- Create goals table for OKR tracking
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_date DATE,
    progress DECIMAL(5,2) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create key_results table for goal measurements
CREATE TABLE IF NOT EXISTS public.key_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    target_value DECIMAL(10,2) NOT NULL,
    unit TEXT DEFAULT '%',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_goals_owner ON public.goals(owner_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_key_results_goal ON public.key_results(goal_id);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goals
CREATE POLICY "Users can view all goals" ON public.goals
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own goals" ON public.goals
    FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for key_results
CREATE POLICY "Users can view key results" ON public.key_results
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage key results for own goals" ON public.key_results
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND owner_id = auth.uid())
    );

-- Triggers to update timestamps
CREATE OR REPLACE FUNCTION update_goal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_goal_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_updated_at();

CREATE TRIGGER trigger_update_key_result_updated_at
    BEFORE UPDATE ON public.key_results
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_updated_at();
