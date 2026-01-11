import { useTasks } from '../../hooks/useTasks';
import { Calendar, Loader2 } from 'lucide-react';

export function RecentTasksWidget() {
    const { tasks, loading } = useTasks();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
        );
    }

    const recentTasks = tasks
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);

    const statusColors: Record<string, string> = {
        pending: 'bg-slate-400',
        'in-progress': 'bg-primary-500',
        urgent: 'bg-red-500',
        completed: 'bg-emerald-500',
    };

    if (recentTasks.length === 0) {
        return (
            <div className="text-center py-4 text-sm text-slate-500">
                No tasks yet
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {recentTasks.map(task => (
                <div
                    key={task.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                    <div className={`w-2 h-2 rounded-full ${statusColors[task.status] || 'bg-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {task.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            {task.due_date && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            )}
                            <span className="capitalize">{task.category.replace('_', ' ')}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
