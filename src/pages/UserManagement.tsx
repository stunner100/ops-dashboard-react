import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, Check, X, Search, Loader2, Shield, Clock, UserCheck, Trash2 } from 'lucide-react';

interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    is_approved: boolean;
    approved_at: string | null;
    approved_by: string | null;
    created_at: string;
}

type FilterStatus = 'all' | 'pending' | 'approved';

export function UserManagement() {
    const { profile, isAdmin } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<UserProfile | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const approveUser = async (userId: string) => {
        if (!profile) return;

        try {
            setActionLoading(userId);
            const { error } = await supabase
                .from('profiles')
                .update({
                    is_approved: true,
                    approved_at: new Date().toISOString(),
                    approved_by: profile.id
                })
                .eq('id', userId);

            if (error) throw error;

            // Update local state
            setUsers(users.map(u =>
                u.id === userId
                    ? { ...u, is_approved: true, approved_at: new Date().toISOString(), approved_by: profile.id }
                    : u
            ));
        } catch (err) {
            console.error('Error approving user:', err);
            setError('Failed to approve user');
        } finally {
            setActionLoading(null);
        }
    };

    const revokeApproval = async (userId: string) => {
        try {
            setActionLoading(userId);
            const { error } = await supabase
                .from('profiles')
                .update({
                    is_approved: false,
                    approved_at: null,
                    approved_by: null
                })
                .eq('id', userId);

            if (error) throw error;

            // Update local state
            setUsers(users.map(u =>
                u.id === userId
                    ? { ...u, is_approved: false, approved_at: null, approved_by: null }
                    : u
            ));
        } catch (err) {
            console.error('Error revoking approval:', err);
            setError('Failed to revoke approval');
        } finally {
            setActionLoading(null);
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            setActionLoading(userId);

            // Get the current session for authorization
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            let deleteSuccess = false;

            // Try Edge Function first (properly deletes from auth.users)
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({ userId }),
                    }
                );

                if (response.ok) {
                    deleteSuccess = true;
                }
            } catch {
                // Edge function not available, try direct delete
            }

            // Fallback: Delete from profiles table directly
            if (!deleteSuccess) {
                const { error: deleteError } = await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', userId);

                if (deleteError) {
                    throw deleteError;
                }
            }

            // Update local state
            setUsers(users.filter(u => u.id !== userId));
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Error deleting user:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete user');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter(user => {
        // Search filter
        const matchesSearch =
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

        // Status filter
        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'pending' && !user.is_approved) ||
            (filterStatus === 'approved' && user.is_approved);

        return matchesSearch && matchesStatus;
    });

    const pendingCount = users.filter(u => !u.is_approved).length;
    const approvedCount = users.filter(u => u.is_approved).length;

    const formatRole = (role: string) => {
        return role.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Shield strokeWidth={1.5} className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Access Denied</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto animate-fade-in space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] mb-1">
                    Administration
                </h1>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    User Management
                </h2>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#080808] rounded-xl p-5 border border-slate-200/60 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center">
                            <Users strokeWidth={1.5} className="w-5 h-5 text-slate-900 dark:text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{users.length}</p>
                            <p className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Users</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#080808] rounded-xl p-5 border border-slate-200/60 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-400/5 border border-amber-100 dark:border-amber-400/10 flex items-center justify-center">
                            <Clock strokeWidth={1.5} className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{pendingCount}</p>
                            <p className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending Approval</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#080808] rounded-xl p-5 border border-slate-200/60 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-400/5 border border-green-100 dark:border-green-400/10 flex items-center justify-center">
                            <UserCheck strokeWidth={1.5} className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{approvedCount}</p>
                            <p className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Approved Users</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex gap-1 p-1 bg-slate-100/50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5">
                    {(['all', 'pending', 'approved'] as FilterStatus[]).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1.5 rounded-md text-[13px] font-bold transition-all duration-200 capitalize ${filterStatus === status
                                ? 'bg-white dark:bg-[#111111] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/10'
                                : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3 items-center w-full md:w-auto">
                    <div className="relative flex-1 md:w-72 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search strokeWidth={1.5} className="h-4 w-4 text-slate-400 dark:text-slate-600 group-focus-within:text-primary-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-9 pr-4 py-2 bg-slate-100/50 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-lg text-[13px] text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-black focus:border-primary-500/50 transition-all font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white dark:bg-[#000000] rounded-xl border border-slate-200/60 dark:border-white/5 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary-500" />
                        <p className="text-[13px] font-bold uppercase tracking-widest">Updating roster...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 dark:border-white/5">
                            <Users strokeWidth={1.5} className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                        </div>
                        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-2">No users found</h3>
                        <p className="text-[13px] font-medium text-slate-400 dark:text-slate-500 max-w-[280px] text-center leading-relaxed">
                            {searchQuery ? `No matches found for "${searchQuery}".` : 'The roster is currently empty.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-100/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                                <tr>
                                    <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">User</th>
                                    <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">Role</th>
                                    <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">Status</th>
                                    <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">Registered</th>
                                    <th className="text-right px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">Management</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[12px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 uppercase tracking-tighter shadow-sm">
                                                    {user.full_name?.charAt(0) || user.email.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[14px] font-bold text-slate-900 dark:text-white leading-tight">
                                                        {user.full_name || 'Anonymous User'}
                                                    </p>
                                                    <p className="text-[12px] font-medium text-slate-400 dark:text-slate-500 truncate">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border ${user.role === 'admin'
                                                ? 'bg-purple-50 dark:bg-purple-400/10 border-purple-100 dark:border-purple-400/20 text-purple-600 dark:text-purple-400'
                                                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                                                }`}>
                                                {formatRole(user.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_approved ? (
                                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                                                    <Check strokeWidth={1.5} className="w-3.5 h-3.5" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500 uppercase tracking-tight">
                                                    <Clock strokeWidth={1.5} className="w-3.5 h-3.5" />
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-[13px] font-medium text-slate-400 dark:text-slate-500">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {user.role !== 'admin' && (
                                                    <>
                                                        {user.is_approved ? (
                                                            <button
                                                                onClick={() => revokeApproval(user.id)}
                                                                disabled={actionLoading === user.id}
                                                                className="p-1.5 rounded-md text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-400/10 transition-all md:opacity-0 md:group-hover:opacity-100"
                                                                title="Revoke Access"
                                                            >
                                                                {actionLoading === user.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <X className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => approveUser(user.id)}
                                                                disabled={actionLoading === user.id}
                                                                className="p-1.5 rounded-md text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-400/10 transition-all md:opacity-0 md:group-hover:opacity-100"
                                                                title="Approve User"
                                                            >
                                                                {actionLoading === user.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Check strokeWidth={1.5} className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => setDeleteConfirm(user)}
                                                            disabled={actionLoading === user.id}
                                                            className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 transition-all md:opacity-0 md:group-hover:opacity-100"
                                                            title="Remove User"
                                                        >
                                                            <Trash2 strokeWidth={1.5} className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-[#111111] rounded-xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden animate-slide-up">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-400/5 border border-red-100 dark:border-red-400/10 flex items-center justify-center mx-auto mb-5">
                                <Trash2 strokeWidth={1.5} className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                Terminate Access
                            </h3>
                            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                                You are about to remove <strong className="text-slate-900 dark:text-white">{deleteConfirm.full_name || deleteConfirm.email}</strong> from the system. This action is irreversible.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2.5 text-[13px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => deleteUser(deleteConfirm.id)}
                                    disabled={actionLoading === deleteConfirm.id}
                                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-[13px] font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                                >
                                    {actionLoading === deleteConfirm.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 strokeWidth={1.5} className="w-4 h-4" />
                                    )}
                                    Terminate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
