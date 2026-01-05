import { useState, useEffect, useRef } from 'react';
import { X, Calendar, User, Tag, AlertCircle, Flag, Loader2 } from 'lucide-react';
import type { Task, TaskInput, TaskCategory, TaskStatus, TaskPriority } from '../hooks/useTasks';
import { supabase } from '../lib/supabase';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TaskInput) => Promise<{ success: boolean; error?: string }>;
    task?: Task | null; // If provided, we're editing
    mode: 'create' | 'edit';
}

interface UserProfile {
    id: string;
    full_name: string | null;
    email: string;
}

const categories: { value: TaskCategory; label: string }[] = [
    { value: 'vendor_ops', label: 'Vendor Ops' },
    { value: 'rider_fleet', label: 'Rider Fleet' },
    { value: 'customer_service', label: 'Customer Service' },
    { value: 'business_development', label: 'Business Development' },
    { value: 'dashboard_support', label: 'Dashboard Support' },
];

const statuses: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'pending', label: 'Pending', color: 'bg-slate-400' },
    { value: 'in-progress', label: 'In Progress', color: 'bg-primary-500' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
    { value: 'completed', label: 'Completed', color: 'bg-emerald-500' },
];

const priorities: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'text-slate-500' },
    { value: 'medium', label: 'Medium', color: 'text-primary-500' },
    { value: 'high', label: 'High', color: 'text-orange-500' },
    { value: 'critical', label: 'Critical', color: 'text-red-500' },
];

export function TaskModal({ isOpen, onClose, onSubmit, task, mode }: TaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<TaskCategory>('vendor_ops');
    const [status, setStatus] = useState<TaskStatus>('pending');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [assigneeName, setAssigneeName] = useState('');
    const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
    // Multiple assignees
    const [selectedAssignees, setSelectedAssignees] = useState<UserProfile[]>([]);
    // Recurrence
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrencePattern, setRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
    const [recurrenceInterval, setRecurrenceInterval] = useState(1);
    const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // @ mention state
    const [showMentions, setShowMentions] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const assigneeInputRef = useRef<HTMLInputElement>(null);
    const mentionDropdownRef = useRef<HTMLDivElement>(null);

    // Fetch users on modal open
    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('is_approved', true)
                .order('full_name', { ascending: true });

            if (error) throw error;
            setAvailableUsers(data || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setUsersLoading(false);
        }
    };

    // Filter users based on input after @
    const getMentionQuery = () => {
        const atIndex = assigneeName.lastIndexOf('@');
        if (atIndex === -1) return '';
        return assigneeName.slice(atIndex + 1).toLowerCase();
    };

    const filteredUsers = availableUsers.filter(user => {
        const query = getMentionQuery();
        if (!query) return true;
        const name = (user.full_name || '').toLowerCase();
        const email = user.email.toLowerCase();
        return name.includes(query) || email.includes(query);
    });

    // Handle assignee input change
    const handleAssigneeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAssigneeName(value);

        // Show dropdown when @ is typed
        if (value.includes('@')) {
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (mentionDropdownRef.current && !mentionDropdownRef.current.contains(e.target as Node) &&
                assigneeInputRef.current && !assigneeInputRef.current.contains(e.target as Node)) {
                setShowMentions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset form when modal opens or task changes
    useEffect(() => {
        if (isOpen) {
            if (task) {
                setTitle(task.title);
                setDescription(task.description || '');
                setCategory(task.category);
                setStatus(task.status);
                setPriority(task.priority);
                setStartDate(task.start_date || '');
                setDueDate(task.due_date || '');
                setAssigneeName(task.assignee_name || '');
                setAssigneeId(task.assignee_id || undefined);
                // Multiple assignees
                const assignees = (task.assignee_ids || []).map((id, idx) => ({
                    id,
                    full_name: (task.assignee_names || [])[idx] || null,
                    email: ''
                }));
                setSelectedAssignees(assignees);
                // Recurrence
                setIsRecurring(task.is_recurring || false);
                setRecurrencePattern(task.recurrence_pattern || 'weekly');
                setRecurrenceInterval(task.recurrence_interval || 1);
                setRecurrenceEndDate(task.recurrence_end_date || '');
            } else {
                setTitle('');
                setDescription('');
                setCategory('vendor_ops');
                setStatus('pending');
                setPriority('medium');
                setStartDate('');
                setDueDate('');
                setAssigneeName('');
                setAssigneeId(undefined);
                setSelectedAssignees([]);
                setIsRecurring(false);
                setRecurrencePattern('weekly');
                setRecurrenceInterval(1);
                setRecurrenceEndDate('');
            }
            setError('');
            setShowMentions(false);
        }
    }, [isOpen, task]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        setLoading(true);
        setError('');

        const taskData: TaskInput = {
            title: title.trim(),
            description: description.trim() || undefined,
            category,
            status,
            priority,
            start_date: startDate || undefined,
            due_date: dueDate || undefined,
            assignee_id: selectedAssignees[0]?.id || assigneeId,
            assignee_name: selectedAssignees[0]?.full_name || assigneeName.trim() || undefined,
            assignee_ids: selectedAssignees.map(a => a.id),
            assignee_names: selectedAssignees.map(a => a.full_name || a.email),
            is_recurring: isRecurring,
            recurrence_pattern: isRecurring ? recurrencePattern : undefined,
            recurrence_interval: isRecurring ? recurrenceInterval : undefined,
            recurrence_end_date: isRecurring && recurrenceEndDate ? recurrenceEndDate : undefined,
        };

        const result = await onSubmit(taskData);

        setLoading(false);

        if (result.success) {
            onClose();
        } else {
            setError(result.error || 'An error occurred');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg max-h-[85vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-slide-up flex flex-col">
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {mode === 'create' ? 'Create New Task' : 'Edit Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter task title"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a description (optional)"
                            rows={3}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Category & Status Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                <Tag className="w-3.5 h-3.5 inline mr-1" />
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                {statuses.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            <Flag className="w-3.5 h-3.5 inline mr-1" />
                            Priority
                        </label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as TaskPriority)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            {priorities.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Start Date & Due Date Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Assignees - Multi-select with chips */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            <User className="w-3.5 h-3.5 inline mr-1" />
                            Assignees
                        </label>

                        {/* Selected assignees chips */}
                        {selectedAssignees.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {selectedAssignees.map((user) => (
                                    <span
                                        key={user.id}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium"
                                    >
                                        <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold">
                                            {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                                        </span>
                                        {user.full_name || user.email}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAssignees(prev => prev.filter(a => a.id !== user.id))}
                                            className="ml-0.5 hover:text-primary-900 dark:hover:text-primary-100"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <input
                            ref={assigneeInputRef}
                            type="text"
                            value={assigneeName}
                            onChange={handleAssigneeChange}
                            placeholder="Type @ to add assignees"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />

                        {/* Mention Dropdown */}
                        {showMentions && (
                            <div
                                ref={mentionDropdownRef}
                                className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto"
                            >
                                {usersLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                                    </div>
                                ) : filteredUsers.filter(u => !selectedAssignees.find(s => s.id === u.id)).length === 0 ? (
                                    <div className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                                        No users found
                                    </div>
                                ) : (
                                    filteredUsers
                                        .filter(u => !selectedAssignees.find(s => s.id === u.id))
                                        .map((user) => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedAssignees(prev => [...prev, user]);
                                                    setAssigneeName('');
                                                    setShowMentions(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500 font-bold text-sm">
                                                    {(user.full_name || user.email).charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                        {user.full_name || 'No name'}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Recurrence Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                            </label>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Recurring Task
                            </span>
                        </div>

                        {isRecurring && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Repeat Every
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            max="99"
                                            value={recurrenceInterval}
                                            onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                                            className="w-16 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                        <select
                                            value={recurrencePattern}
                                            onChange={(e) => setRecurrencePattern(e.target.value as typeof recurrencePattern)}
                                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="daily">Day(s)</option>
                                            <option value="weekly">Week(s)</option>
                                            <option value="monthly">Month(s)</option>
                                            <option value="yearly">Year(s)</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        End Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={recurrenceEndDate}
                                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
