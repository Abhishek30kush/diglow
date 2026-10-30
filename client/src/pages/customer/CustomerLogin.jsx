import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Flame, Lock, Mail, User, Phone, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function CustomerLogin() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginCustomer, registerCustomer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/account';

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!formData.name || !formData.email || !formData.password) {
          throw new Error('Please fill in all required fields.');
        }
        await registerCustomer(formData);
      } else {
        if (!formData.email || !formData.password) {
          throw new Error('Please enter both email and password.');
        }
        await loginCustomer(formData.email, formData.password);
      }
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cream-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-burgundy-900/10">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-burgundy-900 flex items-center justify-center border-2 border-gold-500/50 shadow-glow mb-4">
            <Flame className="w-8 h-8 text-gold-400 animate-flame" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-burgundy-950">
            {isRegister ? 'Join DiGlow Sanctum' : 'Customer Sign In'}
          </h2>
          <p className="mt-2 text-xs text-burgundy-800/70">
            {isRegister
              ? 'Create an account to track shipments, save addresses & unlock member benefits'
              : 'Enter your credentials to access your luxury sanctuary orders'}
          </p>

          {/* Toggle Tabs */}
          <div className="mt-6 flex bg-cream-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !isRegister
                  ? 'bg-burgundy-900 text-gold-300 shadow-sm'
                  : 'text-burgundy-900/70 hover:text-burgundy-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                isRegister
                  ? 'bg-burgundy-900 text-gold-300 shadow-sm'
                  : 'text-burgundy-900/70 hover:text-burgundy-900'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-burgundy-900 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Maharani Gayatri Devi"
                  className="w-full pl-10 pr-4 py-2.5 bg-cream-50/50 border border-burgundy-900/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
                <User className="w-4 h-4 text-burgundy-800/50 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-burgundy-900 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-cream-50/50 border border-burgundy-900/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
              <Mail className="w-4 h-4 text-burgundy-800/50 absolute left-3.5 top-3" />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-burgundy-900 mb-1">
                10-Digit Mobile Number (For Delivery Updates)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full pl-10 pr-4 py-2.5 bg-cream-50/50 border border-burgundy-900/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
                <Phone className="w-4 h-4 text-burgundy-800/50 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-burgundy-900 mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-cream-50/50 border border-burgundy-900/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
              <Lock className="w-4 h-4 text-burgundy-800/50 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-burgundy-950 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isRegister ? 'Complete Registration' : 'Sign In to Sanctum'}</span>
                <ArrowRight className="w-4 h-4 text-gold-400" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-cream-200 text-center space-y-2">
          <p className="text-[11px] text-burgundy-800/60">
            Looking for Store Administration?{' '}
            <Link to="/admin/login" className="text-gold-600 font-semibold hover:underline">
              Admin Login &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
