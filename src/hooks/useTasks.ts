import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type TaskCategory = 'vendor_ops' | 'rider_fleet' | 'customer_service' | 'business_development' | 'dashboard_support';
export type TaskStatus = 'pending' | 'in-progress' | 'urgent' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
    id: string;
    title: string;
    description?: string | null;
    category: TaskCategory;
    status: TaskStatus;
    priority: TaskPriority;
    start_date?: string | null;
    due_date?: string | null;
    assignee_id?: string | null;
    assignee_name?: string | null;
    assignee_ids?: string[];
    assignee_names?: string[];
    is_recurring?: boolean;
    recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
    recurrence_interval?: number;
    recurrence_end_date?: string | null;
    parent_task_id?: string | null;
    board_id?: string | null;
    created_by?: string | null;
    created_at: string;
    updated_at: string;
}

export interface TaskInput {
    title: string;
    description?: string;
    category: TaskCategory;
    status?: TaskStatus;
    priority?: TaskPriority;
    start_date?: string;
    due_date?: string;
    assignee_id?: string;
    assignee_name?: string;
    assignee_ids?: string[];
    assignee_names?: string[];
    is_recurring?: boolean;
    recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    recurrence_interval?: number;
    recurrence_end_date?: string;
    board_id?: string;
}

export interface TaskFilters {
    category?: TaskCategory[];
    status?: TaskStatus[];
    priority?: TaskPriority[];
    assignee_id?: string;
}

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    // Fetch all tasks
    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setTasks(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError('Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    }, []);

    // Create a new task
    const createTask = async (input: TaskInput): Promise<{ success: boolean; error?: string }> => {
        try {
            const newTask = {
                ...input,
                status: input.status || 'pending',
                priority: input.priority || 'medium',
                created_by: user?.id,
            };

            const { data, error: createError } = await supabase
                .from('tasks')
                .insert(newTask)
                .select()
                .single();

            if (createError) throw createError;

            // Optimistically update local state
            setTasks((prev) => [data, ...prev]);

            // Create notification for assignee(s) if assigned
            const assigneesToNotify: string[] = [];

            // Add single assignee if exists
            if (input.assignee_id && input.assignee_id !== user?.id) {
                assigneesToNotify.push(input.assignee_id);
            }

            // Add all assignees from assignee_ids array
            if (input.assignee_ids && input.assignee_ids.length > 0) {
                input.assignee_ids.forEach((id) => {
                    if (id !== user?.id && !assigneesToNotify.includes(id)) {
                        assigneesToNotify.push(id);
                    }
                });
            }

            // Send notifications to all assignees
            if (assigneesToNotify.length > 0) {
                // Build rich description with task details
                const categoryLabels: Record<string, string> = {
                    'vendor_ops': 'Vendor Ops',
                    'rider_fleet': 'Rider Fleet',
                    'customer_service': 'Customer Service',
                    'business_development': 'Business Development',
                    'dashboard_support': 'Dashboard Support',
                };
                const priorityLabels: Record<string, string> = {
                    'low': '🟢 Low',
                    'medium': '🟡 Medium',
                    'high': '🟠 High',
                    'critical': '🔴 Critical',
                };

                let description = `📋 ${input.title}\n`;
                description += `📁 Category: ${categoryLabels[input.category] || input.category}\n`;
                description += `⚡ Priority: ${priorityLabels[input.priority || 'medium']}\n`;

                if (input.due_date) {
                    const dueDate = new Date(input.due_date);
                    const now = new Date();
                    const diff = dueDate.getTime() - now.getTime();
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                    description += `📅 Due: ${dueDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`;
                    if (diff > 0) {
                        description += ` (${days > 0 ? days + 'd ' : ''}${hours}h remaining)`;
                    } else {
                        description += ` (Overdue!)`;
                    }
                    description += '\n';
                }

                if (input.description) {
                    description += `\n${input.description}`;
                }

                const notifications = assigneesToNotify.map((assigneeId) => ({
                    user_id: assigneeId,
                    type: 'update',
                    title: '📌 New Task Assignment',
                    description: description.trim(),
                    priority: input.priority || 'medium',
                    link: `/?task=${data.id}`,
                    read: false,
                }));

                await supabase.from('notifications').insert(notifications);
            }

            return { success: true };
        } catch (err) {
            console.error('Error creating task:', err);
            return { success: false, error: 'Failed to create task' };
        }
    };


    // Update an existing task
    const updateTask = async (id: string, updates: Partial<TaskInput>): Promise<{ success: boolean; error?: string }> => {
        try {
            // Get current task to check if assignee changed
            const currentTask = tasks.find(t => t.id === id);

            const { data, error: updateError } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Update local state
            setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));

            // Create notification for new assignee(s)
            const assigneesToNotify: string[] = [];
            const previousAssigneeIds = currentTask?.assignee_ids || [];
            const previousAssigneeId = currentTask?.assignee_id;

            // Check single assignee change
            if (updates.assignee_id &&
                updates.assignee_id !== previousAssigneeId &&
                updates.assignee_id !== user?.id) {
                assigneesToNotify.push(updates.assignee_id);
            }

            // Check multi-assignee changes
            if (updates.assignee_ids && updates.assignee_ids.length > 0) {
                updates.assignee_ids.forEach((id) => {
                    // Only notify if this is a new assignee
                    if (id !== user?.id &&
                        !previousAssigneeIds.includes(id) &&
                        id !== previousAssigneeId &&
                        !assigneesToNotify.includes(id)) {
                        assigneesToNotify.push(id);
                    }
                });
            }

            // Send notifications to all new assignees
            if (assigneesToNotify.length > 0) {
                // Build rich description with task details
                const categoryLabels: Record<string, string> = {
                    'vendor_ops': 'Vendor Ops',
                    'rider_fleet': 'Rider Fleet',
                    'customer_service': 'Customer Service',
                    'business_development': 'Business Development',
                    'dashboard_support': 'Dashboard Support',
                };
                const priorityLabels: Record<string, string> = {
                    'low': '🟢 Low',
                    'medium': '🟡 Medium',
                    'high': '🟠 High',
                    'critical': '🔴 Critical',
                };

                let description = `📋 ${data.title}\n`;
                description += `📁 Category: ${categoryLabels[data.category] || data.category}\n`;
                description += `⚡ Priority: ${priorityLabels[data.priority || 'medium']}\n`;

                if (data.due_date) {
                    const dueDate = new Date(data.due_date);
                    const now = new Date();
                    const diff = dueDate.getTime() - now.getTime();
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                    description += `📅 Due: ${dueDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`;
                    if (diff > 0) {
                        description += ` (${days > 0 ? days + 'd ' : ''}${hours}h remaining)`;
                    } else {
                        description += ` (Overdue!)`;
                    }
                    description += '\n';
                }

                if (data.description) {
                    description += `\n${data.description}`;
                }

                const notifications = assigneesToNotify.map((assigneeId) => ({
                    user_id: assigneeId,
                    type: 'update',
                    title: '📌 New Task Assignment',
                    description: description.trim(),
                    priority: data.priority || 'medium',
                    link: `/?task=${data.id}`,
                    read: false,
                }));

                await supabase.from('notifications').insert(notifications);
            }

            return { success: true };
        } catch (err) {
            console.error('Error updating task:', err);
            return { success: false, error: 'Failed to update task' };
        }
    };


    // Delete a task
    const deleteTask = async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: deleteError } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // Remove from local state
            setTasks((prev) => prev.filter((t) => t.id !== id));
            return { success: true };
        } catch (err) {
            console.error('Error deleting task:', err);
            return { success: false, error: 'Failed to delete task' };
        }
    };

    // Update task status (for drag & drop)
    const updateTaskStatus = async (id: string, status: TaskStatus): Promise<{ success: boolean; error?: string }> => {
        return updateTask(id, { status });
    };

    // Initial fetch
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel('tasks-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setTasks((prev) => {
                            // Avoid duplicates
                            if (prev.find((t) => t.id === payload.new.id)) return prev;
                            return [payload.new as Task, ...prev];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setTasks((prev) =>
                            prev.map((t) => (t.id === payload.new.id ? (payload.new as Task) : t))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return {
        tasks,
        loading,
        error,
        createTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
        refetch: fetchTasks,
    };
}

// Helper to filter tasks
export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
    return tasks.filter((task) => {
        if (filters.category?.length && !filters.category.includes(task.category)) {
            return false;
        }
        if (filters.status?.length && !filters.status.includes(task.status)) {
            return false;
        }
        if (filters.priority?.length && !filters.priority.includes(task.priority)) {
            return false;
        }
        if (filters.assignee_id && task.assignee_id !== filters.assignee_id) {
            return false;
        }
        return true;
    });
}
