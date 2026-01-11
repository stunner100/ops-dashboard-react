import { useRef, useState } from 'react';
import { Upload, Trash2, Download, FileText, X, Loader2 } from 'lucide-react';
import type { Attachment } from '../hooks/useAttachments';
import { formatFileSize, getFileIcon } from '../hooks/useAttachments';

interface AttachmentsPanelProps {
    attachments: Attachment[];
    loading: boolean;
    uploading: boolean;
    onUpload: (file: File) => Promise<{ success: boolean; error?: string }>;
    onDelete: (attachmentId: string) => Promise<{ success: boolean; error?: string }>;
}

export function AttachmentsPanel({
    attachments,
    loading,
    uploading,
    onUpload,
    onDelete,
}: AttachmentsPanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setUploadError(null);
        const file = files[0];

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('File size must be less than 10MB');
            return;
        }

        const result = await onUpload(file);
        if (!result.success) {
            setUploadError(result.error || 'Upload failed');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this attachment?')) return;
        await onDelete(id);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Drop zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${dragOver
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                        : 'border-slate-200 dark:border-white/10 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">Uploading...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-slate-400" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-medium text-primary-500">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-400">Max file size: 10MB</p>
                    </div>
                )}
            </div>

            {/* Error message */}
            {uploadError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                    <X className="w-4 h-4 cursor-pointer" onClick={() => setUploadError(null)} />
                    {uploadError}
                </div>
            )}

            {/* Attachments list */}
            {attachments.length === 0 ? (
                <div className="text-center py-4">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No attachments yet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 group"
                        >
                            {/* File icon */}
                            <span className="text-xl">{getFileIcon(attachment.file_type)}</span>

                            {/* File info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                    {attachment.file_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {formatFileSize(attachment.file_size)} • {new Date(attachment.created_at).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {attachment.download_url && (
                                    <a
                                        href={attachment.download_url}
                                        download={attachment.file_name}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-md text-slate-500 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                )}
                                <button
                                    onClick={() => handleDelete(attachment.id)}
                                    className="p-1.5 rounded-md text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
