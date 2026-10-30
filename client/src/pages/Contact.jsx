import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, MessageCircle } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Order Inquiry',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-cream-50 pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs uppercase tracking-widest text-gold-600 font-semibold">
            Dedicated Customer Concierge
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-burgundy-950 font-bold mt-2">
            Connect with DiGlow
          </h1>
          <p className="text-sm text-burgundy-900/70 mt-3 max-w-xl mx-auto">
            Whether you seek scent curation advice, corporate festive gifting packages, or assistance with an existing order, our team is at your service.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Information & Channels */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-burgundy-950 text-cream-100 p-8 rounded-2xl border border-gold-500/30 shadow-md space-y-6">
              <h2 className="font-serif text-xl font-bold text-gold-300">
                Concierge Sanctum
              </h2>
              <p className="text-xs text-cream-200/80 leading-relaxed">
                Our perfumers and support executives respond to all customer correspondence within 12 business hours.
              </p>

              <div className="space-y-4 pt-2 text-xs">
                <div className="flex items-start space-x-3.5">
                  <Mail className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-gold-300/80 block font-medium">Customer Support Email</span>
                    <a href="mailto:concierge@diglow.com" className="hover:text-gold-300 font-semibold text-cream-50">
                      concierge@diglow.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <Phone className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-gold-300/80 block font-medium">Telephone & WhatsApp</span>
                    <span className="font-semibold text-cream-50">+91 (0) 98765 43210</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <Clock className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-gold-300/80 block font-medium">Operating Hours</span>
                    <span className="text-cream-200/90">Monday to Saturday: 10:00 AM – 7:00 PM IST</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <MapPin className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-gold-300/80 block font-medium">Artisanal Studio</span>
                    <span className="text-cream-200/90">Kannauj Perfumery Lane & Varanasi Heritage Quarters, Uttar Pradesh, India</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="bg-white p-6 rounded-2xl border border-gold-500/20 shadow-sm space-y-3 text-xs">
              <h3 className="font-serif font-bold text-burgundy-950 text-sm">Instant Help Links</h3>
              <ul className="space-y-2 text-burgundy-900/80">
                <li>
                  <a href="/track" className="hover:text-gold-700 flex items-center justify-between">
                    <span>Track your live shipment</span>
                    <span className="text-gold-600">&rarr;</span>
                  </a>
                </li>
                <li>
                  <a href="/policies/returns" className="hover:text-gold-700 flex items-center justify-between">
                    <span>Cancellation & refund guidelines</span>
                    <span className="text-gold-600">&rarr;</span>
                  </a>
                </li>
                <li>
                  <a href="/about#candle-care" className="hover:text-gold-700 flex items-center justify-between">
                    <span>Candle burning ritual instructions</span>
                    <span className="text-gold-600">&rarr;</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl border border-gold-500/20 shadow-sm">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <CheckCircle2 className="w-12 h-12 text-gold-600 mx-auto" />
                <h3 className="font-serif text-2xl font-bold text-burgundy-950">Thank You</h3>
                <p className="text-xs text-burgundy-900/70 max-w-md mx-auto">
                  Your message has been received by our concierge. A fragrance specialist will reach back to you shortly at <strong>{formData.email}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-burgundy-900 text-gold-300 hover:bg-burgundy-950 rounded-lg text-xs font-semibold transition-colors"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="font-serif text-xl font-bold text-burgundy-950">
                  Send a Message
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-burgundy-950 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Radhika Sharma"
                      className="w-full px-3.5 py-2.5 bg-cream-50/50 border border-gold-500/30 rounded-lg text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-burgundy-950 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="radhika@example.com"
                      className="w-full px-3.5 py-2.5 bg-cream-50/50 border border-gold-500/30 rounded-lg text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-burgundy-950 mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="10-digit mobile"
                      className="w-full px-3.5 py-2.5 bg-cream-50/50 border border-gold-500/30 rounded-lg text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-burgundy-950 mb-1">Inquiry Topic</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-cream-50/50 border border-gold-500/30 rounded-lg text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    >
                      <option value="Order Inquiry">Order Status & Delivery Inquiry</option>
                      <option value="Corporate Gifting">Corporate & Festive Bulk Gifting</option>
                      <option value="Scent Consultation">Artisanal Scent Consultation</option>
                      <option value="Feedback / Press">Press, Partnerships & Feedback</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-burgundy-950 mb-1">Your Message *</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe how we may assist you..."
                    className="w-full px-3.5 py-2.5 bg-cream-50/50 border border-gold-500/30 rounded-lg text-xs text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-burgundy-950 text-gold-300 hover:bg-burgundy-900 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5 text-gold-400" />
                  <span>Transmit Inquiry to Concierge</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
