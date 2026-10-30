import React, { useEffect, useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus,
  Save,
  History,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Filter
} from 'lucide-react';
import { api } from '../../utils/api.js';
import { formatPrice, formatDate } from '../../utils/formatters.js';

export default function AdminInventory() {
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'logs'

  // Products & Stock State
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [feedback, setFeedback] = useState('');

  // Stock Adjustment Modal
  const [adjustModalProduct, setAdjustModalProduct] = useState(null);
  const [newStockValue, setNewStockValue] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [savingStock, setSavingStock] = useState(false);
  const [modalError, setModalError] = useState('');

  // Movement Logs State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logTypeFilter, setLogTypeFilter] = useState('ALL');
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);

  const QUICK_REASONS = [
    'Artisanal batch restock received',
    'Damaged jar / wax transit casualty',
    'Physical warehouse count audit reconciliation',
    'Promotional press / Diwali VIP gifting allocation',
    'Customer return inspected & restocked'
  ];

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const res = await api.getAdminProducts();
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadLogs(page = 1, type = logTypeFilter) {
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 15);
      if (type !== 'ALL') params.append('type', type);

      const res = await api.getInventoryLogs(`?${params.toString()}`);
      if (res.success) {
        setLogs(res.logs);
        setLogTotalPages(res.pagination?.pages || 1);
        setLogPage(page);
      }
    } catch (err) {
      console.error('Failed to load inventory logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs(1, logTypeFilter);
    }
  }, [activeTab, logTypeFilter]);

  const openAdjustModal = (product) => {
    setAdjustModalProduct(product);
    setNewStockValue(product.stock.toString());
    setAdjustmentReason('');
    setModalError('');
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustmentReason.trim()) {
      setModalError('A reason is mandatory for manual stock adjustments.');
      return;
    }
    const val = parseInt(newStockValue, 10);
    if (isNaN(val) || val < 0) {
      setModalError('Please enter a valid non-negative stock quantity.');
      return;
    }

    setSavingStock(true);
    setModalError('');
    try {
      const res = await api.updateStock(adjustModalProduct.id, val, adjustmentReason.trim());
      if (res.success) {
        setFeedback(`Stock for ${adjustModalProduct.name} updated to ${val} units.`);
        setTimeout(() => setFeedback(''), 3000);
        setAdjustModalProduct(null);
        loadProducts();
        if (activeTab === 'logs') loadLogs(1);
      }
    } catch (err) {
      setModalError(err.message || 'Failed to update stock');
    } finally {
      setSavingStock(false);
    }
  };

  const lowStockCount = products.filter(
    (p) => p.stock <= (p.lowStockThreshold || 10) && p.stock > 0
  ).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-gold-600 block">
            Warehouse & Atelier Operations
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-900">
            Artisanal Inventory & Movement Logs
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              loadProducts();
              if (activeTab === 'logs') loadLogs(logPage);
            }}
            className="px-4 py-2 bg-white border border-burgundy-900/15 hover:border-burgundy-900 text-burgundy-900 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingProducts || loadingLogs ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-burgundy-900/10 shadow-sm">
          <span className="text-xs font-semibold text-burgundy-800/70 uppercase">Catalog SKUs</span>
          <div className="font-serif text-2xl font-bold text-burgundy-900 mt-1">{products.length} Items</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-300 shadow-sm bg-amber-50/50">
          <span className="text-xs font-semibold text-amber-900 uppercase">
            Low Stock Alerts (&le; Threshold)
          </span>
          <div className="font-serif text-2xl font-bold text-amber-900 mt-1">{lowStockCount} SKUs</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-red-300 shadow-sm bg-red-50/50">
          <span className="text-xs font-semibold text-red-900 uppercase">Sold Out Batches</span>
          <div className="font-serif text-2xl font-bold text-red-900 mt-1">{outOfStockCount} SKUs</div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-burgundy-900/10 space-x-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          className={`pb-3 transition-colors flex items-center space-x-2 ${
            activeTab === 'stock'
              ? 'text-burgundy-900 border-b-2 border-gold-600 font-bold'
              : 'text-burgundy-800/60 hover:text-burgundy-950'
          }`}
        >
          <Boxes className="w-4 h-4 text-gold-600" />
          <span>Current Stock Levels ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`pb-3 transition-colors flex items-center space-x-2 ${
            activeTab === 'logs'
              ? 'text-burgundy-900 border-b-2 border-gold-600 font-bold'
              : 'text-burgundy-800/60 hover:text-burgundy-950'
          }`}
        >
          <History className="w-4 h-4 text-gold-600" />
          <span>Inventory Movement History</span>
        </button>
      </div>

      {/* Tab 1: Current Stock Levels */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-3xl border border-burgundy-900/10 shadow-sm overflow-hidden">
          {loadingProducts ? (
            <div className="p-12 text-center text-xs text-burgundy-800/60 animate-pulse">
              Loading inventory levels...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-cream-50/80 border-b border-burgundy-900/10 text-burgundy-900 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-6">Product & SKU</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Current Stock</th>
                    <th className="py-3.5 px-4">Threshold</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-burgundy-900/5">
                  {products.map((p) => {
                    const threshold = p.lowStockThreshold || 10;
                    const isLow = p.stock > 0 && p.stock <= threshold;
                    const isOut = p.stock === 0;

                    return (
                      <tr key={p.id} className="hover:bg-cream-50/50 transition-colors">
                        <td className="py-4 px-6 flex items-center space-x-3.5">
                          <img
                            src={p.imageUrl}
                            alt=""
                            className="w-10 h-10 object-cover rounded-xl border border-gold-500/20 shrink-0"
                          />
                          <div>
                            <span className="font-serif font-bold text-sm text-burgundy-950 block">
                              {p.name}
                            </span>
                            <span className="font-mono text-[10px] text-gold-700 bg-gold-50 px-1.5 py-0.5 rounded border border-gold-400/30">
                              {p.sku || 'SKU-PENDING'}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4 font-medium text-burgundy-900">{p.category}</td>

                        <td className="py-4 px-4 font-serif font-bold text-burgundy-900">
                          {formatPrice(p.price)}
                        </td>

                        <td className="py-4 px-4 font-bold text-sm text-burgundy-950">
                          {p.stock} units
                        </td>

                        <td className="py-4 px-4 text-burgundy-800/70 font-mono">
                          {threshold} units
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                              isOut
                                ? 'bg-neutral-800 text-neutral-200'
                                : isLow
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Healthy Stock'}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => openAdjustModal(p)}
                            className="px-3.5 py-1.5 bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Inventory Movement History Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Movement Type Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            <span className="text-burgundy-800/70 font-semibold flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-gold-600" /> Filter Type:
            </span>
            {['ALL', 'SALE', 'CANCELLATION', 'MANUAL_ADJUSTMENT', 'RETURN', 'INITIAL'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setLogTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  logTypeFilter === t
                    ? 'bg-burgundy-900 text-gold-300'
                    : 'bg-white border border-burgundy-900/10 text-burgundy-900 hover:bg-cream-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-burgundy-900/10 shadow-sm overflow-hidden">
            {loadingLogs ? (
              <div className="p-12 text-center text-xs text-burgundy-800/60 animate-pulse">
                Loading movement audit logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-xs text-burgundy-800/70 space-y-2">
                <FileText className="w-8 h-8 text-gold-500 mx-auto" />
                <p>No inventory movements recorded under this filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-cream-100/70 border-b border-burgundy-900/10 text-burgundy-950 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-6">Timestamp</th>
                      <th className="py-3.5 px-6">Candle Item & SKU</th>
                      <th className="py-3.5 px-4">Movement Type</th>
                      <th className="py-3.5 px-4">Stock Change</th>
                      <th className="py-3.5 px-4">Balance (Prev &rarr; New)</th>
                      <th className="py-3.5 px-6">Reason / Reference</th>
                      <th className="py-3.5 px-4">Authorized By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-burgundy-900/5">
                    {logs.map((log) => {
                      const isPositive = log.change > 0;
                      return (
                        <tr key={log.id} className="hover:bg-cream-50/50 transition-colors">
                          <td className="py-3.5 px-6 text-burgundy-800/70 font-mono text-[11px]">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="py-3.5 px-6">
                            <span className="font-semibold text-burgundy-950 block">
                              {log.product?.name || 'Unknown Product'}
                            </span>
                            <span className="font-mono text-[10px] text-gold-700">
                              {log.product?.sku || 'SKU'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                log.type === 'SALE'
                                  ? 'bg-blue-100 text-blue-800'
                                  : log.type === 'CANCELLATION'
                                  ? 'bg-amber-100 text-amber-900'
                                  : log.type === 'MANUAL_ADJUSTMENT'
                                  ? 'bg-purple-100 text-purple-900'
                                  : 'bg-emerald-100 text-emerald-900'
                              }`}
                            >
                              {log.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold">
                            <span
                              className={`flex items-center gap-0.5 ${
                                isPositive ? 'text-emerald-700' : 'text-red-700'
                              }`}
                            >
                              {isPositive ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              )}
                              {log.change > 0 ? `+${log.change}` : log.change}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-burgundy-900">
                            {log.previousStock} &rarr;{' '}
                            <strong className="text-burgundy-950 font-bold">{log.newStock}</strong>
                          </td>
                          <td className="py-3.5 px-6 text-burgundy-900 max-w-xs break-words">
                            {log.reason}
                          </td>
                          <td className="py-3.5 px-4 text-burgundy-800/70 font-mono text-[11px]">
                            {log.user?.name || 'System / Automated'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {logTotalPages > 1 && (
            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-burgundy-800/70">
                Page {logPage} of {logTotalPages}
              </span>
              <div className="space-x-2">
                <button
                  type="button"
                  disabled={logPage <= 1}
                  onClick={() => loadLogs(logPage - 1)}
                  className="px-3 py-1 bg-white border border-burgundy-900/20 rounded-lg disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={logPage >= logTotalPages}
                  onClick={() => loadLogs(logPage + 1)}
                  className="px-3 py-1 bg-white border border-burgundy-900/20 rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock Adjustment Modal (Requires Mandatory Reason) */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-burgundy-900/10 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-burgundy-900/10">
              <div>
                <span className="text-[10px] uppercase font-bold text-gold-600 block">
                  Mandatory Audit Log
                </span>
                <h3 className="font-serif text-lg font-bold text-burgundy-950">
                  Adjust Inventory Stock
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAdjustModalProduct(null)}
                className="text-burgundy-800/60 hover:text-burgundy-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-cream-50 p-3.5 rounded-2xl border border-burgundy-900/10 text-xs space-y-1">
              <div className="font-serif font-bold text-burgundy-950">
                {adjustModalProduct.name}
              </div>
              <div className="flex justify-between text-burgundy-800/70">
                <span>SKU: <strong className="text-burgundy-900">{adjustModalProduct.sku || 'N/A'}</strong></span>
                <span>Current Workshop Stock: <strong>{adjustModalProduct.stock} units</strong></span>
              </div>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-burgundy-900 mb-1">
                  New Total Stock Quantity (Units) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 font-bold text-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
                <span className="text-[10px] text-burgundy-800/60 block mt-1">
                  Delta Change:{' '}
                  <strong>
                    {parseInt(newStockValue || 0, 10) - adjustModalProduct.stock > 0 ? '+' : ''}
                    {parseInt(newStockValue || 0, 10) - adjustModalProduct.stock} units
                  </strong>
                </span>
              </div>

              <div>
                <label className="block font-semibold text-burgundy-900 mb-1">
                  Mandatory Audit Reason *
                </label>
                <input
                  type="text"
                  required
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Received Diwali batch shipment PO #204"
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-burgundy-900/15 rounded-xl text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              {/* Quick Reason Suggestions */}
              <div>
                <span className="text-[10px] font-semibold text-burgundy-800/60 block mb-1.5">
                  Quick Standard Reasons:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REASONS.map((qr) => (
                    <button
                      key={qr}
                      type="button"
                      onClick={() => setAdjustmentReason(qr)}
                      className="px-2 py-1 bg-cream-100 hover:bg-gold-100 text-burgundy-950 text-[10px] rounded-lg transition-colors border border-burgundy-900/10 text-left"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-burgundy-900/10 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-4 py-2 border border-burgundy-900/20 text-burgundy-800 rounded-xl hover:bg-cream-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStock || !adjustmentReason.trim()}
                  className="px-5 py-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-serif font-bold uppercase tracking-wider rounded-xl shadow-sm disabled:opacity-50"
                >
                  {savingStock ? 'Committing...' : 'Commit Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
