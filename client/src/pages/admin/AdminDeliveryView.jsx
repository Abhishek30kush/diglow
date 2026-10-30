import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Eye,
  User,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatPrice, formatDate } from '../../utils/formatters.js';

export default function AdminDeliveryView() {
  const { admin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [deliveryStaffList, setDeliveryStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [search, setSearch] = useState('');

  // PIN Verification Modal
  const [verifyModalOrder, setVerifyModalOrder] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');

  // Failed Delivery Attempt Modal
  const [failedModalOrder, setFailedModalOrder] = useState(null);
  const [failedReason, setFailedReason] = useState('Customer unavailable at doorstep');
  const [customReason, setCustomReason] = useState('');
  const [submittingFailed, setSubmittingFailed] = useState(false);
  const [failedError, setFailedError] = useState('');
  const [failedSuccess, setFailedSuccess] = useState('');

  // Status Update Quick Action
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const isRider = admin?.role === 'DELIVERY';

  async function loadAssignedOrders() {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter !== 'All') query.append('status', statusFilter);
      if (!isRider && selectedStaffId) query.append('assignedToId', selectedStaffId);

      const res = await api.getAssignedDeliveryOrders(query.toString() ? `?${query.toString()}` : '');
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error('Failed to load assigned delivery orders:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadStaffList() {
    if (!isRider) {
      try {
        const res = await api.getDeliveryStaffList();
        if (res.success) {
          setDeliveryStaffList(res.staff || []);
        }
      } catch (err) {
        console.error('Failed to load staff list:', err);
      }
    }
  }

  useEffect(() => {
    loadStaffList();
  }, []);

  useEffect(() => {
    loadAssignedOrders();
  }, [statusFilter, selectedStaffId]);

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!pinInput || pinInput.length !== 6) {
      setVerifyError('Please enter the customer\'s 6-digit delivery PIN.');
      return;
    }

    setVerifying(true);
    setVerifyError('');
    setVerifySuccess('');
    try {
      const res = await api.verifyDeliveryPin(verifyModalOrder.id, pinInput);
      if (res.success) {
        setVerifySuccess('Doorstep PIN verified! Order confirmed Delivered and payment collected.');
        setTimeout(() => {
          setVerifyModalOrder(null);
          loadAssignedOrders();
        }, 1500);
      } else {
        setVerifyError(res.message || 'Incorrect PIN.');
      }
    } catch (err) {
      setVerifyError(err.message || 'PIN verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleRecordFailedAttempt = async (e) => {
    e.preventDefault();
    const finalReason = failedReason === 'Other' ? customReason.trim() : failedReason;
    if (!finalReason) {
      setFailedError('Please specify the reason for the failed delivery attempt.');
      return;
    }

    setSubmittingFailed(true);
    setFailedError('');
    setFailedSuccess('');
    try {
      const res = await api.recordFailedDelivery(failedModalOrder.id, finalReason);
      if (res.success) {
        setFailedSuccess(`Failed attempt recorded for #${failedModalOrder.orderNumber}.`);
        setTimeout(() => {
          setFailedModalOrder(null);
          loadAssignedOrders();
        }, 1500);
      } else {
        setFailedError(res.message || 'Failed to record attempt.');
      }
    } catch (err) {
      setFailedError(err.message || 'Error recording attempt.');
    } finally {
      setSubmittingFailed(false);
    }
  };

  const handleMarkOutForDelivery = async (orderId) => {
    setUpdatingStatusId(orderId);
    try {
      const res = await api.updateOrderStatus(orderId, {
        status: 'Out for Delivery',
        notes: `Rider ${admin?.name || 'Assigned Agent'} is on the way for doorstep delivery.`
      });
      if (res.success) {
        loadAssignedOrders();
      }
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ord.orderNumber.toLowerCase().includes(q) ||
      ord.customerName.toLowerCase().includes(q) ||
      ord.customerPhone.includes(q) ||
      ord.shippingAddress.toLowerCase().includes(q) ||
      ord.city.toLowerCase().includes(q) ||
      (ord.trackingNumber && ord.trackingNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-gold-600 block">
            {isRider ? 'My Assigned Delivery Run' : 'Dispatch & Courier Field Portal'}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-gold-600" />
            <span>Delivery Management & Field Verification</span>
          </h1>
          <p className="text-xs text-burgundy-800/70 mt-1">
            {isRider
              ? `Logged in as ${admin?.name} (${admin?.phone || admin?.email}) • Only your assigned orders are accessible.`
              : 'Supervise assigned riders, track field handoffs, and manage doorstep delivery confirmations.'}
          </p>
        </div>

        <button
          type="button"
          onClick={loadAssignedOrders}
          className="px-4 py-2 bg-white border border-burgundy-900/15 hover:border-burgundy-900 text-burgundy-900 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Run</span>
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-3xl p-5 border border-burgundy-900/10 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-burgundy-900/40 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, customer, address, phone..."
              className="w-full pl-10 pr-4 py-2 bg-cream-50 border border-burgundy-900/15 rounded-xl text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center space-x-2 w-full md:w-auto text-xs overflow-x-auto pb-1">
            {[
              'All',
              'Shipped',
              'Out for Delivery',
              'Failed Delivery',
              'Delivered'
            ].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? 'bg-burgundy-900 text-gold-300 shadow-sm'
                    : 'bg-cream-50 text-burgundy-900 hover:bg-cream-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Rider Switcher for Admin/Staff */}
        {!isRider && deliveryStaffList.length > 0 && (
          <div className="pt-3 border-t border-burgundy-900/10 flex items-center gap-3 text-xs">
            <span className="text-burgundy-800/70 font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gold-600" />
              <span>Filter by Assigned Rider:</span>
            </span>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="px-3 py-1.5 bg-cream-50 border border-burgundy-900/15 rounded-lg text-burgundy-950 font-medium"
            >
              <option value="">All Delivery Personnel ({deliveryStaffList.length})</option>
              {deliveryStaffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.role} - {st.phone || st.email})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-burgundy-800/60 animate-pulse bg-white rounded-3xl border">
          Loading assigned orders and addresses...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-burgundy-900/10 shadow-sm space-y-2">
          <Truck className="w-10 h-10 text-burgundy-900/30 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-burgundy-900">No Assigned Deliveries</h3>
          <p className="text-xs text-burgundy-800/60 max-w-sm mx-auto">
            There are currently no orders matching your delivery queue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((ord) => {
            const isDelivered = ord.orderStatus === 'Delivered';
            const isFailed = ord.orderStatus === 'Failed Delivery';
            const isOut = ord.orderStatus === 'Out for Delivery';

            return (
              <div
                key={ord.id}
                className="bg-white rounded-3xl p-6 border border-burgundy-900/10 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between border-b border-burgundy-900/10 pb-3">
                    <div>
                      <div className="font-serif font-bold text-lg text-burgundy-950">
                        #{ord.orderNumber}
                      </div>
                      <span className="text-[11px] text-burgundy-800/60">
                        Placed: {formatDate(ord.createdAt)}
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                        isDelivered
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isFailed
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : isOut
                          ? 'bg-purple-100 text-purple-900 font-extrabold border border-purple-300'
                          : 'bg-gold-100 text-burgundy-900'
                      }`}
                    >
                      {ord.orderStatus}
                    </span>
                  </div>

                  {/* Customer Contact & Address */}
                  <div className="pt-3 space-y-2.5 text-xs">
                    <div>
                      <span className="font-serif font-bold text-sm text-burgundy-950 block">
                        {ord.customerName}
                      </span>
                      <div className="flex items-center space-x-2 text-burgundy-800/80 mt-1">
                        <Phone className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                        <a
                          href={`tel:${ord.customerPhone}`}
                          className="font-mono font-bold text-burgundy-900 hover:underline"
                        >
                          +91 {ord.customerPhone}
                        </a>
                      </div>
                    </div>

                    {/* Delivery Address Block */}
                    <div className="p-3 bg-cream-50/80 rounded-2xl border border-burgundy-900/10 space-y-1">
                      <div className="flex items-center space-x-1.5 text-gold-700 font-bold uppercase text-[10px]">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Delivery Address</span>
                      </div>
                      <p className="text-burgundy-900 font-medium leading-relaxed">
                        {ord.shippingAddress}
                      </p>
                      <p className="text-burgundy-800/70 font-semibold">
                        {ord.city}, {ord.state} -{' '}
                        <span className="font-mono font-bold text-burgundy-950">
                          {ord.postalCode}
                        </span>
                      </p>
                      {ord.notes && (
                        <p className="text-[11px] text-burgundy-900/80 italic pt-1 border-t border-burgundy-900/10">
                          &ldquo;{ord.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Order Financials & Assignment */}
                    <div className="pt-1 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-burgundy-800/60 uppercase font-bold block">
                          Amount to Collect
                        </span>
                        <span className="font-serif font-bold text-base text-burgundy-950">
                          {formatPrice(ord.total)}
                        </span>
                        <span className="text-[10px] text-emerald-800 uppercase font-semibold block">
                          {ord.paymentMethod} ({ord.paymentStatus})
                        </span>
                      </div>

                      {ord.assignedToName && (
                        <div className="text-right">
                          <span className="text-[10px] text-burgundy-800/60 uppercase font-bold block">
                            Assigned Rider
                          </span>
                          <span className="font-semibold text-burgundy-900 text-xs">
                            {ord.assignedToName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Failed Attempt Warning if any */}
                    {ord.failedAttempts > 0 && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800 flex items-start space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>{ord.failedAttempts} Failed Attempt(s):</strong> {ord.failedReason}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 border-t border-burgundy-900/10 space-y-2">
                  {!isDelivered ? (
                    <div className="grid grid-cols-2 gap-2">
                      {ord.orderStatus === 'Shipped' && (
                        <button
                          type="button"
                          disabled={updatingStatusId === ord.id}
                          onClick={() => handleMarkOutForDelivery(ord.id)}
                          className="col-span-2 py-2 bg-purple-900 hover:bg-purple-950 text-gold-200 rounded-xl text-xs font-serif font-bold uppercase tracking-wider transition-colors"
                        >
                          {updatingStatusId === ord.id ? 'Updating...' : 'Start Run (Out for Delivery)'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setVerifyModalOrder(ord);
                          setPinInput('');
                          setVerifyError('');
                          setVerifySuccess('');
                        }}
                        className="py-2.5 bg-gold-500 hover:bg-gold-400 text-burgundy-950 rounded-xl text-xs font-serif font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verify PIN</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFailedModalOrder(ord);
                          setFailedReason('Customer unavailable at doorstep');
                          setCustomReason('');
                          setFailedError('');
                          setFailedSuccess('');
                        }}
                        className="py-2.5 bg-cream-100 hover:bg-red-50 border border-burgundy-900/15 hover:border-red-300 text-burgundy-900 hover:text-red-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>Log Failed</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 bg-emerald-50 rounded-xl text-center text-xs text-emerald-800 font-bold flex items-center justify-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Delivered & Verified</span>
                    </div>
                  )}

                  <Link
                    to={`/admin/orders/${ord.id}`}
                    className="w-full py-1.5 text-center text-[11px] text-burgundy-800/70 hover:text-burgundy-950 font-semibold block transition-colors"
                  >
                    View Full Order Dossier &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Doorstep Delivery PIN Verification Modal */}
      {verifyModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-burgundy-900/10 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-burgundy-900 border-b border-burgundy-900/10 pb-3">
              <ShieldCheck className="w-5 h-5 text-gold-600" />
              <div>
                <h3 className="font-serif text-lg font-bold">Doorstep PIN Verification</h3>
                <p className="text-xs text-burgundy-800/60">Order #{verifyModalOrder.orderNumber}</p>
              </div>
            </div>

            <p className="text-xs text-burgundy-800/80 leading-relaxed">
              Ask customer <strong>{verifyModalOrder.customerName}</strong> for the 6-digit PIN displayed on their order confirmation screen.
            </p>

            {verifyError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{verifyError}</span>
              </div>
            )}

            {verifySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{verifySuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-burgundy-900 mb-1.5 text-center">
                  Enter Recipient's 6-Digit PIN
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="0 0 0 0 0 0"
                  className="w-full text-center tracking-[0.5em] text-2xl font-serif font-bold py-3 bg-cream-50 border border-gold-500/50 rounded-2xl text-burgundy-950 focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalOrder(null)}
                  className="flex-1 py-2.5 bg-cream-100 hover:bg-cream-200 text-burgundy-900 font-semibold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying || pinInput.length !== 6}
                  className="flex-1 py-2.5 bg-gold-500 hover:bg-gold-400 disabled:bg-neutral-300 text-burgundy-950 font-serif font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                >
                  {verifying ? 'Verifying...' : 'Confirm Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Failed Delivery Attempt Logging Modal */}
      {failedModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-burgundy-900/10 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-burgundy-900 border-b border-burgundy-900/10 pb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-serif text-lg font-bold">Record Failed Delivery</h3>
                <p className="text-xs text-burgundy-800/60">Order #{failedModalOrder.orderNumber}</p>
              </div>
            </div>

            <p className="text-xs text-burgundy-800/80 leading-relaxed">
              Record a failed attempt with a reason and timestamp. The order status will transition to <strong>Failed Delivery</strong>.
            </p>

            {failedError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{failedError}</span>
              </div>
            )}

            {failedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{failedSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRecordFailedAttempt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-burgundy-900 mb-1.5">
                  Select Reason
                </label>
                <select
                  value={failedReason}
                  onChange={(e) => setFailedReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-xs text-burgundy-950 font-medium focus:outline-none"
                >
                  <option value="Customer unavailable at doorstep">Customer unavailable at doorstep</option>
                  <option value="Customer phone unreachable / switched off">Customer phone unreachable / switched off</option>
                  <option value="Address untraceable / incorrect landmark">Address untraceable / incorrect landmark</option>
                  <option value="Customer requested rescheduling">Customer requested rescheduling</option>
                  <option value="Customer refused parcel / COD cash unready">Customer refused parcel / COD cash unready</option>
                  <option value="Door locked / premises inaccessible">Door locked / premises inaccessible</option>
                  <option value="Other">Other Reason</option>
                </select>
              </div>

              {failedReason === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold text-burgundy-900 mb-1">
                    Describe Reason
                  </label>
                  <textarea
                    rows={2}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter details..."
                    className="w-full p-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-xs text-burgundy-950 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFailedModalOrder(null)}
                  className="flex-1 py-2.5 bg-cream-100 hover:bg-cream-200 text-burgundy-900 font-semibold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFailed}
                  className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 disabled:bg-neutral-300 text-white font-serif font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                >
                  {submittingFailed ? 'Recording...' : 'Record Attempt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
