import { useState, useEffect } from 'react';
import { Header } from '../components/layout';
import {
    FileText, Download, Calendar, Filter, BarChart3, Users,
    TrendingUp, Loader2, ChevronDown, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';
import { useReports, type ReportFilters } from '../hooks/useReports';
import type { TaskCategory, TaskStatus, TaskPriority } from '../hooks/useTasks';

type ReportType = 'summary' | 'productivity' | 'team';

const categoryLabels: Record<TaskCategory, string> = {
    vendor_ops: 'Vendor Ops',
    rider_fleet: 'Rider Fleet',
    customer_service: 'Customer Service',
    business_development: 'Business Dev',
    dashboard_support: 'Dashboard',
};

const statusLabels: Record<TaskStatus, string> = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    urgent: 'Urgent',
    completed: 'Completed',
};

const statusColors: Record<TaskStatus, string> = {
    pending: 'bg-slate-400',
    'in-progress': 'bg-primary-500',
    urgent: 'bg-red-500',
    completed: 'bg-emerald-500',
};

// Priority labels available for future use
const _priorityLabels: Record<TaskPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
};

export function Reports() {
    const [reportType, setReportType] = useState<ReportType>('summary');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<ReportFilters>({
        dateFrom: '',
        dateTo: '',
        categories: [],
        statuses: [],
        priorities: [],
    });

    const {
        loading,
        tasks,
        fetchFilteredTasks,
        taskSummary,
        productivityData,
        teamPerformance,
        exportTasksCSV,
    } = useReports();

    // Fetch data on mount and filter change
    useEffect(() => {
        fetchFilteredTasks(filters);
    }, []);

    const handleApplyFilters = () => {
        fetchFilteredTasks(filters);
        setShowFilters(false);
    };

    const handleClearFilters = () => {
        setFilters({
            dateFrom: '',
            dateTo: '',
            categories: [],
            statuses: [],
            priorities: [],
        });
        fetchFilteredTasks({});
    };

    const toggleArrayFilter = <T extends string>(
        key: 'categories' | 'statuses' | 'priorities',
        value: T
    ) => {
        setFilters(prev => {
            const current = (prev[key] || []) as T[];
            const updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [key]: updated };
        });
    };

    const reportTabs = [
        { id: 'summary' as const, label: 'Task Summary', icon: BarChart3 },
        { id: 'productivity' as const, label: 'Productivity', icon: TrendingUp },
        { id: 'team' as const, label: 'Team Performance', icon: Users },
    ];

    return (
        <div className="min-h-screen pb-20">
            <Header title="Reports" />

            <div className="p-4 md:p-6 max-w-6xl mx-auto">
                {/* Header with actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Analytics & Reports</h2>
                        <p className="text-sm text-slate-500">Generate insights from your task data</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${showFilters || Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : v))
                                ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/30 dark:border-primary-700 dark:text-primary-400'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                            onClick={exportTasksCSV}
                            disabled={tasks.length === 0}
                            className="btn-primary disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Filters panel */}
                {showFilters && (
                    <div className="mb-6 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 animate-slide-up">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Date range */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    <Calendar className="w-3 h-3 inline mr-1" />
                                    Date Range
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={filters.dateFrom || ''}
                                        onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                                        className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg"
                                    />
                                    <input
                                        type="date"
                                        value={filters.dateTo || ''}
                                        onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                                        className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Category filter */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Categories
                                </label>
                                <div className="flex flex-wrap gap-1">
                                    {(Object.entries(categoryLabels) as [TaskCategory, string][]).map(([key, label]) => (
                                        <button
                                            key={key}
                                            onClick={() => toggleArrayFilter('categories', key)}
                                            className={`px-2 py-1 text-xs rounded-md transition-colors ${filters.categories?.includes(key)
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Status filter */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Status
                                </label>
                                <div className="flex flex-wrap gap-1">
                                    {(Object.entries(statusLabels) as [TaskStatus, string][]).map(([key, label]) => (
                                        <button
                                            key={key}
                                            onClick={() => toggleArrayFilter('statuses', key)}
                                            className={`px-2 py-1 text-xs rounded-md transition-colors ${filters.statuses?.includes(key)
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                            <button
                                onClick={handleClearFilters}
                                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            >
                                Clear All
                            </button>
                            <button onClick={handleApplyFilters} className="btn-primary text-sm">
                                Apply Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Report type tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {reportTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setReportType(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${reportType === tab.id
                                ? 'bg-primary-500 text-white shadow-md'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                )}

                {/* Task Summary Report */}
                {!loading && reportType === 'summary' && (
                    <div className="space-y-6">
                        {/* Summary cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 p-4">
                                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                                    <FileText className="w-4 h-4" />
                                    Total Tasks
                                </div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">{taskSummary.total}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 p-4">
                                <div className="flex items-center gap-2 text-emerald-500 text-sm mb-1">
                                    <CheckCircle className="w-4 h-4" />
                                    Completed
                                </div>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{taskSummary.completed}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 p-4">
                                <div className="flex items-center gap-2 text-primary-500 text-sm mb-1">
                                    <Clock className="w-4 h-4" />
                                    In Progress
                                </div>
                                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{taskSummary.byStatus['in-progress']}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 p-4">
                                <div className="flex items-center gap-2 text-red-500 text-sm mb-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    Overdue
                                </div>
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{taskSummary.overdue}</div>
                            </div>
                        </div>

                        {/* Status breakdown */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 p-6">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">By Status</h3>
                            <div className="space-y-3">
                                {(Object.entries(taskSummary.byStatus) as [TaskStatus, number][]).map(([status, count]) => (
                                    <div key={status} className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
                                        <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">{statusLabels[status]}</span>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{count}</span>
                                        <div className="w-24 h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${statusColors[status]}`}
                                                style={{ width: taskSummary.total > 0 ? `${(count / taskSummary.total) * 100}%` : '0%' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Category breakdown */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 p-6">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">By Category</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {(Object.entries(taskSummary.byCategory) as [TaskCategory, number][]).map(([category, count]) => (
                                    <div key={category} className="text-center p-3 bg-slate-50 dark:bg-white/5 rounded-lg">
                                        <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">{count}</div>
                                        <div className="text-xs text-slate-500">{categoryLabels[category]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Productivity Report */}
                {!loading && reportType === 'productivity' && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 p-6">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Tasks Over Time</h3>
                        {productivityData.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">No data available for the selected period</p>
                        ) : (
                            <div className="space-y-2">
                                {productivityData.slice(-14).map(day => (
                                    <div key={day.date} className="flex items-center gap-4">
                                        <span className="text-xs text-slate-500 w-20">
                                            {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                        <div className="flex-1 flex items-center gap-2">
                                            <div className="flex-1 h-4 bg-slate-100 dark:bg-white/5 rounded overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-500"
                                                    style={{ width: `${Math.min((day.created / Math.max(...productivityData.map(d => d.created), 1)) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-600 dark:text-slate-400 w-16">Created: {day.created}</span>
                                        </div>
                                        <div className="flex-1 flex items-center gap-2">
                                            <div className="flex-1 h-4 bg-slate-100 dark:bg-white/5 rounded overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500"
                                                    style={{ width: `${Math.min((day.completed / Math.max(...productivityData.map(d => d.completed), 1)) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-600 dark:text-slate-400 w-20">Completed: {day.completed}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Team Performance Report */}
                {!loading && reportType === 'team' && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-white/5">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Team Member</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400">Assigned</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400">Completed</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400">Completion Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                {teamPerformance.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                            No team data available
                                        </td>
                                    </tr>
                                ) : (
                                    teamPerformance.map(member => (
                                        <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500 font-bold text-sm">
                                                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">{member.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">{member.assigned}</td>
                                            <td className="px-4 py-3 text-center text-sm text-emerald-600 dark:text-emerald-400">{member.completed}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-16 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${member.completionRate >= 75 ? 'bg-emerald-500' : member.completionRate >= 50 ? 'bg-primary-500' : 'bg-red-500'}`}
                                                            style={{ width: `${member.completionRate}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{member.completionRate}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
