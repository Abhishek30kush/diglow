import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Flame, X, Tag, Copy, Check, ArrowRight, Gift } from 'lucide-react';
import { api } from '../utils/api.js';

export default function FestiveOfferBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [featuredCoupons, setFeaturedCoupons] = useState([
    {
      code: 'DIWALI20',
      title: 'Diwali Grand Offer',
      desc: 'Flat 20% Off on Festive Hampers & Gift Boxes',
      min: '₹1,999'
    },
    {
      code: 'FESTIVE10',
      title: 'Festive Delight',
      desc: 'Flat 10% Off on entire luxury collection',
      min: '₹999'
    }
  ]);

  useEffect(() => {
    // Check if dismissed in this session
    if (sessionStorage.getItem('diglow_festive_pill_dismissed')) {
      setDismissed(true);
      return;
    }

    async function fetchCoupons() {
      try {
        const res = await api.getPublicOffers();
        if (res.success && res.coupons && res.coupons.length > 0) {
          const formatted = res.coupons.slice(0, 3).map((c) => ({
            code: c.code,
            title: c.discountType === 'PERCENTAGE' ? `${c.discountValue}% Off Offer` : `Flat ₹${c.discountValue} Off`,
            desc: c.description || 'Special festive celebratory discount',
            min: `₹${c.minOrderAmount || 0}`
          }));
          setFeaturedCoupons(formatted);
        }
      } catch (err) {
        // Keep default fallback coupons
      }
    }

    fetchCoupons();
  }, []);

  if (dismissed) return null;

  const handleCopy = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleDismissPill = (e) => {
    e.stopPropagation();
    sessionStorage.setItem('diglow_festive_pill_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <>
      {/* Floating Sparkle Trigger Button (Bottom Left) */}
      <div className="fixed bottom-6 left-6 z-40 print:hidden">
        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-burgundy-950 via-burgundy-900 to-amber-950 text-gold-300 rounded-full shadow-2xl border-2 border-gold-500/60 hover:scale-105 transition-all duration-300"
            aria-label="View Festive Offers"
          >
            {/* Glowing pulse ring */}
            <span className="absolute -inset-0.5 rounded-full bg-gold-400 opacity-30 group-hover:opacity-75 blur-sm transition duration-300 animate-pulse" />

            <div className="relative flex items-center gap-2">
              <span className="text-base">🪔</span>
              <div className="text-left font-serif">
                <span className="block text-[11px] font-bold tracking-wider uppercase text-gold-300">
                  Diwali Offers
                </span>
                <span className="block text-[9px] text-cream-200/80 -mt-0.5">
                  Up to 20% Off
                </span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-bounce" />
            </div>

            {/* Small subtle dismiss X */}
            <span
              onClick={handleDismissPill}
              className="ml-1 p-0.5 hover:text-white opacity-60 hover:opacity-100 transition-opacity"
              title="Hide this popup"
            >
              <X className="w-3 h-3" />
            </span>
          </button>
        ) : (
          /* Expanded Modal / Card */
          <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border-2 border-gold-500/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-burgundy-950 via-burgundy-900 to-amber-950 text-cream-50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪔</span>
                <div>
                  <h4 className="font-serif font-bold text-sm text-gold-300">
                    DiGlow Festive Offers
                  </h4>
                  <p className="text-[10px] text-cream-200/80">
                    Handmade Soy Wax & Brass Gifts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-cream-200/70 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Coupon List */}
            <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
              {featuredCoupons.map((item) => (
                <div
                  key={item.code}
                  className="p-3 bg-cream-50 rounded-xl border border-gold-500/30 flex items-center justify-between gap-3 hover:bg-gold-50/30 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-burgundy-900 bg-white px-2 py-0.5 rounded border border-burgundy-900/10">
                        {item.code}
                      </span>
                      <span className="text-[10px] text-gold-700 font-semibold uppercase">
                        Min {item.min}
                      </span>
                    </div>
                    <p className="text-[11px] text-burgundy-900/80 leading-tight">
                      {item.desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleCopy(item.code, e)}
                    className="p-2 rounded-lg bg-white border border-gold-500/40 hover:bg-gold-500 hover:text-burgundy-950 text-burgundy-900 transition-colors shadow-sm flex-shrink-0"
                    title="Copy code"
                  >
                    {copiedCode === item.code ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gold-600" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Footer with link to full offers page */}
            <div className="p-3 bg-cream-100/60 border-t border-cream-200 flex items-center justify-between">
              <span className="text-[10px] text-burgundy-800/70">
                Free shipping above ₹999
              </span>
              <Link
                to="/offers"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1 text-xs font-serif font-bold text-burgundy-950 hover:text-gold-600 transition-colors"
              >
                <span>View All Offers</span>
                <ArrowRight className="w-3 h-3 text-gold-600" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
