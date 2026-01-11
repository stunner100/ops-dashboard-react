import type { ReactNode } from 'react';
import { GripVertical, X, MoreHorizontal } from 'lucide-react';

interface WidgetWrapperProps {
    title: string;
    size: 'small' | 'medium' | 'large';
    onRemove: () => void;
    children: ReactNode;
    dragHandleProps?: Record<string, unknown>;
}

export function WidgetWrapper({
    title,
    size,
    onRemove,
    children,
    dragHandleProps
}: WidgetWrapperProps) {
    const sizeClasses = {
        small: 'col-span-1',
        medium: 'col-span-1 md:col-span-2',
        large: 'col-span-1 md:col-span-2 lg:col-span-3',
    };

    return (
        <div className={`${sizeClasses[size]} bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <div
                        {...dragHandleProps}
                        className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                        <GripVertical className="w-4 h-4 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{title}</h3>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                        onClick={onRemove}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {children}
            </div>
        </div>
    );
}
