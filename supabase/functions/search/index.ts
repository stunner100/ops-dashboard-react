// Search Edge Function - Semantic search using Qwen embeddings
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';

const QWEN_API_URL = 'https://dashscope-intl.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding';

interface SearchRequest {
    query: string;
    department?: string | null;
    limit?: number;
    threshold?: number;
}

interface SearchResult {
    id: string;
    content: string;
    department: string;
    section_title: string;
    document_title: string;
    similarity: number;
}

// Generate embedding using Qwen API
async function generateEmbedding(text: string): Promise<number[]> {
    const qwenApiKey = Deno.env.get('QWEN_API_KEY');

    if (!qwenApiKey) {
        throw new Error('QWEN_API_KEY not configured');
    }

    const response = await fetch(QWEN_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${qwenApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'text-embedding-v3',
            input: {
                texts: [text],
            },
            parameters: {
                dimension: 1536,
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Qwen embedding failed: ${error}`);
    }

    const data = await response.json();
    return data.output?.embeddings?.[0]?.embedding || [];
}

// Fallback: Full-text search when embeddings are not available
async function fullTextSearch(
    supabase: ReturnType<typeof createSupabaseClient>,
    query: string,
    department: string | null,
    limit: number
): Promise<SearchResult[]> {
    let queryBuilder = supabase
        .from('sop_sections')
        .select(`
      id,
      title,
      content,
      document:sop_documents!inner(
        id,
        title,
        department,
        status
      )
    `)
        .eq('document.status', 'active')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(limit);

    if (department) {
        queryBuilder = queryBuilder.eq('document.department', department);
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;

    return (data || []).map((row: any) => ({
        id: row.id,
        content: row.content,
        department: row.document.department,
        section_title: row.title,
        document_title: row.document.title,
        similarity: 0.8, // Fixed score for text search
    }));
}

// Semantic search using embeddings
async function semanticSearch(
    supabase: ReturnType<typeof createSupabaseClient>,
    queryEmbedding: number[],
    department: string | null,
    limit: number,
    threshold: number
): Promise<SearchResult[]> {
    const { data, error } = await supabase.rpc('match_sop_sections', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
        filter_department: department,
    });

    if (error) throw error;

    return (data || []).map((row: any) => ({
        id: row.id,
        content: row.content,
        department: row.department,
        section_title: row.title,
        document_title: row.document_title,
        similarity: row.similarity,
    }));
}

Deno.serve(async (req) => {
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
        const { query, department = null, limit = 8, threshold = 0.65 }: SearchRequest = await req.json();

        if (!query || query.trim().length === 0) {
            return errorResponse('Query is required', 400);
        }

        const supabase = createSupabaseClient(req.headers.get('Authorization') || undefined);

        let results: SearchResult[];

        try {
            // Try semantic search first
            const embedding = await generateEmbedding(query);
            results = await semanticSearch(supabase, embedding, department, limit, threshold);

            // If no semantic results, fall back to text search
            if (results.length === 0) {
                results = await fullTextSearch(supabase, query, department, limit);
            }
        } catch (embeddingError) {
            console.warn('Embedding search failed, using text search:', embeddingError);
            results = await fullTextSearch(supabase, query, department, limit);
        }

        return jsonResponse({ results });
    } catch (error) {
        console.error('Search error:', error);
        return errorResponse(error.message || 'Search failed', 500);
    }
});
