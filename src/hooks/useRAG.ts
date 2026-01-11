import { useState, useCallback } from 'react';
import { supabase, SUPABASE_CONFIG } from '../lib/supabase';

interface SearchResult {
    id: string;
    content: string;
    department: string;
    section_title: string;
    document_title: string;
    similarity: number;
}

interface ChatResponse {
    response: string;
    sources: Array<{
        title: string;
        department: string;
        relevance: number;
    }>;
}

interface SOPDocument {
    id: string;
    title: string;
    department: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface SOPPolicy {
    id: string;
    metric_name: string;
    department: string;
    category: string;
    comparison_operator: string;
    threshold_value: number;
    threshold_unit: string;
    severity: 'info' | 'warning' | 'critical';
    description: string;
}

const functionsUrl = `${SUPABASE_CONFIG.url}/functions/v1`;

async function callFunction<T>(functionName: string, data: Record<string, unknown> = {}): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
        throw new Error('Authentication required');
    }

    const response = await fetch(`${functionsUrl}/${functionName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

export function useRAG() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Search SOP content using semantic search with client-side fallback
     */
    const search = useCallback(async (
        query: string,
        department: string | null = null,
        limit = 8
    ): Promise<SearchResult[]> => {
        setLoading(true);
        setError(null);

        const searchTerm = query.trim().toLowerCase();
        const safeSearchTerm = searchTerm
            .replace(/[^a-z0-9 _-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (!safeSearchTerm) {
            setLoading(false);
            return [];
        }

        // Helper function for client-side search
        const performClientSideSearch = async (): Promise<SearchResult[]> => {
            try {
                // Search in sop_sections with joined document info
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
                    .or(`title.ilike.%${safeSearchTerm}%,content.ilike.%${safeSearchTerm}%`)
                    .limit(limit);

                if (department) {
                    queryBuilder = queryBuilder.eq('document.department', department);
                }

                const { data: sectionData, error: sectionError } = await queryBuilder;

                if (sectionError) throw sectionError;

                // Map section results to SearchResult format
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let results: SearchResult[] = (sectionData || []).map((row: any) => {
                    const doc = Array.isArray(row.document) ? row.document[0] : row.document;
                    const titleMatch = row.title?.toLowerCase().includes(safeSearchTerm) ? 0.3 : 0;
                    const contentMatch = row.content?.toLowerCase().includes(safeSearchTerm) ? 0.2 : 0;
                    const exactMatch = row.title?.toLowerCase() === safeSearchTerm ? 0.2 : 0;

                    return {
                        id: row.id,
                        content: row.content || '',
                        department: doc?.department || '',
                        section_title: row.title || '',
                        document_title: doc?.title || '',
                        similarity: Math.min(0.95, 0.5 + titleMatch + contentMatch + exactMatch),
                    };
                });

                // If no section results, search documents directly
                if (results.length === 0) {
                    let docQueryBuilder = supabase
                        .from('sop_documents')
                        .select('id, title, department, description, status')
                        .eq('status', 'active')
                        .or(`title.ilike.%${safeSearchTerm}%,description.ilike.%${safeSearchTerm}%`)
                        .limit(limit);

                    if (department) {
                        docQueryBuilder = docQueryBuilder.eq('department', department);
                    }

                    const { data: docData, error: docError } = await docQueryBuilder;

                    if (docError) throw docError;

                    // Map document results to SearchResult format
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    results = (docData || []).map((doc: any) => {
                        const titleMatch = doc.title?.toLowerCase().includes(safeSearchTerm) ? 0.35 : 0;
                        const descMatch = doc.description?.toLowerCase().includes(safeSearchTerm) ? 0.2 : 0;
                        const exactMatch = doc.title?.toLowerCase() === safeSearchTerm ? 0.2 : 0;

                        return {
                            id: doc.id,
                            content: doc.description || 'No description available',
                            department: doc.department || '',
                            section_title: doc.title || '',
                            document_title: doc.title || '',
                            similarity: Math.min(0.95, 0.45 + titleMatch + descMatch + exactMatch),
                        };
                    });
                }

                // Sort by similarity descending
                results.sort((a, b) => b.similarity - a.similarity);
                return results;
            } catch (fallbackErr) {
                const message = fallbackErr instanceof Error ? fallbackErr.message : 'Search failed';
                setError(message);
                return [];
            }
        };

        try {
            // Try Edge Function first (semantic search)
            const result = await callFunction<{ results: SearchResult[] }>('search', {
                query,
                department,
                limit,
                threshold: 0.65,
            });

            // If Edge Function returns results, use them
            if (result.results && result.results.length > 0) {
                return result.results;
            }

            // Otherwise, fall back to client-side search
            console.log('Edge function returned no results, using client-side search');
            return await performClientSideSearch();
        } catch {
            // Also fallback on Edge Function error
            console.log('Edge function unavailable, using client-side search');
            return await performClientSideSearch();
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Chat with AI assistant using RAG
     */
    const chat = useCallback(async (
        message: string,
        department: string | null = null,
        history: Array<{ role: string; content: string }> = []
    ): Promise<ChatResponse> => {
        setLoading(true);
        setError(null);
        try {
            const result = await callFunction<ChatResponse>('rag-chat', {
                message,
                department,
                history,
            });
            return result;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Chat request failed';
            setError(message);
            return { response: 'Sorry, I encountered an error processing your request.', sources: [] };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Get SOP policies for notifications/alerts
     */
    const getPolicies = useCallback(async (
        department: string | null = null,
        category: string | null = null,
        severity: string | null = null
    ): Promise<SOPPolicy[]> => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('sop_policies')
                .select('*')
                .order('severity', { ascending: false })
                .order('metric_name');

            if (department) query = query.eq('department', department);
            if (category) query = query.eq('category', category);
            if (severity) query = query.eq('severity', severity);

            const { data, error: queryError } = await query;

            if (queryError) throw queryError;
            return data || [];
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch policies';
            setError(message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Get all active SOP documents
     */
    const getDocuments = useCallback(async (): Promise<SOPDocument[]> => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: queryError } = await supabase
                .from('sop_documents')
                .select('*')
                .eq('status', 'active')
                .order('department');

            if (queryError) throw queryError;
            return data || [];
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch documents';
            setError(message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Get sections for a specific document
     */
    const getSections = useCallback(async (documentId: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: queryError } = await supabase
                .from('sop_sections')
                .select('*')
                .eq('document_id', documentId)
                .order('order_index');

            if (queryError) throw queryError;
            return data || [];
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch sections';
            setError(message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Create a new SOP document
     */
    const createDocument = useCallback(async (
        title: string,
        department: string,
        description?: string
    ): Promise<{ success: boolean; data?: SOPDocument; error?: string }> => {
        try {
            const { data, error: createError } = await supabase
                .from('sop_documents')
                .insert({
                    title,
                    department,
                    description: description || null,
                    status: 'active',
                })
                .select()
                .single();

            if (createError) throw createError;
            return { success: true, data };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create document';
            return { success: false, error: message };
        }
    }, []);

    /**
     * Update an existing SOP document
     */
    const updateDocument = useCallback(async (
        id: string,
        updates: { title?: string; department?: string; description?: string; status?: string }
    ): Promise<{ success: boolean; data?: SOPDocument; error?: string }> => {
        try {
            const { data, error: updateError } = await supabase
                .from('sop_documents')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;
            return { success: true, data };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update document';
            return { success: false, error: message };
        }
    }, []);

    /**
     * Delete an SOP document
     */
    const deleteDocument = useCallback(async (
        id: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: deleteError } = await supabase
                .from('sop_documents')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            return { success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete document';
            return { success: false, error: message };
        }
    }, []);

    /**
     * Create a new section in a document
     */
    const createSection = useCallback(async (
        documentId: string,
        title: string,
        content: string,
        orderIndex?: number
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: createError } = await supabase
                .from('sop_sections')
                .insert({
                    document_id: documentId,
                    title,
                    content,
                    order_index: orderIndex || 0,
                });

            if (createError) throw createError;
            return { success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create section';
            return { success: false, error: message };
        }
    }, []);

    /**
     * Update a section
     */
    const updateSection = useCallback(async (
        id: string,
        updates: { title?: string; content?: string; order_index?: number }
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: updateError } = await supabase
                .from('sop_sections')
                .update(updates)
                .eq('id', id);

            if (updateError) throw updateError;
            return { success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update section';
            return { success: false, error: message };
        }
    }, []);

    /**
     * Delete a section
     */
    const deleteSection = useCallback(async (
        id: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: deleteError } = await supabase
                .from('sop_sections')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            return { success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete section';
            return { success: false, error: message };
        }
    }, []);

    return {
        loading,
        error,
        search,
        chat,
        getPolicies,
        getDocuments,
        getSections,
        createDocument,
        updateDocument,
        deleteDocument,
        createSection,
        updateSection,
        deleteSection,
    };
}

export type { SearchResult, ChatResponse, SOPDocument, SOPPolicy };
