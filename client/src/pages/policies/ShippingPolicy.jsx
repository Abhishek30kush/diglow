import React from 'react';
import { Truck, ShieldCheck, Clock, MapPin } from 'lucide-react';

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-cream-50 pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-gold-600 font-semibold">
            Artisanal Delivery Standards
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-burgundy-950 font-bold mt-2">
            Shipping & Doorstep Verification Policy
          </h1>
          <p className="text-sm text-burgundy-900/70 mt-3 max-w-xl mx-auto">
            Each DiGlow vessel is hand-poured in micro-batches and packaged in shock-resistant protective cartons to ensure your artisanal candles reach you in pristine condition.
          </p>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl border border-gold-500/20 shadow-sm text-center">
            <Truck className="w-8 h-8 text-gold-600 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-burgundy-950 text-base">Complimentary Shipping</h3>
            <p className="text-xs text-burgundy-900/70 mt-1">
              All orders above <strong>₹999</strong> qualify for free express shipping across all serviceable pin codes in India.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gold-500/20 shadow-sm text-center">
            <Clock className="w-8 h-8 text-gold-600 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-burgundy-950 text-base">Dispatch Timelines</h3>
            <p className="text-xs text-burgundy-900/70 mt-1">
              Orders are packaged and dispatched within <strong>24–48 business hours</strong> from our studio.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gold-500/20 shadow-sm text-center">
            <ShieldCheck className="w-8 h-8 text-gold-600 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-burgundy-950 text-base">Doorstep PIN Handover</h3>
            <p className="text-xs text-burgundy-900/70 mt-1">
              Your parcel is secured with a unique <strong>6-digit delivery PIN</strong> to ensure delivery only to authorized recipients.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white rounded-2xl border border-gold-500/20 p-8 sm:p-10 shadow-sm space-y-8 text-sm text-burgundy-950/80 leading-relaxed">
          <section>
            <h2 className="font-serif text-lg font-bold text-burgundy-950 mb-2">1. Delivery Zones & Timeline</h2>
            <p>
              We ship across mainland India via reputable express logistics partners (BlueDart, Delhivery, DTDC).
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-burgundy-900/70">
              <li><strong>Metro Cities (Delhi NCR, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad):</strong> 3 to 5 business days.</li>
              <li><strong>Tier 2 & Tier 3 Cities:</strong> 5 to 7 business days.</li>
              <li><strong>North-East & Remote Regions:</strong> 7 to 10 business days.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-burgundy-950 mb-2">2. Shipping Charges</h2>
            <p>
              For orders below ₹999, a nominal flat express shipping charge of <strong>₹99</strong> is added at checkout. This fee covers specialized transit handling for fragile glass and brass wax containers.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-burgundy-950 mb-2">3. Secret 6-Digit Delivery PIN Verification</h2>
            <p>
              To eliminate package tampering and misdelivery, every DiGlow order is assigned a secret 6-digit PIN visible only on your order confirmation screen and email. When the courier delivery officer arrives, share this PIN only after verifying the sealed carton. The courier executive will input the PIN on their portal to authenticate handover.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-burgundy-950 mb-2">4. Order Tracking</h2>
            <p>
              You can track your package live at any time using our dedicated <a href="/track" className="text-gold-700 underline font-semibold">Track Order</a> page by entering your unique Order Number (e.g. DIG-2026-XXXXX) and your registered 10-digit mobile number.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
