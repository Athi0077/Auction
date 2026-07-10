import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, ShieldAlert } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const { login, user, error, setError } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    setError(null);
    if (user) {
      navigate('/');
    }
  }, [user, navigate, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoadingSubmit(true);
    const success = await login(email, password);
    setLoadingSubmit(false);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="glass-panel-glow max-w-[450px] w-full mx-auto my-20 p-8 md:p-10 text-center">
      <h2 className="font-display text-3xl font-extrabold text-white mb-2">
        Welcome Back
      </h2>
      <p className="text-slate-400 text-sm mb-8">
        Log in to continue to <span className="gradient-text font-display font-bold bg-gradient-to-r from-accent to-secondary-neon bg-clip-text text-transparent">BidX</span>
      </p>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-500 p-3.5 rounded-xl mb-6 text-sm text-left">
          <ShieldAlert size={20} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-5 flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-400 text-left">Email Address</label>
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-accent focus:bg-white/[0.05] focus:ring-4 focus:ring-accent/15 transition-all"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-400 text-left">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="password"
              className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-accent focus:bg-white/[0.05] focus:ring-4 focus:ring-accent/15 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-4 py-3.5 rounded-xl font-bold bg-gradient-to-r from-accent to-secondary-neon text-white shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:scale-[1.02] active:scale-100 transition-all cursor-pointer disabled:opacity-50"
          disabled={loadingSubmit}
        >
          {loadingSubmit ? 'Logging in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-accent-light hover:text-accent font-semibold transition-colors">
          Sign Up
        </Link>
      </p>
    </div>
  );
};

export default Login;
