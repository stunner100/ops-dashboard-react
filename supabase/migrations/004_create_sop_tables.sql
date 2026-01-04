-- Create SOP documents table if not exists
CREATE TABLE IF NOT EXISTS public.sop_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    department TEXT NOT NULL CHECK (department IN ('vendor', 'rider', 'customer_service')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create SOP sections table for document content
CREATE TABLE IF NOT EXISTS public.sop_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.sop_documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sop_documents_department ON public.sop_documents(department);
CREATE INDEX IF NOT EXISTS idx_sop_documents_status ON public.sop_documents(status);
CREATE INDEX IF NOT EXISTS idx_sop_sections_document ON public.sop_sections(document_id);
CREATE INDEX IF NOT EXISTS idx_sop_sections_order ON public.sop_sections(order_index);

-- Enable RLS
ALTER TABLE public.sop_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sop_documents
CREATE POLICY "Authenticated users can read sop_documents"
    ON public.sop_documents FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create sop_documents"
    ON public.sop_documents FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update sop_documents"
    ON public.sop_documents FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sop_documents"
    ON public.sop_documents FOR DELETE
    TO authenticated
    USING (true);

-- RLS Policies for sop_sections
CREATE POLICY "Authenticated users can read sop_sections"
    ON public.sop_sections FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create sop_sections"
    ON public.sop_sections FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update sop_sections"
    ON public.sop_sections FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sop_sections"
    ON public.sop_sections FOR DELETE
    TO authenticated
    USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_sop_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sop_document_updated_at ON public.sop_documents;
CREATE TRIGGER trigger_update_sop_document_updated_at
    BEFORE UPDATE ON public.sop_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_sop_updated_at();

DROP TRIGGER IF EXISTS trigger_update_sop_section_updated_at ON public.sop_sections;
CREATE TRIGGER trigger_update_sop_section_updated_at
    BEFORE UPDATE ON public.sop_sections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_sop_updated_at();

-- Seed sample documents
INSERT INTO public.sop_documents (title, description, department, status)
VALUES 
    ('Vendor Onboarding Guide', 'Complete guide for onboarding new vendors to the platform including documentation requirements and quality standards.', 'vendor', 'active'),
    ('Delivery Partner Training Manual', 'Comprehensive training manual for delivery riders covering safety protocols, app usage, and customer interaction guidelines.', 'rider', 'active'),
    ('Customer Complaint Resolution', 'Standard procedures for handling and resolving customer complaints with escalation pathways.', 'customer_service', 'active'),
    ('Vendor Quality Standards', 'Quality control standards and inspection procedures for vendor food safety compliance.', 'vendor', 'active'),
    ('Rider Safety Protocols', 'Safety guidelines and emergency procedures for delivery riders during operations.', 'rider', 'active'),
    ('Refund Processing Guidelines', 'Step-by-step process for handling refund requests and approval workflows.', 'customer_service', 'active')
ON CONFLICT DO NOTHING;

-- Seed sample sections for first document
INSERT INTO public.sop_sections (document_id, title, content, order_index)
SELECT 
    d.id,
    s.title,
    s.content,
    s.order_index
FROM public.sop_documents d
CROSS JOIN (
    VALUES 
        ('Introduction', 'This guide outlines the complete process for onboarding new vendors to the Night Market platform. All vendors must complete these requirements before being activated.', 1),
        ('Documentation Requirements', 'Required documents include: Business registration certificate, Food safety certification, Valid government ID, Bank account details for payments, Menu with pricing.', 2),
        ('Quality Standards', 'All vendors must maintain: Minimum 4.0 star rating, Maximum 15-minute preparation time, Proper food packaging standards, Accurate menu descriptions.', 3),
        ('Activation Process', 'After document verification: Account setup (1-2 business days), Menu upload and review, Training session completion, Test orders before going live.', 4)
) AS s(title, content, order_index)
WHERE d.title = 'Vendor Onboarding Guide'
ON CONFLICT DO NOTHING;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sop_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sop_sections;
