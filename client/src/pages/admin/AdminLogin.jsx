import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Flame, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@diglow.com');
  const [password, setPassword] = useState('DiGlow@Admin2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-burgundy-950 via-burgundy-900 to-burgundy-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      
      {/* Decorative luxury glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-burgundy-900 border-2 border-gold-500/50 flex items-center justify-center mx-auto shadow-glow">
            <Flame className="w-8 h-8 text-gold-400 animate-flame" />
          </div>
          <span className="font-serif text-3xl font-bold tracking-wider text-cream-50 block">
            Di<span className="text-gold-500 font-cinzel">Glow</span>
          </span>
          <p className="text-xs uppercase tracking-widest text-gold-400 font-semibold">
            Administrative Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-cream-50 rounded-3xl p-8 border border-gold-500/30 shadow-2xl space-y-6">
          <div className="border-b border-burgundy-900/10 pb-4">
            <h2 className="font-serif text-xl font-bold text-burgundy-900">
              Sign In to Store Console
            </h2>
            <p className="text-xs text-burgundy-800/70 mt-0.5">
              Access real-time orders, stock control & delivery PIN verification.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-burgundy-900 mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-burgundy-900/40 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@diglow.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-burgundy-900/15 rounded-xl text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-burgundy-900 mb-1">
                Secret Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-burgundy-900/40 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-white border border-burgundy-900/15 rounded-xl text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-burgundy-900/40 hover:text-burgundy-900"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Credentials Helper */}
            <div className="p-3 bg-gold-100/60 rounded-xl border border-gold-300 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-burgundy-900 font-bold text-[11px] uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-700" />
                <span>Pre-configured Credentials</span>
              </div>
              <div className="text-[11px] text-burgundy-800/80 font-mono">
                Email: <strong>admin@diglow.com</strong><br />
                Password: <strong>DiGlow@Admin2026</strong>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-burgundy-900 hover:bg-burgundy-950 disabled:bg-neutral-400 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-glow hover:shadow-glow-lg flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-gold-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate & Enter</span>
                  <ArrowRight className="w-4 h-4 text-gold-400" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              to="/"
              className="text-xs text-burgundy-800/70 hover:text-burgundy-950 font-medium"
            >
              &larr; Return to Customer Storefront
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
