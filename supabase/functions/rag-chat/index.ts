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
    let queryBuilder = supabase
        .from('sop_sections')
        .select(`
      id,
      title,
      content,
      document:sop_documents!inner(title, department, status)
    `)
        .eq('document.status', 'active')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
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
        const error = await response.text();
        throw new Error(`Qwen chat failed: ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
}

Deno.serve(async (req) => {
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
        const { message, department = null, history = [] }: ChatRequest = await req.json();

        if (!message || message.trim().length === 0) {
            return errorResponse('Message is required', 400);
        }

        const supabase = createSupabaseClient(req.headers.get('Authorization') || undefined);

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
        });
    }
});
