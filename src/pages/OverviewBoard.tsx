import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Header } from '../components/layout';
import { TaskModal } from '../components/TaskModal';
import { FilterPanel } from '../components/FilterPanel';
import { useTasks, filterTasks } from '../hooks';
import type { Task, TaskInput, TaskFilters, TaskStatus } from '../hooks';
import { Plus, MoreHorizontal, Clock, AlertCircle, CheckCircle2, Circle, Calendar, List, Kanban, Trash2, Pencil, Loader2 } from 'lucide-react';

type ViewType = 'board' | 'gantt' | 'list';
type GanttZoom = 'day' | 'week' | 'month';

const columns = [
  { id: 'pending' as TaskStatus, title: 'Pending', color: 'bg-slate-400' },
  { id: 'in-progress' as TaskStatus, title: 'In Progress', color: 'bg-primary-500' },
  { id: 'urgent' as TaskStatus, title: 'Urgent', color: 'bg-red-500' },
  { id: 'completed' as TaskStatus, title: 'Completed', color: 'bg-emerald-500' },
];

const statusIcons = {
  'pending': Circle,
  'in-progress': Clock,
  'urgent': AlertCircle,
  'completed': CheckCircle2,
};

const priorityConfig = {
  low: { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' },
  medium: { color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20', border: 'border-primary-200 dark:border-primary-800' },
  high: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
  critical: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
};

const categoryLabels: Record<string, string> = {
  'vendor_ops': 'Vendor Ops',
  'rider_fleet': 'Rider Fleet',
  'customer_service': 'Customer Service',
};

export function OverviewBoard() {
  const [currentView, setCurrentView] = useState<ViewType>('board');
  const [ganttZoom, setGanttZoom] = useState<GanttZoom>('day');
  const [filters, setFilters] = useState<TaskFilters>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { tasks, loading, createTask, updateTask, deleteTask, updateTaskStatus } = useTasks();

  // Apply filters
  const filteredTasks = filterTasks(tasks, filters);

  const handleCreateTask = async (data: TaskInput) => {
    return createTask(data);
  };

  const handleUpdateTask = async (data: TaskInput) => {
    if (!editingTask) return { success: false, error: 'No task selected' };
    return updateTask(editingTask.id, data);
  };

  const handleDeleteTask = async (task: Task) => {
    if (confirm(`Delete "${task.title}"?`)) {
      await deleteTask(task.id);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  // Drag & drop handler
  const handleDragDrop = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      await updateTaskStatus(taskId, newStatus);
    },
    [updateTaskStatus]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="Overview">
        {/* View toggle */}
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg gap-0.5 ml-8 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setCurrentView('board')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === 'board'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            Board
          </button>
          <button
            onClick={() => setCurrentView('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === 'list'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
          <button
            onClick={() => setCurrentView('gantt')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === 'gantt'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Timeline
          </button>
        </div>
      </Header>

      <div className="p-4 md:p-6 max-w-[1600px] mx-auto animate-fade-in">
        {/* Mobile View Toggle & Toolbar */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Mobile View Toggle */}
          <div className="md:hidden flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCurrentView('board')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === 'board'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              onClick={() => setCurrentView('list')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === 'list'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setCurrentView('gantt')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === 'gantt'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Timeline
            </button>
          </div>

          {/* Main Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button className="btn-primary flex-1 md:flex-none justify-center" onClick={handleOpenCreateModal}>
                <Plus className="w-4 h-4" />
                New Task
              </button>
              <div className="flex-1 md:flex-none">
                <FilterPanel filters={filters} onChange={setFilters} />
              </div>
            </div>

            {currentView === 'gantt' && (
              <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1 shadow-sm self-start md:self-auto">
                {(['day', 'week', 'month'] as GanttZoom[]).map((zoom) => (
                  <button
                    key={zoom}
                    onClick={() => setGanttZoom(zoom)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${ganttZoom === zoom
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    {zoom.charAt(0).toUpperCase() + zoom.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Views */}
        {currentView === 'board' && (
          <BoardView
            tasks={filteredTasks}
            onDragDrop={handleDragDrop}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onAddToColumn={(_status) => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
          />
        )}
        {currentView === 'gantt' && (
          <GanttView
            tasks={filteredTasks}
            zoom={ganttZoom}
            onEdit={handleEditTask}
            onUpdateTask={updateTask}
          />
        )}
        {currentView === 'list' && (
          <ListView
            tasks={filteredTasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
        mode={editingTask ? 'edit' : 'create'}
      />
    </div>
  );
}

interface BoardViewProps {
  tasks: Task[];
  onDragDrop: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddToColumn: (status: TaskStatus) => void;
}

function BoardView({ tasks, onDragDrop, onEdit, onDelete, onAddToColumn }: BoardViewProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDrop = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    if (draggedTask) {
      onDragDrop(draggedTask, columnId);
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);
        const StatusIcon = statusIcons[column.id];
        const isOver = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            className={`flex flex-col h-full transition-all ${isOver ? 'scale-[1.02]' : ''}`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
            onDragLeave={() => setDragOverColumn(null)}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-4 h-4 ${column.id === 'completed' ? 'text-emerald-500' : column.id === 'urgent' ? 'text-red-500' : column.id === 'in-progress' ? 'text-primary-500' : 'text-slate-400'}`} />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {column.title}
                </h3>
                <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {columnTasks.length}
                </span>
              </div>
              <button
                onClick={() => onAddToColumn(column.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-opacity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div
              className={`space-y-3 min-h-[200px] p-2 rounded-xl transition-colors ${isOver ? 'bg-primary-50 dark:bg-primary-900/10 ring-2 ring-primary-500/20' : ''
                }`}
            >
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isDragging={draggedTask === task.id}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
              <button
                onClick={() => onAddToColumn(column.id)}
                className="w-full py-2 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 border-dashed transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function TaskCard({ task, isDragging, onDragStart, onDragEnd, onEdit, onDelete }: TaskCardProps) {
  const priority = priorityConfig[task.priority];
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      className={`bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-700/50 transition-all cursor-grab active:cursor-grabbing group ${isDragging ? 'opacity-50 scale-95' : ''
        }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {categoryLabels[task.category] || task.category}
        </span>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEdit(task);
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(task);
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h4
        onClick={() => onEdit(task)}
        className="text-sm font-medium text-slate-900 dark:text-white mb-4 line-clamp-2 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors cursor-pointer"
      >
        {task.title}
      </h4>

      <div className="flex items-center justify-between mt-auto">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${priority.bg} ${priority.color} ${priority.border}`}>
          {task.priority === 'critical' || task.priority === 'high' ? <AlertCircle className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
          {task.priority}
        </div>

        {task.assignee_name && (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 border border-white dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 text-[10px] font-bold shadow-sm ring-2 ring-transparent group-hover:ring-primary-50 dark:group-hover:ring-primary-900/20 transition-all">
            {task.assignee_name.split(' ').map(n => n[0]).join('')}
          </div>
        )}
      </div>
    </div>
  );
}

interface GanttViewProps {
  tasks: Task[];
  zoom: GanttZoom;
  onEdit: (task: Task) => void;
  onUpdateTask: (id: string, updates: Partial<TaskInput>) => Promise<{ success: boolean; error?: string }>;
}

function GanttView({ tasks, zoom, onEdit, onUpdateTask }: GanttViewProps) {
  const today = useMemo(() => new Date(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    taskId: string;
    type: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    originalStartDate: Date;
    originalDueDate: Date;
  } | null>(null);

  // Calculate the number of date columns based on zoom level
  const columnCount = zoom === 'day' ? 14 : zoom === 'week' ? 8 : 6;
  const startOffset = -2; // Start 2 units before today

  // Generate date headers
  const dates = useMemo(() => {
    const result: Date[] = [];
    for (let i = startOffset; i < columnCount + startOffset; i++) {
      const date = new Date(today);
      if (zoom === 'day') {
        date.setDate(today.getDate() + i);
      } else if (zoom === 'week') {
        date.setDate(today.getDate() + i * 7);
      } else {
        date.setMonth(today.getMonth() + i);
      }
      result.push(date);
    }
    return result;
  }, [today, zoom, columnCount]);

  const visibleStart = dates[0];

  // Calculate milliseconds per column
  const getMsPerColumn = () => {
    if (zoom === 'day') return 24 * 60 * 60 * 1000; // 1 day
    if (zoom === 'week') return 7 * 24 * 60 * 60 * 1000; // 1 week
    return 30 * 24 * 60 * 60 * 1000; // ~1 month
  };

  const msPerColumn = getMsPerColumn();
  const totalMs = dates.length * msPerColumn;

  // Calculate bar position for a task
  const getBarStyle = (task: Task): { left: string; width: string } | null => {
    const startDate = task.start_date ? new Date(task.start_date) : null;
    const dueDate = task.due_date ? new Date(task.due_date) : null;

    // If no dates, show a placeholder bar
    if (!startDate && !dueDate) {
      return { left: '5%', width: '10%' };
    }

    // Use start_date or fallback to due_date - 3 days
    const effectiveStart = startDate || (dueDate ? new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000) : new Date());
    // Use due_date or fallback to start_date + 3 days
    const effectiveEnd = dueDate || (startDate ? new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000) : new Date());

    const startMs = effectiveStart.getTime() - visibleStart.getTime();
    const endMs = effectiveEnd.getTime() - visibleStart.getTime();

    const leftPercent = (startMs / totalMs) * 100;
    const widthPercent = ((endMs - startMs) / totalMs) * 100;

    // Clamp values to visible range
    const clampedLeft = Math.max(0, Math.min(leftPercent, 100));
    const clampedWidth = Math.max(2, Math.min(widthPercent, 100 - clampedLeft));

    return {
      left: `${clampedLeft}%`,
      width: `${clampedWidth}%`,
    };
  };

  // Format date for display
  const formatDate = (date: Date) => {
    if (zoom === 'month') {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  };

  const isToday = (date: Date) => date.toDateString() === today.toDateString();
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Calculate today marker position
  const getTodayMarkerPosition = () => {
    const todayMs = today.getTime() - visibleStart.getTime();
    const percent = (todayMs / totalMs) * 100;
    return Math.max(0, Math.min(percent, 100));
  };

  // Status colors
  const statusColors: Record<string, string> = {
    'pending': 'bg-slate-400',
    'in-progress': 'bg-primary-500',
    'urgent': 'bg-red-500',
    'completed': 'bg-emerald-500',
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, task: Task, type: 'move' | 'resize-start' | 'resize-end') => {
    e.preventDefault();
    e.stopPropagation();

    const startDate = task.start_date ? new Date(task.start_date) : new Date();
    const dueDate = task.due_date ? new Date(task.due_date) : new Date();

    setDragState({
      taskId: task.id,
      type,
      startX: e.clientX,
      originalStartDate: startDate,
      originalDueDate: dueDate,
    });
  };

  const handleMouseMove = useCallback((_e: MouseEvent) => {
    if (!dragState || !containerRef.current) return;

    // Visual feedback during drag could be added here
    // The actual update happens on mouseUp
  }, [dragState]);

  const handleMouseUp = useCallback(async (e: MouseEvent) => {
    if (!dragState || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const deltaX = e.clientX - dragState.startX;
    const deltaDays = Math.round((deltaX / containerWidth) * dates.length * (zoom === 'day' ? 1 : zoom === 'week' ? 7 : 30));

    if (deltaDays !== 0) {
      let newStartDate = new Date(dragState.originalStartDate);
      let newDueDate = new Date(dragState.originalDueDate);

      if (dragState.type === 'move') {
        newStartDate.setDate(newStartDate.getDate() + deltaDays);
        newDueDate.setDate(newDueDate.getDate() + deltaDays);
      } else if (dragState.type === 'resize-start') {
        newStartDate.setDate(newStartDate.getDate() + deltaDays);
        // Don't let start date go past due date
        if (newStartDate >= newDueDate) {
          newStartDate = new Date(newDueDate.getTime() - 24 * 60 * 60 * 1000);
        }
      } else if (dragState.type === 'resize-end') {
        newDueDate.setDate(newDueDate.getDate() + deltaDays);
        // Don't let due date go before start date
        if (newDueDate <= newStartDate) {
          newDueDate = new Date(newStartDate.getTime() + 24 * 60 * 60 * 1000);
        }
      }

      await onUpdateTask(dragState.taskId, {
        start_date: newStartDate.toISOString().split('T')[0],
        due_date: newDueDate.toISOString().split('T')[0],
      });
    }

    setDragState(null);
  }, [dragState, dates.length, zoom, onUpdateTask]);

  // Add/remove global mouse listeners for drag
  useEffect(() => {
    if (dragState) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = dragState.type === 'move' ? 'grabbing' : 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragState, handleMouseMove, handleMouseUp]);

  // Calculate duration in days
  const getDuration = (task: Task) => {
    if (!task.start_date || !task.due_date) return null;
    const start = new Date(task.start_date);
    const end = new Date(task.due_date);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return diff + 1; // Include both start and end days
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-sm">
      <div className="min-w-[800px]">
        {/* Timeline header */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <div className="sticky left-0 z-20 w-72 flex-shrink-0 p-4 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex items-center shadow-[1px_0_4px_-1px_rgba(0,0,0,0.1)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Task</span>
          </div>
          <div className="flex-1 flex">
            {dates.map((date, i) => (
              <div
                key={i}
                className={`flex-1 min-w-[100px] p-3 text-center border-r border-slate-100 dark:border-slate-700/50 last:border-r-0 ${isToday(date)
                  ? 'bg-primary-50/50 dark:bg-primary-900/10'
                  : isWeekend(date)
                    ? 'bg-slate-50/50 dark:bg-slate-800/30'
                    : ''
                  }`}
              >
                <span className={`text-xs font-medium ${isToday(date)
                  ? 'text-primary-600 dark:text-primary-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
                  }`}>
                  {formatDate(date)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Task rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {tasks.map((task) => {
            const barStyle = getBarStyle(task);
            const duration = getDuration(task);
            const isDragging = dragState?.taskId === task.id;

            return (
              <div key={task.id} className="flex group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                <div
                  className="sticky left-0 z-20 w-72 flex-shrink-0 p-4 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-center cursor-pointer shadow-[1px_0_4px_-1px_rgba(0,0,0,0.1)]"
                  onClick={() => onEdit(task)}
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {categoryLabels[task.category] || task.category}
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex relative" ref={containerRef}>
                  {/* Grid columns */}
                  {dates.map((date, i) => (
                    <div
                      key={i}
                      className={`flex-1 min-w-[100px] border-r border-slate-100/50 dark:border-slate-700/30 last:border-r-0 ${isToday(date)
                        ? 'bg-primary-50/30 dark:bg-primary-900/5'
                        : isWeekend(date)
                          ? 'bg-slate-50/30 dark:bg-slate-800/20'
                          : ''
                        }`}
                    />
                  ))}

                  {/* Today marker line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                    style={{ left: `${getTodayMarkerPosition()}%` }}
                  />

                  {/* Task bar */}
                  {barStyle && (
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 h-7 ${statusColors[task.status]} rounded-md shadow-sm border border-white/20 transition-all z-10 flex items-center ${isDragging ? 'opacity-70 shadow-lg scale-105' : 'hover:brightness-110'
                        }`}
                      style={{
                        left: barStyle.left,
                        width: barStyle.width,
                        minWidth: '20px',
                      }}
                    >
                      {/* Left resize handle */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 rounded-l-md"
                        onMouseDown={(e) => handleMouseDown(e, task, 'resize-start')}
                      />

                      {/* Middle area - click to edit, drag to move */}
                      <div
                        className="flex-1 h-full cursor-grab active:cursor-grabbing flex items-center justify-center px-2"
                        onClick={() => onEdit(task)}
                        onMouseDown={(e) => {
                          // Only trigger drag if not clicking the resize handles
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          if (x > 8 && x < rect.width - 8) {
                            handleMouseDown(e, task, 'move');
                          }
                        }}
                      >
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded shadow-lg whitespace-nowrap z-30 transition-opacity pointer-events-none">
                          <div className="font-medium mb-0.5">{task.title}</div>
                          <div className="text-slate-300 text-[10px]">
                            {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'No start'}
                            {' → '}
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No end'}
                            {duration && ` (${duration} day${duration > 1 ? 's' : ''})`}
                          </div>
                        </div>
                      </div>

                      {/* Right resize handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 rounded-r-md"
                        onMouseDown={(e) => handleMouseDown(e, task, 'resize-end')}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ListViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function ListView({ tasks, onEdit, onDelete }: ListViewProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-left">
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/3">
                Task Details
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Assignee
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {tasks.map((task) => {
              const StatusIcon = statusIcons[task.status];
              const priority = priorityConfig[task.priority];

              return (
                <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                  <td className="px-6 py-3">
                    <div className="flex flex-col">
                      <span
                        onClick={() => onEdit(task)}
                        className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors cursor-pointer"
                      >
                        {task.title}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {categoryLabels[task.category] || task.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-3.5 h-3.5 ${task.status === 'completed' ? 'text-emerald-500' :
                        task.status === 'urgent' ? 'text-red-500' :
                          task.status === 'in-progress' ? 'text-primary-500' :
                            'text-slate-400'
                        }`} />
                      <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
                        {task.status.replace('-', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide border ${priority.bg} ${priority.color} ${priority.border} text-[10px]`}>
                      {task.priority === 'critical' ? <AlertCircle className="w-3 h-3" /> : null}
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {task.assignee_name ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700">
                          {task.assignee_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {task.assignee_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(task)}
                        className="p-1.5 rounded text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(task)}
                        className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
