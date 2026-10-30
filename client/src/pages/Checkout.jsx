import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  Flame,
  CheckCircle2,
  Lock,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  CreditCard,
  Banknote,
  MapPin,
  Check,
  Tag,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  X
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import { formatPrice } from '../utils/formatters.js';
import { trackBeginCheckout } from '../utils/analytics.js';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi NCR', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function Checkout() {
  const { cartItems, cartSubtotal, deliveryFee, clearCart, sessionToken, recoveryToken, syncCartWithServer } = useCart();
  const { customer, isCustomerAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' or 'RAZORPAY'
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Dynamic Coupon State
  const [couponInput, setCouponInput] = useState(location.state?.couponCode || '');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const [formData, setFormData] = useState({
    customerName: customer?.name || '',
    customerEmail: customer?.email || '',
    customerPhone: customer?.phone || '',
    shippingAddress: '',
    city: '',
    state: 'Delhi NCR',
    postalCode: '',
    notes: ''
  });

  const [checkoutIdempotencyKey] = useState(
    () => `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // SEO Defense: Prevent search engines from indexing private checkout screens
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    const prev = meta.content;
    meta.content = 'noindex, nofollow';

    // Track consent-appropriate begin_checkout event
    if (cartItems.length > 0) {
      trackBeginCheckout(cartItems, cartSubtotal + deliveryFee, location.state?.couponCode);
    }

    return () => {
      meta.content = prev || 'all';
    };
  }, []);

  // Load saved customer addresses if authenticated
  useEffect(() => {
    if (isCustomerAuthenticated) {
      api.getCustomerAddresses()
        .then((res) => {
          if (res.success && res.addresses.length > 0) {
            setSavedAddresses(res.addresses);
            const defaultAddr = res.addresses.find((a) => a.isDefault) || res.addresses[0];
            if (defaultAddr) {
              applyAddress(defaultAddr);
            }
          }
        })
        .catch(() => {});
    }
  }, [isCustomerAuthenticated]);

  // Auto-validate coupon if passed via navigation state
  useEffect(() => {
    if (location.state?.couponCode) {
      applyCouponCode(location.state.couponCode);
    }
  }, [location.state?.couponCode]);

  const applyCouponCode = async (codeToApply) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await api.validateCoupon(code, cartSubtotal);
      if (res.success && res.coupon) {
        setAppliedCoupon({
          code: res.coupon.code,
          discount: res.coupon.discountAmount,
          discountType: res.coupon.discountType,
          discountValue: res.coupon.discountValue
        });
        setCouponInput(res.coupon.code);
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid or expired promotional code');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const applyAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setFormData((prev) => ({
      ...prev,
      customerName: addr.name || prev.customerName,
      customerPhone: addr.phone || prev.customerPhone,
      shippingAddress: addr.street,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode
    }));
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-burgundy-900">Your Cart is Empty</h2>
        <p className="text-xs text-burgundy-800/70">
          Please add handcrafted candles to your bag before checking out.
        </p>
        <Link
          to="/shop"
          className="inline-block px-6 py-2.5 bg-burgundy-900 text-gold-300 rounded-full text-xs font-semibold hover:bg-burgundy-950 transition-colors"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  const validate = () => {
    const errs = {};
    if (!formData.customerName.trim()) errs.customerName = 'Please enter your full name';
    if (!formData.customerEmail.trim() || !/^\S+@\S+\.\S+$/.test(formData.customerEmail)) {
      errs.customerEmail = 'Please provide a valid email address';
    }
    const cleanPhone = formData.customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      errs.customerPhone = 'Please provide a valid 10-digit mobile number';
    }
    if (!formData.shippingAddress.trim()) errs.shippingAddress = 'Complete street address is required';
    if (!formData.city.trim()) errs.city = 'City is required';
    if (!formData.postalCode.trim() || !/^\d{6}$/.test(formData.postalCode.trim())) {
      errs.postalCode = 'Please enter a valid 6-digit PIN code';
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const nextData = { ...prev, [name]: value };
      if (['customerEmail', 'customerName', 'customerPhone'].includes(name) && value.length > 3) {
        syncCartWithServer(nextData);
      }
      return nextData;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        sessionToken,
        recoveryToken,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        shippingAddress: formData.shippingAddress,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        notes: formData.notes,
        paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
        idempotencyKey: checkoutIdempotencyKey,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          variantId: item.variant?.id || undefined,
          quantity: item.quantity
        }))
      };

      const res = await api.checkout(payload);

      if (res.success && res.order) {
        // Complete Cash on Delivery order
        clearCart();
        navigate('/order-success', {
          state: {
            order: res.order,
            deliveryPin: res.deliveryPin
          },
          replace: true
        });
      } else {
        setServerError(res.message || 'Unable to place order. Please check item stock.');
      }
    } catch (err) {
      setServerError(err.message || 'An error occurred during checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const estimatedTotal = Math.max(0, cartSubtotal + deliveryFee - discountAmount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Back button & Delivery estimate banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          to="/cart"
          className="inline-flex items-center space-x-1.5 text-xs text-burgundy-800/70 hover:text-burgundy-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bag</span>
        </Link>
        <div className="flex items-center space-x-2 text-[11px] text-burgundy-900/80 bg-gold-50/80 border border-gold-400/40 px-3 py-1.5 rounded-full">
          <Truck className="w-3.5 h-3.5 text-gold-600" />
          <span>Dispatched within 24h &bull; Express delivery in 3-5 business days across India</span>
        </div>
      </div>

      {/* Mobile Collapsible Order Summary */}
      <div className="lg:hidden bg-cream-50 border border-gold-500/30 rounded-2xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          className="w-full p-4 flex items-center justify-between text-xs font-semibold text-burgundy-900 bg-gold-100/40 hover:bg-gold-100/70 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-gold-600" />
            <span>
              {mobileSummaryOpen ? 'Hide' : 'Review'} Order Items ({cartItems.length})
            </span>
            {mobileSummaryOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="font-serif font-bold text-sm text-burgundy-950">
            {formatPrice(estimatedTotal)}
          </span>
        </button>

        {mobileSummaryOpen && (
          <div className="p-4 space-y-3 border-t border-gold-500/20 divide-y divide-burgundy-900/10">
            {cartItems.map((item) => (
              <div key={item.product.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 truncate pr-2">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-10 h-10 object-cover rounded-lg border border-gold-500/30 shrink-0"
                  />
                  <div className="truncate">
                    <p className="font-serif font-bold text-burgundy-950 truncate">{item.product.name}</p>
                    <p className="text-[10px] text-burgundy-800/70">Qty {item.quantity}</p>
                  </div>
                </div>
                <span className="font-serif font-bold text-burgundy-900 text-xs shrink-0">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Delivery Form & Payment Choice */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-burgundy-900/10 shadow-luxury space-y-6">
          <div className="border-b border-burgundy-900/10 pb-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-gold-600 block">
                Doorstep Shipping
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-900">
                Customer & Delivery Details
              </h1>
            </div>
            {!isCustomerAuthenticated && (
              <Link
                to="/login"
                state={{ from: location }}
                className="text-xs font-semibold text-gold-700 hover:text-gold-900 underline"
              >
                Sign In for Saved Addresses
              </Link>
            )}
          </div>

          {serverError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Saved Addresses quick-picker */}
          {savedAddresses.length > 0 && (
            <div className="space-y-2 pb-2">
              <label className="block text-xs font-semibold text-burgundy-900">
                Deliver to a Saved Destination:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => applyAddress(addr)}
                    className={`text-left p-3 rounded-xl border text-xs transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-gold-500 bg-gold-50/50 ring-1 ring-gold-500/30'
                        : 'border-burgundy-900/15 hover:border-gold-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-burgundy-950 mb-1">
                      <span>{addr.label}</span>
                      {selectedAddressId === addr.id && (
                        <Check className="w-3.5 h-3.5 text-gold-600" />
                      )}
                    </div>
                    <p className="text-burgundy-800/80 truncate">{addr.street}</p>
                    <p className="text-burgundy-800/70 text-[11px]">
                      {addr.city}, {addr.postalCode}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-burgundy-900 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="Aarav Sharma"
                className={`w-full px-4 py-3 bg-cream-50 border rounded-xl text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                  errors.customerName ? 'border-red-400' : 'border-burgundy-900/15'
                }`}
              />
              {errors.customerName && (
                <p className="text-[11px] text-red-600 mt-1">{errors.customerName}</p>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-burgundy-900 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  placeholder="aarav@example.com"
                  className={`w-full px-4 py-3 bg-cream-50 border rounded-xl text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    errors.customerEmail ? 'border-red-400' : 'border-burgundy-900/15'
                  }`}
                />
                {errors.customerEmail && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.customerEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-burgundy-900 mb-1">
                  10-Digit Phone * (Used for Delivery Tracking)
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  maxLength={10}
                  className={`w-full px-4 py-3 bg-cream-50 border rounded-xl text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    errors.customerPhone ? 'border-red-400' : 'border-burgundy-900/15'
                  }`}
                />
                {errors.customerPhone && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.customerPhone}</p>
                )}
              </div>
            </div>

            {/* Street Address */}
            <div>
              <label className="block text-xs font-semibold text-burgundy-900 mb-1">
                Street Address, Flat / Villa No. *
              </label>
              <input
                type="text"
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleChange}
                placeholder="Flat 402, Royal Palms, Heritage Road"
                className={`w-full px-4 py-3 bg-cream-50 border rounded-xl text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                  errors.shippingAddress ? 'border-red-400' : 'border-burgundy-900/15'
                }`}
              />
              {errors.shippingAddress && (
                <p className="text-[11px] text-red-600 mt-1">{errors.shippingAddress}</p>
              )}
            </div>

            {/* City, State, PIN Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-burgundy-900 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Jaipur"
                  className={`w-full px-4 py-3 bg-cream-50 border rounded-xl text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    errors.city ? 'border-red-400' : 'border-burgundy-900/15'
                  }`}
                />
                {errors.city && <p className="text-[11px] text-red-600 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-burgundy-900 mb-1">
                  State *
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-cream-50 border border-burgundy-900/15 rounded-xl text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-burgundy-900 mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="302001"
                  maxLength={6}
                  className={`w-full px-4 py-3 bg-cream-50 border rounded-xl text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    errors.postalCode ? 'border-red-400' : 'border-burgundy-900/15'
                  }`}
                />
                {errors.postalCode && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.postalCode}</p>
                )}
              </div>
            </div>

            {/* Gift Message / Special Notes */}
            <div>
              <label className="block text-xs font-semibold text-burgundy-900 mb-1">
                Gift Message / Special Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Include a festive Diwali handwritten note, leave at door, etc."
                className="w-full px-4 py-3 bg-cream-50 border border-burgundy-900/15 rounded-xl text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            {/* Payment Method Selector - COD Only */}
            <div className="pt-4 border-t border-burgundy-900/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-burgundy-900">
                  Payment Method *
                </label>
                <span className="text-[11px] font-bold text-gold-700 bg-gold-500/15 border border-gold-500/30 px-2.5 py-0.5 rounded-full">
                  Cash on Delivery Only
                </span>
              </div>

              {/* Sole Option: Cash on Delivery */}
              <div className="p-4 rounded-2xl border bg-burgundy-950 text-cream-50 border-gold-500 ring-1 ring-gold-500/40 shadow-md flex items-start space-x-3.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border bg-gold-500 border-gold-400 text-burgundy-950">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Banknote className="w-4 h-4 text-gold-400" />
                    <span className="font-serif font-bold text-sm">
                      Cash on Delivery (Doorstep Payment)
                    </span>
                    <span className="px-2 py-0.2 text-[10px] font-bold uppercase rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/30">
                      PIN Verified
                    </span>
                  </div>
                  <p className="text-xs text-cream-100/80 leading-relaxed font-light">
                    Pay securely at your doorstep via cash or delivery executive's UPI QR code upon parcel arrival. A confidential <strong>6-digit delivery PIN</strong> will be issued to protect your parcel handover. Online card payment is disabled for this launch.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-burgundy-900 hover:bg-burgundy-950 disabled:bg-neutral-400 text-gold-300 font-serif font-bold text-sm tracking-wider uppercase rounded-2xl shadow-glow hover:shadow-glow-lg transition-all flex items-center justify-center space-x-2 mt-4"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-gold-300 border-t-transparent rounded-full animate-spin" />
                  <span>Securing Order &bull; Processing...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-gold-400" />
                  <span>
                    Confirm Cash on Delivery Order • {formatPrice(estimatedTotal)}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Order Items Summary */}
        <div className="lg:col-span-5 bg-cream-50 rounded-3xl p-6 sm:p-8 border border-gold-500/30 space-y-6">
          <div className="border-b border-burgundy-900/10 pb-4">
            <h3 className="font-serif text-xl font-bold text-burgundy-900">
              Order Review ({cartItems.length} items)
            </h3>
          </div>

          {/* Items breakdown */}
          <div className="divide-y divide-burgundy-900/10 max-h-72 overflow-y-auto pr-1">
            {cartItems.map((item) => {
              const itemKey = item.variant ? `${item.product.id}_${item.variant.id || item.variant.sku}` : item.product.id;
              const unitPrice = item.variant?.price ?? item.product.price;
              const itemImg = item.variant?.imageUrl || item.product.imageUrl;
              return (
                <div key={itemKey} className="py-3 first:pt-0 last:pb-0 flex items-center space-x-3">
                  <img
                    src={itemImg}
                    alt={item.product.name}
                    className="w-14 h-14 object-cover rounded-xl border border-gold-500/30 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-xs font-bold text-burgundy-950 truncate">
                      {item.product.name}
                    </h4>
                    {item.variant && (
                      <span className="inline-block px-1.5 py-0.5 rounded bg-gold-100 text-[10px] font-medium text-burgundy-900 border border-gold-300 mr-2">
                        {item.variant.title || item.variant.size || item.variant.packaging}
                      </span>
                    )}
                    <span className="text-[11px] text-burgundy-800/70 block sm:inline">
                      Qty: {item.quantity} &times; {formatPrice(unitPrice)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-serif text-xs font-bold text-burgundy-900">
                      {formatPrice(unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Promo / Coupon Box */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-burgundy-900 mb-1.5">
              Promotional or Gift Coupon
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyCouponCode();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="e.g. FESTIVE10 or DIWALI20"
                disabled={appliedCoupon !== null}
                className="flex-1 px-3 py-2 bg-white border border-burgundy-900/15 rounded-xl text-xs uppercase font-medium focus:outline-none focus:ring-1 focus:ring-gold-500 text-burgundy-950 placeholder:normal-case disabled:bg-cream-100"
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={couponLoading || !couponInput.trim()}
                  className="px-4 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
                >
                  {couponLoading ? 'Checking...' : 'Apply'}
                </button>
              )}
            </form>
            {couponError && <p className="text-[11px] text-red-600 mt-1">{couponError}</p>}
            {appliedCoupon && (
              <p className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>
                  Code <strong>{appliedCoupon.code}</strong> applied &bull; Saved{' '}
                  {formatPrice(appliedCoupon.discount)}
                </span>
              </p>
            )}
          </div>

          {/* Pricing calculations */}
          <div className="space-y-2.5 pt-4 border-t border-burgundy-900/10 text-xs">
            <div className="flex justify-between text-burgundy-800/80">
              <span>Subtotal</span>
              <span className="font-semibold text-burgundy-950">{formatPrice(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-burgundy-800/80">
              <span>Delivery Fee</span>
              <span className="font-semibold text-burgundy-950">
                {deliveryFee === 0 ? (
                  <span className="text-emerald-700 font-bold uppercase">Free</span>
                ) : (
                  formatPrice(deliveryFee)
                )}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount ({appliedCoupon?.code})</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-burgundy-900/10 flex justify-between items-baseline">
              <span className="font-serif text-base font-bold text-burgundy-950">Total Amount Due</span>
              <span className="font-serif text-2xl font-bold text-burgundy-900">
                {formatPrice(estimatedTotal)}
              </span>
            </div>
          </div>

          {/* Guarantee Badges & Shipping / Refund Policies */}
          <div className="pt-4 border-t border-burgundy-900/10 space-y-2.5 text-xs text-burgundy-800/80">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-gold-600 shrink-0" />
              <span>Ships in 24-48 hrs &bull; 3-5 business days delivery across India</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-gold-600 shrink-0" />
              <span>Free instant cancellation before courier dispatch with 100% refund</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-gold-600 shrink-0" />
              <span>
                Secret 6-Digit PIN generated upon confirmation for courier verification
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
