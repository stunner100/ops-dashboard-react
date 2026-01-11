import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';

export function CalendarMiniWidget() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { tasks } = useTasks();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // Get tasks with due dates in current month
    const taskDates = new Set(
        tasks
            .filter(t => t.due_date)
            .map(t => {
                const d = new Date(t.due_date!);
                if (d.getMonth() === month && d.getFullYear() === year) {
                    return d.getDate();
                }
                return null;
            })
            .filter(Boolean)
    );

    const days = [];
    // Empty cells for days before the first day
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-6" />);
    }
    // Days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
        const hasTask = taskDates.has(day);

        days.push(
            <div
                key={day}
                className={`h-6 w-6 flex items-center justify-center text-xs rounded-full relative
                    ${isToday
                        ? 'bg-primary-500 text-white font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                    }
                `}
            >
                {day}
                {hasTask && !isToday && (
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
                )}
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={prevMonth}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10"
                >
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {currentDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
                <button
                    onClick={nextMonth}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10"
                >
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="h-6 w-6 flex items-center justify-center text-[10px] font-medium text-slate-400">
                        {d}
                    </div>
                ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
                {days}
            </div>
        </div>
    );
}
