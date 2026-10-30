import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Copy, Check, X, ArrowRight } from 'lucide-react';
import { api } from '../utils/api.js';

export default function PromotionBanner() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    async function loadPromotions() {
      try {
        const res = await api.getActivePromotions();
        if (res.success && Array.isArray(res.banners) && res.banners.length > 0) {
          // Filter out banners dismissed in this session
          const activeBanners = res.banners.filter(
            (b) => !sessionStorage.getItem(`dismissed_promo_${b.id}`)
          );
          setBanners(activeBanners);
        }
      } catch (err) {
        // Silently fallback without breaking storefront
      }
    }

    loadPromotions();
  }, []);

  if (dismissed || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];
  if (!currentBanner) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(`dismissed_promo_${currentBanner.id}`, 'true');
    setDismissed(true);
  };

  const handleCopyCode = (code, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div
      className={`relative z-40 bg-gradient-to-r ${currentBanner.bgGradient || 'from-burgundy-950 via-burgundy-900 to-amber-950'} text-cream-50 text-xs py-2 px-4 border-b border-gold-500/30 transition-all`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-center sm:text-left">
          {currentBanner.badge && (
            <span className="px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-300 font-serif font-bold text-[10px] tracking-wider uppercase border border-gold-500/40">
              {currentBanner.badge}
            </span>
          )}

          <span className="font-serif font-bold text-cream-100">
            {currentBanner.title}
          </span>

          {currentBanner.subtitle && (
            <span className="hidden md:inline text-cream-200/80 text-[11px]">
              &bull; {currentBanner.subtitle}
            </span>
          )}

          {currentBanner.couponCode && (
            <button
              type="button"
              onClick={(e) => handleCopyCode(currentBanner.couponCode, e)}
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 font-mono font-bold text-[11px] border border-gold-500/40 transition-colors"
              title="Click to copy coupon code"
            >
              <span>{currentBanner.couponCode}</span>
              {copiedCode === currentBanner.couponCode ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 opacity-70" />
              )}
            </button>
          )}

          {currentBanner.linkUrl && (
            <Link
              to={currentBanner.linkUrl}
              className="inline-flex items-center space-x-1 text-gold-400 hover:text-gold-300 font-bold underline underline-offset-2 ml-1"
            >
              <span>Shop Collection</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-full text-cream-200/60 hover:text-cream-50 hover:bg-white/10 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
