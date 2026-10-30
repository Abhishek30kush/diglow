import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-cream-50 pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-gold-600 font-semibold">
            Legal Transparency
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-burgundy-950 font-bold mt-2">
            Terms of Service & Candle Care Rituals
          </h1>
          <p className="text-sm text-burgundy-900/70 mt-3 max-w-xl mx-auto">
            Please review the terms and conditions governing purchases, candle safety guidelines, and services provided by DiGlow.
          </p>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white rounded-2xl border border-gold-500/20 p-8 sm:p-10 shadow-sm space-y-8 text-sm text-burgundy-950/80 leading-relaxed">
          <section>
            <h2 className="font-serif text-lg font-bold text-burgundy-950 mb-2">1. Overview & Acceptance</h2>
            <p>
              By accessing our online store, creating a customer account, or purchasing our artisanal candles, you agree to be bound by these Terms of Service. These terms apply to all visitors, buyers, and account holders.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-burgundy-950 mb-2">2. Artisanal Craftsmanship & Wax Integrity</h2>
            <p>
              DiGlow products are hand-poured in micro-batches using 100% natural soy and coconut waxes blended with botanical essential oils and attars. Minor variations in wax coloration, crystallization, or brass patina are natural aspects of handcrafting and certify authenticity.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-burgundy-950 mb-2">3. Candle Burning & Fire Safety Instructions</h2>
            <p>
              For your safety and optimal fragrance performance, every customer agrees to observe standard candle burning safety:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-burgundy-900/70">
              <li>Never leave a burning candle unattended or within reach of children or pets.</li>
              <li>Always trim cotton wicks to 1/4 inch (6mm) prior to each burn to avoid excess smoke or flame flare.</li>
              <li>Burn candles on heat-resistant, level surfaces away from flammable curtains or drafts.</li>
              <li>Perform a full memory burn on first lighting (2–3 hours until a complete wax pool reaches container edges).</li>
              <li>Do not burn a candle for more than 4 consecutive hours. Extinguish when 1/2 inch of wax remains.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-burgundy-950 mb-2">4. Pricing, Taxes & Cash on Delivery (COD)</h2>
            <p>
              All prices shown on the store are listed in Indian Rupees (INR) and are inclusive of applicable GST. Cash on Delivery orders require exact cash payment or UPI payment to the courier delivery executive before opening the package seal.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-burgundy-950 mb-2">5. Governing Law & Jurisdiction</h2>
            <p>
              These terms and all sales transactions shall be governed by and construed in accordance with the laws of the Republic of India, subject to the exclusive jurisdiction of the competent courts in India.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
