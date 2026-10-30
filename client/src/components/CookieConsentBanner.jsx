import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie } from 'lucide-react';
import { setAnalyticsConsent } from '../utils/analytics.js';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('diglow_analytics_consent');
      if (!consent) {
        // Small delay so it smoothly animates in after page settles
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsVisible(false);
    }
  }, []);

  const handleAccept = () => {
    setAnalyticsConsent(true);
    setIsVisible(false);
  };

  const handleDecline = () => {
    setAnalyticsConsent(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy & Cookie Preferences"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slide-up"
    >
      <div className="bg-burgundy-950/95 text-cream-50 p-5 rounded-2xl shadow-2xl border border-gold-500/40 backdrop-blur-md space-y-3">
        <div className="flex items-center space-x-2 text-gold-400">
          <Cookie className="w-5 h-5 shrink-0" />
          <h4 className="font-serif text-sm font-bold tracking-wide">
            Your Privacy in Our Sanctum
          </h4>
        </div>

        <p className="text-xs text-cream-200/80 leading-relaxed">
          We use strictly essential storage for your bag and 6-digit delivery PIN security. With your consent, we also utilize privacy-conscious analytics to measure festive demand and optimize our candle craft.
        </p>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-burgundy-950 font-serif font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all"
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="py-2 px-3 bg-burgundy-900/80 hover:bg-burgundy-800 border border-gold-500/30 text-gold-300 font-serif text-xs rounded-xl transition-all"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
}
