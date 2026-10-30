import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/formatters.js';

export default function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    deliveryFee,
    freeDeliveryProgress,
    remainingForFreeDelivery,
    getCartItemKey
  } = useCart();

  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const grandTotal = cartSubtotal + deliveryFee;

  const handleCheckoutClick = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-burgundy-950/70 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-cream-50 shadow-2xl flex flex-col border-l border-gold-500/30">
          
          {/* Header */}
          <div className="p-5 bg-burgundy-900 text-cream-50 flex items-center justify-between border-b border-gold-500/30">
            <div className="flex items-center space-x-2.5">
              <ShoppingBag className="w-5 h-5 text-gold-400" />
              <h3 className="font-serif text-lg font-bold tracking-wide text-cream-100">
                Your Luxury Bag
              </h3>
              <span className="text-xs bg-gold-500 text-burgundy-950 font-bold px-2 py-0.5 rounded-full">
                {cartItems.length} items
              </span>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="p-1.5 text-cream-200/70 hover:text-cream-50 rounded-full hover:bg-burgundy-800 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="p-4 bg-gold-100/60 border-b border-gold-200">
            <div className="flex items-center justify-between text-xs text-burgundy-900 font-medium mb-1.5">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                {remainingForFreeDelivery > 0 ? (
                  <>Add <strong>{formatPrice(remainingForFreeDelivery)}</strong> more for <strong>Free Delivery</strong></>
                ) : (
                  <strong className="text-emerald-800">✨ You unlocked Free Express Delivery!</strong>
                )}
              </span>
              <span>{freeDeliveryProgress}%</span>
            </div>
            <div className="w-full h-2 bg-cream-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-300 rounded-full"
                style={{ width: `${freeDeliveryProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gold-100 border border-gold-300 flex items-center justify-center mx-auto text-burgundy-900">
                  <ShoppingBag className="w-8 h-8 text-gold-600" />
                </div>
                <h4 className="font-serif text-xl font-bold text-burgundy-900">Your bag is empty</h4>
                <p className="text-xs text-burgundy-800/70 max-w-xs mx-auto">
                  Immerse your space in the regal aromas of Indian heritage. Explore our festive collections.
                </p>
                <Link
                  to="/shop"
                  onClick={closeCart}
                  className="inline-block mt-2 px-6 py-2.5 bg-burgundy-900 text-gold-300 rounded-full text-xs font-semibold hover:bg-burgundy-950 transition-colors shadow-sm"
                >
                  Explore Scented Candles
                </Link>
              </div>
            ) : (
              cartItems.map((item) => {
                const itemKey = getCartItemKey(item);
                const unitPrice = item.variant?.price ?? item.product.price;
                const maxStock = item.variant ? (item.variant.stock ?? item.product.stock) : item.product.stock;
                const isUnavailable = maxStock <= 0;

                return (
                  <div
                    key={itemKey}
                    className={`flex space-x-3.5 p-3 bg-white rounded-xl border shadow-sm transition-all ${
                      isUnavailable ? 'border-amber-300 bg-amber-50/40 opacity-80' : 'border-burgundy-900/10'
                    }`}
                  >
                    <img
                      src={item.variant?.imageUrl || item.product.imageUrl}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg border border-gold-500/20 shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <Link
                            to={`/product/${item.product.slug}`}
                            onClick={closeCart}
                            className="font-serif text-sm font-bold text-burgundy-950 hover:text-gold-600 line-clamp-1 transition-colors"
                          >
                            {item.product.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromCart(itemKey)}
                            className="text-burgundy-900/40 hover:text-red-600 p-1 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Variant Badge */}
                        {item.variant && (
                          <div className="mt-1">
                            <span className="inline-flex items-center text-[10px] font-bold text-burgundy-900 bg-gold-100/80 px-2 py-0.5 rounded border border-gold-300/60">
                              {item.variant.title}
                            </span>
                          </div>
                        )}

                        <p className="text-[11px] text-burgundy-800/60 line-clamp-1 mt-0.5">
                          {item.product.scentProfile}
                        </p>

                        {isUnavailable && (
                          <span className="text-[10px] text-amber-700 font-bold block mt-1">
                            ⚠️ Currently Out of Stock
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-burgundy-900/20 rounded-full bg-cream-50 px-2 py-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                            className="p-1 text-burgundy-900 hover:text-gold-600"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-burgundy-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                            disabled={item.quantity >= maxStock}
                            className="p-1 text-burgundy-900 hover:text-gold-600 disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Line Price */}
                        <div className="text-right">
                          <span className="font-serif text-sm font-bold text-burgundy-900">
                            {formatPrice(unitPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Summary */}
          {cartItems.length > 0 && (
            <div className="p-5 bg-white border-t border-burgundy-900/10 space-y-3 shadow-luxury">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-burgundy-800/80">
                  <span>Subtotal</span>
                  <span className="font-medium text-burgundy-950">{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-burgundy-800/80">
                  <span>Estimated Delivery</span>
                  <span className="font-medium text-burgundy-950">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-semibold uppercase">Free</span>
                    ) : (
                      formatPrice(deliveryFee)
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-burgundy-900/10 flex justify-between items-baseline">
                  <span className="font-serif text-base font-bold text-burgundy-950">Grand Total</span>
                  <span className="font-serif text-xl font-bold text-burgundy-900">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckoutClick}
                className="w-full py-3.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-serif font-bold text-sm tracking-wide rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md group"
              >
                <span>Proceed to Cash on Delivery</span>
                <ArrowRight className="w-4 h-4 text-gold-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-burgundy-800/60 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-600" />
                <span>Secret 6-Digit Delivery PIN verification upon arrival</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
