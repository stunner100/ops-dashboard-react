import { useState } from 'react';
import { Header } from '../components/layout';
import { Plus, Target, Calendar, Trash2, Pencil, ChevronDown, ChevronUp, Loader2, Check, X } from 'lucide-react';
import { useGoals } from '../hooks/useGoals';
import type { Goal, KeyResult } from '../hooks/useGoals';

export function Goals() {
    const {
        goals,
        loading,
        createGoal,
        updateGoal,
        deleteGoal,
        addKeyResult,
        updateKeyResult,
        deleteKeyResult,
        currentUserId,
    } = useGoals();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    // Key result form
    const [addingKRToGoal, setAddingKRToGoal] = useState<string | null>(null);
    const [krTitle, setKrTitle] = useState('');
    const [krTarget, setKrTarget] = useState('100');
    const [krUnit, setKrUnit] = useState('%');

    const toggleExpand = (id: string) => {
        setExpandedGoals(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleCreate = async () => {
        if (!title.trim()) return;
        setFormLoading(true);
        await createGoal({ title, description, target_date: targetDate || undefined });
        setFormLoading(false);
        setShowCreateModal(false);
        resetForm();
    };

    const handleUpdate = async () => {
        if (!editingGoal || !title.trim()) return;
        setFormLoading(true);
        await updateGoal(editingGoal.id, { title, description, target_date: targetDate || undefined });
        setFormLoading(false);
        setEditingGoal(null);
        resetForm();
    };

    const handleDelete = async (goal: Goal) => {
        if (!confirm(`Delete "${goal.title}"? This will also delete all key results.`)) return;
        await deleteGoal(goal.id);
    };

    const handleAddKR = async (goalId: string) => {
        if (!krTitle.trim()) return;
        setFormLoading(true);
        await addKeyResult(goalId, {
            title: krTitle,
            target_value: parseFloat(krTarget) || 100,
            unit: krUnit,
        });
        setFormLoading(false);
        setAddingKRToGoal(null);
        setKrTitle('');
        setKrTarget('100');
        setKrUnit('%');
    };

    const handleUpdateKRProgress = async (kr: KeyResult, newValue: number) => {
        await updateKeyResult(kr.id, { current_value: newValue });
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setTargetDate('');
    };

    const openEdit = (goal: Goal) => {
        setEditingGoal(goal);
        setTitle(goal.title);
        setDescription(goal.description || '');
        setTargetDate(goal.target_date || '');
    };

    const calculateGoalProgress = (keyResults: KeyResult[] | undefined) => {
        if (!keyResults || keyResults.length === 0) return 0;
        const total = keyResults.reduce((acc, kr) => {
            const progress = kr.target_value > 0 ? (kr.current_value / kr.target_value) * 100 : 0;
            return acc + Math.min(progress, 100);
        }, 0);
        return Math.round(total / keyResults.length);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');

    return (
        <div className="min-h-screen pb-20">
            <Header title="Goals & OKRs" />

            <div className="p-4 md:p-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Objectives & Key Results</h2>
                        <p className="text-sm text-slate-500">Set goals and track progress with measurable key results</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary"
                    >
                        <Plus className="w-4 h-4" />
                        New Goal
                    </button>
                </div>

                {/* Active Goals */}
                <div className="space-y-4">
                    {activeGoals.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10">
                            <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500">No active goals</p>
                            <p className="text-sm text-slate-400 mt-1">Create your first goal to start tracking progress</p>
                        </div>
                    ) : (
                        activeGoals.map(goal => {
                            const progress = calculateGoalProgress(goal.key_results);
                            const isExpanded = expandedGoals.has(goal.id);
                            const isOwner = goal.owner_id === currentUserId;

                            return (
                                <div
                                    key={goal.id}
                                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden"
                                >
                                    {/* Goal Header */}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Target className="w-4 h-4 text-primary-500" />
                                                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                                        {goal.title}
                                                    </h3>
                                                </div>
                                                {goal.description && (
                                                    <p className="text-sm text-slate-500 line-clamp-2">{goal.description}</p>
                                                )}
                                                {goal.target_date && (
                                                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                                                        <Calendar className="w-3 h-3" />
                                                        Target: {new Date(goal.target_date).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Progress ring */}
                                            <div className="relative w-16 h-16 flex-shrink-0">
                                                <svg className="w-full h-full -rotate-90">
                                                    <circle
                                                        cx="32"
                                                        cy="32"
                                                        r="28"
                                                        stroke="currentColor"
                                                        strokeWidth="6"
                                                        fill="none"
                                                        className="text-slate-200 dark:text-white/10"
                                                    />
                                                    <circle
                                                        cx="32"
                                                        cy="32"
                                                        r="28"
                                                        stroke="currentColor"
                                                        strokeWidth="6"
                                                        fill="none"
                                                        strokeDasharray={`${(progress / 100) * 176} 176`}
                                                        className="text-primary-500"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{progress}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 mt-3">
                                            <button
                                                onClick={() => toggleExpand(goal.id)}
                                                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-white"
                                            >
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                {goal.key_results?.length || 0} Key Results
                                            </button>
                                            <div className="flex-1" />
                                            {isOwner && (
                                                <>
                                                    <button
                                                        onClick={() => openEdit(goal)}
                                                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(goal)}
                                                        className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Key Results */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 space-y-3">
                                            {goal.key_results?.map(kr => {
                                                const krProgress = kr.target_value > 0 ? Math.min((kr.current_value / kr.target_value) * 100, 100) : 0;
                                                return (
                                                    <div key={kr.id} className="flex items-center gap-3">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{kr.title}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className="flex-1 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-primary-500 rounded-full transition-all"
                                                                        style={{ width: `${krProgress}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-medium text-slate-500 w-20 text-right">
                                                                    {kr.current_value} / {kr.target_value} {kr.unit}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isOwner && (
                                                            <input
                                                                type="number"
                                                                value={kr.current_value}
                                                                onChange={(e) => handleUpdateKRProgress(kr, parseFloat(e.target.value) || 0)}
                                                                className="w-16 px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded text-slate-900 dark:text-white"
                                                                min="0"
                                                                max={kr.target_value}
                                                            />
                                                        )}
                                                        {isOwner && (
                                                            <button
                                                                onClick={() => deleteKeyResult(kr.id)}
                                                                className="p-1 text-slate-400 hover:text-red-500"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* Add Key Result */}
                                            {isOwner && (
                                                addingKRToGoal === goal.id ? (
                                                    <div className="flex items-end gap-2 pt-2 border-t border-slate-200 dark:border-white/5">
                                                        <input
                                                            value={krTitle}
                                                            onChange={(e) => setKrTitle(e.target.value)}
                                                            placeholder="Key result title"
                                                            className="flex-1 px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded"
                                                        />
                                                        <input
                                                            type="number"
                                                            value={krTarget}
                                                            onChange={(e) => setKrTarget(e.target.value)}
                                                            placeholder="Target"
                                                            className="w-16 px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded"
                                                        />
                                                        <input
                                                            value={krUnit}
                                                            onChange={(e) => setKrUnit(e.target.value)}
                                                            placeholder="Unit"
                                                            className="w-12 px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded"
                                                        />
                                                        <button
                                                            onClick={() => handleAddKR(goal.id)}
                                                            disabled={formLoading}
                                                            className="p-1.5 rounded bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setAddingKRToGoal(null)}
                                                            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setAddingKRToGoal(goal.id)}
                                                        className="flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-600 pt-2"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        Add Key Result
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Completed Goals */}
                {completedGoals.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wide">Completed</h3>
                        <div className="space-y-2">
                            {completedGoals.map(goal => (
                                <div
                                    key={goal.id}
                                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.02] rounded-lg text-slate-500"
                                >
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className="flex-1 truncate">{goal.title}</span>
                                    <span className="text-xs">{new Date(goal.updated_at).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {(showCreateModal || editingGoal) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setShowCreateModal(false); setEditingGoal(null); resetForm(); }} />
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl p-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            {editingGoal ? 'Edit Goal' : 'Create Goal'}
                        </h3>

                        <div className="space-y-4">
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Goal title"
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white"
                            />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Description (optional)"
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white resize-none"
                            />
                            <input
                                type="date"
                                value={targetDate}
                                onChange={(e) => setTargetDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white"
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => { setShowCreateModal(false); setEditingGoal(null); resetForm(); }}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={editingGoal ? handleUpdate : handleCreate}
                                disabled={formLoading || !title.trim()}
                                className="btn-primary disabled:opacity-50"
                            >
                                {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingGoal ? 'Save' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
