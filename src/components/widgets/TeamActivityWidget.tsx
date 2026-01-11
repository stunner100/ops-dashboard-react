import { useTasks } from '../../hooks/useTasks';
import { Loader2, User } from 'lucide-react';

export function TeamActivityWidget() {
    const { tasks, loading } = useTasks();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
        );
    }

    // Get recent task updates (simulate activity feed)
    const recentActivity = tasks
        .filter(t => t.updated_at)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5)
        .map(task => ({
            id: task.id,
            user: task.assignee_name || task.assignee_names?.[0] || 'Someone',
            action: task.status === 'completed' ? 'completed' : 'updated',
            task: task.title,
            time: new Date(task.updated_at),
        }));

    if (recentActivity.length === 0) {
        return (
            <div className="text-center py-4 text-sm text-slate-500">
                No recent activity
            </div>
        );
    }

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="space-y-3">
            {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            <span className="font-medium text-slate-900 dark:text-white">{activity.user}</span>
                            {' '}{activity.action}{' '}
                            <span className="font-medium text-slate-900 dark:text-white truncate">"{activity.task}"</span>
                        </p>
                        <p className="text-xs text-slate-400">{formatTime(activity.time)}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
