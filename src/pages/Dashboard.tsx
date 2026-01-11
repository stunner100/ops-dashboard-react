import { useState } from 'react';
import { Header } from '../components/layout';
import {
    Plus, RotateCcw, LayoutGrid, Loader2,
    CheckSquare, ListTodo, Target, Calendar, Users
} from 'lucide-react';
import { useDashboard, widgetTypeInfo, type WidgetType } from '../hooks/useDashboard';
import {
    WidgetWrapper,
    TaskSummaryWidget,
    RecentTasksWidget,
    GoalsWidget,
    CalendarMiniWidget,
    TeamActivityWidget,
} from '../components/widgets';

const widgetIcons: Record<WidgetType, React.ElementType> = {
    'task-summary': CheckSquare,
    'recent-tasks': ListTodo,
    'goals': Target,
    'team-activity': Users,
    'calendar-mini': Calendar,
};

export function Dashboard() {
    const {
        widgets,
        isLoaded,
        addWidget,
        removeWidget,
        reorderWidgets,
        resetToDefault,
        availableTypes,
    } = useDashboard();

    const [showAddModal, setShowAddModal] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        reorderWidgets(draggedIndex, index);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const renderWidgetContent = (type: WidgetType) => {
        switch (type) {
            case 'task-summary':
                return <TaskSummaryWidget />;
            case 'recent-tasks':
                return <RecentTasksWidget />;
            case 'goals':
                return <GoalsWidget />;
            case 'team-activity':
                return <TeamActivityWidget />;
            case 'calendar-mini':
                return <CalendarMiniWidget />;
            default:
                return <div className="text-slate-500">Unknown widget</div>;
        }
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20">
            <Header title="Dashboard" />

            <div className="p-4 md:p-6 max-w-7xl mx-auto">
                {/* Header actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Dashboard</h2>
                        <p className="text-sm text-slate-500">Customize your view with widgets</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={resetToDefault}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn-primary"
                        >
                            <Plus className="w-4 h-4" />
                            Add Widget
                        </button>
                    </div>
                </div>

                {/* Widget grid */}
                {widgets.length === 0 ? (
                    <div className="text-center py-20">
                        <LayoutGrid className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No widgets yet</h3>
                        <p className="text-sm text-slate-500 mb-4">Add widgets to customize your dashboard</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn-primary"
                        >
                            <Plus className="w-4 h-4" />
                            Add Your First Widget
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {widgets.map((widget, index) => (
                            <div
                                key={widget.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`${draggedIndex === index ? 'opacity-50' : ''} transition-opacity`}
                            >
                                <WidgetWrapper
                                    title={widget.title}
                                    size={widget.size}
                                    onRemove={() => removeWidget(widget.id)}
                                >
                                    {renderWidgetContent(widget.type)}
                                </WidgetWrapper>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Widget Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowAddModal(false)}
                    />
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                        <div className="p-6 border-b border-slate-200 dark:border-white/10">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Widget</h3>
                            <p className="text-sm text-slate-500">Choose a widget to add to your dashboard</p>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-2">
                                {availableTypes.map(type => {
                                    const info = widgetTypeInfo[type];
                                    const Icon = widgetIcons[type];
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                addWidget(type);
                                                setShowAddModal(false);
                                            }}
                                            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-left"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-primary-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-900 dark:text-white">{info.label}</p>
                                                <p className="text-sm text-slate-500">{info.description}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-white/10">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="w-full py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
