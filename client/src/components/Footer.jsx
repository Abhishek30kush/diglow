import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Sparkles, ShieldCheck, HeartHandshake, Leaf, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../utils/api.js';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    if (!consent) {
      setErrorMsg('Consent is required to subscribe.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await api.subscribeNewsletter(email);
      setSubscribed(true);
      setEmail('');
    } catch (err) {
      setErrorMsg(err.message || 'Subscription failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-burgundy-950 text-cream-100 border-t border-gold-500/20 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Brand Pillars Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-14 border-b border-gold-500/20 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-burgundy-900 border border-gold-500/30 flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-gold-300">100% Pure Soy Wax</h4>
              <p className="text-xs text-cream-200/70 mt-0.5">Clean, soot-free, non-toxic burn</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-burgundy-900 border border-gold-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-gold-300">Artisanal Vessels</h4>
              <p className="text-xs text-cream-200/70 mt-0.5">Brass & hand-blown frosted glass</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-burgundy-900 border border-gold-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-gold-300">Safe Delivery PIN</h4>
              <p className="text-xs text-cream-200/70 mt-0.5">6-digit customer verified handoff</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-burgundy-900 border border-gold-500/30 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-gold-300">Cash on Delivery</h4>
              <p className="text-xs text-cream-200/70 mt-0.5">Pay conveniently at your doorstep</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 py-14">
          
          {/* Brand Bio */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-burgundy-900 flex items-center justify-center border border-gold-500/40">
                <Flame className="w-5 h-5 text-gold-400 animate-flame" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-wider text-cream-50">
                Di<span className="text-gold-500 font-cinzel">Glow</span>
              </span>
            </div>
            <p className="text-xs text-cream-200/80 leading-relaxed max-w-sm">
              DiGlow is a tribute to India's sacred perfumery heritage and celebratory warmth.
              Each candle is hand-poured in micro-batches using natural botanical soy wax,
              precious Kannauj attars, and royal brass containers crafted by Indian master artisans.
            </p>
            <div className="pt-2 text-xs text-gold-400/90 font-medium">
              Hand-poured with love &bull; Kannauj &bull; Varanasi &bull; Awadh
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="font-serif font-bold text-sm text-gold-300 tracking-wider uppercase">
              Collections
            </h5>
            <ul className="space-y-2 text-xs text-cream-200/80">
              <li>
                <Link to="/offers" className="text-gold-400 font-semibold hover:text-gold-300 transition-colors flex items-center gap-1.5">
                  <span>🪔 Festive & Diwali Offers</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-gold-500/20 text-gold-300 border border-gold-500/40">Save</span>
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-gold-400 transition-colors">
                  All Candles
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Festive%20Hampers" className="hover:text-gold-400 transition-colors">
                  Festive Hampers
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Brass%20Diya%20Candles" className="hover:text-gold-400 transition-colors">
                  Brass Diya Vessels
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Aromatherapy" className="hover:text-gold-400 transition-colors">
                  Aromatherapy & Peace
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Luxury%20Gift%20Sets" className="hover:text-gold-400 transition-colors">
                  Luxury Gift Boxes
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="font-serif font-bold text-sm text-gold-300 tracking-wider uppercase">
              Customer Care
            </h5>
            <ul className="space-y-2 text-xs text-cream-200/80">
              <li>
                <Link to="/contact" className="hover:text-gold-400 transition-colors">
                  Contact Concierge
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-gold-400 transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-gold-400 transition-colors">
                  Shipping & PIN Delivery
                </Link>
              </li>
              <li>
                <Link to="/return-policy" className="hover:text-gold-400 transition-colors">
                  Returns & Cancellations
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-gold-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-gold-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter / Festive Club */}
          <div className="md:col-span-3 space-y-4">
            <h5 className="font-serif font-bold text-sm text-gold-300 tracking-wider uppercase">
              The Festive Club
            </h5>
            <p className="text-xs text-cream-200/80">
              Join the DiGlow inner circle for exclusive seasonal scent releases and celebratory gifting privileges.
            </p>
            {subscribed ? (
              <div className="p-3 bg-burgundy-900/60 border border-gold-500/40 rounded-lg text-xs text-gold-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                <span>Welcome! Use code <strong className="text-gold-200">FESTIVE10</strong> for 10% off at checkout.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                {errorMsg && (
                  <div className="text-[11px] text-red-300 bg-red-950/60 p-1.5 rounded border border-red-500/40">
                    {errorMsg}
                  </div>
                )}
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full px-3.5 py-2.5 bg-burgundy-900 border border-gold-500/40 rounded-lg text-xs text-cream-100 placeholder:text-cream-200/40 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-1 top-1 bottom-1 px-3 bg-gold-500 hover:bg-gold-600 text-burgundy-950 rounded text-xs font-semibold flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-start space-x-2 text-[10px] text-cream-200/60 pt-1">
                  <input
                    type="checkbox"
                    id="footer-consent"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="rounded text-gold-500 focus:ring-gold-500 mt-0.5"
                  />
                  <label htmlFor="footer-consent" className="cursor-pointer">
                    I agree to receive artisanal candle launches & festive offers. Unsubscribe at any time.
                  </label>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Copyright & Sub-footer */}
        <div className="pt-8 border-t border-gold-500/15 flex flex-col sm:flex-row items-center justify-between text-xs text-cream-200/60 space-y-4 sm:space-y-0">
          <p>&copy; {new Date().getFullYear()} DiGlow Candle Store India. Handcrafted Luxury. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span>Cash on Delivery (COD) Available</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
