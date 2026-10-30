import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Printer,
  PackageCheck,
  Flame,
  ArrowRight
} from 'lucide-react';
import { formatPrice, formatDate } from '../utils/formatters.js';
import { trackPurchase } from '../utils/analytics.js';

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { order, deliveryPin } = location.state || {};
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Avoid indexing order confirmation page
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    const prev = meta.content;
    meta.content = 'noindex, nofollow';

    // Track consent-appropriate purchase analytics event (deduplicated by orderNumber)
    if (order && order.orderNumber) {
      trackPurchase(order);
    }

    // Launch celebratory golden confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#B89326', '#4E0E1B', '#F4E9CB']
      });
    } catch (e) {
      // Graceful fallback
    }

    return () => {
      meta.content = prev || 'all';
    };
  }, [order]);

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-burgundy-900">No Order Found</h2>
        <p className="text-xs text-burgundy-800/70">
          We couldn't find active order details for this session. You can track your existing order using your phone number.
        </p>
        <Link
          to="/track"
          className="inline-block px-6 py-2.5 bg-burgundy-900 text-gold-300 rounded-full text-xs font-semibold hover:bg-burgundy-950 transition-colors"
        >
          Track My Order
        </Link>
      </div>
    );
  }

  const handleCopyPin = () => {
    if (deliveryPin) {
      navigator.clipboard.writeText(deliveryPin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Success Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-700 shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <span className="text-xs uppercase font-bold tracking-widest text-gold-600 block">
          Order Confirmed
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-burgundy-900">
          Thank You, {order.customerName}!
        </h1>
        <p className="text-xs sm:text-sm text-burgundy-800/70 max-w-lg mx-auto font-light">
          Your order has been received at our artisanal workshop. We are preparing your hand-poured candles with festive warmth.
        </p>
      </div>

      {/* CRITICAL FEATURE: 6-DIGIT DELIVERY PIN HIGHLIGHT BOX */}
      {deliveryPin && (
        <div className="bg-gradient-to-r from-burgundy-950 via-burgundy-900 to-burgundy-950 border-2 border-gold-500 rounded-3xl p-6 sm:p-8 text-cream-50 shadow-luxury space-y-4 text-center relative overflow-hidden">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gold-500/20 text-gold-300 text-xs font-semibold border border-gold-500/30">
            <ShieldCheck className="w-4 h-4 text-gold-400" />
            <span>Important &bull; Doorstep Verification Code</span>
          </div>

          <div className="space-y-1">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-cream-50">
              Your 6-Digit Delivery PIN
            </h3>
            <p className="text-xs text-cream-200/80 max-w-md mx-auto">
              Please save this PIN. For your security, share it with the DiGlow courier partner upon delivery to unlock your parcel.
            </p>
          </div>

          {/* Large Digit Display */}
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 pt-2">
            {deliveryPin.split('').map((char, index) => (
              <div
                key={index}
                className="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-gold-400/50 flex items-center justify-center font-serif text-2xl sm:text-3xl font-extrabold text-gold-400 shadow-inner"
              >
                {char}
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleCopyPin}
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-gold-500 hover:bg-gold-400 text-burgundy-950 font-bold text-xs transition-colors shadow-sm"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'PIN Copied to Clipboard!' : 'Copy Delivery PIN'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Order Details Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-burgundy-900/10 shadow-sm space-y-6">
        
        {/* Meta Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-burgundy-900/10 gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gold-600 block">
              Order Reference
            </span>
            <span className="font-serif text-xl font-bold text-burgundy-900">
              {order.orderNumber}
            </span>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-burgundy-800/60 block">
              Order Date
            </span>
            <span className="text-xs font-semibold text-burgundy-950">
              {formatDate(order.createdAt)}
            </span>
          </div>
        </div>

        {/* Shipping and Payment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-burgundy-900/10 text-xs">
          <div>
            <h4 className="font-serif font-bold text-sm text-burgundy-900 mb-2">
              Delivery Address
            </h4>
            <div className="text-burgundy-950/80 space-y-0.5">
              <p className="font-semibold text-burgundy-900">{order.customerName}</p>
              <p>{order.shippingAddress}</p>
              <p>{order.city}, {order.state} - {order.postalCode}</p>
              <p className="pt-1 text-burgundy-900 font-medium">Phone: +91 {order.customerPhone}</p>
              <p className="text-burgundy-900/70">Email: {order.customerEmail}</p>
            </div>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm text-burgundy-900 mb-2">
              Payment & Status
            </h4>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-burgundy-800/70">Payment Method:</span>
                <span className="font-bold text-burgundy-950">Cash on Delivery (COD)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-burgundy-800/70">Payment Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-amber-100 text-amber-800">
                  {order.paymentStatus} (Collect at doorstep)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-burgundy-800/70">Current Order Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-burgundy-100 text-burgundy-900">
                  {order.orderStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ordered Items Table */}
        <div className="space-y-4">
          <h4 className="font-serif font-bold text-sm text-burgundy-900">
            Items Handcrafted for You
          </h4>
          <div className="divide-y divide-burgundy-900/10">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {item.product?.imageUrl && (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded-lg border border-gold-500/20 shrink-0"
                    />
                  )}
                  <div>
                    <h5 className="font-serif text-xs font-bold text-burgundy-950">
                      {item.product?.name || 'Artisanal Candle'}
                    </h5>
                    <span className="text-[11px] text-burgundy-800/60">
                      Qty: {item.quantity} &times; {formatPrice(item.unitPrice)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-serif text-xs font-bold text-burgundy-900">
                    {formatPrice(item.totalPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="pt-4 border-t border-burgundy-900/10 space-y-2 text-xs">
          <div className="flex justify-between text-burgundy-800/80">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-burgundy-800/80">
            <span>Delivery Fee</span>
            <span>{order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Festive Discount</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="pt-3 border-t border-burgundy-900/10 flex justify-between items-baseline">
            <span className="font-serif text-base font-bold text-burgundy-950">Total Payable</span>
            <span className="font-serif text-2xl font-bold text-burgundy-900">
              {formatPrice(order.total)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-burgundy-900/10 flex flex-wrap gap-4 items-center justify-between">
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 border border-burgundy-900/20 hover:border-burgundy-900 text-burgundy-900 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice Receipt</span>
          </button>

          <div className="flex items-center space-x-3">
            <Link
              to="/track"
              className="px-6 py-2.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-xl flex items-center space-x-2 transition-colors shadow-sm"
            >
              <PackageCheck className="w-4 h-4 text-gold-400" />
              <span>Track Live Delivery</span>
            </Link>

            <Link
              to="/shop"
              className="px-6 py-2.5 bg-cream-100 hover:bg-cream-200 text-burgundy-900 font-semibold text-xs rounded-xl transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
