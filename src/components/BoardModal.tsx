import { useState, useEffect } from 'react';
import { X, Folder, Star, Briefcase, Target, Zap, Heart, Bookmark, Flag, Archive } from 'lucide-react';
import type { Board, BoardInput } from '../hooks/useBoards';

interface BoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: BoardInput) => Promise<{ success: boolean; error?: string }>;
    editingBoard?: Board | null;
}

const iconOptions = [
    { value: 'folder', icon: Folder, label: 'Folder' },
    { value: 'star', icon: Star, label: 'Star' },
    { value: 'briefcase', icon: Briefcase, label: 'Briefcase' },
    { value: 'target', icon: Target, label: 'Target' },
    { value: 'zap', icon: Zap, label: 'Zap' },
    { value: 'heart', icon: Heart, label: 'Heart' },
    { value: 'bookmark', icon: Bookmark, label: 'Bookmark' },
    { value: 'flag', icon: Flag, label: 'Flag' },
    { value: 'archive', icon: Archive, label: 'Archive' },
];

const colorOptions = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
];

export function BoardModal({ isOpen, onClose, onSubmit, editingBoard }: BoardModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#3B82F6');
    const [icon, setIcon] = useState('folder');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Reset form when modal opens/closes or editing board changes
    useEffect(() => {
        if (isOpen) {
            if (editingBoard) {
                setName(editingBoard.name);
                setDescription(editingBoard.description || '');
                setColor(editingBoard.color);
                setIcon(editingBoard.icon);
            } else {
                setName('');
                setDescription('');
                setColor('#3B82F6');
                setIcon('folder');
            }
            setError('');
        }
    }, [isOpen, editingBoard]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Board name is required');
            return;
        }

        setLoading(true);
        const result = await onSubmit({
            name: name.trim(),
            description: description.trim() || undefined,
            color,
            icon,
        });

        if (result.success) {
            onClose();
        } else {
            setError(result.error || 'Failed to save board');
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    const SelectedIcon = iconOptions.find(i => i.value === icon)?.icon || Folder;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl w-full max-w-md shadow-2xl border border-slate-200/60 dark:border-white/5 animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${color}20` }}
                        >
                            <SelectedIcon className="w-5 h-5" style={{ color }} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {editingBoard ? 'Edit Board' : 'New Board'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Board Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Project Board"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this board for?"
                            rows={2}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
                        />
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {colorOptions.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0A0A0A] scale-110' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Icon Picker */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Icon
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {iconOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setIcon(opt.value)}
                                    className={`p-2.5 rounded-lg transition-all ${icon === opt.value
                                        ? 'bg-primary-500/10 text-primary-500 ring-2 ring-primary-500/30'
                                        : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'}`}
                                    title={opt.label}
                                >
                                    <opt.icon className="w-5 h-5" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:bg-slate-400 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="animate-spin">⏳</span>
                            ) : (
                                <>{editingBoard ? 'Save Changes' : 'Create Board'}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
