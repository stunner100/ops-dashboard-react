-- Create SOP Policies table for operational thresholds and alerts
-- These policies define metrics that trigger notifications when violated

-- Drop existing table if it exists (to handle partial migrations)
DROP TABLE IF EXISTS public.sop_policies CASCADE;

CREATE TABLE public.sop_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    department TEXT NOT NULL CHECK (department IN ('vendor', 'rider', 'customer_service', 'all')),
    category TEXT NOT NULL,
    comparison_operator TEXT NOT NULL CHECK (comparison_operator IN ('>', '<', '=', '>=', '<=', '!=')),
    threshold_value NUMERIC NOT NULL,
    threshold_unit TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sop_policies_department ON public.sop_policies(department);
CREATE INDEX IF NOT EXISTS idx_sop_policies_severity ON public.sop_policies(severity);
CREATE INDEX IF NOT EXISTS idx_sop_policies_category ON public.sop_policies(category);
CREATE INDEX IF NOT EXISTS idx_sop_policies_active ON public.sop_policies(is_active);

-- Enable RLS
ALTER TABLE public.sop_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read sop_policies"
    ON public.sop_policies FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create sop_policies"
    ON public.sop_policies FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update sop_policies"
    ON public.sop_policies FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sop_policies"
    ON public.sop_policies FOR DELETE
    TO authenticated
    USING (true);

-- Function for updated_at trigger (create if not exists)
CREATE OR REPLACE FUNCTION public.update_sop_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_sop_policies_updated_at ON public.sop_policies;
CREATE TRIGGER trigger_update_sop_policies_updated_at
    BEFORE UPDATE ON public.sop_policies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_sop_updated_at();

-- Seed sample policies
INSERT INTO public.sop_policies (metric_name, department, category, comparison_operator, threshold_value, threshold_unit, severity, description)
VALUES 
    ('Average Delivery Time', 'rider', 'Performance', '>', 45, 'minutes', 'warning', 'Delivery time exceeds acceptable threshold'),
    ('Order Completion Rate', 'rider', 'Performance', '<', 95, 'percent', 'critical', 'Order completion rate falls below minimum standard'),
    ('Customer Response Time', 'customer_service', 'Response', '>', 5, 'minutes', 'warning', 'First response time exceeds SLA'),
    ('Complaint Resolution Time', 'customer_service', 'Resolution', '>', 24, 'hours', 'critical', 'Complaint not resolved within SLA'),
    ('Vendor Rating', 'vendor', 'Quality', '<', 4.0, 'stars', 'warning', 'Vendor rating drops below minimum threshold'),
    ('Food Safety Violations', 'vendor', 'Compliance', '>', 0, 'count', 'critical', 'Any food safety violation requires immediate action'),
    ('Rider Safety Incidents', 'rider', 'Safety', '>', 0, 'count', 'critical', 'Safety incidents require immediate review'),
    ('Order Cancellation Rate', 'all', 'Performance', '>', 5, 'percent', 'warning', 'Cancellation rate exceeds threshold')
ON CONFLICT DO NOTHING;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sop_policies;
