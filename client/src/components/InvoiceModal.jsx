import React, { useState } from 'react';
import { Printer, X, FileText, Package, CheckCircle2 } from 'lucide-react';
import { formatPrice, formatDate } from '../utils/formatters.js';

export default function InvoiceModal({ order, onClose }) {
  const [docType, setDocType] = useState('invoice'); // 'invoice' or 'packingslip'

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `INV-${order.orderNumber}`;
  const companyInfo = {
    name: 'DiGlow Artisanal Candles Pvt Ltd',
    tagline: 'Handcrafted Heritage Candles & Festive Luxuries',
    gstin: '07AAAAA0000A1Z5',
    address: 'Sanctum Atelier, 42 Heritage Craft Lane, Mehrauli, New Delhi - 110030',
    email: 'atelier@diglow.com',
    phone: '+91 98765 43210',
    website: 'www.diglowcandles.com'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-10 shadow-2xl border border-burgundy-900/10 space-y-6 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-burgundy-900/10 print:hidden">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setDocType('invoice')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                docType === 'invoice'
                  ? 'bg-burgundy-900 text-gold-300'
                  : 'bg-cream-100 text-burgundy-900 hover:bg-cream-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tax Invoice</span>
            </button>
            <button
              type="button"
              onClick={() => setDocType('packingslip')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                docType === 'packingslip'
                  ? 'bg-burgundy-900 text-gold-300'
                  : 'bg-cream-100 text-burgundy-900 hover:bg-cream-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Warehouse Packing Slip</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 rounded-xl text-xs font-serif font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print {docType === 'invoice' ? 'Invoice' : 'Slip'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-burgundy-900/60 hover:text-burgundy-950 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="printable-sheet bg-white text-burgundy-950 text-xs space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-gold-500/50 pb-6">
            <div>
              <span className="font-serif text-2xl font-bold tracking-wider text-burgundy-950">
                Di<span className="text-gold-600 font-cinzel">Glow</span>
              </span>
              <p className="text-[10px] text-gold-700 uppercase tracking-widest font-semibold">
                {companyInfo.tagline}
              </p>
              <p className="text-[11px] text-burgundy-800/80 mt-2 max-w-sm">
                {companyInfo.address}
              </p>
              <p className="text-[10px] text-burgundy-800/70">
                GSTIN: <span className="font-mono font-bold">{companyInfo.gstin}</span> &bull; {companyInfo.email}
              </p>
            </div>

            <div className="text-right space-y-1">
              <h2 className="font-serif text-xl font-bold uppercase tracking-wider text-burgundy-900">
                {docType === 'invoice' ? 'TAX INVOICE' : 'PACKING SLIP'}
              </h2>
              <p className="font-mono font-bold text-sm text-burgundy-950">
                {docType === 'invoice' ? invoiceNumber : `PACK-${order.orderNumber}`}
              </p>
              <p className="text-burgundy-800/70 text-[11px]">Date: {formatDate(order.createdAt)}</p>
              <div className="pt-1">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-cream-100 text-burgundy-950 border border-burgundy-900/20">
                  {order.paymentMethod} &bull; {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Addresses */}
          <div className="grid grid-cols-2 gap-8 py-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy-800/60 block mb-1">
                Billed & Shipped To:
              </span>
              <p className="font-serif font-bold text-sm text-burgundy-950">{order.customerName}</p>
              <p className="text-burgundy-800/80 mt-0.5">{order.shippingAddress}</p>
              <p className="text-burgundy-800/80">
                {order.city}, {order.state} - <span className="font-mono font-bold">{order.postalCode}</span>
              </p>
              <p className="text-burgundy-800/70 mt-1 font-mono">
                Phone: +91 {order.customerPhone} &bull; {order.customerEmail}
              </p>
            </div>

            <div className="space-y-1 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-burgundy-800/60 block mb-1">
                Logistics & Dispatch Details:
              </span>
              <p className="text-burgundy-800/80">
                Carrier: <strong>{order.deliveryPartner || 'Express Priority Courier'}</strong>
              </p>
              {order.trackingNumber && (
                <p className="text-burgundy-800/80">
                  AWB Tracking: <span className="font-mono font-bold">{order.trackingNumber}</span>
                </p>
              )}
              <p className="text-burgundy-800/80">
                Order Status: <strong>{order.orderStatus}</strong>
              </p>
              {order.notes && (
                <p className="text-[11px] text-gold-800 italic mt-1">
                  &ldquo;{order.notes}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-burgundy-900/15 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-cream-100/80 border-b border-burgundy-900/10 text-[10px] uppercase font-bold tracking-wider text-burgundy-950">
                <tr>
                  <th className="py-2.5 px-4">Item & Fragrance Description</th>
                  <th className="py-2.5 px-4">Product SKU</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  {docType === 'invoice' && (
                    <>
                      <th className="py-2.5 px-4 text-right">Rate</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                    </>
                  )}
                  {docType === 'packingslip' && (
                    <th className="py-2.5 px-4 text-right">Checked</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-burgundy-900/10">
                {order.items?.map((item) => (
                  <tr key={item.id} className="text-xs">
                    <td className="py-3 px-4">
                      <strong className="font-serif text-burgundy-950 block">
                        {item.product?.name || 'Artisanal Candle'}
                      </strong>
                      <span className="text-[10px] text-burgundy-800/60">
                        {item.product?.scentProfile || item.product?.waxType || 'Hand-poured 100% Soy Wax'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] font-bold text-gold-700">
                      {item.product?.sku || 'DG-CANDLE'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-mono">
                      {item.quantity}
                    </td>
                    {docType === 'invoice' && (
                      <>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatPrice(item.unitPrice || item.price)}
                        </td>
                        <td className="py-3 px-4 text-right font-serif font-bold text-burgundy-950">
                          {formatPrice(item.totalPrice || ((item.unitPrice || item.price) * item.quantity))}
                        </td>
                      </>
                    )}
                    {docType === 'packingslip' && (
                      <td className="py-3 px-4 text-right">
                        <div className="w-4 h-4 border-2 border-burgundy-900/40 rounded inline-block" />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals (Invoice Only) */}
          {docType === 'invoice' && (
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-burgundy-800/80">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">{formatPrice(order.subtotal || order.total)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount ({order.couponCode || 'PROMO'}):</span>
                    <span className="font-mono">-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-burgundy-800/80">
                  <span>Shipping & Delivery:</span>
                  <span className="font-mono">
                    {order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee || 0)}
                  </span>
                </div>
                {order.taxAmount > 0 && (
                  <div className="flex justify-between text-burgundy-800/80">
                    <span>GST (18% inclusive):</span>
                    <span className="font-mono">{formatPrice(order.taxAmount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t-2 border-burgundy-900/20 flex justify-between items-baseline font-bold">
                  <span className="font-serif text-sm text-burgundy-950">Total Amount Due:</span>
                  <span className="font-serif text-lg text-burgundy-900">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Packing Slip Quality Control Checklist */}
          {docType === 'packingslip' && (
            <div className="border border-burgundy-900/10 bg-cream-50/60 rounded-xl p-4 space-y-2 text-[11px] text-burgundy-800/80">
              <span className="font-bold text-burgundy-950 uppercase tracking-wider block">
                Quality Inspection & Packaging Sign-off:
              </span>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <label className="flex items-center space-x-1.5">
                  <div className="w-3.5 h-3.5 border border-burgundy-900/40 rounded" />
                  <span>Wax jar unblemished</span>
                </label>
                <label className="flex items-center space-x-1.5">
                  <div className="w-3.5 h-3.5 border border-burgundy-900/40 rounded" />
                  <span>Festive seal intact</span>
                </label>
                <label className="flex items-center space-x-1.5">
                  <div className="w-3.5 h-3.5 border border-burgundy-900/40 rounded" />
                  <span>Tamper-evident wrap</span>
                </label>
              </div>
              <div className="flex justify-between items-end pt-6 text-[10px] text-burgundy-800/60">
                <span>Packed By: __________________</span>
                <span>Inspected By: __________________</span>
                <span>Signature: __________________</span>
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="border-t border-burgundy-900/10 pt-4 text-center text-[10px] text-burgundy-800/60 space-y-1">
            <p>
              This is a computer-generated document authorized by DiGlow Artisanal Candles Pvt Ltd.
            </p>
            <p>
              Need assistance? Email <strong>support@diglow.com</strong> or call <strong>+91 98765 43210</strong>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
