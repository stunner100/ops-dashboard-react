import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface Task {
    id: string;
    title: string;
    status: string;
    priority: string;
    category: string;
    due_date?: string | null;
    start_date?: string | null;
}

interface CalendarViewProps {
    tasks: readonly {
        id: string;
        title: string;
        status: string;
        priority: string;
        category: string;
        due_date?: string | null;
        start_date?: string | null;
    }[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onEdit: (task: any) => void;
    onAddTask: (date: Date) => void;
}

type ViewMode = 'month' | 'week';

const priorityColors: Record<string, string> = {
    urgent: 'bg-red-500',
    high: 'bg-amber-500',
    medium: 'bg-blue-500',
    low: 'bg-slate-400',
};

const statusColors: Record<string, string> = {
    pending: 'border-l-slate-400',
    'in-progress': 'border-l-primary-500',
    completed: 'border-l-emerald-500',
    blocked: 'border-l-red-500',
};

export function CalendarView({ tasks, onEdit, onAddTask }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');

    // Get month data
    const monthData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        // Get days from previous month to fill first week
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        const prevMonthDays = Array.from({ length: startDayOfWeek }, (_, i) => ({
            date: new Date(year, month - 1, prevMonthLastDay - startDayOfWeek + i + 1),
            isCurrentMonth: false,
        }));

        // Current month days
        const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
            date: new Date(year, month, i + 1),
            isCurrentMonth: true,
        }));

        // Next month days to fill last week
        const remainingDays = (7 - ((startDayOfWeek + daysInMonth) % 7)) % 7;
        const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => ({
            date: new Date(year, month + 1, i + 1),
            isCurrentMonth: false,
        }));

        return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    }, [currentDate]);

    // Get week data
    const weekData = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            return { date, isCurrentMonth: date.getMonth() === currentDate.getMonth() };
        });
    }, [currentDate]);

    // Group tasks by date
    const tasksByDate = useMemo(() => {
        const grouped: Record<string, Task[]> = {};

        tasks.forEach(task => {
            const dateStr = task.due_date ? task.due_date.split('T')[0] : null;
            if (dateStr) {
                if (!grouped[dateStr]) grouped[dateStr] = [];
                grouped[dateStr].push(task);
            }
        });

        return grouped;
    }, [tasks]);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const isToday = (date: Date) => formatDate(date) === formatDate(new Date());

    const navigatePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setDate(newDate.getDate() - 7);
        }
        setCurrentDate(newDate);
    };

    const navigateNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else {
            newDate.setDate(newDate.getDate() + 7);
        }
        setCurrentDate(newDate);
    };

    const goToToday = () => setCurrentDate(new Date());

    const days = viewMode === 'month' ? monthData : weekData;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={navigatePrev}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={navigateNext}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={goToToday}
                        className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
                    >
                        Today
                    </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-lg p-0.5">
                    <button
                        onClick={() => setViewMode('month')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'month'
                            ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Month
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'week'
                            ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Week
                    </button>
                </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-white/10">
                {dayNames.map((day) => (
                    <div
                        key={day}
                        className="py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-500"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className={`flex-1 grid grid-cols-7 ${viewMode === 'month' ? 'auto-rows-fr' : ''}`}>
                {days.map(({ date, isCurrentMonth }, index) => {
                    const dateStr = formatDate(date);
                    const dayTasks = tasksByDate[dateStr] || [];
                    const today = isToday(date);

                    return (
                        <div
                            key={index}
                            className={`group relative border-b border-r border-slate-100 dark:border-white/5 ${viewMode === 'week' ? 'min-h-[400px]' : 'min-h-[100px]'
                                } ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-white/[0.02]' : ''}`}
                        >
                            {/* Date Number */}
                            <div className="flex items-center justify-between p-1.5">
                                <span
                                    className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full ${today
                                        ? 'bg-primary-500 text-white'
                                        : isCurrentMonth
                                            ? 'text-slate-900 dark:text-slate-300'
                                            : 'text-slate-400 dark:text-slate-600'
                                        }`}
                                >
                                    {date.getDate()}
                                </span>
                                <button
                                    onClick={() => onAddTask(date)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Tasks */}
                            <div className="px-1 pb-1 space-y-0.5 overflow-y-auto max-h-[80px]">
                                {dayTasks.slice(0, viewMode === 'week' ? 10 : 3).map((task) => (
                                    <button
                                        key={task.id}
                                        onClick={() => onEdit(task)}
                                        className={`w-full text-left px-1.5 py-0.5 text-[10px] font-medium rounded border-l-2 truncate ${statusColors[task.status] || 'border-l-slate-400'
                                            } bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors`}
                                    >
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${priorityColors[task.priority] || 'bg-slate-400'}`} />
                                        {task.title}
                                    </button>
                                ))}
                                {dayTasks.length > (viewMode === 'week' ? 10 : 3) && (
                                    <div className="text-[10px] text-slate-500 dark:text-slate-500 px-1.5">
                                        +{dayTasks.length - (viewMode === 'week' ? 10 : 3)} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
