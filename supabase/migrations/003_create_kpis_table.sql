-- Create KPIs table for the dashboard
CREATE TABLE IF NOT EXISTS public.kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    previous_value TEXT,
    category TEXT NOT NULL CHECK (category IN ('overview', 'vendor_ops', 'rider_fleet', 'customer_service')),
    icon TEXT, -- Icon name for overview KPIs
    display_order INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Index for fast category queries
CREATE INDEX IF NOT EXISTS idx_kpis_category ON public.kpis(category);
CREATE INDEX IF NOT EXISTS idx_kpis_display_order ON public.kpis(display_order);

-- Enable RLS
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read KPIs
CREATE POLICY "Authenticated users can read kpis"
    ON public.kpis FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users can update KPIs
CREATE POLICY "Authenticated users can update kpis"
    ON public.kpis FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Only admins can insert/delete (optional - for now allow all authenticated)
CREATE POLICY "Authenticated users can insert kpis"
    ON public.kpis FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Authenticated users can delete KPIs
CREATE POLICY "Authenticated users can delete kpis"
    ON public.kpis FOR DELETE
    TO authenticated
    USING (true);

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_kpi_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_kpi_updated_at ON public.kpis;
CREATE TRIGGER trigger_update_kpi_updated_at
    BEFORE UPDATE ON public.kpis
    FOR EACH ROW
    EXECUTE FUNCTION public.update_kpi_updated_at();

-- Seed Overview KPIs
INSERT INTO public.kpis (name, value, previous_value, category, icon, display_order)
VALUES 
    ('Active Vendors', '156', '139', 'overview', 'Package', 1),
    ('Rider Fleet', '89', '85', 'overview', 'Users', 2),
    ('Avg. Delivery Time', '28 min', '30 min', 'overview', 'Clock', 3),
    ('Customer Rating', '4.7', '4.5', 'overview', 'Star', 4)
ON CONFLICT DO NOTHING;

-- Seed Vendor Ops KPIs
INSERT INTO public.kpis (name, value, category, display_order)
VALUES 
    ('New Vendors This Week', '12', 'vendor_ops', 1),
    ('Pending Applications', '23', 'vendor_ops', 2),
    ('Active Promotions', '8', 'vendor_ops', 3),
    ('Menu Updates', '45', 'vendor_ops', 4)
ON CONFLICT DO NOTHING;

-- Seed Rider Fleet KPIs
INSERT INTO public.kpis (name, value, category, display_order)
VALUES 
    ('Active Riders', '67', 'rider_fleet', 1),
    ('On-Time Rate', '94%', 'rider_fleet', 2),
    ('Pending Payouts', '$12,450', 'rider_fleet', 3),
    ('Training Completed', '89%', 'rider_fleet', 4)
ON CONFLICT DO NOTHING;

-- Seed Customer Service KPIs
INSERT INTO public.kpis (name, value, category, display_order)
VALUES 
    ('Open Tickets', '34', 'customer_service', 1),
    ('Resolved Today', '56', 'customer_service', 2),
    ('Avg. Response Time', '4 min', 'customer_service', 3),
    ('CSAT Score', '92%', 'customer_service', 4)
ON CONFLICT DO NOTHING;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.kpis;
