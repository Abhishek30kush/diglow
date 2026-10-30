import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Mail,
  MousePointer,
  CheckCircle2,
  DollarSign,
  Play,
  RotateCw,
  Clock,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { api } from '../../utils/api.js';
import { formatPrice } from '../../utils/formatters.js';

export default function AdminAbandonedCarts() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Manual Batch Dispatch Modal State
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchParams, setDispatchParams] = useState({
    inactivityMinutes: 60,
    maxEmails: 1,
    couponCode: '',
    discountText: ''
  });
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let query = `?page=${page}&limit=20`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;

      const res = await api.getAdminAbandonedCarts(query);
      if (res.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load abandoned cart analytics.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRunDispatch = async (e) => {
    e.preventDefault();
    setDispatching(true);
    setDispatchResult(null);
    try {
      const res = await api.triggerAbandonedCartRecovery({
        inactivityMinutes: Number(dispatchParams.inactivityMinutes),
        maxEmails: Number(dispatchParams.maxEmails),
        couponCode: dispatchParams.couponCode.trim() || undefined,
        discountText: dispatchParams.discountText.trim() || undefined
      });
      if (res.success) {
        setDispatchResult(res.result);
        fetchAnalytics();
      }
    } catch (err) {
      alert(`Dispatch failed: ${err.message}`);
    } finally {
      setDispatching(false);
    }
  };

  const metrics = analytics?.metrics || {
    totalCarts: 0,
    abandonedCarts: 0,
    emailsDispatched: 0,
    recoveryClicks: 0,
    recoveredOrders: 0,
    recoveredRevenue: 0,
    recoveryRatePercent: 0
  };

  const carts = analytics?.carts || [];
  const pagination = analytics?.pagination || { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gold-600 uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            <span>Customer Retention & Re-engagement</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-burgundy-950 mt-1">
            Abandoned Cart Recovery
          </h1>
          <p className="text-xs sm:text-sm text-burgundy-800/70 mt-1 max-w-2xl font-light">
            Monitor incomplete luxury candle checkouts, trigger automated recovery campaigns, and track reclaimed revenue without double counting.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchAnalytics()}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-gold-300 bg-white text-burgundy-900 text-xs font-semibold hover:bg-gold-50 transition-colors shadow-sm"
          >
            <RotateCw className={`w-3.5 h-3.5 text-gold-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setDispatchResult(null);
              setDispatchModalOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-burgundy-900 text-gold-300 text-xs font-serif font-bold uppercase tracking-wider hover:bg-burgundy-950 transition-all shadow-glow"
          >
            <Play className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
            <span>Dispatch Recovery Run</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gold-200/80 shadow-sm">
          <div className="flex items-center justify-between text-burgundy-800/60 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Eligible Abandoned</span>
            <div className="w-8 h-8 rounded-full bg-gold-50 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-gold-600" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-burgundy-950">
            {metrics.abandonedCarts}
          </div>
          <p className="text-[10px] text-burgundy-700/60 mt-1">
            Out of {metrics.totalCarts} total recorded sessions
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gold-200/80 shadow-sm">
          <div className="flex items-center justify-between text-burgundy-800/60 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Emails Dispatched</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-burgundy-950">
            {metrics.emailsDispatched}
          </div>
          <p className="text-[10px] text-blue-700/70 mt-1">
            {metrics.recoveryClicks} customer link clicks
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gold-200/80 shadow-sm">
          <div className="flex items-center justify-between text-burgundy-800/60 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Recovered Orders</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-burgundy-950">
            {metrics.recoveredOrders}
          </div>
          <p className="text-[10px] text-emerald-700 mt-1 font-medium">
            {metrics.recoveryRatePercent}% conversion recovery rate
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-burgundy-900 text-gold-300 border border-gold-500/30 shadow-md">
          <div className="flex items-center justify-between text-gold-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Recovered Revenue</span>
            <div className="w-8 h-8 rounded-full bg-burgundy-950 border border-gold-500/40 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-gold-400" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-cream-50">
            {formatPrice(metrics.recoveredRevenue)}
          </div>
          <p className="text-[10px] text-gold-300/80 mt-1 font-light">
            Directly attributed from completed recovery sessions
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-gold-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-xs text-burgundy-900 font-semibold">
            <Filter className="w-3.5 h-3.5 text-gold-600" />
            <span>Filter By:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-gold-300 bg-white text-burgundy-900 focus:outline-none focus:ring-1 focus:ring-burgundy-900"
          >
            <option value="">All Statuses</option>
            <option value="ABANDONED">Abandoned (Unrecovered)</option>
            <option value="RECOVERED">Recovered (Order Placed)</option>
            <option value="CONVERTED">Direct Converted</option>
            <option value="ACTIVE">Active (In Session)</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl border border-gold-300 bg-white text-burgundy-900 focus:outline-none"
            placeholder="From Date"
          />
          <span className="text-xs text-burgundy-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl border border-gold-300 bg-white text-burgundy-900 focus:outline-none"
            placeholder="To Date"
          />

          {(statusFilter || startDate || endDate) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="text-xs text-burgundy-600 hover:text-burgundy-900 underline font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="text-xs text-burgundy-800/60 font-light">
          Showing {carts.length} of {pagination.total} records
        </div>
      </div>

      {/* Carts Table */}
      <div className="bg-white rounded-2xl border border-gold-200/80 shadow-sm overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-cream-100/70 border-b border-gold-200/80 text-[11px] font-serif uppercase tracking-wider text-burgundy-900/80">
                <th className="py-3.5 px-4 font-bold">Customer / Session</th>
                <th className="py-3.5 px-4 font-bold">Cart Items</th>
                <th className="py-3.5 px-4 font-bold">Bag Value</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold">Recovery Emails</th>
                <th className="py-3.5 px-4 font-bold">Last Activity</th>
                <th className="py-3.5 px-4 font-bold text-right">Order Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-100">
              {carts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-burgundy-800/60 font-light">
                    {loading ? 'Retrieving cart intelligence...' : 'No abandoned cart records found for the selected criteria.'}
                  </td>
                </tr>
              ) : (
                carts.map((cart) => {
                  const items = Array.isArray(cart.items) ? cart.items : [];
                  return (
                    <tr key={cart.id} className="hover:bg-cream-50/50 transition-colors">
                      {/* Customer / Session */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-burgundy-950">
                          {cart.customerEmail || (
                            <span className="text-burgundy-800/60 italic font-normal">
                              Anonymous Guest
                            </span>
                          )}
                        </div>
                        {cart.customerName && (
                          <div className="text-[11px] text-burgundy-800/70 font-light">
                            {cart.customerName}
                          </div>
                        )}
                        <div className="text-[10px] text-burgundy-400 font-mono mt-0.5">
                          {cart.sessionToken.slice(0, 16)}...
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-4 px-4">
                        <div className="space-y-1 max-w-xs">
                          {items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-[11px]">
                              {item.product?.imageUrl && (
                                <img
                                  src={item.product.imageUrl}
                                  alt=""
                                  className="w-7 h-7 rounded-md object-cover border border-gold-200 shrink-0"
                                />
                              )}
                              <span className="truncate text-burgundy-900 font-medium">
                                {item.product?.name || 'Handcrafted Candle'}
                                {item.variant ? ` (${item.variant.title})` : ''} &times; {item.quantity}
                              </span>
                            </div>
                          ))}
                          {items.length > 2 && (
                            <span className="text-[10px] text-burgundy-600 italic">
                              +{items.length - 2} more candle item(s)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Bag Value */}
                      <td className="py-4 px-4">
                        <span className="font-serif font-bold text-burgundy-900">
                          {formatPrice(cart.subtotal)}
                        </span>
                        <div className="text-[10px] text-burgundy-500">
                          {cart.itemCount} items
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                            cart.status === 'RECOVERED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : cart.status === 'ABANDONED'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : cart.status === 'CONVERTED'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-cream-200 text-burgundy-800'
                          }`}
                        >
                          {cart.status}
                        </span>
                      </td>

                      {/* Recovery Emails */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-1.5">
                          <Mail className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-semibold text-burgundy-900">
                            {cart.recoveryEmailSentCount} sent
                          </span>
                        </div>
                        {cart.recoveryClickedAt && (
                          <div className="flex items-center space-x-1 text-[10px] text-emerald-700 mt-0.5 font-medium">
                            <MousePointer className="w-3 h-3 text-emerald-600" />
                            <span>Link Clicked</span>
                          </div>
                        )}
                      </td>

                      {/* Last Activity */}
                      <td className="py-4 px-4 text-burgundy-800/80 font-light">
                        <div>{new Date(cart.lastActivityAt || cart.updatedAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-burgundy-400">
                          {new Date(cart.lastActivityAt || cart.updatedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      {/* Order Link */}
                      <td className="py-4 px-4 text-right">
                        {cart.recoveredOrder ? (
                          <Link
                            to={`/admin/orders/${cart.recoveredOrder.id}`}
                            className="inline-flex items-center space-x-1 text-xs text-burgundy-900 hover:text-gold-700 font-semibold underline"
                          >
                            <span>#{cart.recoveredOrder.orderNumber}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-[11px] text-burgundy-300">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="py-3 px-4 bg-cream-50 border-t border-gold-200/80 flex items-center justify-between text-xs">
            <span className="text-burgundy-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-gold-300 disabled:opacity-40 hover:bg-white text-burgundy-900"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-gold-300 disabled:opacity-40 hover:bg-white text-burgundy-900"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Dispatch Modal */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-gold-300 shadow-2xl relative space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-gold-600 uppercase tracking-widest">
                  Batch Recovery Campaign
                </span>
                <h3 className="font-serif text-2xl font-bold text-burgundy-950 mt-0.5">
                  Trigger Recovery Run
                </h3>
              </div>
              <button
                onClick={() => setDispatchModalOpen(false)}
                className="text-burgundy-400 hover:text-burgundy-900 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-burgundy-800/70 font-light leading-relaxed">
              Scans for carts abandoned beyond your specified inactivity threshold. Emails are sent exclusively to customers with saved emails who have not opted out of communications.
            </p>

            <form onSubmit={handleRunDispatch} className="space-y-4 text-xs">
              <div>
                <label className="block text-burgundy-900 font-semibold mb-1">
                  Inactivity Period (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="10080"
                  value={dispatchParams.inactivityMinutes}
                  onChange={(e) =>
                    setDispatchParams({ ...dispatchParams, inactivityMinutes: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gold-300 text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-burgundy-900"
                />
                <span className="text-[10px] text-burgundy-400">
                  Carts inactive for at least this amount of time will be selected. Default: 60 minutes.
                </span>
              </div>

              <div>
                <label className="block text-burgundy-900 font-semibold mb-1">
                  Optional Recovery Coupon Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. SAVE10 (optional)"
                  value={dispatchParams.couponCode}
                  onChange={(e) =>
                    setDispatchParams({ ...dispatchParams, couponCode: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gold-300 text-burgundy-950 uppercase font-mono focus:outline-none"
                />
                <span className="text-[10px] text-burgundy-400">
                  Leave empty if you do not wish to offer a discount.
                </span>
              </div>

              <div>
                <label className="block text-burgundy-900 font-semibold mb-1">
                  Custom Recovery Note in Email (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete your order today to enjoy complimentary gift wrapping."
                  value={dispatchParams.discountText}
                  onChange={(e) =>
                    setDispatchParams({ ...dispatchParams, discountText: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gold-300 text-burgundy-950 focus:outline-none"
                />
              </div>

              {dispatchResult && (
                <div className="p-4 rounded-xl bg-gold-50 border border-gold-300 text-burgundy-950 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Dispatch Batch Completed</span>
                  </div>
                  <div className="text-[11px] grid grid-cols-2 gap-2 pt-1">
                    <div>Processed: {dispatchResult.processedCount}</div>
                    <div>Emails Sent: {dispatchResult.emailsDispatched}</div>
                    <div>Skipped (Unsubscribed): {dispatchResult.skippedUnsubscribed}</div>
                    <div>Skipped (No Email): {dispatchResult.skippedEmpty}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gold-300 text-burgundy-800 font-semibold hover:bg-gold-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={dispatching}
                  className="px-6 py-2.5 rounded-xl bg-burgundy-900 text-gold-300 font-serif font-bold tracking-wider uppercase hover:bg-burgundy-950 disabled:opacity-50 transition-all shadow-glow flex items-center space-x-2"
                >
                  {dispatching ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <span>Execute Campaign</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
