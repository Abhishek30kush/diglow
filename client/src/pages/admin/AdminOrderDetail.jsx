import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  CheckCheck,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  Calendar,
  History,
  Printer,
  User,
  RotateCcw,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../utils/api.js';
import OrderTimeline from '../../components/OrderTimeline.jsx';
import InvoiceModal from '../../components/InvoiceModal.jsx';
import { formatPrice, formatDate } from '../../utils/formatters.js';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [deliveryPartner, setDeliveryPartner] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // PIN Verification State
  const [deliveryPin, setDeliveryPin] = useState('');
  const [pinVerifying, setPinVerifying] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Delivery Staff Assignment State
  const [deliveryStaffList, setDeliveryStaffList] = useState([]);
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState('');

  // Return Processing State
  const [returnDisposition, setReturnDisposition] = useState('RESTOCK_TO_INVENTORY');
  const [returnReason, setReturnReason] = useState('');
  const [processingReturn, setProcessingReturn] = useState(false);
  const [returnMessage, setReturnMessage] = useState('');
  const [returnError, setReturnError] = useState('');

  async function loadStaff() {
    try {
      const res = await api.getDeliveryStaffList();
      if (res.success) {
        setDeliveryStaffList(res.staff || []);
      }
    } catch (e) {
      console.error('Failed to load delivery staff:', e);
    }
  }

  async function loadOrder() {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAdminOrderById(id);
      if (res.success && res.order) {
        setOrder(res.order);
        setStatusInput(res.order.orderStatus);
        setStatusNotes(res.order.notes || '');
        setDeliveryPartner(res.order.deliveryPartner || '');
        setTrackingNumber(res.order.trackingNumber || '');
        setAssignedStaffId(res.order.assignedToId || '');
      } else {
        setError(res.message || 'Order not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
    loadStaff();
  }, [id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage('');
    try {
      const res = await api.updateOrderStatus(id, {
        status: statusInput,
        notes: statusNotes,
        deliveryPartner,
        trackingNumber
      });
      if (res.success) {
        setOrder(res.order);
        setMessage(`Order updated successfully.`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleVerifyDeliveryPin = async (e) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');
    setPinVerifying(true);

    try {
      const res = await api.verifyDeliveryPin(id, deliveryPin);
      if (res.success && res.order) {
        setOrder(res.order);
        setPinSuccess('PIN verified! Order marked Delivered and Cash Collected.');
        setDeliveryPin('');
      } else {
        setPinError(res.message || 'Incorrect PIN');
      }
    } catch (err) {
      setPinError(err.message || 'Failed to verify PIN');
    } finally {
      setPinVerifying(false);
    }
  };

  const handleAssignStaff = async (e) => {
    e.preventDefault();
    setAssigning(true);
    setAssignMessage('');
    try {
      const res = await api.assignOrderDelivery(id, {
        assignedToId: assignedStaffId || null,
        deliveryPartner
      });
      if (res.success && res.order) {
        setOrder(res.order);
        setAssignMessage('Delivery personnel assigned successfully.');
        setTimeout(() => setAssignMessage(''), 3000);
      }
    } catch (err) {
      alert(`Assignment failed: ${err.message}`);
    } finally {
      setAssigning(false);
    }
  };

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    if (!returnReason.trim()) {
      setReturnError('Please enter the reason for return inspection.');
      return;
    }
    setProcessingReturn(true);
    setReturnError('');
    setReturnMessage('');
    try {
      const res = await api.processOrderReturn(id, {
        itemDisposition: returnDisposition,
        reason: returnReason.trim()
      });
      if (res.success && res.order) {
        setOrder(res.order);
        setReturnMessage(`Return processed successfully (${returnDisposition === 'RESTOCK_TO_INVENTORY' ? 'Restocked to Inventory' : 'Damaged Write-Off Recorded'}).`);
        setReturnReason('');
      }
    } catch (err) {
      setReturnError(err.message || 'Failed to process return.');
    } finally {
      setProcessingReturn(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-burgundy-800/60 animate-pulse">
        Loading order dossier...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-12 text-center space-y-3">
        <h2 className="font-serif text-xl font-bold text-burgundy-900">Order Not Found</h2>
        <p className="text-xs text-burgundy-800/60">{error}</p>
        <Link
          to="/admin/orders"
          className="inline-block px-4 py-2 bg-burgundy-900 text-gold-300 rounded-xl text-xs font-semibold"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center space-x-1 text-xs text-burgundy-800/60 hover:text-burgundy-950 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Orders</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-900">
              Order #{order.orderNumber}
            </h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                order.orderStatus === 'Delivered'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : order.orderStatus === 'Cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gold-100 text-burgundy-950 font-semibold'
              }`}
            >
              {order.orderStatus}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowInvoiceModal(true)}
            className="px-4 py-2 bg-cream-100 hover:bg-cream-200 border border-burgundy-900/15 text-burgundy-900 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 text-gold-600" />
            <span>Print Invoice & Packing Slip</span>
          </button>

          <div className="text-right text-xs">
            <span className="text-burgundy-800/60 block">Placed on</span>
            <span className="font-semibold text-burgundy-900">{formatDate(order.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Visual Status Progress */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-burgundy-900/10 shadow-sm space-y-4">
        <h3 className="font-serif text-base font-bold text-burgundy-900">
          Delivery Fulfillment Lifecycle
        </h3>
        <OrderTimeline order={order} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Order Items & Customer Dossier */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer & Shipping Details */}
          <div className="bg-white rounded-3xl p-6 border border-burgundy-900/10 shadow-sm space-y-4 text-xs">
            <h3 className="font-serif text-base font-bold text-burgundy-900 border-b border-burgundy-900/10 pb-3">
              Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-burgundy-900">
                  <span className="font-bold text-sm">{order.customerName}</span>
                </div>
                <div className="flex items-center space-x-2 text-burgundy-800/80">
                  <Mail className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                  <a href={`mailto:${order.customerEmail}`} className="hover:underline">
                    {order.customerEmail}
                  </a>
                </div>
                <div className="flex items-center space-x-2 text-burgundy-800/80">
                  <Phone className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                  <a href={`tel:${order.customerPhone}`} className="hover:underline font-mono">
                    +91 {order.customerPhone}
                  </a>
                </div>
              </div>

              <div className="space-y-1.5 p-3.5 bg-cream-50 rounded-2xl border border-burgundy-900/10">
                <div className="flex items-center space-x-1.5 text-gold-700 font-bold uppercase text-[10px]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Shipping Address</span>
                </div>
                <p className="text-burgundy-900 font-medium">{order.shippingAddress}</p>
                <p className="text-burgundy-800/70">
                  {order.city}, {order.state} - <strong>{order.postalCode}</strong>
                </p>
                {order.notes && (
                  <p className="pt-2 text-burgundy-900/80 italic border-t border-burgundy-900/10">
                    "{order.notes}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-3xl border border-burgundy-900/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-burgundy-900/10">
              <h3 className="font-serif text-base font-bold text-burgundy-900">
                Purchased Candles ({order.items?.length || 0})
              </h3>
            </div>

            <div className="divide-y divide-burgundy-900/10 text-xs">
              {order.items?.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex items-center space-x-4">
                  <img
                    src={item.product?.imageUrl}
                    alt={item.product?.name}
                    className="w-16 h-16 object-cover rounded-2xl border border-gold-500/20 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif font-bold text-sm text-burgundy-950 truncate">
                      {item.product?.name || 'Artisanal Candle'}
                    </h4>
                    <p className="text-[11px] text-burgundy-800/60 mt-0.5">
                      Category: {item.product?.category || 'Scented Soy'} &bull; Scent: {item.product?.scentProfile}
                    </p>
                    <p className="text-[11px] text-burgundy-800/70 mt-1 font-medium">
                      Qty: {item.quantity} &times; {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-serif font-bold text-sm text-burgundy-900">
                      {formatPrice(item.totalPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="p-6 bg-cream-50/60 border-t border-burgundy-900/10 space-y-2 text-xs">
              <div className="flex justify-between text-burgundy-800/80">
                <span>Items Subtotal</span>
                <span className="font-semibold text-burgundy-950">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-burgundy-800/80">
                <span>Standard Delivery Fee</span>
                <span className="font-semibold text-burgundy-950">
                  {order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>Festive Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-burgundy-900/10 flex justify-between items-baseline text-sm">
                <span className="font-serif font-bold text-burgundy-950">Grand Total Payable</span>
                <span className="font-serif text-xl font-bold text-burgundy-900">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Status Logs History */}
          {order.statusLogs && order.statusLogs.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-burgundy-900/10 shadow-sm space-y-4 text-xs">
              <h3 className="font-serif text-base font-bold text-burgundy-900 border-b border-burgundy-900/10 pb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-gold-600" />
                <span>Status Change Audit History</span>
              </h3>
              <div className="space-y-2">
                {order.statusLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-cream-50 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-burgundy-950">{log.toStatus}</span>
                      {log.notes && <p className="text-[11px] text-burgundy-800/70 mt-0.5">{log.notes}</p>}
                      <span className="text-[10px] text-burgundy-800/50 block mt-0.5">Updated by: {log.updatedBy}</span>
                    </div>
                    <span className="text-burgundy-800/60 font-mono text-[11px]">{formatDate(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Actions & Security PIN Handover */}
        <div className="lg:col-span-5 space-y-6">
          {/* PIN Verification Handover Portal */}
          <div className="bg-burgundy-950 text-cream-50 rounded-3xl p-6 sm:p-7 border border-gold-500/40 shadow-luxury space-y-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-gold-400" />
              <h3 className="font-serif text-base font-bold text-gold-300">
                Doorstep Delivery PIN Verification
              </h3>
            </div>

            {order.orderStatus === 'Delivered' ? (
              <div className="p-4 bg-emerald-900/40 border border-emerald-500/40 rounded-2xl flex items-center space-x-2.5 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Order has already been verified and delivered on {formatDate(order.deliveredAt)}.
                </span>
              </div>
            ) : order.orderStatus === 'Cancelled' ? (
              <div className="p-3 bg-red-900/60 border border-red-500/40 rounded-xl text-xs text-red-200">
                This order is cancelled. PIN verification disabled.
              </div>
            ) : (
              <form onSubmit={handleVerifyDeliveryPin} className="space-y-3 text-xs">
                <p className="text-cream-200/80 leading-relaxed font-light">
                  To prevent unauthorized handoffs, ask the recipient for their 6-digit PIN. Once verified, the order is marked <strong>Delivered</strong> and payment is confirmed.
                </p>

                {pinError && (
                  <div className="p-2.5 bg-red-900/80 border border-red-500 text-red-200 rounded-lg text-[11px] flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}

                {pinSuccess && (
                  <div className="p-2.5 bg-emerald-900/80 border border-emerald-500 text-emerald-200 rounded-lg text-[11px] flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{pinSuccess}</span>
                  </div>
                )}

                <div className="flex space-x-2 pt-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={deliveryPin}
                    onChange={(e) => setDeliveryPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-Digit PIN"
                    className="flex-1 px-3.5 py-2.5 bg-burgundy-900 border border-gold-500/50 rounded-xl text-gold-300 text-center font-serif text-lg tracking-widest focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={pinVerifying || deliveryPin.length !== 6}
                    className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 disabled:bg-neutral-600 text-burgundy-950 font-serif font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
                  >
                    {pinVerifying ? 'Verifying...' : 'Verify & Deliver'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Delivery Personnel Assignment Card */}
          <div className="bg-white rounded-3xl p-6 border border-burgundy-900/10 shadow-sm space-y-4 text-xs">
            <div className="flex items-center space-x-2 border-b border-burgundy-900/10 pb-3">
              <Truck className="w-4 h-4 text-gold-600" />
              <h3 className="font-serif text-base font-bold text-burgundy-900">
                Delivery Rider Assignment
              </h3>
            </div>

            {assignMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl">
                {assignMessage}
              </div>
            )}

            <form onSubmit={handleAssignStaff} className="space-y-3">
              <div>
                <label className="block font-semibold text-burgundy-900 mb-1">
                  Assigned Delivery Agent / Courier
                </label>
                <select
                  value={assignedStaffId}
                  onChange={(e) => setAssignedStaffId(e.target.value)}
                  disabled={order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled'}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500 font-medium"
                >
                  <option value="">-- Unassigned (Store Dispatch) --</option>
                  {deliveryStaffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role} • {st.phone || st.email})
                    </option>
                  ))}
                </select>
                {order.assignedToName && (
                  <span className="text-[10px] text-emerald-800 font-semibold block mt-1">
                    Currently assigned to: {order.assignedToName} ({order.assignedToPhone || 'No direct phone'})
                  </span>
                )}
              </div>

              <div>
                <label className="block font-semibold text-burgundy-900 mb-1">
                  Courier / Logistics Fleet
                </label>
                <input
                  type="text"
                  value={deliveryPartner}
                  onChange={(e) => setDeliveryPartner(e.target.value)}
                  placeholder="e.g. DiGlow Sanctum Express, BlueDart, Delhivery"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <button
                type="submit"
                disabled={assigning || order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled'}
                className="w-full py-2.5 bg-gold-500 hover:bg-gold-400 disabled:bg-neutral-300 text-burgundy-950 font-serif font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
              >
                {assigning ? 'Assigning...' : 'Assign Delivery Agent'}
              </button>
            </form>
          </div>

          {/* Dispatch Status & Logistics Update */}
          <div className="bg-white rounded-3xl p-6 border border-burgundy-900/10 shadow-sm space-y-4 text-xs">
            <h3 className="font-serif text-base font-bold text-burgundy-900">
              Update Dispatch & Logistics
            </h3>

            {message && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl">
                {message}
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="block font-semibold text-burgundy-900 mb-1">Order Status</label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  disabled={order.orderStatus === 'Delivered' || order.orderStatus === 'Returned'}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500 font-medium"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Packed">Packed (Warehouse Ready)</option>
                  <option value="Packing">Packing</option>
                  <option value="Shipped">Shipped (Dispatched)</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Failed Delivery">Failed Delivery Attempt</option>
                  <option value="Cancelled">Cancelled (Auto-Restore Inventory)</option>
                  {order.orderStatus === 'Delivered' && <option value="Delivered">Delivered</option>}
                  {order.orderStatus === 'Returned' && <option value="Returned">Returned</option>}
                </select>
                <span className="text-[10px] text-burgundy-800/60 block mt-1">
                  * Note: "Delivered" requires entering customer's 6-digit delivery PIN in the security card above.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-burgundy-900 mb-1">
                  Air Waybill (AWB) / Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. DG-AWB-987654321IN"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-burgundy-900 mb-1">
                  Dispatch Notes
                </label>
                <input
                  type="text"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Special instructions or notes"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <button
                type="submit"
                disabled={updating || order.orderStatus === 'Delivered' || order.orderStatus === 'Returned'}
                className="w-full py-2.5 bg-burgundy-900 hover:bg-burgundy-950 disabled:bg-neutral-300 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
              >
                {updating ? 'Updating...' : 'Save Logistics & Status'}
              </button>
            </form>
          </div>

          {/* Warehouse Returns & Restock Card */}
          <div className="bg-white rounded-3xl p-6 border border-burgundy-900/10 shadow-sm space-y-4 text-xs">
            <div className="flex items-center space-x-2 border-b border-burgundy-900/10 pb-3">
              <RotateCcw className="w-4 h-4 text-gold-600" />
              <h3 className="font-serif text-base font-bold text-burgundy-900">
                Warehouse Return & Restock Disposition
              </h3>
            </div>

            {returnMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl">
                {returnMessage}
              </div>
            )}

            {returnError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-800 rounded-xl">
                {returnError}
              </div>
            )}

            {order.orderStatus === 'Returned' || order.isRestocked ? (
              <div className="p-4 bg-cream-50 border border-burgundy-900/15 rounded-2xl space-y-1">
                <span className="font-bold text-burgundy-950 block">
                  Return Processed ({order.returnStatus || 'Processed'})
                </span>
                <p className="text-burgundy-800/80">
                  {order.returnNotes || 'Items processed and double-restock protection active.'}
                </p>
                {order.returnedAt && (
                  <span className="text-[10px] text-burgundy-800/60 block font-mono">
                    Processed on: {formatDate(order.returnedAt)}
                  </span>
                )}
              </div>
            ) : ['Delivered', 'Failed Delivery', 'Shipped', 'Cancelled'].includes(order.orderStatus) ? (
              <form onSubmit={handleProcessReturn} className="space-y-3">
                <p className="text-burgundy-800/70 leading-relaxed">
                  Process customer returns or damaged goods with automatic inventory audit logs and double-restock prevention.
                </p>

                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">
                    Item Disposition
                  </label>
                  <select
                    value={returnDisposition}
                    onChange={(e) => setReturnDisposition(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 font-medium focus:outline-none"
                  >
                    <option value="RESTOCK_TO_INVENTORY">
                      Restock to Inventory (Undamaged, Resellable)
                    </option>
                    <option value="DAMAGED_WRITE_OFF">
                      Damaged Item Write-off (Jar cracked / Transit spoil)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-burgundy-900 mb-1">
                    Return Reason & QA Notes
                  </label>
                  <textarea
                    rows={2}
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="e.g. Customer returned intact in original velvet box / Transit vessel breakage"
                    className="w-full p-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={processingReturn}
                  className="w-full py-2.5 bg-burgundy-900 hover:bg-burgundy-950 disabled:bg-neutral-300 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
                >
                  {processingReturn ? 'Processing...' : 'Process Return & Update Audit Trail'}
                </button>
              </form>
            ) : (
              <p className="text-burgundy-800/60 italic">
                Return processing becomes available once an order has been shipped, delivered, or marked as a failed delivery attempt.
              </p>
            )}
          </div>
        </div>
      </div>

      {showInvoiceModal && (
        <InvoiceModal order={order} onClose={() => setShowInvoiceModal(false)} />
      )}
    </div>
  );
}
