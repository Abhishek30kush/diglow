import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Lock,
  Heart,
  Headphones,
  Check,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../utils/api.js';

export default function CustomerAccount() {
  const { customer, refreshCustomerProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || ''
  });
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Newsletter preferences state
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterConsentDate, setNewsletterConsentDate] = useState(null);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || ''
      });
      loadNewsletterPreferences();
    }
  }, [customer]);

  const loadNewsletterPreferences = async () => {
    try {
      const res = await api.getCustomerNewsletterPreferences();
      if (res.success) {
        setNewsletterSubscribed(Boolean(res.subscribed));
        setNewsletterConsentDate(res.consentTimestamp);
      }
    } catch (err) {
      console.warn('Could not load newsletter preferences:', err);
    }
  };

  const handleNewsletterToggle = async (e) => {
    const nextVal = e.target.checked;
    setNewsletterLoading(true);
    setNewsletterMessage('');
    try {
      const res = await api.updateCustomerNewsletterPreferences(nextVal);
      if (res.success) {
        setNewsletterSubscribed(res.subscribed);
        setNewsletterMessage(res.message);
        setTimeout(() => setNewsletterMessage(''), 4000);
      }
    } catch (err) {
      setNewsletterMessage(`Failed: ${err.message}`);
    } finally {
      setNewsletterLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMessage('');
    try {
      await api.updateCustomerProfile(formData);
      await refreshCustomerProfile();
      setMessage('Profile details updated successfully.');
      setEditing(false);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setErrorMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.changeCustomerPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (res.success) {
        setPasswordSuccess(res.message || 'Password changed successfully.');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setPasswordSuccess(''), 4000);
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-burgundy-950 via-burgundy-900 to-burgundy-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gold-500/20 mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gold opacity-15 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gold-500/20 border-2 border-gold-400 flex items-center justify-center text-2xl font-serif font-bold text-gold-300">
              {customer?.name?.charAt(0) || 'D'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                  {customer?.name}
                </h1>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-gold-500 text-burgundy-950 rounded-full">
                  Sanctum Member
                </span>
              </div>
              <p className="text-gold-200/80 text-xs sm:text-sm mt-1">{customer?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/account/orders"
              className="px-4 py-2 bg-gold-500 text-burgundy-950 font-serif font-bold text-xs uppercase tracking-wider rounded-full hover:bg-gold-400 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <PackageCheck className="w-4 h-4" />
              <span>View Orders</span>
            </Link>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl mb-6 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-3">
          <Link
            to="/account"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-burgundy-900 text-gold-300 font-medium text-sm shadow-sm"
          >
            <User className="w-4 h-4 text-gold-400" />
            <span>Profile & Security</span>
          </Link>
          <Link
            to="/account/orders"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-burgundy-900/10 text-burgundy-900 hover:bg-cream-100 transition-colors font-medium text-sm"
          >
            <PackageCheck className="w-4 h-4 text-gold-600" />
            <span>Order History</span>
          </Link>
          <Link
            to="/account/addresses"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-burgundy-900/10 text-burgundy-900 hover:bg-cream-100 transition-colors font-medium text-sm"
          >
            <MapPin className="w-4 h-4 text-gold-600" />
            <span>Saved Addresses</span>
          </Link>
          <Link
            to="/account/wishlist"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-burgundy-900/10 text-burgundy-900 hover:bg-cream-100 transition-colors font-medium text-sm"
          >
            <Heart className="w-4 h-4 text-gold-600" />
            <span>Sanctum Wishlist</span>
          </Link>
          <Link
            to="/contact"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-gold-500/20 text-burgundy-900 hover:bg-cream-100 transition-colors font-medium text-sm"
          >
            <Headphones className="w-4 h-4 text-gold-600" />
            <span>Concierge & Support</span>
          </Link>
        </div>

        {/* Content Column */}
        <div className="md:col-span-2 space-y-8">
          {/* Personal Information Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-burgundy-900/10">
            <div className="flex items-center justify-between pb-4 border-b border-cream-200 mb-6">
              <h2 className="font-serif text-lg font-bold text-burgundy-950 flex items-center gap-2">
                <User className="w-5 h-5 text-gold-600" />
                <span>Personal Information</span>
              </h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs font-semibold text-gold-600 hover:text-gold-700"
                >
                  Edit Details
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: customer?.name || '',
                      phone: customer?.phone || ''
                    });
                  }}
                  className="text-xs font-semibold text-burgundy-700 hover:text-burgundy-900"
                >
                  Cancel
                </button>
              )}
            </div>

            {!editing ? (
              <div className="space-y-5 text-sm">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gold-600 shrink-0" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-burgundy-700/60 font-semibold">
                      Full Name
                    </p>
                    <p className="font-medium text-burgundy-950">{customer?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gold-600 shrink-0" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-burgundy-700/60 font-semibold">
                      Email Address (Login ID)
                    </p>
                    <p className="font-medium text-burgundy-950">{customer?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gold-600 shrink-0" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-burgundy-700/60 font-semibold">
                      Delivery Phone Number
                    </p>
                    <p className="font-medium text-burgundy-950">
                      {customer?.phone || 'No phone number saved'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-burgundy-900 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-burgundy-900 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    maxLength={10}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-burgundy-950 transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            )}
          </div>

          {/* Password & Security Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-burgundy-900/10">
            <div className="pb-4 border-b border-cream-200 mb-6">
              <h2 className="font-serif text-lg font-bold text-burgundy-950 flex items-center gap-2">
                <Lock className="w-5 h-5 text-gold-600" />
                <span>Security & Password</span>
              </h2>
              <p className="text-xs text-burgundy-800/70 mt-1">
                Keep your sanctum account secure by updating your access credentials
              </p>
            </div>

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl mb-4 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-medium text-burgundy-900 mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-burgundy-900 mb-1">
                  New Password * (min. 6 characters)
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-burgundy-900 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="px-6 py-2.5 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-burgundy-950 transition-colors shadow-sm disabled:opacity-50"
              >
                {passwordLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Newsletter & Marketing Preferences Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-burgundy-900/10">
            <div className="pb-4 border-b border-cream-200 mb-4">
              <h2 className="font-serif text-lg font-bold text-burgundy-950 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold-600" />
                <span>Sanctum Notes & Communication Preferences</span>
              </h2>
              <p className="text-xs text-burgundy-800/70 mt-1">
                Control notifications regarding limited festive batches, private artisanal drops, and workshop stories
              </p>
            </div>

            {newsletterMessage && (
              <div className="p-3 bg-gold-50 border border-gold-500/30 text-burgundy-950 text-xs rounded-xl mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-600 shrink-0" />
                <span>{newsletterMessage}</span>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 bg-cream-50/70 rounded-xl border border-gold-500/20">
              <input
                type="checkbox"
                id="newsletterConsent"
                checked={newsletterSubscribed}
                onChange={handleNewsletterToggle}
                disabled={newsletterLoading}
                className="mt-1 h-4 w-4 text-gold-600 focus:ring-gold-500 border-burgundy-900/30 rounded cursor-pointer"
              />
              <label htmlFor="newsletterConsent" className="text-xs text-burgundy-950 cursor-pointer space-y-1">
                <span className="font-bold block">
                  Receive DiGlow Sanctum Notes & VIP Drops
                </span>
                <span className="text-burgundy-800/70 block leading-relaxed">
                  We respect your sanctuary inbox. You will only receive curated announcements of new seasonal fragrance accords, Diwali gifting previews, and brass crafting behind-the-scenes. You can toggle this consent off at any time.
                </span>
                {newsletterConsentDate && (
                  <span className="text-[10px] text-gold-700/80 block pt-1 font-mono">
                    Consent recorded: {new Date(newsletterConsentDate).toLocaleDateString()}
                  </span>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

