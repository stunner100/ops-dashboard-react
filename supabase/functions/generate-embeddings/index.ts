// Generate Embeddings Edge Function - Populate embeddings for SOP sections
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabase.ts';

const QWEN_EMBEDDING_URL = 'https://dashscope-intl.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding';

// Generate embedding using Qwen API
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

Deno.serve(async (req) => {
    // Handle CORS
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
        const { section_id, regenerate_all = false } = await req.json();

        const supabase = createSupabaseAdmin();

        let sectionsToProcess;

        if (section_id) {
            // Process single section
            const { data, error } = await supabase
                .from('sop_sections')
                .select('id, title, content')
                .eq('id', section_id)
                .single();

            if (error) throw error;
            sectionsToProcess = [data];
        } else if (regenerate_all) {
            // Process all sections without embeddings (or all if regenerate_all)
            let query = supabase
                .from('sop_sections')
                .select('id, title, content');

            if (!regenerate_all) {
                query = query.is('embedding', null);
            }

            const { data, error } = await query;
            if (error) throw error;
            sectionsToProcess = data || [];
        } else {
            // Process only sections without embeddings
            const { data, error } = await supabase
                .from('sop_sections')
                .select('id, title, content')
                .is('embedding', null);

            if (error) throw error;
            sectionsToProcess = data || [];
        }

        let processed = 0;
        let failed = 0;

        for (const section of sectionsToProcess) {
            try {
                // Create text for embedding (title + content)
                const text = `${section.title}\n\n${section.content}`;

                // Generate embedding
                const embedding = await generateEmbedding(text);

                // Update section with embedding
                const { error: updateError } = await supabase
                    .from('sop_sections')
                    .update({ embedding })
                    .eq('id', section.id);

                if (updateError) throw updateError;

                processed++;

                // Rate limiting - wait 200ms between API calls
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {
                console.error(`Failed to process section ${section.id}:`, err);
                failed++;
            }
        }

        return jsonResponse({
            success: true,
            processed,
            failed,
            total: sectionsToProcess.length,
        });
    } catch (error) {
        console.error('Generate embeddings error:', error);
        return errorResponse(error.message || 'Failed to generate embeddings', 500);
    }
});
