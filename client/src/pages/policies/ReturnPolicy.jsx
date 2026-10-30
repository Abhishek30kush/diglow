import React from 'react';
import { RotateCcw, AlertTriangle, CheckCircle, PackageX } from 'lucide-react';

export default function ReturnPolicy() {
  return (
    <div className="min-h-screen bg-cream-50 pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-gold-600 font-semibold">
            Honest & Fair Policies
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-burgundy-950 font-bold mt-2">
            Cancellation & Return / Refund Policy
          </h1>
          <p className="text-sm text-burgundy-900/70 mt-3 max-w-xl mx-auto">
            Due to the artisanal, personal-care, and fragrance nature of handcrafted candles, we maintain transparent cancellation and return standards to protect craft purity.
          </p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl border border-gold-500/20 shadow-sm text-center">
            <PackageX className="w-8 h-8 text-gold-600 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-burgundy-950 text-base">Instant Order Cancellation</h3>
            <p className="text-xs text-burgundy-900/70 mt-1">
              Cancel your order directly from your <a href="/account/orders" className="text-gold-700 underline">Order History</a> anytime before it enters <em>Packing</em> or <em>Shipped</em> status.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gold-500/20 shadow-sm text-center">
            <AlertTriangle className="w-8 h-8 text-gold-600 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-burgundy-950 text-base">Damaged in Transit</h3>
            <p className="text-xs text-burgundy-900/70 mt-1">
              If a glass or brass vessel is damaged during shipping, we issue an immediate replacement within <strong>48 hours</strong> of photographic verification.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gold-500/20 shadow-sm text-center">
            <RotateCcw className="w-8 h-8 text-gold-600 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-burgundy-950 text-base">7-Day Replacement Window</h3>
            <p className="text-xs text-burgundy-900/70 mt-1">
              Notify our concierge within <strong>7 calendar days</strong> of parcel arrival for missing items or defective candle wicks.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white rounded-2xl border border-gold-500/20 p-8 sm:p-10 shadow-sm space-y-8 text-sm text-burgundy-950/80 leading-relaxed">
          <section>
            <h2 className="font-serif text-lg font-bold text-burgundy-950 mb-2">1. Pre-Dispatch Order Cancellation</h2>
            <p>
              You may cancel your order at no cost as long as its status is marked as <strong>Pending</strong> or <strong>Confirmed</strong>.
            </p>
            <p className="mt-2 text-xs text-burgundy-900/70">
              When cancelled, reserved inventory is automatically and atomically restored to store stock, and pre-paid transactions via Razorpay are initiated for immediate refund back to the original payment source (3–5 banking days).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-burgundy-950 mb-2">2. Artisanal Nature & Non-Returnable Items</h2>
            <p>
              Because our candles are formulated with 100% natural soy wax and hand-blended attars, we cannot accept returns once a candle has been lit, unsealed, or warmed. Subtle cosmetic differences such as natural wax frosting, crystal surface mottling, or micro-textures in hammered brass are hallmarks of hand-poured artisanal craftsmanship and are not considered defects.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-burgundy-950 mb-2">3. How to Report Transit Damage</h2>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-xs text-burgundy-900/70">
              <li>Do not discard the outer shipping carton or broken vessel components.</li>
              <li>Take 2–3 clear photographs of the damaged product and outer label with AWB number.</li>
              <li>Email us at <a href="mailto:concierge@diglow.com" className="text-gold-700 underline font-semibold">concierge@diglow.com</a> within 7 days of delivery with your Order ID.</li>
              <li>Our team will dispatch a brand-new replacement unit with expedited shipping at zero cost to you.</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
