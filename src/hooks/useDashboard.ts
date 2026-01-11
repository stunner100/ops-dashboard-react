import { useState, useEffect, useCallback } from 'react';

export type WidgetType =
    | 'task-summary'
    | 'recent-tasks'
    | 'goals'
    | 'team-activity'
    | 'calendar-mini';

export interface WidgetConfig {
    id: string;
    type: WidgetType;
    title: string;
    position: number;
    size: 'small' | 'medium' | 'large';
}

const STORAGE_KEY = 'dashboard-widgets';

const defaultWidgets: WidgetConfig[] = [
    { id: 'w1', type: 'task-summary', title: 'Task Summary', position: 0, size: 'small' },
    { id: 'w2', type: 'recent-tasks', title: 'Recent Tasks', position: 1, size: 'medium' },
    { id: 'w3', type: 'goals', title: 'Goals Progress', position: 2, size: 'small' },
    { id: 'w4', type: 'calendar-mini', title: 'Calendar', position: 3, size: 'small' },
];

export const widgetTypeInfo: Record<WidgetType, { label: string; description: string; defaultSize: WidgetConfig['size'] }> = {
    'task-summary': { label: 'Task Summary', description: 'Overview of task counts by status', defaultSize: 'small' },
    'recent-tasks': { label: 'Recent Tasks', description: 'Your recently updated tasks', defaultSize: 'medium' },
    'goals': { label: 'Goals Progress', description: 'Top goals with progress rings', defaultSize: 'small' },
    'team-activity': { label: 'Team Activity', description: 'Recent team updates', defaultSize: 'medium' },
    'calendar-mini': { label: 'Mini Calendar', description: 'Quick view of upcoming dates', defaultSize: 'small' },
};

export function useDashboard() {
    const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setWidgets(JSON.parse(saved));
            } catch {
                setWidgets(defaultWidgets);
            }
        } else {
            setWidgets(defaultWidgets);
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage when widgets change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
        }
    }, [widgets, isLoaded]);

    const addWidget = useCallback((type: WidgetType) => {
        const info = widgetTypeInfo[type];
        const newWidget: WidgetConfig = {
            id: `w${Date.now()}`,
            type,
            title: info.label,
            position: widgets.length,
            size: info.defaultSize,
        };
        setWidgets(prev => [...prev, newWidget]);
    }, [widgets.length]);

    const removeWidget = useCallback((id: string) => {
        setWidgets(prev => prev.filter(w => w.id !== id).map((w, i) => ({ ...w, position: i })));
    }, []);

    const updateWidgetTitle = useCallback((id: string, title: string) => {
        setWidgets(prev => prev.map(w => w.id === id ? { ...w, title } : w));
    }, []);

    const reorderWidgets = useCallback((sourceIndex: number, destinationIndex: number) => {
        setWidgets(prev => {
            const result = [...prev];
            const [removed] = result.splice(sourceIndex, 1);
            result.splice(destinationIndex, 0, removed);
            return result.map((w, i) => ({ ...w, position: i }));
        });
    }, []);

    const resetToDefault = useCallback(() => {
        setWidgets(defaultWidgets);
    }, []);

    return {
        widgets: widgets.sort((a, b) => a.position - b.position),
        isLoaded,
        addWidget,
        removeWidget,
        updateWidgetTitle,
        reorderWidgets,
        resetToDefault,
        availableTypes: Object.keys(widgetTypeInfo) as WidgetType[],
    };
}
