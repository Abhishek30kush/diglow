import React from 'react';
import { Clock, CheckCircle2, Package, Truck, CheckCheck, XCircle } from 'lucide-react';
import { formatDate } from '../utils/formatters.js';

export default function OrderTimeline({ order }) {
  if (!order) return null;

  const currentStatus = order.orderStatus;

  if (currentStatus === 'Cancelled') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-red-800">
        <XCircle className="w-6 h-6 text-red-600 shrink-0" />
        <div>
          <h4 className="font-bold text-sm">Order Cancelled</h4>
          <p className="text-xs text-red-700/80">
            This order has been cancelled. Product inventory has been restored.
          </p>
        </div>
      </div>
    );
  }

  if (currentStatus === 'Returned') {
    return (
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center space-x-3 text-amber-900">
        <Package className="w-6 h-6 text-amber-700 shrink-0" />
        <div>
          <h4 className="font-bold text-sm">Order Returned & Processed</h4>
          <p className="text-xs text-amber-800/80">
            {order.returnNotes || 'This order was processed at the warehouse.'}
          </p>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'Pending', label: 'Order Received', desc: 'Awaiting confirmation', icon: Clock },
    { key: 'Confirmed', label: 'Confirmed & Processing', desc: 'Sent to workshop for hand-pouring', icon: CheckCircle2 },
    { key: 'Packed', label: 'Packed & Dispatched', desc: 'Quality inspected & labeled', icon: Package },
    { key: 'Out for Delivery', label: 'Out for Delivery', desc: 'With assigned courier rider', icon: Truck },
    { key: 'Delivered', label: 'Delivered', desc: 'Doorstep PIN verified & collected', icon: CheckCheck }
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'Pending':
        return 0;
      case 'Confirmed':
      case 'Processing':
        return 1;
      case 'Packing':
      case 'Packed':
        return 2;
      case 'Shipped':
      case 'Out for Delivery':
      case 'Failed Delivery':
        return 3;
      case 'Delivered':
        return 4;
      default:
        return 0;
    }
  };

  const activeIndex = getStepIndex(currentStatus);

  return (
    <div className="w-full py-4">
      {/* Mobile Stack Timeline */}
      <div className="sm:hidden space-y-4">
        {steps.map((step, idx) => {
          const isDone = idx <= activeIndex;
          const isCurrent = idx === activeIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex items-start space-x-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                  isDone
                    ? 'bg-burgundy-900 border-gold-500 text-gold-300'
                    : 'bg-white border-neutral-300 text-neutral-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h5
                    className={`text-xs font-bold ${
                      isCurrent ? 'text-burgundy-900 font-extrabold' : isDone ? 'text-burgundy-900' : 'text-neutral-400'
                    }`}
                  >
                    {step.label}
                  </h5>
                  {isCurrent && (
                    <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold bg-gold-500 text-burgundy-950 rounded-full animate-pulse">
                      Current Stage
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-burgundy-800/60">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Horizontal Stepper */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between relative">
          {/* Connector Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-cream-300 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-burgundy-900 to-gold-500 -translate-y-1/2 transition-all duration-500 z-0"
            style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((step, idx) => {
            const isDone = idx <= activeIndex;
            const isCurrent = idx === activeIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center group">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isDone
                      ? 'bg-burgundy-900 border-gold-500 text-gold-300 shadow-glow'
                      : 'bg-white border-neutral-300 text-neutral-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="mt-2 text-center">
                  <span
                    className={`text-xs block font-bold ${
                      isCurrent
                        ? 'text-burgundy-950 underline decoration-gold-500 decoration-2 font-serif'
                        : isDone
                        ? 'text-burgundy-900'
                        : 'text-neutral-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] text-burgundy-800/60 max-w-[100px] block leading-tight mt-0.5">
                    {step.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
