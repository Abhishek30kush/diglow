import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Tag,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { api } from '../utils/api.js';
import { formatPrice } from '../utils/formatters.js';

export default function CartPage() {
  const [searchParams] = useSearchParams();
  const recoveryToken = searchParams.get('recovery_token');

  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    deliveryFee,
    freeDeliveryProgress,
    remainingForFreeDelivery,
    getCartItemKey,
    restoreCart
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState(null);
  const [restoringCart, setRestoringCart] = useState(Boolean(recoveryToken));
  const navigate = useNavigate();

  // Restore cart if user followed recovery link (Phase 13)
  useEffect(() => {
    if (!recoveryToken) return;

    let isMounted = true;
    async function restoreAbandonedCart() {
      setRestoringCart(true);
      try {
        const res = await api.recoverCart(recoveryToken);
        if (isMounted && res.success && res.cart) {
          restoreCart(res.cart.items, recoveryToken);
          setRecoveryNotice({
            type: 'success',
            title: 'Welcome Back to DiGlow Sanctuary',
            message: 'Your artisanal soy candle selection has been faithfully restored to your bag.',
            unavailable: res.cart.unavailableItems || []
          });
        }
      } catch (err) {
        if (isMounted) {
          setRecoveryNotice({
            type: 'error',
            title: 'Recovery Link Notice',
            message: err.message || 'This recovery link has expired or has already completed. Your current items are preserved.'
          });
        }
      } finally {
        if (isMounted) setRestoringCart(false);
      }
    }

    restoreAbandonedCart();
    return () => {
      isMounted = false;
    };
  }, [recoveryToken, restoreCart]);

  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    const prev = meta.content;
    meta.content = 'noindex, nofollow';

    return () => {
      meta.content = prev || 'all';
    };
  }, []);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    try {
      const res = await api.validateCoupon(code, cartSubtotal);
      if (res.success && res.coupon) {
        setAppliedCoupon({
          code: res.coupon.code,
          discount: res.coupon.discountAmount,
          discountType: res.coupon.discountType,
          discountValue: res.coupon.discountValue
        });
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid or expired coupon code');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const grandTotal = Math.max(0, cartSubtotal + deliveryFee - discountAmount);

  if (restoringCart) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 border-4 border-gold-300 border-t-burgundy-900 rounded-full animate-spin mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-burgundy-900">Restoring Your Candle Selection...</h2>
        <p className="text-xs text-burgundy-800/70">Connecting with the DiGlow sanctuary workshop.</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        {recoveryNotice && (
          <div className="max-w-md mx-auto mb-6 p-4 rounded-xl border bg-amber-50 border-amber-300 text-amber-900 text-xs sm:text-sm text-left flex items-start space-x-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{recoveryNotice.title}</p>
              <p className="mt-0.5 opacity-90">{recoveryNotice.message}</p>
            </div>
          </div>
        )}
        <div className="w-20 h-20 rounded-full bg-gold-100 border border-gold-300 flex items-center justify-center mx-auto text-burgundy-900">
          <ShoppingBag className="w-10 h-10 text-gold-600" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-burgundy-900">Your Luxury Bag is Empty</h2>
        <p className="text-xs sm:text-sm text-burgundy-800/70 max-w-sm mx-auto font-light">
          No artisanal candles in your cart yet. Discover our celebratory fragrances hand-poured for your home.
        </p>
        <Link
          to="/shop"
          className="inline-block mt-4 px-8 py-3.5 bg-burgundy-900 text-gold-300 rounded-full font-serif font-bold text-sm tracking-wider uppercase hover:bg-burgundy-950 transition-colors shadow-glow"
        >
          Explore Festive Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Recovery Restoration Banner */}
      {recoveryNotice && (
        <div
          className={`p-4 rounded-2xl border flex items-start space-x-3 transition-all ${
            recoveryNotice.type === 'success'
              ? 'bg-gold-50/90 border-gold-400 text-burgundy-950 shadow-sm'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {recoveryNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-gold-600 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 text-xs sm:text-sm">
            <h4 className="font-serif font-bold text-burgundy-900">{recoveryNotice.title}</h4>
            <p className="mt-0.5 opacity-90">{recoveryNotice.message}</p>
            {recoveryNotice.unavailable?.length > 0 && (
              <p className="mt-1 text-[11px] text-amber-800 font-medium">
                Note: Some items or variants were adjusted due to updated workshop inventory.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <Link
          to="/shop"
          className="inline-flex items-center space-x-1.5 text-xs text-burgundy-800/70 hover:text-burgundy-950 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-burgundy-900">
          Shopping Bag ({cartItems.length} items)
        </h1>
      </div>

      {/* Free Delivery Bar */}
      <div className="p-4 bg-gold-100/70 border border-gold-300 rounded-2xl">
        <div className="flex items-center justify-between text-xs text-burgundy-900 font-semibold mb-2">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-gold-600" />
            {remainingForFreeDelivery > 0 ? (
              <>Add <strong>{formatPrice(remainingForFreeDelivery)}</strong> more to enjoy <strong>Free Luxury Shipping</strong></>
            ) : (
              <span className="text-emerald-800">You unlocked Free Express Indian Shipping!</span>
            )}
          </span>
          <span>{freeDeliveryProgress}%</span>
        </div>
        <div className="w-full h-2 bg-cream-300 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full transition-all duration-300"
            style={{ width: `${freeDeliveryProgress}%` }}
          />
        </div>
      </div>

      {/* Cart Items Grid & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Items List */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-burgundy-900/10 shadow-sm space-y-6">
          <div className="divide-y divide-burgundy-900/10">
            {cartItems.map((item) => {
              const itemKey = getCartItemKey(item);
              const unitPrice = item.variant?.price ?? item.product.price;
              const maxStock = item.variant ? (item.variant.stock ?? item.product.stock) : item.product.stock;
              const isUnavailable = maxStock <= 0;

              return (
                <div key={itemKey} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-5">
                  <img
                    src={item.variant?.imageUrl || item.product.imageUrl}
                    alt={item.product.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border border-gold-500/30 shrink-0"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gold-600">
                          {item.product.category}
                        </span>
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="font-serif text-lg font-bold text-burgundy-950 hover:text-gold-600 transition-colors block"
                        >
                          {item.product.name}
                        </Link>

                        {/* Variant Badge */}
                        {item.variant && (
                          <div className="mt-1">
                            <span className="inline-flex items-center text-xs font-semibold text-burgundy-900 bg-gold-100/90 px-2.5 py-0.5 rounded-md border border-gold-300/70">
                              {item.variant.title}
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-burgundy-800/70 mt-1">
                          {item.product.scentProfile}
                        </p>

                        {isUnavailable && (
                          <span className="text-xs font-bold text-amber-700 block mt-1">
                            ⚠️ This candle variant is currently out of stock.
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(itemKey)}
                        className="p-2 text-burgundy-900/40 hover:text-red-600 transition-colors"
                        title="Remove candle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-burgundy-900/20 rounded-full bg-cream-50 px-3 py-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                          className="p-1 text-burgundy-900 hover:text-gold-600"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-burgundy-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                          disabled={item.quantity >= maxStock}
                          className="p-1 text-burgundy-900 hover:text-gold-600 disabled:opacity-30"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Unit & Line Total */}
                      <div className="text-right">
                        <span className="text-[11px] text-burgundy-800/60 block">
                          {formatPrice(unitPrice)} each
                        </span>
                        <span className="font-serif text-lg font-bold text-burgundy-900">
                          {formatPrice(unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-burgundy-900/10 shadow-luxury space-y-6">
          <h3 className="font-serif text-xl font-bold text-burgundy-900 border-b border-burgundy-900/10 pb-4">
            Order Summary
          </h3>

          {/* Coupon Code Input */}
          <div>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Discount code (e.g. FESTIVE10)"
                className="flex-1 px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-xs uppercase font-medium focus:outline-none focus:ring-1 focus:ring-gold-500 text-burgundy-950 placeholder:normal-case"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-burgundy-900 text-gold-300 font-semibold text-xs rounded-xl hover:bg-burgundy-950 transition-colors"
              >
                Apply
              </button>
            </form>
            {couponError && <p className="text-[11px] text-red-600 mt-1">{couponError}</p>}
            {appliedCoupon && (
              <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>Coupon {appliedCoupon.code} applied (-{formatPrice(appliedCoupon.discount)})</span>
              </p>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-burgundy-800/80">
              <span>Subtotal</span>
              <span className="font-semibold text-burgundy-950">{formatPrice(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-burgundy-800/80">
              <span>Delivery Charges</span>
              <span className="font-semibold text-burgundy-950">
                {deliveryFee === 0 ? (
                  <span className="text-emerald-700 font-bold uppercase">FREE</span>
                ) : (
                  formatPrice(deliveryFee)
                )}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Festive Discount</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-burgundy-900/10 flex justify-between items-baseline">
              <span className="font-serif text-base font-bold text-burgundy-950">Total Amount</span>
              <span className="font-serif text-2xl font-bold text-burgundy-900">
                {formatPrice(grandTotal)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/checkout', { state: { couponCode: appliedCoupon?.code } })}
            className="w-full py-4 bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-serif font-bold text-sm tracking-wider uppercase rounded-2xl shadow-glow hover:shadow-glow-lg transition-all flex items-center justify-center space-x-2"
          >
            <span>Proceed to Cash on Delivery</span>
            <ArrowRight className="w-4 h-4 text-gold-400" />
          </button>

          <div className="p-3 bg-cream-50 rounded-xl border border-gold-500/30 text-xs text-burgundy-800/80 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
            <span>
              Your order generates a unique <strong>6-digit delivery PIN</strong>. Share it with your delivery agent to verify and accept your package.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
