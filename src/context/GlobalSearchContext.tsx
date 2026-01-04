import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface SearchResult {
    id: string;
    type: 'page' | 'task' | 'document' | 'channel';
    title: string;
    description?: string;
    path?: string;
    icon?: string;
}

interface GlobalSearchContextType {
    query: string;
    setQuery: (query: string) => void;
    results: SearchResult[];
    isOpen: boolean;
    open: () => void;
    close: () => void;
    navigate: (result: SearchResult) => void;
}

const GlobalSearchContext = createContext<GlobalSearchContextType | undefined>(undefined);

// Static navigation items that are always available
const navigationItems: SearchResult[] = [
    { id: 'nav-overview', type: 'page', title: 'Overview Board', description: 'Task management and overview', path: '/' },
    { id: 'nav-kpi', type: 'page', title: 'KPI Dashboard', description: 'Key performance indicators', path: '/kpi' },
    { id: 'nav-sop', type: 'page', title: 'SOP Library', description: 'Standard operating procedures', path: '/sop' },
    { id: 'nav-chat', type: 'page', title: 'Team Chat', description: 'Team communication channels', path: '/chat' },
    { id: 'nav-notifications', type: 'page', title: 'Notifications', description: 'Alerts and notifications', path: '/notifications' },
];

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const nav = useNavigate();

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => {
        setIsOpen(false);
        setQuery('');
    }, []);

    // Close search when route changes
    useEffect(() => {
        close();
    }, [location.pathname, close]);

    // Filter results based on query
    const results = useMemo(() => {
        if (!query.trim()) return [];

        const lowerQuery = query.toLowerCase();
        return navigationItems.filter(item =>
            item.title.toLowerCase().includes(lowerQuery) ||
            item.description?.toLowerCase().includes(lowerQuery)
        );
    }, [query]);

    const navigate = useCallback((result: SearchResult) => {
        if (result.path) {
            nav(result.path);
        }
        close();
    }, [nav, close]);

    return (
        <GlobalSearchContext.Provider value={{ query, setQuery, results, isOpen, open, close, navigate }}>
            {children}
        </GlobalSearchContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGlobalSearch() {
    const context = useContext(GlobalSearchContext);
    if (context === undefined) {
        throw new Error('useGlobalSearch must be used within a GlobalSearchProvider');
    }
    return context;
}
