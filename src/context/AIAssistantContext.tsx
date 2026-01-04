import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

interface AIAssistantContextType {
    isOpen: boolean;
    initialQuery: string;
    open: () => void;
    openWithQuery: (query: string) => void;
    close: () => void;
    toggle: () => void;
    clearInitialQuery: () => void;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export function AIAssistantProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [initialQuery, setInitialQuery] = useState('');

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => {
        setIsOpen(false);
        setInitialQuery('');
    }, []);
    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    const openWithQuery = useCallback((query: string) => {
        setInitialQuery(query);
        setIsOpen(true);
    }, []);

    const clearInitialQuery = useCallback(() => setInitialQuery(''), []);

    // Keyboard shortcut listener (CMD+K / Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggle();
            }
            if (e.key === 'Escape' && isOpen) {
                close();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, toggle, close]);

    return (
        <AIAssistantContext.Provider value={{ isOpen, initialQuery, open, openWithQuery, close, toggle, clearInitialQuery }}>
            {children}
        </AIAssistantContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAIAssistant() {
    const context = useContext(AIAssistantContext);
    if (context === undefined) {
        throw new Error('useAIAssistant must be used within an AIAssistantProvider');
    }
    return context;
}
