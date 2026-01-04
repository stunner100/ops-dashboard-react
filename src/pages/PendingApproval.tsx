import { Logo } from '../components/Logo';
import { Clock, Mail } from 'lucide-react';

export function PendingApproval() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <Logo size="lg" className="mb-6 scale-125" />
                </div>

                {/* Pending Card */}
                <div className="bg-slate-900/50 rounded-3xl shadow-2xl border border-slate-800 p-8 backdrop-blur-xl ring-1 ring-white/5 text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-900/30 flex items-center justify-center mx-auto mb-6">
                        <Clock className="w-8 h-8 text-amber-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3">
                        Account Pending Approval
                    </h2>

                    <p className="text-slate-400 mb-6 leading-relaxed">
                        Your account has been created successfully. Please wait for an administrator to approve your access to the platform.
                    </p>

                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-center gap-2 text-slate-300">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">You'll receive an email once approved</span>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors border border-slate-700"
                    >
                        Check Status
                    </button>

                    <button
                        onClick={() => {
                            // Sign out and redirect to login
                            import('../lib/supabase').then(({ supabase }) => {
                                supabase.auth.signOut().then(() => {
                                    window.location.href = '/login';
                                });
                            });
                        }}
                        className="mt-3 w-full py-3 text-slate-400 hover:text-white font-medium transition-colors"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-600">
                        © {new Date().getFullYear()} Night Market. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
