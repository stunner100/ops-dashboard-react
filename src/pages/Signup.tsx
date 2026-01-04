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
    const [role, setRole] = useState<'' | 'customer_service' | 'rider_manager' | 'vendor_manager'>('');
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

        const { error } = await signUp(email, password, fullName, role as 'customer_service' | 'rider_manager' | 'vendor_manager');

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
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Ambience */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

                <div className="w-full max-w-md text-center relative z-10">
                    <div className="bg-slate-900/50 rounded-3xl shadow-2xl border border-slate-800 p-8 backdrop-blur-xl ring-1 ring-white/5">
                        <div className="w-16 h-16 rounded-full bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            Check your email
                        </h2>
                        <p className="text-slate-400 mb-6">
                            We've sent a confirmation link to <strong className="text-white">{email}</strong>. Please check your inbox and click the link to activate your account.
                        </p>
                        <Link
                            to="/login"
                            className="inline-block py-3 px-6 bg-[#FDE047] hover:bg-yellow-300 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(253,224,71,0.3)] hover:shadow-[0_0_25px_-5px_rgba(253,224,71,0.5)]"
                        >
                            Back to Sign in
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <Logo size="lg" className="mb-6 scale-125" />
                    <p className="text-slate-400 font-light tracking-wide mt-2">
                        Create your account
                    </p>
                </div>

                {/* Signup form */}
                <div className="bg-slate-900/50 rounded-3xl shadow-2xl border border-slate-800 p-8 backdrop-blur-xl ring-1 ring-white/5">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-sm text-red-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label
                                    htmlFor="fullName"
                                    className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1"
                                >
                                    Full Name
                                </label>
                                <div className="group relative">
                                    <div className="absolute inset-y-0 left-0 w-1 bg-slate-700 rounded-l-lg group-focus-within:bg-[#FDE047] transition-colors" />
                                    <input
                                        id="fullName"
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        className="w-full pl-4 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 focus:bg-slate-950 transition-all font-light"
                                        placeholder="Enter your full name..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1"
                                >
                                    Email Address
                                </label>
                                <div className="group relative">
                                    <div className="absolute inset-y-0 left-0 w-1 bg-slate-700 rounded-l-lg group-focus-within:bg-[#FDE047] transition-colors" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-4 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 focus:bg-slate-950 transition-all font-light"
                                        placeholder="Enter your email..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1"
                                >
                                    Password
                                </label>
                                <div className="group relative">
                                    <div className="absolute inset-y-0 left-0 w-1 bg-slate-700 rounded-l-lg group-focus-within:bg-[#FDE047] transition-colors" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full pl-4 pr-12 py-3 bg-slate-950/50 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 focus:bg-slate-950 transition-all font-light"
                                        placeholder="Create a password..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1"
                                >
                                    Confirm Password
                                </label>
                                <div className="group relative">
                                    <div className="absolute inset-y-0 left-0 w-1 bg-slate-700 rounded-l-lg group-focus-within:bg-[#FDE047] transition-colors" />
                                    <input
                                        id="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full pl-4 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 focus:bg-slate-950 transition-all font-light"
                                        placeholder="Confirm your password..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="role"
                                    className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1"
                                >
                                    Role
                                </label>
                                <div className="group relative">
                                    <div className="absolute inset-y-0 left-0 w-1 bg-slate-700 rounded-l-lg group-focus-within:bg-[#FDE047] transition-colors" />
                                    <select
                                        id="role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as '' | 'customer_service' | 'rider_manager' | 'vendor_manager')}
                                        className={`w-full pl-4 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-lg focus:outline-none focus:border-slate-700 focus:bg-slate-950 transition-all font-light appearance-none cursor-pointer ${role === '' ? 'text-slate-600' : 'text-white'}`}
                                        required
                                    >
                                        <option value="" disabled>Choose your role...</option>
                                        <option value="customer_service">Customer Service</option>
                                        <option value="rider_manager">Rider Manager</option>
                                        <option value="vendor_manager">Vendor Account Manager</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-[#FDE047] hover:bg-yellow-300 text-black font-bold text-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(253,224,71,0.3)] hover:shadow-[0_0_25px_-5px_rgba(253,224,71,0.5)] transform hover:-translate-y-0.5"
                        >
                            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>

                        <p className="text-center text-sm text-slate-500 mt-6">
                            Already have an account?{' '}
                            <Link to="/login" className="text-white hover:text-[#FDE047] font-medium transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </form>
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
