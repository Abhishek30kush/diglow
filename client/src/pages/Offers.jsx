import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Flame,
  Gift,
  Copy,
  Check,
  Tag,
  Clock,
  ArrowRight,
  ShieldCheck,
  Truck,
  Package,
  HeartHandshake
} from 'lucide-react';
import { api } from '../utils/api.js';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/formatters.js';

export default function Offers() {
  const [offersData, setOffersData] = useState({
    banners: [],
    coupons: [],
    festiveProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Curated Fallback Festive Coupons in case none are seeded in DB yet
  const defaultCoupons = [
    {
      id: 'default-diwali20',
      code: 'DIWALI20',
      description: '20% Grand Discount on Festive Hampers & Gift Trunks',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderAmount: 1999,
      maxDiscountAmount: 1000,
      badge: 'DIWALI SPECIAL'
    },
    {
      id: 'default-festive10',
      code: 'FESTIVE10',
      description: 'Flat 10% Off on All Artisanal Scented Candles & Brass Urlis',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 999,
      maxDiscountAmount: 500,
      badge: 'FESTIVE EDIT'
    },
    {
      id: 'default-royalglow',
      code: 'ROYALGLOW',
      description: 'Flat ₹300 Instant Discount + Free Brass Wick Trimmer on Orders over ₹2,499',
      discountType: 'FIXED',
      discountValue: 300,
      minOrderAmount: 2499,
      badge: 'ROYAL LUXURY'
    },
    {
      id: 'default-welcome50',
      code: 'WELCOME50',
      description: 'Welcome Gift: Flat ₹50 Off on your first DiGlow order',
      discountType: 'FIXED',
      discountValue: 50,
      minOrderAmount: 499,
      badge: 'FIRST ORDER'
    }
  ];

  useEffect(() => {
    async function loadOffers() {
      try {
        setLoading(true);
        const res = await api.getPublicOffers();
        if (res.success) {
          setOffersData({
            banners: res.banners || [],
            coupons: res.coupons && res.coupons.length > 0 ? res.coupons : defaultCoupons,
            festiveProducts: res.festiveProducts || []
          });
        } else {
          setOffersData((prev) => ({ ...prev, coupons: defaultCoupons }));
        }
      } catch (err) {
        // Graceful fallback to default coupons
        setOffersData((prev) => ({ ...prev, coupons: defaultCoupons }));
      } finally {
        setLoading(false);
      }
    }

    loadOffers();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleApplyAndShop = (code) => {
    handleCopyCode(code);
    navigate('/shop?category=Festive%20Hampers');
  };

  const couponsToDisplay =
    offersData.coupons.length > 0 ? offersData.coupons : defaultCoupons;

  return (
    <div className="min-h-screen bg-cream-50 text-burgundy-950 pb-20">
      {/* 1. Grand Festive Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-burgundy-950 via-burgundy-900 to-amber-950 text-cream-50 pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b-2 border-gold-500/30">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/40 text-xs font-semibold uppercase tracking-widest shadow-glow">
            <Flame className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
            <span>The Royal Illumination Edit &bull; Festive & Diwali Sale</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-cream-50 leading-tight">
            Illume Your Celebrations With{' '}
            <span className="text-gold-400 italic">Royal Festive Offers</span>
          </h1>

          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-cream-200/90 leading-relaxed font-sans">
            Handcrafted pure soy wax candles, heirloom brass vessels & velvet festive hampers.
            Apply our limited-edition celebratory coupon codes to unlock royal gifting privileges.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#active-coupons"
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-amber-600 text-burgundy-950 font-serif font-bold text-xs uppercase tracking-wider rounded-full shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
            >
              <Tag className="w-4 h-4" />
              <span>Explore Promo Codes</span>
            </a>
            <Link
              to="/shop?category=Festive%20Hampers"
              className="px-6 py-3 bg-burgundy-950/80 text-gold-300 border border-gold-500/40 font-serif font-bold text-xs uppercase tracking-wider rounded-full hover:bg-burgundy-900 transition-all flex items-center gap-2"
            >
              <Gift className="w-4 h-4" />
              <span>Shop Festive Hampers</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Festive Highlights & Assurances */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-md border border-gold-500/20 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-burgundy-900/10 flex items-center justify-center text-gold-600 flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-xs text-burgundy-950">Free Express Delivery</h4>
              <p className="text-[11px] text-burgundy-800/70">On all orders above ₹999</p>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-md border border-gold-500/20 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-burgundy-900/10 flex items-center justify-center text-gold-600 flex-shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-xs text-burgundy-950">Velvet Festive Packaging</h4>
              <p className="text-[11px] text-burgundy-800/70">Complimentary royal gift box</p>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-md border border-gold-500/20 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-burgundy-900/10 flex items-center justify-center text-gold-600 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-xs text-burgundy-950">Heirloom Brass Wick Trimmer</h4>
              <p className="text-[11px] text-burgundy-800/70">Free with orders over ₹1,999</p>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-md border border-gold-500/20 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-burgundy-900/10 flex items-center justify-center text-gold-600 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-xs text-burgundy-950">Insured Delivery</h4>
              <p className="text-[11px] text-burgundy-800/70">100% damage replacement cover</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Active Festive Coupons Hub */}
      <section id="active-coupons" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-serif font-bold tracking-widest text-gold-600 uppercase">
            Exclusive Vouchers & Coupons
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
            Active Celebratory Promo Codes
          </h2>
          <p className="text-xs text-burgundy-800/70">
            Click on any coupon code to instantly copy it to your clipboard and apply during checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {couponsToDisplay.map((coupon) => (
            <div
              key={coupon.id}
              className="relative bg-white rounded-2xl border-2 border-gold-500/30 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Decorative scalloped ticket divider effect */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-500/20 text-burgundy-900 border border-gold-500/40">
                    {coupon.badge || (coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% DISCOUNT` : `₹${coupon.discountValue} OFF`)}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-burgundy-800/60">
                    <Clock className="w-3.5 h-3.5 text-gold-600" />
                    <span>Limited Festive Period</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-bold text-burgundy-950">
                    {coupon.discountType === 'PERCENTAGE'
                      ? `Flat ${coupon.discountValue}% Instant Savings`
                      : `Save Flat ₹${coupon.discountValue} on Your Order`}
                  </h3>
                  <p className="text-xs text-burgundy-800/80 mt-1">
                    {coupon.description || 'Exclusive celebratory discount voucher for DiGlow shoppers.'}
                  </p>
                </div>

                <div className="bg-cream-100/70 p-3 rounded-xl flex items-center justify-between text-xs text-burgundy-900">
                  <span className="font-medium">
                    Min. Order: <strong>{formatPrice(coupon.minOrderAmount || 0)}</strong>
                  </span>
                  {coupon.maxDiscountAmount && (
                    <span className="text-[11px] text-burgundy-800/70">
                      Max discount: {formatPrice(coupon.maxDiscountAmount)}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Voucher Action Strip */}
              <div className="px-6 py-4 bg-cream-50 border-t border-dashed border-gold-500/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-burgundy-800/60">
                    Code:
                  </span>
                  <span className="font-mono font-bold text-sm text-burgundy-900 bg-white px-2.5 py-1 rounded-lg border border-burgundy-900/10 shadow-inner tracking-widest">
                    {coupon.code}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(coupon.code)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gold-500/50 hover:bg-gold-50 text-burgundy-900 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gold-600" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyAndShop(coupon.code)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-serif font-bold uppercase tracking-wider bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <span>Shop</span>
                    <ArrowRight className="w-3 h-3 text-gold-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Curated Festive Hampers & Bestsellers */}
      {offersData.festiveProducts && offersData.festiveProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-serif font-bold tracking-widest text-gold-600 uppercase">
                Festive Collection
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
                Curated Diwali Hampers & Urli Candles
              </h2>
            </div>
            <Link
              to="/shop?category=Festive%20Hampers"
              className="text-xs font-serif font-bold text-burgundy-900 hover:text-gold-600 flex items-center gap-1 transition-colors"
            >
              <span>View All Festive Hampers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {offersData.festiveProducts.map((product) => {
              const primaryVariant = product.variants?.[0];
              const price = primaryVariant?.price || product.price || 0;
              const compareAtPrice = primaryVariant?.compareAtPrice || product.compareAtPrice;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gold-500/30 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  <div className="relative aspect-square overflow-hidden bg-cream-100">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-burgundy-900/90 text-gold-300 backdrop-blur-sm border border-gold-500/40">
                      Festive Special
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-gold-600 font-semibold font-serif">
                        {product.scentProfile || product.category}
                      </p>
                      <h3 className="font-serif font-bold text-base text-burgundy-950 mt-1 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-burgundy-800/70 mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-cream-100 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-serif font-bold text-base text-burgundy-950">
                            {formatPrice(price)}
                          </span>
                          {compareAtPrice && compareAtPrice > price && (
                            <span className="text-xs text-burgundy-800/40 line-through">
                              {formatPrice(compareAtPrice)}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-emerald-700 font-medium">
                          Eligible for DIWALI20 code
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          addToCart(product, primaryVariant?.id, 1);
                        }}
                        className="px-4 py-2 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-burgundy-950 transition-colors shadow-sm"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Corporate & Bulk Diwali Gifting Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="bg-gradient-to-r from-burgundy-900 via-burgundy-950 to-amber-950 text-cream-50 rounded-3xl p-8 sm:p-12 border border-gold-500/30 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-gold-500/20 text-gold-300 text-[11px] font-semibold uppercase tracking-wider border border-gold-500/40">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Bespoke Corporate & Wedding Gifting</span>
            </div>

            <h3 className="font-serif text-2xl sm:text-4xl font-bold text-cream-50">
              Planning Bulk Festive Gifting for Clients & Family?
            </h3>

            <p className="text-xs sm:text-sm text-cream-200/80 leading-relaxed font-sans">
              Enjoy tailored volume pricing, custom gold-embossed brand sleeves, personalized wax seal tags,
              and multi-location insured dispatch across India.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/contact"
                className="px-6 py-3 bg-gold-500 hover:bg-gold-400 text-burgundy-950 font-serif font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition-all flex items-center gap-2"
              >
                <span>Request Custom Quote</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/919876543210?text=Hello%20DiGlow,%20I%20am%20interested%20in%20Festive%20Diwali%20bulk%20gifting%20offers."
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-cream-100 border border-gold-500/30 font-serif font-bold text-xs uppercase tracking-wider rounded-full transition-all flex items-center gap-2"
              >
                <span>WhatsApp Concierge</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
