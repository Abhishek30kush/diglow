import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, Home, Briefcase, Star, Edit3 } from 'lucide-react';
import { api } from '../../utils/api.js';

export default function CustomerAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    label: 'Home',
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    isDefault: false
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomerAddresses();
      if (res.success) {
        setAddresses(res.addresses);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      label: 'Home',
      name: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      isDefault: false
    });
    setModalOpen(true);
  };

  const openEditModal = (addr) => {
    setEditingId(addr.id);
    setFormData({
      label: addr.label || 'Home',
      name: addr.name || '',
      phone: addr.phone || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postalCode || '',
      isDefault: Boolean(addr.isDefault)
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.updateCustomerAddress(editingId, formData);
      } else {
        await api.addCustomerAddress(formData);
      }
      setModalOpen(false);
      setEditingId(null);
      await fetchAddresses();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this saved address?')) return;
    try {
      await api.deleteCustomerAddress(id);
      await fetchAddresses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.setDefaultAddress(id);
      await fetchAddresses();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-burgundy-900/10 mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-burgundy-950">
            Saved Delivery Addresses
          </h1>
          <p className="text-xs text-burgundy-800/70 mt-1">
            Manage your sanctuary delivery destinations for faster checkout
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-full hover:bg-burgundy-950 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs text-burgundy-800/70">Loading saved addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-burgundy-900/10 space-y-4">
          <MapPin className="w-16 h-16 text-gold-500/50 mx-auto" />
          <h3 className="font-serif text-xl font-bold text-burgundy-950">
            No Addresses Saved
          </h3>
          <p className="text-xs text-burgundy-800/70 max-w-sm mx-auto">
            Save your home or office address to enjoy seamless one-click checkout.
          </p>
          <button
            onClick={openAddModal}
            className="px-6 py-2.5 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-full hover:bg-burgundy-950 transition-colors shadow-sm"
          >
            Add Address Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-2xl p-6 shadow-sm border transition-all relative ${
                addr.isDefault
                  ? 'border-gold-500 shadow-md ring-1 ring-gold-500/20'
                  : 'border-burgundy-900/10 hover:border-gold-500/50'
              }`}
            >
              {addr.isDefault && (
                <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-gold-100 text-burgundy-950 px-2 py-0.5 rounded-full border border-gold-300">
                  <Star className="w-3 h-3 fill-gold-500 text-gold-500" />
                  <span>Default</span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <span className="font-serif font-bold text-base text-burgundy-950">
                  {addr.label}
                </span>
              </div>

              <div className="space-y-1 text-xs text-burgundy-800/80 mb-6">
                <p className="font-semibold text-sm text-burgundy-950">{addr.name}</p>
                <p>{addr.street}</p>
                <p>
                  {addr.city}, {addr.state} - <strong>{addr.postalCode}</strong>
                </p>
                <p className="text-burgundy-900 font-medium pt-1">Phone: +91 {addr.phone}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-cream-200 text-xs">
                {!addr.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-gold-700 hover:text-gold-900 font-semibold"
                  >
                    Set as Default
                  </button>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Primary Shipping Address</span>
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(addr)}
                    className="text-burgundy-700 hover:text-burgundy-950 p-1 transition-colors"
                    title="Edit address"
                    aria-label="Edit address"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-red-600 hover:text-red-800 p-1 transition-colors"
                    title="Delete address"
                    aria-label="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-burgundy-900/10 space-y-5">
            <h3 className="font-serif text-2xl font-bold text-burgundy-950">
              {editingId ? 'Edit Delivery Destination' : 'Add Delivery Destination'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-burgundy-900 mb-1">
                    Address Label
                  </label>
                  <select
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 py-2 bg-cream-50 border border-burgundy-900/20 rounded-xl text-xs focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Office / Work</option>
                    <option value="Sanctum">Sanctum Villa</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-burgundy-900 mb-1">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-cream-50 border border-burgundy-900/20 rounded-xl text-xs focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-burgundy-900 mb-1">
                  10-Digit Phone *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 bg-cream-50 border border-burgundy-900/20 rounded-xl text-xs focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-burgundy-900 mb-1">
                  Street Address & Flat / Bungalow *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-3 py-2 bg-cream-50 border border-burgundy-900/20 rounded-xl text-xs focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-burgundy-900 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-cream-50 border border-burgundy-900/20 rounded-xl text-xs focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-burgundy-900 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-cream-50 border border-burgundy-900/20 rounded-xl text-xs focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-burgundy-900 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 bg-cream-50 border border-burgundy-900/20 rounded-xl text-xs focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultCheck"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded text-burgundy-900 focus:ring-gold-500"
                />
                <label htmlFor="isDefaultCheck" className="text-xs text-burgundy-900">
                  Set as default shipping address
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-burgundy-800 hover:text-burgundy-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-burgundy-950 transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
