import React from 'react';
import { Lock, Shield, Eye, Database } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-cream-50 pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-gold-600 font-semibold">
            Privacy & Trust
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-burgundy-950 font-bold mt-2">
            Privacy & Data Protection Policy
          </h1>
          <p className="text-sm text-burgundy-900/70 mt-3 max-w-xl mx-auto">
            Your privacy is sacred to us. We treat your personal details with the utmost discretion and never sell, rent, or trade your private information.
          </p>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white rounded-2xl border border-gold-500/20 p-8 sm:p-10 shadow-sm space-y-8 text-sm text-burgundy-950/80 leading-relaxed">
          <section>
            <h2 className="font-serif text-lg font-bold text-burgundy-950 mb-2">1. Information We Collect</h2>
            <p>
              When you browse our catalog, register a customer account, or place an order, we collect:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-burgundy-900/70">
              <li><strong>Contact Information:</strong> Full name, verified email address, and 10-digit mobile number for order delivery coordination.</li>
              <li><strong>Shipping Addresses:</strong> Doorstep delivery address, city, state, and 6-digit postal code.</li>
              <li><strong>Order History:</strong> Product selections, transaction references, and status timestamps.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-burgundy-950 mb-2">2. How Your Information Is Used</h2>
            <p>
              Your data is utilized solely for:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-burgundy-900/70">
              <li>Processing, packaging, and shipping your candle orders via authorized logistics partners.</li>
              <li>Generating and authenticating your secret 6-digit doorstep delivery PIN.</li>
              <li>Dispatching transactional updates (order confirmation, courier tracking numbers, and delivery receipts).</li>
              <li>Customer concierge support regarding fragrance consultation or order inquiries.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-burgundy-950 mb-2">3. Payment Security (Zero Stored Card Details)</h2>
            <p>
              For online payments (UPI, credit/debit cards, NetBanking), all transactions are processed through Razorpay's PCI-DSS compliant secure infrastructure. <strong>DiGlow does not store, process, or view your debit/credit card numbers or UPI PINs.</strong> All communication is encrypted via TLS 1.3 / HTTPS.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold text-burgundy-950 mb-2">4. Your Rights & Data Erasure</h2>
            <p>
              You have the right to inspect, edit, or request complete deletion of your customer profile and saved delivery addresses at any time by navigating to your <a href="/account" className="text-gold-700 underline font-semibold">Account Settings</a> or contacting our data concierge at <a href="mailto:privacy@diglow.com" className="text-gold-700 underline font-semibold">privacy@diglow.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
