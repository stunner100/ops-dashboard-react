-- Enable pgvector extension for embeddings-based semantic search
-- This extension must be enabled by a superuser or through Supabase Dashboard

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to sop_sections for semantic search
ALTER TABLE public.sop_sections 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for faster similarity search
CREATE INDEX IF NOT EXISTS idx_sop_sections_embedding 
ON public.sop_sections 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function to search sections by embedding similarity
CREATE OR REPLACE FUNCTION match_sop_sections(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.65,
    match_count int DEFAULT 10,
    filter_department text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    title text,
    content text,
    document_title text,
    department text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.document_id,
        s.title,
        s.content,
        d.title AS document_title,
        d.department,
        1 - (s.embedding <=> query_embedding) AS similarity
    FROM public.sop_sections s
    JOIN public.sop_documents d ON s.document_id = d.id
    WHERE 
        s.embedding IS NOT NULL
        AND 1 - (s.embedding <=> query_embedding) > match_threshold
        AND (filter_department IS NULL OR d.department = filter_department)
        AND d.status = 'active'
    ORDER BY s.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
REVOKE EXECUTE ON FUNCTION match_sop_sections FROM PUBLIC;
GRANT EXECUTE ON FUNCTION match_sop_sections TO authenticated;
