import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import { X, Send, Sparkles, Loader2, FileText, ExternalLink } from 'lucide-react';
import { useAIAssistant } from '../context/AIAssistantContext';
import { useRAG, type ChatResponse } from '../hooks';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: Array<{
        title: string;
        department: string;
        relevance: number;
    }>;
}

const suggestedQuestions = [
    "What is the refund policy for late deliveries?",
    "How do I onboard a new vendor?",
    "What are the rider training requirements?",
    "How should I handle customer complaints?",
];



export function AIAssistant() {
    const { isOpen, initialQuery, close, clearInitialQuery } = useAIAssistant();
    const { chat, loading } = useRAG();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const latestMessageRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const hasProcessedInitialQuery = useRef(false);

    // Submit a message (extracted for reuse)
    const submitMessage = useCallback(async (messageText: string) => {
        if (!messageText.trim() || loading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText.trim(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // Build history for context
        const history = messages.map(m => ({
            role: m.role,
            content: m.content,
        }));

        // Make API call
        const response: ChatResponse = await chat(messageText.trim(), null, history);

        const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.response,
            sources: response.sources,
        };

        setMessages(prev => [...prev, assistantMessage]);
    }, [chat, loading, messages]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            hasProcessedInitialQuery.current = false;
        }
    }, [isOpen]);

    // Handle initial query from search bar
    useEffect(() => {
        if (isOpen && initialQuery && !hasProcessedInitialQuery.current && !loading) {
            hasProcessedInitialQuery.current = true;
            submitMessage(initialQuery);
            clearInitialQuery();
        }
    }, [isOpen, initialQuery, loading, submitMessage, clearInitialQuery]);

    // Scroll to show the start of the latest assistant message
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            // For user messages, scroll to bottom; for assistant responses, scroll to start of message
            if (lastMessage.role === 'user') {
                // Scroll container to bottom to show user message
                messagesContainerRef.current?.scrollTo({
                    top: messagesContainerRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            } else {
                // Scroll to show start of assistant response
                latestMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [messages]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        await submitMessage(input);
    };


    const handleSuggestion = (question: string) => {
        setInput(question);
        inputRef.current?.focus();
    };

    const formatContent = (content: string) => {
        // Basic markdown-like formatting
        return content
            .split('\n')
            .map((line, i) => {
                // Bold text **text**
                line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // Bullet points
                if (line.startsWith('- ') || line.startsWith('• ')) {
                    return `<li key="${i}" class="ml-4">${line.slice(2)}</li>`;
                }
                // Numbered lists
                const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
                if (numberedMatch) {
                    return `<li key="${i}" class="ml-4">${numberedMatch[2]}</li>`;
                }
                return line ? `<p key="${i}">${line}</p>` : '<br />';
            })
            .join('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={close}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[70vh] ring-1 ring-black/5">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                Operations AI
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">BETA</span>
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-medium text-slate-500 border border-slate-200 dark:border-slate-700">
                            <span className="text-xs">⌘</span>K
                        </span>
                        <button
                            onClick={close}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-900/50">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-4">
                            <div className="space-y-2">
                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto">
                                    <Sparkles className="w-6 h-6 text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                        How can I help you?
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Search across SOPs, policies, and guidelines
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 w-full gap-2">
                                {suggestedQuestions.map((question, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSuggestion(question)}
                                        className="w-full text-left px-3 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 transition-all shadow-sm hover:shadow group"
                                    >
                                        <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">{question}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <div
                                key={message.id}
                                ref={index === messages.length - 1 && message.role === 'assistant' ? latestMessageRef : null}
                                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                                        <Sparkles className="w-4 h-4 text-indigo-500" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm ${message.role === 'user'
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                                        }`}
                                >
                                    {message.role === 'assistant' ? (
                                        <div className="space-y-2">
                                            <div
                                                className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900"
                                                dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                                            />
                                            {message.sources && message.sources.length > 0 && (
                                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                                        <FileText className="w-3 h-3" />
                                                        References
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {message.sources.slice(0, 3).map((source, i) => (
                                                            <div
                                                                key={i}
                                                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-colors cursor-pointer"
                                                            >
                                                                <ExternalLink className="w-3 h-3 opacity-50" />
                                                                <span className="truncate max-w-[150px]">{source.title}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm leading-relaxed">{message.content}</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {loading && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 shadow-sm">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                    <span className="animate-pulse">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}


                </div>

                {/* Input */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <form
                        onSubmit={handleSubmit}
                        className="relative flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm"
                        onClick={() => inputRef.current?.focus()}
                    >
                        <Sparkles className="w-4 h-4 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            className="flex-1 bg-transparent border-0 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-sm font-medium h-6"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className={`p-1.5 rounded-lg transition-all ${input.trim() && !loading
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-sm'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </form>
                    <div className="mt-2 text-[10px] text-center text-slate-400">
                        AI can make mistakes. Please verify important information.
                    </div>
                </div>
            </div>
        </div>
    );
}

