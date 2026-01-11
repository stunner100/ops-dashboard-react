import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Attachment {
    id: string;
    task_id: string;
    file_name: string;
    file_path: string;
    file_type: string | null;
    file_size: number | null;
    uploaded_by: string;
    created_at: string;
    // Computed
    download_url?: string;
}

const STORAGE_BUCKET = 'task-attachments';

export function useAttachments(taskId: string | null) {
    const { user } = useAuth();
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch attachments for a task
    const fetchAttachments = useCallback(async () => {
        if (!taskId) {
            setAttachments([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('task_attachments')
                .select('*')
                .eq('task_id', taskId)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            // Get signed URLs for each attachment
            const attachmentsWithUrls = await Promise.all(
                (data || []).map(async (att) => {
                    const { data: urlData } = await supabase.storage
                        .from(STORAGE_BUCKET)
                        .createSignedUrl(att.file_path, 3600); // 1 hour expiry

                    return {
                        ...att,
                        download_url: urlData?.signedUrl,
                    };
                })
            );

            setAttachments(attachmentsWithUrls);
        } catch (err) {
            console.error('Error fetching attachments:', err);
            setError('Failed to load attachments');
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    // Upload a file
    const uploadFile = async (file: File): Promise<{ success: boolean; error?: string }> => {
        if (!user || !taskId) {
            return { success: false, error: 'Not authenticated or no task selected' };
        }

        setUploading(true);
        setError(null);

        try {
            // Generate unique file path
            const fileExt = file.name.split('.').pop();
            const fileName = `${taskId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Create database record
            const { error: insertError } = await supabase
                .from('task_attachments')
                .insert({
                    task_id: taskId,
                    file_name: file.name,
                    file_path: fileName,
                    file_type: file.type,
                    file_size: file.size,
                    uploaded_by: user.id,
                });

            if (insertError) {
                // Clean up uploaded file if DB insert fails
                await supabase.storage.from(STORAGE_BUCKET).remove([fileName]);
                throw insertError;
            }

            await fetchAttachments();
            return { success: true };
        } catch (err) {
            console.error('Error uploading file:', err);
            return { success: false, error: 'Failed to upload file' };
        } finally {
            setUploading(false);
        }
    };

    // Delete an attachment
    const deleteAttachment = async (attachmentId: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            // Get attachment to find file path
            const attachment = attachments.find(a => a.id === attachmentId);
            if (!attachment) {
                return { success: false, error: 'Attachment not found' };
            }

            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .remove([attachment.file_path]);

            if (storageError) {
                console.warn('Failed to delete from storage:', storageError);
                // Continue anyway to delete DB record
            }

            // Delete from database
            const { error: deleteError } = await supabase
                .from('task_attachments')
                .delete()
                .eq('id', attachmentId);

            if (deleteError) throw deleteError;

            await fetchAttachments();
            return { success: true };
        } catch (err) {
            console.error('Error deleting attachment:', err);
            return { success: false, error: 'Failed to delete attachment' };
        }
    };

    // Fetch on mount and when taskId changes
    useEffect(() => {
        fetchAttachments();
    }, [taskId, fetchAttachments]);

    return {
        attachments,
        loading,
        uploading,
        error,
        uploadFile,
        deleteAttachment,
        refetch: fetchAttachments,
    };
}

// Helper to format file size
export function formatFileSize(bytes: number | null): string {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Helper to get file icon based on type
export function getFileIcon(fileType: string | null): string {
    if (!fileType) return '📄';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎬';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('document') || fileType.includes('word')) return '📝';
    if (fileType.includes('zip') || fileType.includes('compressed')) return '🗜️';
    return '📄';
}
