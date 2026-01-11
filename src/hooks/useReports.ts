import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, TaskCategory, TaskStatus, TaskPriority } from './useTasks';

export interface ReportFilters {
    dateFrom?: string;
    dateTo?: string;
    categories?: TaskCategory[];
    statuses?: TaskStatus[];
    priorities?: TaskPriority[];
    assigneeId?: string;
}

export interface TaskSummary {
    total: number;
    byStatus: Record<TaskStatus, number>;
    byCategory: Record<TaskCategory, number>;
    byPriority: Record<TaskPriority, number>;
    completed: number;
    overdue: number;
}

export interface ProductivityData {
    date: string;
    created: number;
    completed: number;
}

export interface TeamMemberStats {
    id: string;
    name: string;
    assigned: number;
    completed: number;
    completionRate: number;
}

export function useReports() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);

    // Fetch tasks with filters
    const fetchFilteredTasks = useCallback(async (filters: ReportFilters) => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase.from('tasks').select('*');

            if (filters.dateFrom) {
                query = query.gte('created_at', filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.lte('created_at', filters.dateTo + 'T23:59:59');
            }
            if (filters.categories && filters.categories.length > 0) {
                query = query.in('category', filters.categories);
            }
            if (filters.statuses && filters.statuses.length > 0) {
                query = query.in('status', filters.statuses);
            }
            if (filters.priorities && filters.priorities.length > 0) {
                query = query.in('priority', filters.priorities);
            }
            if (filters.assigneeId) {
                query = query.eq('assignee_id', filters.assigneeId);
            }

            const { data, error: fetchError } = await query.order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setTasks(data || []);
            return data || [];
        } catch (err) {
            console.error('Error fetching report data:', err);
            setError('Failed to fetch report data');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Calculate task summary statistics
    const getTaskSummary = useMemo(() => {
        const summary: TaskSummary = {
            total: tasks.length,
            byStatus: { pending: 0, 'in-progress': 0, urgent: 0, completed: 0 },
            byCategory: { vendor_ops: 0, rider_fleet: 0, customer_service: 0, business_development: 0, dashboard_support: 0 },
            byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
            completed: 0,
            overdue: 0,
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        tasks.forEach(task => {
            // Count by status
            if (summary.byStatus[task.status] !== undefined) {
                summary.byStatus[task.status]++;
            }

            // Count by category
            if (summary.byCategory[task.category] !== undefined) {
                summary.byCategory[task.category]++;
            }

            // Count by priority
            if (summary.byPriority[task.priority] !== undefined) {
                summary.byPriority[task.priority]++;
            }

            // Count completed
            if (task.status === 'completed') {
                summary.completed++;
            }

            // Count overdue
            if (task.due_date && task.status !== 'completed') {
                const dueDate = new Date(task.due_date);
                if (dueDate < today) {
                    summary.overdue++;
                }
            }
        });

        return summary;
    }, [tasks]);

    // Get productivity data (tasks created vs completed by date)
    const getProductivityData = useMemo((): ProductivityData[] => {
        const dataByDate: Record<string, { created: number; completed: number }> = {};

        tasks.forEach(task => {
            const createdDate = task.created_at.split('T')[0];
            if (!dataByDate[createdDate]) {
                dataByDate[createdDate] = { created: 0, completed: 0 };
            }
            dataByDate[createdDate].created++;

            if (task.status === 'completed' && task.updated_at) {
                const completedDate = task.updated_at.split('T')[0];
                if (!dataByDate[completedDate]) {
                    dataByDate[completedDate] = { created: 0, completed: 0 };
                }
                dataByDate[completedDate].completed++;
            }
        });

        return Object.entries(dataByDate)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [tasks]);

    // Get team performance stats
    const getTeamPerformance = useMemo((): TeamMemberStats[] => {
        const memberStats: Record<string, { name: string; assigned: number; completed: number }> = {};

        tasks.forEach(task => {
            // Handle multi-assignees
            if (task.assignee_ids && task.assignee_ids.length > 0) {
                task.assignee_ids.forEach((id, idx) => {
                    const name = task.assignee_names?.[idx] || 'Unknown';
                    if (!memberStats[id]) {
                        memberStats[id] = { name, assigned: 0, completed: 0 };
                    }
                    memberStats[id].assigned++;
                    if (task.status === 'completed') {
                        memberStats[id].completed++;
                    }
                });
            } else if (task.assignee_id) {
                // Handle single assignee
                if (!memberStats[task.assignee_id]) {
                    memberStats[task.assignee_id] = {
                        name: task.assignee_name || 'Unknown',
                        assigned: 0,
                        completed: 0
                    };
                }
                memberStats[task.assignee_id].assigned++;
                if (task.status === 'completed') {
                    memberStats[task.assignee_id].completed++;
                }
            }
        });

        return Object.entries(memberStats)
            .map(([id, stats]) => ({
                id,
                ...stats,
                completionRate: stats.assigned > 0
                    ? Math.round((stats.completed / stats.assigned) * 100)
                    : 0,
            }))
            .sort((a, b) => b.assigned - a.assigned);
    }, [tasks]);

    // Export to CSV
    const exportToCSV = useCallback((data: Record<string, unknown>[], filename: string) => {
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains comma
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, []);

    // Export current tasks to CSV
    const exportTasksCSV = useCallback(() => {
        const exportData = tasks.map(task => ({
            Title: task.title,
            Description: task.description || '',
            Category: task.category,
            Status: task.status,
            Priority: task.priority,
            'Due Date': task.due_date || '',
            Assignee: task.assignee_name || (task.assignee_names?.join(', ') || ''),
            'Created At': task.created_at,
        }));
        exportToCSV(exportData, 'task_report');
    }, [tasks, exportToCSV]);

    return {
        loading,
        error,
        tasks,
        fetchFilteredTasks,
        taskSummary: getTaskSummary,
        productivityData: getProductivityData,
        teamPerformance: getTeamPerformance,
        exportToCSV,
        exportTasksCSV,
    };
}
