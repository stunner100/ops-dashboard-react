import { useState, useEffect } from 'react';
import { X, Loader2, FileText, Clock, Edit2, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useRAG, type SOPDocument } from '../hooks';

interface SOPSection {
    id: string;
    document_id: string;
    title: string;
    content: string;
    order_index: number;
}

interface DocumentModalProps {
    document: SOPDocument;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const categoryLabels: Record<string, string> = {
    'vendor': 'Vendor Ops',
    'rider': 'Rider Fleet',
    'customer_service': 'Customer Service',
};

const categoryStyle: Record<string, { bg: string, text: string, border: string }> = {
    'vendor': { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
    'rider': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
    'customer_service': { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
};

export function DocumentModal({ document, onClose, onEdit, onDelete }: DocumentModalProps) {
    const { getSections } = useRAG();
    const [sections, setSections] = useState<SOPSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadSections = async () => {
            setLoading(true);
            const data = await getSections(document.id);
            setSections(data);
            // Expand all sections by default
            setExpandedSections(new Set(data.map((s: SOPSection) => s.id)));
            setLoading(false);
        };
        loadSections();
    }, [document.id, getSections]);

    const toggleSection = (id: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleDelete = () => {
        if (confirm(`Delete "${document.title}"? This cannot be undone.`)) {
            onDelete();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-slide-up">
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${categoryStyle[document.department]?.bg || 'bg-slate-100'
                                } ${categoryStyle[document.department]?.text || 'text-slate-600'} ${categoryStyle[document.department]?.border || 'border-slate-200'
                                }`}>
                                {categoryLabels[document.department] || document.department}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                            {document.title}
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Updated {formatDate(document.updated_at || document.created_at)}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onEdit}
                            className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            title="Edit document"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete document"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {document.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                            {document.description}
                        </p>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                        </div>
                    ) : sections.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500 dark:text-slate-400 mb-4">No sections in this document yet.</p>
                            <button className="btn-secondary text-sm">
                                <Plus className="w-4 h-4" />
                                Add Section
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sections.map((section, index) => (
                                <div
                                    key={section.id}
                                    className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                                >
                                    <button
                                        onClick={() => toggleSection(section.id)}
                                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center">
                                                {index + 1}
                                            </span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {section.title}
                                            </span>
                                        </span>
                                        {expandedSections.has(section.id) ? (
                                            <ChevronDown className="w-5 h-5 text-slate-400" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-slate-400" />
                                        )}
                                    </button>
                                    {expandedSections.has(section.id) && (
                                        <div className="px-4 pb-4">
                                            <div className="pl-9 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                {section.content}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
