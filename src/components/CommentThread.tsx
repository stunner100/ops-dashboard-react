import { useState } from 'react';
import { Send, Reply, Pencil, Trash2, X, Check, CornerDownRight } from 'lucide-react';
import type { Comment } from '../hooks/useComments';

interface CommentThreadProps {
    comments: Comment[];
    loading: boolean;
    currentUserId?: string;
    onAddComment: (content: string, parentId?: string) => Promise<{ success: boolean; error?: string }>;
    onEditComment: (commentId: string, content: string) => Promise<{ success: boolean; error?: string }>;
    onDeleteComment: (commentId: string) => Promise<{ success: boolean; error?: string }>;
}

export function CommentThread({
    comments,
    loading,
    currentUserId,
    onAddComment,
    onEditComment,
    onDeleteComment,
}: CommentThreadProps) {
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!newComment.trim() || submitting) return;

        setSubmitting(true);
        const result = await onAddComment(newComment.trim());
        if (result.success) {
            setNewComment('');
        }
        setSubmitting(false);
    };

    const handleReply = async (parentId: string) => {
        if (!replyContent.trim() || submitting) return;

        setSubmitting(true);
        const result = await onAddComment(replyContent.trim(), parentId);
        if (result.success) {
            setReplyContent('');
            setReplyingTo(null);
        }
        setSubmitting(false);
    };

    const handleEdit = async (commentId: string) => {
        if (!editContent.trim() || submitting) return;

        setSubmitting(true);
        const result = await onEditComment(commentId, editContent.trim());
        if (result.success) {
            setEditingId(null);
            setEditContent('');
        }
        setSubmitting(false);
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;
        await onDeleteComment(commentId);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const renderComment = (comment: Comment, isReply = false) => {
        const isOwn = comment.author_id === currentUserId;
        const isEditing = editingId === comment.id;

        return (
            <div
                key={comment.id}
                className={`flex gap-2 ${isReply ? 'ml-8 pl-3 border-l-2 border-slate-200 dark:border-white/10' : ''}`}
            >
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        {getInitials(comment.author_name || 'U')}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {comment.author_name || 'Unknown'}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-500">
                            {formatDate(comment.created_at)}
                        </span>
                        {comment.updated_at !== comment.created_at && (
                            <span className="text-[10px] text-slate-400 italic">(edited)</span>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="flex items-end gap-2">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                                rows={2}
                                autoFocus
                            />
                            <button
                                onClick={() => handleEdit(comment.id)}
                                disabled={submitting}
                                className="p-1.5 rounded-md bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                            >
                                <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => {
                                    setEditingId(null);
                                    setEditContent('');
                                }}
                                className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                                {comment.content}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-1">
                                {!isReply && (
                                    <button
                                        onClick={() => {
                                            setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                            setReplyContent('');
                                        }}
                                        className="flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-primary-500 transition-colors"
                                    >
                                        <Reply className="w-3 h-3" />
                                        Reply
                                    </button>
                                )}
                                {isOwn && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setEditingId(comment.id);
                                                setEditContent(comment.content);
                                            }}
                                            className="flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {/* Reply input */}
                    {replyingTo === comment.id && (
                        <div className="flex items-end gap-2 mt-2">
                            <CornerDownRight className="w-4 h-4 text-slate-400 flex-shrink-0 mb-1.5" />
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md text-slate-900 dark:text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                                rows={2}
                                autoFocus
                            />
                            <button
                                onClick={() => handleReply(comment.id)}
                                disabled={!replyContent.trim() || submitting}
                                className="p-1.5 rounded-md bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Nested replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 space-y-3">
                            {comment.replies.map(reply => renderComment(reply, true))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Comments list */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
                {comments.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-slate-500 dark:text-slate-500">No comments yet</p>
                        <p className="text-xs text-slate-400 mt-1">Be the first to comment</p>
                    </div>
                ) : (
                    comments.map(comment => renderComment(comment))
                )}
            </div>

            {/* New comment input */}
            <div className="flex items-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                    rows={2}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            handleSubmit();
                        }
                    }}
                />
                <button
                    onClick={handleSubmit}
                    disabled={!newComment.trim() || submitting}
                    className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Send (⌘+Enter)"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
