import { useState, useRef, useEffect } from 'react';
import { Filter, Check } from 'lucide-react';
import type { TaskFilters, TaskCategory, TaskStatus, TaskPriority } from '../hooks/useTasks';

interface FilterPanelProps {
    filters: TaskFilters;
    onChange: (filters: TaskFilters) => void;
}

const categoryOptions: { value: TaskCategory; label: string }[] = [
    { value: 'vendor_ops', label: 'Vendor Ops' },
    { value: 'rider_fleet', label: 'Rider Fleet' },
    { value: 'customer_service', label: 'Customer Service' },
    { value: 'business_development', label: 'Business Development' },
    { value: 'dashboard_support', label: 'Dashboard Support' },
];

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-slate-400' },
    { value: 'medium', label: 'Medium', color: 'bg-primary-400' },
    { value: 'high', label: 'High', color: 'bg-orange-400' },
    { value: 'critical', label: 'Critical', color: 'bg-red-400' },
];

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'pending', label: 'Pending', color: 'bg-slate-400' },
    { value: 'in-progress', label: 'In Progress', color: 'bg-primary-500' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
    { value: 'completed', label: 'Completed', color: 'bg-emerald-500' },
];

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const activeFilterCount =
        (filters.category?.length || 0) +
        (filters.status?.length || 0) +
        (filters.priority?.length || 0);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleCategory = (value: TaskCategory) => {
        const current = filters.category || [];
        const updated = current.includes(value)
            ? current.filter((c) => c !== value)
            : [...current, value];
        onChange({ ...filters, category: updated.length ? updated : undefined });
    };

    const toggleStatus = (value: TaskStatus) => {
        const current = filters.status || [];
        const updated = current.includes(value)
            ? current.filter((s) => s !== value)
            : [...current, value];
        onChange({ ...filters, status: updated.length ? updated : undefined });
    };

    const togglePriority = (value: TaskPriority) => {
        const current = filters.priority || [];
        const updated = current.includes(value)
            ? current.filter((p) => p !== value)
            : [...current, value];
        onChange({ ...filters, priority: updated.length ? updated : undefined });
    };

    const clearFilters = () => {
        onChange({});
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`btn-secondary ${activeFilterCount > 0 ? 'ring-2 ring-primary-500/20' : ''}`}
            >
                <Filter className="w-3.5 h-3.5" />
                Filter
                {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-primary-500 text-white rounded-full">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 animate-slide-up">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Filters</span>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                        {/* Category */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                Category
                            </h4>
                            <div className="space-y-1">
                                {categoryOptions.map((option) => (
                                    <label
                                        key={option.value}
                                        className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                                    >
                                        <div
                                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${filters.category?.includes(option.value)
                                                ? 'bg-primary-500 border-primary-500'
                                                : 'border-slate-300 dark:border-slate-600'
                                                }`}
                                        >
                                            {filters.category?.includes(option.value) && (
                                                <Check className="w-3 h-3 text-white" />
                                            )}
                                        </div>
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{option.label}</span>
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={filters.category?.includes(option.value) || false}
                                            onChange={() => toggleCategory(option.value)}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                Status
                            </h4>
                            <div className="space-y-1">
                                {statusOptions.map((option) => (
                                    <label
                                        key={option.value}
                                        className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                                    >
                                        <div
                                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${filters.status?.includes(option.value)
                                                ? 'bg-primary-500 border-primary-500'
                                                : 'border-slate-300 dark:border-slate-600'
                                                }`}
                                        >
                                            {filters.status?.includes(option.value) && (
                                                <Check className="w-3 h-3 text-white" />
                                            )}
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${option.color}`} />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{option.label}</span>
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={filters.status?.includes(option.value) || false}
                                            onChange={() => toggleStatus(option.value)}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Priority */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                Priority
                            </h4>
                            <div className="space-y-1">
                                {priorityOptions.map((option) => (
                                    <label
                                        key={option.value}
                                        className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                                    >
                                        <div
                                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${filters.priority?.includes(option.value)
                                                ? 'bg-primary-500 border-primary-500'
                                                : 'border-slate-300 dark:border-slate-600'
                                                }`}
                                        >
                                            {filters.priority?.includes(option.value) && (
                                                <Check className="w-3 h-3 text-white" />
                                            )}
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${option.color}`} />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{option.label}</span>
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={filters.priority?.includes(option.value) || false}
                                            onChange={() => togglePriority(option.value)}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
