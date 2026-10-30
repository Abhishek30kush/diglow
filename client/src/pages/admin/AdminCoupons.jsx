import React, { useEffect, useState } from 'react';
import {
  Tag,
  Plus,
  Percent,
  Calendar,
  CheckCircle,
  XCircle,
  Trash2,
  Edit2,
  RefreshCw,
  AlertCircle,
  X,
  Check
} from 'lucide-react';
import { api } from '../../utils/api.js';
import { formatPrice, formatDate } from '../../utils/formatters.js';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderAmount: '0',
    maxDiscountAmount: '',
    usageLimit: '',
    endDate: '',
    isActive: true
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadCoupons() {
    setLoading(true);
    setError('');
    try {
      const res = await api.getCoupons();
      if (res.success) {
        setCoupons(res.coupons);
      }
    } catch (err) {
      setError(err.message || 'Failed to load promotional coupons');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '10',
      minOrderAmount: '499',
      maxDiscountAmount: '200',
      usageLimit: '100',
      endDate: '',
      isActive: true
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCoupon(c);
    setFormData({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType,
      discountValue: c.discountValue.toString(),
      minOrderAmount: c.minOrderAmount.toString(),
      maxDiscountAmount: c.maxDiscountAmount ? c.maxDiscountAmount.toString() : '',
      usageLimit: c.usageLimit ? c.usageLimit.toString() : '',
      endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
      isActive: c.isActive
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit, 10) : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        isActive: formData.isActive
      };

      if (!payload.code) throw new Error('Coupon code is required.');
      if (isNaN(payload.discountValue) || payload.discountValue <= 0) {
        throw new Error('Valid discount value is required.');
      }

      if (editingCoupon) {
        await api.updateCoupon(editingCoupon.id, payload);
        setSuccessMsg(`Coupon "${payload.code}" updated successfully.`);
      } else {
        await api.createCoupon(payload);
        setSuccessMsg(`Coupon "${payload.code}" created successfully.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      loadCoupons();
    } catch (err) {
      setFormError(err.message || 'Failed to save coupon.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (c) => {
    try {
      await api.updateCoupon(c.id, { isActive: !c.isActive });
      loadCoupons();
    } catch (err) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (id, code) => {
    if (window.confirm(`Permanently delete coupon "${code}"?`)) {
      try {
        await api.deleteCoupon(id);
        loadCoupons();
      } catch (err) {
        alert(err.message || 'Failed to delete coupon');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-gold-600 block">
            Promotions & Gifting Engine
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-900">
            Promotional Coupons & Discount Rules ({coupons.length})
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-xl shadow-glow hover:shadow-glow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            <span>Create New Coupon</span>
          </button>

          <button
            type="button"
            onClick={loadCoupons}
            className="px-4 py-2 bg-white border border-burgundy-900/15 hover:border-burgundy-900 text-burgundy-900 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-3xl border border-burgundy-900/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-burgundy-800/60 animate-pulse">
            Loading promotional coupons...
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Tag className="w-10 h-10 text-gold-500 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-burgundy-900">No Coupons Configured</h3>
            <p className="text-xs text-burgundy-800/70 max-w-sm mx-auto">
              Create your first promotional discount code for Diwali, festive seasons, or welcome gifts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-100/70 border-b border-burgundy-900/10 text-burgundy-950 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-4 px-6">Coupon Code & Details</th>
                  <th className="py-4 px-6">Discount Value</th>
                  <th className="py-4 px-6">Min Order / Cap</th>
                  <th className="py-4 px-6">Redemptions</th>
                  <th className="py-4 px-6">Validity</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-burgundy-900/5">
                {coupons.map((c) => {
                  const isExpired = c.endDate && new Date(c.endDate) < new Date();
                  const isExhausted = c.usageLimit && c.usedCount >= c.usageLimit;

                  return (
                    <tr key={c.id} className="hover:bg-cream-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-sm text-burgundy-950 bg-gold-100/60 border border-gold-400/40 px-2.5 py-1 rounded-lg">
                            {c.code}
                          </span>
                        </div>
                        {c.description && (
                          <p className="text-[11px] text-burgundy-800/70 mt-1 max-w-xs">{c.description}</p>
                        )}
                      </td>
                      <td className="py-4 px-6 font-semibold text-burgundy-900">
                        {c.discountType === 'PERCENTAGE'
                          ? `${c.discountValue}% OFF`
                          : `${formatPrice(c.discountValue)} OFF`}
                      </td>
                      <td className="py-4 px-6 text-burgundy-800/80">
                        <div>Min: {formatPrice(c.minOrderAmount)}</div>
                        {c.maxDiscountAmount && (
                          <div className="text-[10px] text-burgundy-800/60">
                            Cap: {formatPrice(c.maxDiscountAmount)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-burgundy-950">{c.usedCount}</span>
                        <span className="text-burgundy-800/60">
                          {c.usageLimit ? ` / ${c.usageLimit} limit` : ' / unlimited'}
                        </span>
                        {isExhausted && (
                          <span className="block text-[10px] text-red-600 font-bold">Max Limit Hit</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-[11px]">
                        {c.endDate ? (
                          <span className={isExpired ? 'text-red-600 font-bold' : 'text-burgundy-800/80'}>
                            {isExpired ? 'Expired: ' : 'Expires: '}
                            {formatDate(c.endDate)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">No Expiration</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${
                            c.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                          }`}
                        >
                          {c.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-burgundy-800/70 hover:text-burgundy-950 rounded-lg hover:bg-cream-100"
                          title="Edit Coupon"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.code)}
                          className="p-1.5 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-burgundy-900/10 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-burgundy-900/10">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-gold-600" />
                <h3 className="font-serif text-lg font-bold text-burgundy-950">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promotional Coupon'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-burgundy-800/60 hover:text-burgundy-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Quick Festive Coupon Presets */}
            {!editingCoupon && (
              <div className="bg-amber-50/70 p-3 rounded-2xl border border-gold-500/30 space-y-2">
                <span className="text-[11px] font-serif font-bold text-burgundy-950">
                  🪔 Festive Coupon Presets (Click to Auto-fill):
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        code: 'DIWALI20',
                        description: '20% Grand Diwali Festive Discount on Hampers & Orders over ₹1,999',
                        discountType: 'PERCENTAGE',
                        discountValue: '20',
                        minOrderAmount: '1999',
                        maxDiscountAmount: '1000',
                        usageLimit: '500',
                        endDate: '',
                        isActive: true
                      })
                    }
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-gold-500/50 hover:bg-gold-50 text-burgundy-900 transition-colors shadow-xs"
                  >
                    DIWALI20 (20% Off)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        code: 'FESTIVE10',
                        description: 'Flat 10% Festive Savings across all handcrafted candles',
                        discountType: 'PERCENTAGE',
                        discountValue: '10',
                        minOrderAmount: '999',
                        maxDiscountAmount: '500',
                        usageLimit: '1000',
                        endDate: '',
                        isActive: true
                      })
                    }
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-gold-500/50 hover:bg-gold-50 text-burgundy-900 transition-colors shadow-xs"
                  >
                    FESTIVE10 (10% Off)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        code: 'ROYALGLOW',
                        description: 'Flat ₹300 Off on Luxury Orders over ₹2,499',
                        discountType: 'FIXED',
                        discountValue: '300',
                        minOrderAmount: '2499',
                        maxDiscountAmount: '',
                        usageLimit: '300',
                        endDate: '',
                        isActive: true
                      })
                    }
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-gold-500/50 hover:bg-gold-50 text-burgundy-900 transition-colors shadow-xs"
                  >
                    ROYALGLOW (₹300 Off)
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-burgundy-900 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. DIWALI20"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 uppercase font-mono font-bold focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-burgundy-900 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 20% festive discount on all orders above ₹999"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">Discount Type *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 font-medium"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">
                    Discount Value {formData.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === 'PERCENTAGE' ? '15' : '100'}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950"
                  />
                </div>

                {formData.discountType === 'PERCENTAGE' && (
                  <div>
                    <label className="block font-semibold text-burgundy-900 mb-1">
                      Max Cap Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      placeholder="e.g. 200"
                      className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">
                    Usage Limit (Max Times)
                  </label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="Blank = Unlimited"
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="couponActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-burgundy-900 focus:ring-gold-500"
                />
                <label htmlFor="couponActive" className="text-burgundy-950 font-semibold cursor-pointer">
                  Coupon is currently Active and redeemable at checkout
                </label>
              </div>

              <div className="pt-4 border-t border-burgundy-900/10 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-burgundy-900/20 text-burgundy-800 rounded-xl hover:bg-cream-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-serif font-bold uppercase tracking-wider rounded-xl shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
