import { useRef, useEffect } from 'react';
import type { ChannelMember } from '../hooks/useTeamChat';

interface MentionDropdownProps {
    members: ChannelMember[];
    searchQuery: string;
    onSelect: (member: ChannelMember) => void;
    onClose: () => void;
    position: { top: number; left: number };
}

export function MentionDropdown({ members, searchQuery, onSelect, onClose, position }: MentionDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter members based on search query
    const filteredMembers = members.filter(member => {
        const query = searchQuery.toLowerCase();
        return (
            member.full_name.toLowerCase().includes(query) ||
            member.email.toLowerCase().includes(query)
        );
    }).slice(0, 6);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    if (filteredMembers.length === 0) return null;

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div
            ref={dropdownRef}
            className="absolute z-50 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden animate-slide-up"
            style={{ bottom: `calc(100% + 8px)`, left: position.left }}
        >
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Mention someone
                </p>
            </div>
            <div className="max-h-48 overflow-y-auto">
                {filteredMembers.map((member) => (
                    <button
                        key={member.id}
                        onClick={() => onSelect(member)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                            {member.avatar_url ? (
                                <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-lg object-cover" />
                            ) : (
                                getInitials(member.full_name)
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {member.full_name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {member.email}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
