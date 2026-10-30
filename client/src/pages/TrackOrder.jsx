import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  PackageCheck,
  ShieldCheck,
  Clock,
  MapPin,
  AlertCircle,
  Truck,
  History,
  CheckCircle2
} from 'lucide-react';
import { api } from '../utils/api.js';
import OrderTimeline from '../components/OrderTimeline.jsx';
import { formatPrice, formatDate } from '../utils/formatters.js';

export default function TrackOrder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrderNumber = searchParams.get('orderNumber') || searchParams.get('order') || '';
  const initialPhone = searchParams.get('phone') || '';

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState(initialPhone);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeTrack = async (num, ph) => {
    if (!num || !ph) {
      setError('Please provide both Order Number and Registered Phone Number.');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await api.trackOrder(num.trim(), ph.trim());
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        setError(res.message || 'No order found with these credentials.');
      }
    } catch (err) {
      setError(err.message || 'Failed to track order. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber && initialPhone) {
      executeTrack(initialOrderNumber, initialPhone);
    }
  }, [initialOrderNumber, initialPhone]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ orderNumber: orderNumber.trim(), phone: phone.trim() });
    executeTrack(orderNumber, phone);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gold-100 text-gold-700 text-xs font-bold uppercase tracking-wider">
          <Truck className="w-3.5 h-3.5" />
          <span>Real-time Indian Dispatch</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-burgundy-900">
          Track Your DiGlow Candle Order
        </h1>
        <p className="text-xs sm:text-sm text-burgundy-800/70">
          Enter your unique order number and the phone number used at checkout to view current status and timeline.
        </p>
      </div>

      {/* Lookup Card Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-burgundy-900/10 shadow-luxury">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold text-burgundy-900 mb-1">
              Order Number *
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. DIG-2026-8K4P9"
              required
              className="w-full px-4 py-3 bg-cream-50 border border-burgundy-900/15 rounded-xl text-xs uppercase font-medium focus:outline-none focus:ring-1 focus:ring-gold-500 text-burgundy-950 placeholder:normal-case"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-burgundy-900 mb-1">
              Registered Phone *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              required
              maxLength={10}
              className="w-full px-4 py-3 bg-cream-50 border border-burgundy-900/15 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 text-burgundy-950"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-burgundy-900 hover:bg-burgundy-950 disabled:bg-neutral-400 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-gold-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Track</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Tracking Result View */}
      {order && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-burgundy-900/10 shadow-luxury space-y-8 animate-fadeIn">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-burgundy-900/10 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gold-600 block">
                Order Tracking
              </span>
              <h2 className="font-serif text-2xl font-bold text-burgundy-900">
                {order.orderNumber}
              </h2>
              <span className="text-xs text-burgundy-800/60 block mt-0.5">
                Placed on {formatDate(order.createdAt)}
              </span>
            </div>

            <div className="flex flex-col sm:items-end gap-1.5">
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-burgundy-800/60 block">
                  Current Status
                </span>
                <span className="inline-block mt-1 px-3 py-1 bg-burgundy-900 text-gold-300 text-xs font-bold rounded-full uppercase tracking-wider">
                  {order.orderStatus}
                </span>
              </div>
              <div className="text-left sm:text-right text-[11px] text-burgundy-900/80 font-medium">
                Payment: <strong className="font-semibold text-burgundy-950">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}</strong> •{' '}
                <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                  order.paymentStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : order.paymentStatus === 'Refunded'
                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div>
            <h3 className="font-serif text-lg font-bold text-burgundy-900 mb-2">
              Dispatch & Delivery Progress
            </h3>
            <OrderTimeline order={order} />
          </div>

          {/* Logistics Assignment Information if assigned */}
          {(order.deliveryPartner || order.trackingNumber || order.dispatchedAt || order.estimatedDelivery) && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-2 text-xs text-purple-950">
              <div className="flex items-start space-x-3">
                <Truck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="block font-serif text-sm">
                    {order.deliveryPartner ? `Carrier: ${order.deliveryPartner}` : 'Artisanal Dispatch Fleet'}
                  </strong>
                  {order.trackingNumber && (
                    <span className="block mt-0.5">
                      Air Waybill (AWB) / Tracking No: <strong className="font-mono">{order.trackingNumber}</strong>
                    </span>
                  )}
                  <div className="flex flex-wrap gap-4 mt-1.5 text-[11px] text-purple-900/80">
                    {order.dispatchedAt && (
                      <span>Dispatched On: <strong>{formatDate(order.dispatchedAt)}</strong></span>
                    )}
                    {order.estimatedDelivery && (
                      <span>Estimated Arrival: <strong>{formatDate(order.estimatedDelivery)}</strong></span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security PIN Reminder for COD */}
          {order.paymentMethod === 'COD' && order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && (
            <div className="p-4 bg-gold-100/70 border border-gold-300 rounded-2xl flex items-start space-x-3 text-xs text-burgundy-900">
              <ShieldCheck className="w-5 h-5 text-gold-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-serif text-sm">Doorstep Security Check</strong>
                <span>
                  When our courier partner arrives with your package, share your secret 6-digit delivery PIN generated at checkout to verify and receive your parcel.
                </span>
              </div>
            </div>
          )}

          {/* Status History Logs */}
          {order.statusLogs && order.statusLogs.length > 0 && (
            <div className="pt-4 border-t border-burgundy-900/10">
              <h4 className="font-serif font-bold text-sm text-burgundy-900 mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-gold-600" />
                <span>Activity & Status History</span>
              </h4>
              <div className="space-y-2">
                {order.statusLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-cream-50 border border-burgundy-900/10 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-burgundy-950">{log.toStatus}</span>
                      {log.notes && <p className="text-burgundy-800/70 text-[11px] mt-0.5">{log.notes}</p>}
                    </div>
                    <span className="text-burgundy-800/50 text-[11px] shrink-0 ml-4">{formatDate(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items & Address Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-burgundy-900/10 text-xs">
            <div>
              <h4 className="font-serif font-bold text-sm text-burgundy-900 mb-3">
                Items in This Package
              </h4>
              <div className="divide-y divide-burgundy-900/10">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      {item.product?.imageUrl && (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-10 h-10 object-cover rounded-lg border border-gold-500/20"
                        />
                      )}
                      <div>
                        <span className="font-serif font-bold text-burgundy-950 block">
                          {item.product?.name || 'Candle'}
                        </span>
                        <span className="text-burgundy-800/60 text-[11px]">
                          Qty: {item.quantity} &times; {formatPrice(item.unitPrice)}
                        </span>
                      </div>
                    </div>
                    <span className="font-serif font-bold text-burgundy-900">
                      {formatPrice(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-serif font-bold text-sm text-burgundy-900 mb-3">
                Destination Address
              </h4>
              <div className="p-4 bg-cream-50 rounded-2xl border border-burgundy-900/10 space-y-1 text-burgundy-950/80">
                <p className="font-bold text-burgundy-900">{order.customerName}</p>
                <p>{order.shippingAddress}</p>
                <p>{order.city}, {order.state} - {order.postalCode}</p>
                <p className="pt-1 text-burgundy-900">Contact: +91 {order.customerPhone}</p>
                <p className="text-burgundy-900/70">
                  Payment Method: <strong>{order.paymentMethod}</strong> ({order.paymentStatus}) &bull; Total: {formatPrice(order.total)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
