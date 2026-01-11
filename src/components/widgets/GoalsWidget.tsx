import { useGoals } from '../../hooks/useGoals';
import { Loader2, Target } from 'lucide-react';

export function GoalsWidget() {
    const { goals, loading } = useGoals();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
        );
    }

    const activeGoals = goals
        .filter(g => g.status === 'active')
        .slice(0, 3);

    if (activeGoals.length === 0) {
        return (
            <div className="text-center py-4">
                <Target className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No active goals</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {activeGoals.map(goal => {
                const progress = goal.progress || 0;
                const circumference = 2 * Math.PI * 18;
                const strokeDashoffset = circumference - (progress / 100) * circumference;

                return (
                    <div key={goal.id} className="flex items-center gap-3">
                        {/* Progress ring */}
                        <div className="relative w-10 h-10 flex-shrink-0">
                            <svg className="w-10 h-10 transform -rotate-90">
                                <circle
                                    cx="20"
                                    cy="20"
                                    r="18"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    className="text-slate-100 dark:text-white/10"
                                />
                                <circle
                                    cx="20"
                                    cy="20"
                                    r="18"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    className="text-primary-500"
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                {Math.round(progress)}%
                            </span>
                        </div>

                        {/* Goal info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {goal.title}
                            </p>
                            <p className="text-xs text-slate-500">
                                {goal.key_results?.length || 0} key results
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
