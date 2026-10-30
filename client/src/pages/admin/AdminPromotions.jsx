import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Link as LinkIcon,
  Copy
} from 'lucide-react';
import { api } from '../../utils/api.js';

export default function AdminPromotions() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badge: 'LIMITED EDITION',
    couponCode: '',
    linkUrl: '/shop',
    bgGradient: 'from-burgundy-950 via-burgundy-900 to-amber-950',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true,
    priority: 10
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAdminPromotions();
      if (res.success) {
        setBanners(res.banners);
      }
    } catch (err) {
      setError(err.message || 'Failed to load promotional campaign banners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      badge: 'LIMITED EDITION',
      couponCode: '',
      linkUrl: '/shop',
      bgGradient: 'from-burgundy-950 via-burgundy-900 to-amber-950',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true,
      priority: 10
    });
    setModalOpen(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      badge: banner.badge || 'LIMITED EDITION',
      couponCode: banner.couponCode || '',
      linkUrl: banner.linkUrl || '/shop',
      bgGradient: banner.bgGradient || 'from-burgundy-950 via-burgundy-900 to-amber-950',
      startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
      endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
      isActive: banner.isActive,
      priority: banner.priority || 0
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Campaign title is required.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingBanner) {
        await api.updatePromotion(editingBanner.id, formData);
      } else {
        await api.createPromotion(formData);
      }
      setModalOpen(false);
      fetchPromotions();
    } catch (err) {
      alert(err.message || 'Error saving promotional banner.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete campaign banner "${title}"?`)) return;
    try {
      await api.deletePromotion(id);
      fetchPromotions();
    } catch (err) {
      alert(err.message || 'Failed to delete banner.');
    }
  };

  const getStatusBadge = (banner) => {
    if (!banner.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-300">
          <XCircle className="w-3 h-3 text-neutral-500" />
          Inactive
        </span>
      );
    }

    const now = new Date();
    const start = new Date(banner.startDate);
    const end = banner.endDate ? new Date(banner.endDate) : null;

    if (start > now) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3 h-3 text-blue-500" />
          Scheduled
        </span>
      );
    }

    if (end && end < now) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <XCircle className="w-3 h-3 text-red-500" />
          Expired
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle className="w-3 h-3 text-emerald-600" />
        Active Now
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-cream-200 gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950 flex items-center gap-2.5">
            <Megaphone className="w-7 h-7 text-gold-600" />
            <span>Promotions & Seasonal Campaigns</span>
          </h1>
          <p className="text-xs text-burgundy-800/70 mt-1">
            Configure announcement banners, festive offers, and Diwali coupon highlights. Expired banners automatically disappear from the storefront.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-full hover:bg-burgundy-950 transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign Banner</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Campaign Banners Table */}
      <div className="bg-white rounded-2xl border border-gold-500/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-burgundy-950">
            <thead className="bg-cream-100/60 font-serif font-bold text-burgundy-900 uppercase tracking-wider text-[11px] border-b border-cream-200">
              <tr>
                <th className="py-3.5 px-4">Campaign & Badge</th>
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Destination Link</th>
                <th className="py-3.5 px-4">Campaign Duration</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-burgundy-800/50">
                    Loading promotional campaigns...
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-burgundy-800/60 font-serif">
                    No promotional campaign banners configured yet. Click "New Campaign Banner" to add one.
                  </td>
                </tr>
              ) : (
                banners.map((b) => (
                  <tr key={b.id} className="hover:bg-cream-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {b.badge && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gold-500/20 text-burgundy-900 border border-gold-500/40">
                              {b.badge}
                            </span>
                          )}
                          <span className="font-bold text-sm text-burgundy-950">{b.title}</span>
                        </div>
                        {b.subtitle && (
                          <p className="text-[11px] text-burgundy-800/70 italic line-clamp-1">
                            {b.subtitle}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-gold-600">
                      {b.couponCode || '—'}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-burgundy-900/80">
                      <div className="flex items-center gap-1">
                        <LinkIcon className="w-3 h-3 text-burgundy-800/40" />
                        <span>{b.linkUrl || '/shop'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[11px] text-burgundy-900/70 whitespace-nowrap">
                      <div>From: {new Date(b.startDate).toLocaleDateString()}</div>
                      <div>To: {b.endDate ? new Date(b.endDate).toLocaleDateString() : 'Continuous'}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-center">
                      {b.priority}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(b)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-burgundy-700 hover:text-gold-600 hover:bg-cream-100 rounded-lg transition-colors"
                          title="Edit Campaign"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b.id, b.title)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gold-500/40 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-cream-200">
              <h3 className="font-serif text-xl font-bold text-burgundy-950 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold-500" />
                <span>{editingBanner ? 'Edit Campaign Banner' : 'Create Campaign Banner'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-burgundy-800/50 hover:text-burgundy-950 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Quick Festive Templates */}
            {!editingBanner && (
              <div className="bg-amber-50/70 p-3 rounded-2xl border border-gold-500/30 space-y-2">
                <span className="text-[11px] font-serif font-bold text-burgundy-950 flex items-center gap-1.5">
                  <span>🪔 Quick Festive Templates (Click to Auto-fill)</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        title: 'Deepavali Grand Illumination Sale & Royal Hampers',
                        subtitle: 'Flat 20% Off on all Festive Hampers + Free Solid Brass Snuffer above ₹1,999',
                        badge: 'DIWALI SPECIAL',
                        couponCode: 'DIWALI20',
                        linkUrl: '/offers',
                        bgGradient: 'from-burgundy-950 via-burgundy-900 to-amber-950',
                        priority: 25,
                        isActive: true
                      })
                    }
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-gold-500/50 hover:bg-gold-50 text-burgundy-900 transition-colors shadow-xs"
                  >
                    🪔 Diwali 20% Off
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        title: 'Festive Artisanal Scented Candles Celebration',
                        subtitle: 'Use code FESTIVE10 for 10% instant off on all Handcrafted Soy Candles',
                        badge: 'FESTIVE EDIT',
                        couponCode: 'FESTIVE10',
                        linkUrl: '/shop?category=Festive%20Hampers',
                        bgGradient: 'from-amber-950 via-burgundy-950 to-rose-950',
                        priority: 15,
                        isActive: true
                      })
                    }
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-gold-500/50 hover:bg-gold-50 text-burgundy-900 transition-colors shadow-xs"
                  >
                    ✨ Festive 10% Off
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        title: 'Royal Heirloom Brass Urli & Velvet Gifting',
                        subtitle: 'Complimentary Handwritten Calligraphy Card & Free Express Shipping',
                        badge: 'LIMITED EDITION',
                        couponCode: 'ROYALGLOW',
                        linkUrl: '/offers',
                        bgGradient: 'from-burgundy-950 via-amber-950 to-yellow-950',
                        priority: 10,
                        isActive: true
                      })
                    }
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-gold-500/50 hover:bg-gold-50 text-burgundy-900 transition-colors shadow-xs"
                  >
                    🎁 Royal Brass Urli
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-burgundy-950 mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Deepavali Grand Illumination Edit"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-burgundy-900/20 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-burgundy-950 mb-1">
                  Subtitle / Offer Details
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Complimentary Solid Brass Wick Trimmer on orders over ₹1,999"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-burgundy-900/20 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-burgundy-950 mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. FESTIVE EXCLUSIVE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-burgundy-900/20 focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-burgundy-950 mb-1">
                    Attached Coupon Code
                  </label>
                  <input
                    type="text"
                    value={formData.couponCode}
                    onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. DIWALI20"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-burgundy-900/20 font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-burgundy-950 mb-1">
                    Destination URL
                  </label>
                  <input
                    type="text"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder="/category/festive-collections"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-burgundy-900/20 font-mono focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-burgundy-950 mb-1">
                    Display Priority (Higher = First)
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-burgundy-900/20 focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-burgundy-950 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-burgundy-900/20 focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-burgundy-950 mb-1">
                    End Date (Leave blank for ongoing)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-burgundy-900/20 focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-burgundy-900 focus:ring-gold-500"
                />
                <label htmlFor="isActive" className="font-semibold text-burgundy-950 cursor-pointer">
                  Campaign banner is active and visible to customers during schedule
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-burgundy-900/20 text-burgundy-800 hover:bg-cream-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-serif font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingBanner ? 'Save Changes' : 'Publish Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
