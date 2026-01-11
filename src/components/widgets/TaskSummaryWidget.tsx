import { useTasks } from '../../hooks/useTasks';
import { CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';

export function TaskSummaryWidget() {
    const { tasks, loading } = useTasks();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
        );
    }

    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const urgent = tasks.filter(t => t.status === 'urgent').length;
    const completed = tasks.filter(t => t.status === 'completed').length;

    const stats = [
        { label: 'Pending', value: pending, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
        { label: 'In Progress', value: inProgress, color: 'text-primary-500', bg: 'bg-primary-100 dark:bg-primary-900/30', icon: Clock },
        { label: 'Urgent', value: urgent, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', icon: AlertTriangle },
        { label: 'Completed', value: completed, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle },
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
            {stats.map(stat => (
                <div key={stat.label} className={`${stat.bg} rounded-lg p-3 text-center`}>
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</div>
                </div>
            ))}
        </div>
    );
}
