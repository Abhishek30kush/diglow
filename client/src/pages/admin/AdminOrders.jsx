import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  RefreshCw,
  AlertCircle,
  Download,
  Printer
} from 'lucide-react';
import { api } from '../../utils/api.js';
import InvoiceModal from '../../components/InvoiceModal.jsx';
import { formatPrice, formatDate } from '../../utils/formatters.js';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('All');
  const [assignedStaffFilter, setAssignedStaffFilter] = useState('All');
  const [deliveryStaffList, setDeliveryStaffList] = useState([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  // Invoice / Packing Slip Modal
  const [printModalOrder, setPrintModalOrder] = useState(null);

  // Quick PIN Verify Modal
  const [verifyModalOrder, setVerifyModalOrder] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState('');

  async function loadStaff() {
    try {
      const res = await api.getDeliveryStaffList();
      if (res.success) {
        setDeliveryStaffList(res.staff || []);
      }
    } catch (e) {
      console.error('Failed to load staff list:', e);
    }
  }

  async function loadOrders() {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter !== 'All') query.append('status', statusFilter);
      if (paymentMethodFilter !== 'All') query.append('paymentMethod', paymentMethodFilter);
      if (paymentStatusFilter !== 'All') query.append('paymentStatus', paymentStatusFilter);
      if (deliveryStatusFilter !== 'All') query.append('deliveryStatus', deliveryStatusFilter);
      if (assignedStaffFilter !== 'All') query.append('assignedToId', assignedStaffFilter);
      if (dateFilter) query.append('startDate', dateFilter);
      if (search) query.append('search', search);
      query.append('sortBy', sortBy);
      query.append('sortOrder', sortOrder);

      const res = await api.getAdminOrders(`?${query.toString()}`);
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [
    statusFilter,
    paymentMethodFilter,
    paymentStatusFilter,
    deliveryStatusFilter,
    assignedStaffFilter,
    dateFilter,
    sortBy,
    sortOrder
  ]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadOrders();
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter !== 'All') query.append('status', statusFilter);
      if (assignedStaffFilter !== 'All') query.append('assignedToId', assignedStaffFilter);
      if (dateFilter) query.append('startDate', dateFilter);

      const csvData = await api.exportOrdersCsv(query.toString() ? `?${query.toString()}` : '');
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `diglow_orders_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleOpenVerifyModal = (order) => {
    setVerifyModalOrder(order);
    setPinInput('');
    setVerifyError('');
    setVerifySuccess('');
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!pinInput || pinInput.length !== 6) {
      setVerifyError('Please enter a valid 6-digit delivery PIN.');
      return;
    }

    setVerifying(true);
    setVerifyError('');
    try {
      const res = await api.verifyDeliveryPin(verifyModalOrder.id, pinInput);
      if (res.success) {
        setVerifySuccess('PIN verified successfully! Order marked as Delivered and Paid.');
        setTimeout(() => {
          setVerifyModalOrder(null);
          loadOrders();
        }, 1500);
      } else {
        setVerifyError(res.message || 'Incorrect delivery PIN.');
      }
    } catch (err) {
      setVerifyError(err.message || 'Invalid delivery PIN.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-gold-600 block">
            Fulfillment Center
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-900">
            Customer Orders & PIN Verification ({orders.length})
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="px-4 py-2 bg-cream-100 hover:bg-cream-200 text-burgundy-900 border border-burgundy-900/15 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-gold-600" />
            <span>{exporting ? 'Exporting...' : 'Export Orders CSV'}</span>
          </button>

          <button
            type="button"
            onClick={loadOrders}
            className="px-4 py-2 bg-white border border-burgundy-900/15 hover:border-burgundy-900 text-burgundy-900 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-burgundy-900/10 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-burgundy-900/40 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order #, phone, customer..."
                className="w-full pl-10 pr-4 py-2 bg-cream-50 border border-burgundy-900/15 rounded-xl text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-burgundy-900 text-gold-300 font-semibold rounded-xl text-xs"
            >
              Search
            </button>
          </form>

          {/* Status Pills */}
          <div className="flex items-center space-x-2 w-full md:w-auto text-xs overflow-x-auto pb-1">
            {[
              'All',
              'Pending',
              'Confirmed',
              'Processing',
              'Packed',
              'Shipped',
              'Out for Delivery',
              'Delivered',
              'Failed Delivery',
              'Cancelled',
              'Returned'
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

        {/* Multi-Dimensional Filters Row */}
        <div className="pt-3 border-t border-burgundy-900/10 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="text-burgundy-800/70 font-semibold">Payment Method:</span>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-cream-50 border border-burgundy-900/15 rounded-lg text-burgundy-950 font-medium"
            >
              <option value="All">All Methods</option>
              <option value="COD">Cash on Delivery (COD)</option>
              <option value="RAZORPAY">Razorpay Online</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-burgundy-800/70 font-semibold">Payment Status:</span>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-cream-50 border border-burgundy-900/15 rounded-lg text-burgundy-950 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-burgundy-800/70 font-semibold">Assigned Rider:</span>
            <select
              value={assignedStaffFilter}
              onChange={(e) => setAssignedStaffFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-cream-50 border border-burgundy-900/15 rounded-lg text-burgundy-950 font-medium"
            >
              <option value="All">All Staff / Riders</option>
              <option value="unassigned">Unassigned Only</option>
              {deliveryStaffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-burgundy-800/70 font-semibold">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-cream-50 border border-burgundy-900/15 rounded-lg text-burgundy-950 font-medium"
            >
              <option value="createdAt">Date Created</option>
              <option value="total">Order Amount</option>
              <option value="orderStatus">Order Status</option>
              <option value="customerName">Customer Name</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="px-2 py-1.5 bg-cream-50 hover:bg-cream-100 border border-burgundy-900/15 rounded-lg text-burgundy-900 font-bold"
              title="Toggle Sort Direction"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-burgundy-800/70 font-semibold">Order Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2 py-1 bg-cream-50 border border-burgundy-900/15 rounded-lg text-burgundy-950"
            />
          </div>

          {(paymentMethodFilter !== 'All' || paymentStatusFilter !== 'All' || deliveryStatusFilter !== 'All' || assignedStaffFilter !== 'All' || dateFilter) && (
            <button
              type="button"
              onClick={() => {
                setPaymentMethodFilter('All');
                setPaymentStatusFilter('All');
                setDeliveryStatusFilter('All');
                setAssignedStaffFilter('All');
                setDateFilter('');
              }}
              className="text-[11px] text-red-600 hover:text-red-800 font-semibold underline ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-burgundy-900/10 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-burgundy-800/60 animate-pulse">
            Loading order records...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-burgundy-800/60">
            No orders match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-cream-50/80 border-b border-burgundy-900/10 text-burgundy-900 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-6">Order ID & Date</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Amount & Method</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Rider</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-burgundy-900/5">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-cream-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-serif font-bold text-sm text-burgundy-950">
                        {ord.orderNumber}
                      </div>
                      <div className="text-[11px] text-burgundy-800/60">
                        {formatDate(ord.createdAt)}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-semibold text-burgundy-900 block">{ord.customerName}</span>
                      <span className="text-[11px] text-burgundy-800/70 font-mono">
                        +91 {ord.customerPhone}
                      </span>
                      <span className="text-[11px] text-burgundy-800/60 block truncate max-w-xs">
                        {ord.city}, {ord.postalCode}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-burgundy-900">
                      <span className="font-semibold">{ord.items?.length || 0} candles</span>
                      <span className="text-[11px] text-burgundy-800/60 block truncate max-w-[180px]">
                        {ord.items?.[0]?.product?.name || 'Candle'}
                        {ord.items?.length > 1 ? ` +${ord.items.length - 1} more` : ''}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-serif font-bold text-sm text-burgundy-900">
                        {formatPrice(ord.total)}
                      </span>
                      <span className="text-[10px] text-emerald-800 uppercase font-semibold block">
                        {ord.paymentMethod} ({ord.paymentStatus})
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold inline-block ${
                          ord.orderStatus === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : ord.orderStatus === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : ord.orderStatus === 'Failed Delivery'
                            ? 'bg-red-50 text-red-700 border border-red-300 font-bold'
                            : ord.orderStatus === 'Returned'
                            ? 'bg-amber-100 text-amber-900 font-bold'
                            : ord.orderStatus === 'Out for Delivery' || ord.orderStatus === 'Shipped'
                            ? 'bg-purple-100 text-purple-900 font-extrabold'
                            : 'bg-gold-100 text-burgundy-900'
                        }`}
                      >
                        {ord.orderStatus}
                      </span>
                      {ord.trackingNumber && (
                        <div className="text-[10px] text-burgundy-800/70 font-mono mt-1">
                          {ord.deliveryPartner ? `${ord.deliveryPartner}: ` : ''}
                          <span className="font-bold">{ord.trackingNumber}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-burgundy-950">
                        {ord.assignedToName ? ord.assignedToName : (
                          <span className="text-burgundy-800/40 italic">Unassigned</span>
                        )}
                      </div>
                      {ord.deliveryPartner && (
                        <span className="text-[10px] text-burgundy-800/70 block">
                          {ord.deliveryPartner}
                        </span>
                      )}
                      {ord.failedAttempts > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold inline-block mt-0.5">
                          {ord.failedAttempts} Failed Att.
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setPrintModalOrder(ord)}
                        className="px-2.5 py-1.5 bg-cream-100 hover:bg-cream-200 text-burgundy-900 border border-burgundy-900/15 rounded-lg text-xs font-semibold transition-colors inline-flex items-center space-x-1"
                        title="Print Invoice or Packing Slip"
                      >
                        <Printer className="w-3.5 h-3.5 text-gold-600" />
                        <span>Print</span>
                      </button>

                      {ord.orderStatus !== 'Delivered' && ord.orderStatus !== 'Cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleOpenVerifyModal(ord)}
                          className="px-3 py-1.5 bg-gold-500 hover:bg-gold-600 text-burgundy-950 font-bold rounded-lg text-xs transition-colors inline-flex items-center space-x-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verify PIN</span>
                        </button>
                      )}

                      <Link
                        to={`/admin/orders/${ord.id}`}
                        className="px-3 py-1.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 rounded-lg text-xs font-semibold transition-colors inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-gold-400" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verify PIN Modal */}
      {verifyModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-burgundy-900/10 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-burgundy-900 text-gold-400 flex items-center justify-center mx-auto shadow-glow">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-xl font-bold text-burgundy-950">
                Verify Customer Delivery PIN
              </h3>
              <p className="text-xs text-burgundy-800/70">
                Order #{verifyModalOrder.orderNumber} &bull; Recipient: {verifyModalOrder.customerName}
              </p>
            </div>

            {verifyError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            {verifySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{verifySuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-burgundy-900 mb-1 text-center">
                  Enter 6-Digit Delivery PIN provided by recipient:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full text-center font-serif text-2xl tracking-[0.5em] py-3 bg-cream-50 border border-burgundy-900/20 rounded-2xl focus:ring-2 focus:ring-gold-500 text-burgundy-950"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalOrder(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-burgundy-800 hover:text-burgundy-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying || pinInput.length !== 6}
                  className="px-6 py-2.5 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-burgundy-950 transition-colors shadow-md disabled:opacity-50"
                >
                  {verifying ? 'Verifying...' : 'Confirm Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice & Packing Slip Modal */}
      {printModalOrder && (
        <InvoiceModal order={printModalOrder} onClose={() => setPrintModalOrder(null)} />
      )}
    </div>
  );
}
