import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PackageCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Sparkles,
  Headphones,
  Check,
  X
} from 'lucide-react';
import { api } from '../../utils/api.js';
import { formatPrice, formatDate } from '../../utils/formatters.js';
import { useCart } from '../../context/CartContext.jsx';

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  // Reorder Confirmation State
  const [reorderingId, setReorderingId] = useState(null);
  const [reorderModalOpen, setReorderModalOpen] = useState(false);
  const [reorderData, setReorderData] = useState(null);
  
  // Fulfilment Timeline Toggle State
  const [expandedTimelines, setExpandedTimelines] = useState({});

  const { addToCart, openCart } = useCart();

  const toggleTimeline = (orderId) => {
    setExpandedTimelines((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleOpenReorderModal = async (orderId) => {
    try {
      setReorderingId(orderId);
      const res = await api.reorderCustomerOrder(orderId);
      if (res.success && res.reorder) {
        setReorderData(res.reorder);
        setReorderModalOpen(true);
      } else {
        alert(res.message || 'Could not verify reorder availability.');
      }
    } catch (err) {
      alert(`Could not retrieve reorder details: ${err.message}`);
    } finally {
      setReorderingId(null);
    }
  };

  const handleConfirmReorder = () => {
    if (!reorderData || !reorderData.availableItems || reorderData.availableItems.length === 0) {
      alert('There are no available items to add to your cart from this order.');
      return;
    }

    let addedCount = 0;
    for (const item of reorderData.availableItems) {
      if (item.quantityToAdd > 0 && item.product) {
        addToCart(
          {
            id: item.productId,
            name: item.productName || item.product.name,
            slug: item.slug || item.product.slug,
            price: item.currentPrice,
            imageUrl: item.imageUrl || item.product.imageUrl,
            stock: item.availableStock
          },
          item.quantityToAdd,
          item.variant || null
        );
        addedCount++;
      }
    }

    setReorderModalOpen(false);
    setReorderData(null);

    if (addedCount > 0) {
      openCart();
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomerOrders();
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (err) {
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async () => {
    if (!cancellingId) return;
    try {
      await api.cancelCustomerOrder(cancellingId, cancelReason);
      setCancelModalOpen(false);
      setCancellingId(null);
      setCancelReason('');
      await fetchOrders();
    } catch (err) {
      alert(`Could not cancel order: ${err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Out for Delivery':
      case 'Shipped':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Packing':
      case 'Packed':
      case 'Processing':
      case 'Confirmed':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Cancelled':
      case 'Returned':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-burgundy-900/10 mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-burgundy-950">
            My Sanctuary Orders
          </h1>
          <p className="text-xs text-burgundy-800/70 mt-1">
            Track shipments, inspect fulfilment logs, reorder past favourites, or request cancellations
          </p>
        </div>
        <Link
          to="/shop"
          className="px-5 py-2.5 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-full hover:bg-burgundy-950 transition-colors shadow-sm"
        >
          Explore More Candles
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs text-burgundy-800/70">Retrieving your orders from the archives...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-burgundy-900/10 space-y-4">
          <PackageCheck className="w-16 h-16 text-gold-500/50 mx-auto" />
          <h3 className="font-serif text-xl font-bold text-burgundy-950">
            No Orders Placed Yet
          </h3>
          <p className="text-xs text-burgundy-800/70 max-w-sm mx-auto">
            Your sanctuary candle collection is waiting. Discover our hand-poured brass diyas and pure soy scented jars.
          </p>
          <Link
            to="/shop"
            className="inline-block px-6 py-2.5 bg-burgundy-900 text-gold-300 font-serif font-bold text-xs uppercase tracking-wider rounded-full hover:bg-burgundy-950 transition-colors shadow-sm"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const canCancel = ['Pending', 'Confirmed', 'Processing'].includes(order.orderStatus);
            const isTimelineOpen = Boolean(expandedTimelines[order.id]);

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-burgundy-900/10 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-cream-200 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-serif font-bold text-base text-burgundy-950">
                        #{order.orderNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full border ${getStatusBadge(
                          order.orderStatus
                        )}`}
                      >
                        {order.orderStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-burgundy-800/60">
                      Placed on {formatDate(order.createdAt)} &bull; Payment:{' '}
                      <strong className="text-burgundy-900">
                        {order.paymentMethod} ({order.paymentStatus})
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
                    <button
                      type="button"
                      disabled={reorderingId === order.id}
                      onClick={() => handleOpenReorderModal(order.id)}
                      className="px-3 py-1.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                      title="Reorder these items using current live prices and available stock"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-gold-400" />
                      <span>{reorderingId === order.id ? 'Checking Stock...' : 'Reorder'}</span>
                    </button>

                    <Link
                      to={`/track?order=${order.orderNumber}&phone=${order.customerPhone}`}
                      className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-burgundy-900 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>Track Live</span>
                      <ExternalLink className="w-3.5 h-3.5 text-gold-600" />
                    </Link>

                    {canCancel && (
                      <button
                        onClick={() => {
                          setCancellingId(order.id);
                          setCancelModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border border-red-200"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Cancel Order</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Items preview */}
                <div className="py-4 space-y-3">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        {item.product?.imageUrl && (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded-lg border border-gold-500/20"
                          />
                        )}
                        <div>
                          <p className="font-serif font-semibold text-burgundy-950">
                            {item.variantName
                              ? `${item.productName || item.product?.name} (${item.variantName})`
                              : (item.productName || item.product?.name || 'Artisanal Candle')}
                          </p>
                          <p className="text-[11px] text-burgundy-800/60">
                            Qty: {item.quantity} &bull; {formatPrice(item.unitPrice)} each
                            {item.variantSku && <span className="ml-1.5 font-mono text-[10px] text-gold-700">SKU: {item.variantSku}</span>}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-burgundy-950">
                        {formatPrice(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Summary footer */}
                <div className="pt-3 border-t border-cream-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-burgundy-800/80 gap-3">
                  <div className="space-y-1">
                    <div>
                      <span>Delivery Address: </span>
                      <strong className="text-burgundy-950">
                        {order.shippingAddress}, {order.city}, {order.state} - {order.postalCode}
                      </strong>
                    </div>
                    {order.deliveryPartner && (
                      <p className="text-[11px] text-purple-700">
                        Courier: <strong>{order.deliveryPartner}</strong>
                        {order.trackingNumber && ` (AWB: ${order.trackingNumber})`}
                      </p>
                    )}
                  </div>
                  <div className="text-right self-end sm:self-auto flex items-center gap-4">
                    <div>
                      <span className="text-xs text-burgundy-800/70">Total: </span>
                      <strong className="text-base text-burgundy-950 font-serif">
                        {formatPrice(order.total)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Action Toolbar for Timeline and Support */}
                <div className="mt-3 pt-3 border-t border-cream-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => toggleTimeline(order.id)}
                    className="text-gold-700 hover:text-gold-800 font-semibold flex items-center gap-1.5"
                  >
                    <span>{isTimelineOpen ? 'Hide Fulfilment Timeline' : 'View Fulfilment Timeline'}</span>
                    {isTimelineOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <Link
                    to="/contact"
                    className="text-burgundy-700 hover:text-burgundy-900 font-medium flex items-center gap-1"
                  >
                    <Headphones className="w-3.5 h-3.5 text-gold-600" />
                    <span>Concierge Assistance</span>
                  </Link>
                </div>

                {/* Expandable Fulfilment Timeline */}
                {isTimelineOpen && (
                  <div className="mt-4 pt-4 border-t border-cream-200 bg-cream-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                    <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-burgundy-950 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gold-600" />
                      <span>Fulfilment History & Status Logs</span>
                    </h4>
                    {Array.isArray(order.statusLogs) && order.statusLogs.length > 0 ? (
                      <div className="space-y-3 relative border-l-2 border-gold-500/40 ml-2 pl-4">
                        {order.statusLogs.map((log) => (
                          <div key={log.id} className="relative space-y-0.5">
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gold-500 border border-white"></div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-burgundy-950">
                                {log.toStatus}
                              </span>
                              <span className="text-[10px] text-burgundy-800/60 font-mono">
                                {formatDate(log.createdAt)}
                              </span>
                            </div>
                            {log.notes && (
                              <p className="text-xs text-burgundy-800/80 italic">
                                {log.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-burgundy-800/60 italic">
                        Order received in sanctuary workshop. Awaiting processing.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reorder Preview & Confirmation Modal */}
      {reorderModalOpen && reorderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-burgundy-900/10 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-cream-200">
              <div>
                <h3 className="font-serif text-xl font-bold text-burgundy-950 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-gold-600" />
                  <span>Reorder Previous Candles</span>
                </h3>
                <p className="text-xs text-burgundy-800/70 mt-1">
                  Items are revalidated against current workshop inventory and catalog pricing.
                </p>
              </div>
              <button
                onClick={() => setReorderModalOpen(false)}
                className="p-1 text-burgundy-900/50 hover:text-burgundy-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price change or out-of-stock notices */}
            {reorderData.priceChangedItems && reorderData.priceChangedItems.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Price Update Notice:</p>
                  <p>
                    Catalog prices have evolved since your initial purchase. Items will be added at their current active workshop price.
                  </p>
                </div>
              </div>
            )}

            {reorderData.unavailableItems && reorderData.unavailableItems.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Workshop Stock Notice:</p>
                  <p>
                    {reorderData.unavailableItems.length} item(s) from this previous order are currently out of stock or archived.
                  </p>
                </div>
              </div>
            )}

            {/* Line items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {reorderData.items.map((item) => (
                <div
                  key={item.orderItemId}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    item.isAvailable
                      ? 'bg-cream-50/50 border-gold-500/20'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-serif font-bold text-burgundy-950">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-burgundy-800/70">
                      Qty: <strong>{item.quantityToAdd}</strong>
                      {item.quantityToAdd < item.requestedQuantity && (
                        <span className="text-amber-700 ml-1">
                          (Limited from original {item.requestedQuantity})
                        </span>
                      )}
                    </p>
                    {item.priceChanged && (
                      <p className="text-[10px] text-amber-800 font-semibold">
                        Previous: {formatPrice(item.historicalPrice)} &rarr; Current: {formatPrice(item.currentPrice)}
                      </p>
                    )}
                    {!item.isAvailable && (
                      <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-bold bg-red-100 text-red-800 rounded">
                        {item.reasonUnavailable || 'Unavailable'}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="font-serif font-bold text-sm text-burgundy-950 block">
                      {formatPrice(item.currentPrice * item.quantityToAdd)}
                    </span>
                    <span className="text-[10px] text-burgundy-800/60">
                      {formatPrice(item.currentPrice)} each
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-cream-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReorderModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-burgundy-800 hover:text-burgundy-950"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reorderData.availableItems || reorderData.availableItems.length === 0}
                onClick={handleConfirmReorder}
                className="px-5 py-2.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-serif text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-gold-400" />
                <span>Confirm & Add Available Items to Cart</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-burgundy-900/10 space-y-4">
            <h3 className="font-serif text-xl font-bold text-burgundy-950">
              Cancel Order
            </h3>
            <p className="text-xs text-burgundy-800/70">
              Are you sure you wish to cancel this order? Any reserved candle inventory will be immediately restored to the workshop.
            </p>
            <div>
              <label className="block text-xs font-medium text-burgundy-900 mb-1">
                Reason for cancellation (optional):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed my mind, ordered duplicate items..."
                rows={3}
                className="w-full p-2.5 bg-cream-50 border border-burgundy-900/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setCancelModalOpen(false);
                  setCancellingId(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-burgundy-800 hover:text-burgundy-950"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

