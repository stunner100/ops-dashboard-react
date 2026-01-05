import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Clock, Mail, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function PendingApproval() {
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    const handleRefreshStatus = async () => {
        if (!user) return;

        setChecking(true);
        setError('');

        try {
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('is_approved, role')
                .eq('id', user.id)
                .single();

            if (fetchError) {
                throw fetchError;
            }

            // Check if user is now approved or is an admin
            if (data?.is_approved || data?.role === 'admin') {
                // Redirect to dashboard
                navigate('/', { replace: true });
                // Force a full reload to update auth context
                window.location.href = '/';
            } else {
                setError('Your account is still pending approval. Please wait for an administrator to approve your access.');
            }
        } catch (err) {
            console.error('Error checking status:', err);
            setError('Unable to check status. Please try again.');
        } finally {
            setChecking(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Premium Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100 mix-blend-overlay" />
            </div>

            <div className="w-full max-w-[400px] relative z-10 animate-fade-in">
                {/* Logo */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-16 h-16 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-2xl backdrop-blur-sm group hover:border-yellow-500/30 transition-all duration-500">
                        <Logo size="lg" showText={false} className="scale-110 group-hover:scale-125 transition-transform duration-500" />
                    </div>
                </div>

                {/* Pending Card */}
                <div className="bg-[#080808]/80 rounded-[28px] shadow-2xl border border-white/5 p-8 backdrop-blur-2xl ring-1 ring-white/5 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6 shadow-2xl group hover:border-amber-500/40 transition-all duration-500">
                        <Clock className="w-8 h-8 text-amber-500" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                        Terminal Pending
                    </h2>

                    <p className="text-[14px] font-medium text-slate-500 mb-8 leading-relaxed">
                        Your account has been successfully initialized. An administrator must now authorize your access to the secure terminal.
                    </p>

                    <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 mb-8">
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                            <Mail className="w-4 h-4 text-emerald-500" />
                            <span className="text-[13px] font-medium">Email notification will follow approval</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <p className="text-[13px] font-medium text-amber-400">{error}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={handleRefreshStatus}
                            disabled={checking}
                            className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-500/50 text-black font-bold text-[14px] rounded-xl transition-all shadow-[0_10px_20px_-10px_rgba(234,179,8,0.3)] hover:shadow-[0_15px_25px_-10px_rgba(234,179,8,0.4)] transform hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {checking ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                'Refresh Status'
                            )}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full py-3 text-[13px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                        >
                            Log Out
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                        Secure Terminal System 02
                    </p>
                </div>
            </div>
        </div>
    );
}
