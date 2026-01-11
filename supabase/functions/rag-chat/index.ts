// RAG Chat Edge Function - AI chat powered by Qwen with SOP context
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';

const QWEN_CHAT_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
const QWEN_EMBEDDING_URL = 'https://dashscope-intl.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding';

interface ChatRequest {
    message: string;
    department?: string | null;
    history?: Array<{ role: string; content: string }>;
}

interface ChatResponse {
    response: string;
    sources: Array<{
        title: string;
        department: string;
        relevance: number;
    }>;
}

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 10;
const MAX_HISTORY_CONTENT_LENGTH = 1000;
const ALLOWED_ROLES = new Set(['user', 'assistant', 'system']);

function normalizeMessage(input: unknown): string | null {
    if (typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return null;
    return trimmed;
}

function normalizeDepartment(input: unknown): string | null {
    if (input === null || input === undefined) return null;
    if (typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (trimmed.length > 64) return null;
    if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) return null;
    return trimmed;
}

function normalizeHistory(input: unknown): Array<{ role: string; content: string }> {
    if (!Array.isArray(input)) return [];
    return input
        .slice(-MAX_HISTORY_ITEMS)
        .map((entry) => {
            const role = typeof entry?.role === 'string' ? entry.role : '';
            const content = typeof entry?.content === 'string' ? entry.content.trim() : '';
            if (!ALLOWED_ROLES.has(role) || !content || content.length > MAX_HISTORY_CONTENT_LENGTH) {
                return null;
            }
            return { role, content };
        })
        .filter((entry): entry is { role: string; content: string } => entry !== null);
}

function sanitizeSearchTerm(term: string): string {
    return term
        .replace(/[^a-zA-Z0-9 _-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 200);
}

// Generate embedding for finding relevant context
async function generateEmbedding(text: string): Promise<number[]> {
    const qwenApiKey = Deno.env.get('QWEN_API_KEY');

    if (!qwenApiKey) {
        throw new Error('QWEN_API_KEY not configured');
    }

    const response = await fetch(QWEN_EMBEDDING_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${qwenApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'text-embedding-v3',
            input: { texts: [text] },
            parameters: { dimension: 1536 },
        }),
    });

    if (!response.ok) {
        console.error('Embedding generation failed', { status: response.status });
        throw new Error('Embedding generation failed');
    }

    const data = await response.json();
    return data.output?.embeddings?.[0]?.embedding || [];
}

// Get relevant SOP content for context
async function getRelevantContext(
    supabase: ReturnType<typeof createSupabaseClient>,
    query: string,
    department: string | null
): Promise<{ context: string; sources: ChatResponse['sources'] }> {
    try {
        const embedding = await generateEmbedding(query);

        const { data, error } = await supabase.rpc('match_sop_sections', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 5,
            filter_department: department,
        });

        if (error || !data || data.length === 0) {
            // Fallback to text search
            return await getTextContext(supabase, query, department);
        }

        const context = data
            .map((r: any) => `[${r.document_title} - ${r.title}]\n${r.content}`)
            .join('\n\n---\n\n');

        const sources = data.map((r: any) => ({
            title: `${r.document_title} - ${r.title}`,
            department: r.department,
            relevance: r.similarity,
        }));

        return { context, sources };
    } catch (error) {
        console.warn('Semantic context failed, using text search:', error);
        return await getTextContext(supabase, query, department);
    }
}

// Fallback text-based context retrieval
async function getTextContext(
    supabase: ReturnType<typeof createSupabaseClient>,
    query: string,
    department: string | null
): Promise<{ context: string; sources: ChatResponse['sources'] }> {
    const safeQuery = sanitizeSearchTerm(query);
    if (!safeQuery) {
        return { context: '', sources: [] };
    }

    let queryBuilder = supabase
        .from('sop_sections')
        .select(`
      id,
      title,
      content,
      document:sop_documents!inner(title, department, status)
    `)
        .eq('document.status', 'active')
        .or(`title.ilike.%${safeQuery}%,content.ilike.%${safeQuery}%`)
        .limit(5);

    if (department) {
        queryBuilder = queryBuilder.eq('document.department', department);
    }

    const { data, error } = await queryBuilder;

    if (error || !data || data.length === 0) {
        return { context: '', sources: [] };
    }

    const context = data
        .map((r: any) => `[${r.document.title} - ${r.title}]\n${r.content}`)
        .join('\n\n---\n\n');

    const sources = data.map((r: any) => ({
        title: `${r.document.title} - ${r.title}`,
        department: r.document.department,
        relevance: 0.7,
    }));

    return { context, sources };
}

// Call Qwen chat API
async function callQwenChat(
    message: string,
    context: string,
    history: Array<{ role: string; content: string }>
): Promise<string> {
    const qwenApiKey = Deno.env.get('QWEN_API_KEY');

    if (!qwenApiKey) {
        throw new Error('QWEN_API_KEY not configured');
    }

    const systemPrompt = `You are a helpful operations assistant for Night Market, a food delivery platform. 
You help staff with SOPs (Standard Operating Procedures), policies, and operational questions.

${context ? `Use the following SOP content to answer questions:\n\n${context}\n\n` : ''}

Guidelines:
- Be concise and helpful
- Reference specific SOPs when applicable
- If the question isn't covered by available SOPs, provide general best practices
- Format responses with bullet points or numbered lists when appropriate
- If you don't know something, say so honestly`;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-5), // Keep last 5 messages for context
        { role: 'user', content: message },
    ];

    const response = await fetch(QWEN_CHAT_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${qwenApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'qwen-plus',
            messages,
            temperature: 0.7,
            max_tokens: 1024,
        }),
    });

    if (!response.ok) {
        console.error('Qwen chat failed', { status: response.status });
        throw new Error('Qwen chat failed');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
}

Deno.serve(async (req) => {
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
        const payload: ChatRequest = await req.json();
        const message = normalizeMessage(payload.message);
        const rawDepartment = payload.department;
        const department = normalizeDepartment(rawDepartment);
        const hasDepartmentInput = typeof rawDepartment === 'string'
            ? rawDepartment.trim().length > 0
            : rawDepartment !== undefined && rawDepartment !== null;

        if (hasDepartmentInput && department === null) {
            return errorResponse('Invalid department value', 400);
        }

        if (payload.history !== undefined && !Array.isArray(payload.history)) {
            return errorResponse('History must be an array', 400);
        }

        const history = normalizeHistory(payload.history);

        if (!message) {
            return errorResponse('Message is required and must be under 2000 characters.', 400);
        }

        const authHeader = req.headers.get('Authorization') || undefined;
        if (!authHeader) {
            return errorResponse('Unauthorized', 401);
        }

        const supabase = createSupabaseClient(authHeader);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return errorResponse('Unauthorized', 401);
        }

        // Get relevant SOP context
        const { context, sources } = await getRelevantContext(supabase, message, department);

        // Generate AI response
        const response = await callQwenChat(message, context, history);

        return jsonResponse({ response, sources });
    } catch (error) {
        console.error('RAG chat error:', error);
        return jsonResponse({
            response: 'I apologize, but I encountered an error processing your request. Please try again.',
            sources: [],
        }, 500);
    }
});
