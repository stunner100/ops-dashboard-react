import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Logo } from '../components/Logo';

export function Signup() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'' | 'customer_service' | 'rider_manager' | 'vendor_manager' | 'business_development_manager' | 'dashboard_support' | 'marketing_brands'>('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { signUp } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (!role) {
            setError('Please select a role');
            return;
        }

        setLoading(true);

        const { error } = await signUp(email, password, fullName, role as 'customer_service' | 'rider_manager' | 'vendor_manager' | 'business_development_manager' | 'dashboard_support' | 'marketing_brands');

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 relative overflow-hidden">
                {/* Premium Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/5 rounded-full blur-[120px]" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100 mix-blend-overlay" />
                </div>

                <div className="w-full max-w-[400px] text-center relative z-10 animate-fade-in">
                    <div className="bg-[#080808]/80 rounded-[28px] shadow-2xl border border-white/5 p-8 backdrop-blur-2xl ring-1 ring-white/5">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                            Verify Email
                        </h2>
                        <p className="text-[14px] font-medium text-slate-500 mb-8 leading-relaxed">
                            Instructions have been dispatched to <strong className="text-white">{email}</strong>. Please confirm your account to gain terminal access.
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center w-full py-3.5 px-6 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-[14px] rounded-xl transition-all shadow-lg hover:shadow-yellow-500/20 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Return to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Premium Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100 mix-blend-overlay" />
            </div>

            <div className="w-full max-w-[400px] relative z-10 animate-fade-in my-12">
                {/* Logo and Welcome */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-16 h-16 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-2xl backdrop-blur-sm group hover:border-yellow-500/30 transition-all duration-500">
                        <Logo size="lg" showText={false} className="scale-110 group-hover:scale-125 transition-transform duration-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
                        Create Account
                    </h1>
                    <p className="text-[14px] font-medium text-slate-500 mt-2 tracking-tight">
                        Join the Operations Command Center
                    </p>
                </div>

                {/* Signup Card */}
                <div className="bg-[#080808]/80 rounded-[28px] shadow-2xl border border-white/5 p-8 backdrop-blur-2xl ring-1 ring-white/5">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-[13px] font-bold text-red-400 flex items-center gap-3 animate-shake">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="fullName" className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
                                    Full Name
                                </label>
                                <input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/[0.03] border border-transparent hover:border-white/10 rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:bg-white/5 focus:border-yellow-500/30 transition-all font-medium"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/[0.03] border border-transparent hover:border-white/10 rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:bg-white/5 focus:border-yellow-500/30 transition-all font-medium"
                                    placeholder="name@company.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
                                    Password
                                </label>
                                <div className="relative group">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full pl-4 pr-12 py-3 bg-white/[0.03] border border-transparent hover:border-white/10 rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:bg-white/5 focus:border-yellow-500/30 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/[0.03] border border-transparent hover:border-white/10 rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:bg-white/5 focus:border-yellow-500/30 transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="role" className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
                                    Assigned Role
                                </label>
                                <div className="relative group">
                                    <select
                                        id="role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as any)}
                                        className="w-full px-4 py-3 bg-white/[0.03] border border-transparent hover:border-white/10 rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:bg-white/5 focus:border-yellow-500/30 transition-all font-medium appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="" disabled className="bg-[#080808]">Choose your role...</option>
                                        <option value="customer_service" className="bg-[#080808]">Customer Service</option>
                                        <option value="rider_manager" className="bg-[#080808]">Rider Manager</option>
                                        <option value="vendor_manager" className="bg-[#080808]">Vendor Account Manager</option>
                                        <option value="business_development_manager" className="bg-[#080808]">Business Development Manager</option>
                                        <option value="dashboard_support" className="bg-[#080808]">Dashboard Support</option>
                                        <option value="marketing_brands" className="bg-[#080808]">Marketing & Brands</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-800 text-black font-bold text-[14px] rounded-xl transition-all disabled:text-slate-500 flex items-center justify-center gap-2 shadow-[0_10px_20px_-10px_rgba(234,179,8,0.3)] hover:shadow-[0_15px_25px_-10px_rgba(234,179,8,0.4)] transform hover:-translate-y-0.5 active:translate-y-0 mt-8"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Request Account'
                            )}
                        </button>

                        <div className="text-center pt-4">
                            <p className="text-[13px] font-medium text-slate-500">
                                Already have an account?{' '}
                                <Link to="/login" className="text-white hover:text-yellow-500 font-bold transition-colors ml-1">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </form>
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
