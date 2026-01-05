import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Logo } from '../components/Logo';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
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
        {/* Logo and Welcome */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-2xl backdrop-blur-sm group hover:border-yellow-500/30 transition-all duration-500">
            <Logo size="lg" showText={false} className="scale-110 group-hover:scale-125 transition-transform duration-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
            Night Market
          </h1>
          <p className="text-[14px] font-medium text-slate-500 mt-2 tracking-tight">
            Operations Command Center
          </p>
        </div>

        {/* Login form */}
        <div className="bg-[#080808]/80 rounded-[28px] shadow-2xl border border-white/5 p-8 backdrop-blur-2xl ring-1 ring-white/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-[13px] font-bold text-red-400 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1"
                >
                  Email
                </label>
                <div className="relative group">
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
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label
                    htmlFor="password"
                    className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-bold text-yellow-500 hover:text-yellow-400 transition-colors uppercase tracking-widest"
                  >
                    Reset?
                  </Link>
                </div>
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-800 text-black font-bold text-[14px] rounded-xl transition-all disabled:text-slate-500 flex items-center justify-center gap-2 shadow-[0_10px_20px_-10px_rgba(234,179,8,0.3)] hover:shadow-[0_15px_25px_-10px_rgba(234,179,8,0.4)] transform hover:-translate-y-0.5 active:translate-y-0 mt-8"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>

            <div className="text-center pt-4">
              <p className="text-[13px] font-medium text-slate-500">
                Don't have access?{' '}
                <Link to="/signup" className="text-white hover:text-yellow-500 font-bold transition-colors ml-1">
                  Request Account
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
