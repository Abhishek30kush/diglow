import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Package,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Eye,
  RefreshCw,
  Sparkles,
  Download,
  Truck,
  RotateCcw,
  Box
} from 'lucide-react';
import { api } from '../../utils/api.js';
import { formatPrice, formatDate } from '../../utils/formatters.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesSummary, setSalesSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all'); // 'all', 'today', 'week', 'month', 'year'
  const [exportingSales, setExportingSales] = useState(false);

  async function loadDashboard(selectedRange = dateRange) {
    setLoading(true);
    try {
      const rangeParam = selectedRange !== 'all' ? `?range=${selectedRange}` : '';
      const [dashRes, salesRes] = await Promise.all([
        api.getDashboardStats(rangeParam),
        api.getSalesSummary()
      ]);

      if (dashRes.success) {
        setStats(dashRes.stats);
        setRecentOrders(dashRes.recentOrders || []);
      }
      if (salesRes.success) {
        setSalesSummary(salesRes);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard(dateRange);
  }, [dateRange]);

  const handleExportSalesCsv = async () => {
    setExportingSales(true);
    try {
      const csvData = await api.exportSalesCsv();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `diglow_sales_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExportingSales(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-cream-300 rounded w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border" />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-gold-600 block">
            Executive Overview
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-900">
            DiGlow Operations Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportSalesCsv}
            disabled={exportingSales}
            className="px-4 py-2 bg-cream-100 hover:bg-cream-200 text-burgundy-900 border border-burgundy-900/15 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-gold-600" />
            <span>{exportingSales ? 'Exporting...' : 'Export Sales CSV'}</span>
          </button>

          <button
            type="button"
            onClick={loadDashboard}
            className="px-4 py-2 bg-white border border-burgundy-900/15 hover:border-burgundy-900 text-burgundy-900 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-burgundy-900/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          <span className="text-burgundy-800/70 font-semibold uppercase tracking-wider text-[10px] shrink-0">
            Reporting Window:
          </span>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'year', label: 'This Year' }
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setDateRange(r.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                dateRange === r.id
                  ? 'bg-burgundy-900 text-gold-300 shadow-sm'
                  : 'bg-cream-50 text-burgundy-900 hover:bg-cream-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-burgundy-800/60 font-mono">
          Live queries &bull; Server calculated
        </div>
      </div>

      {/* Low-Stock Alert Warning Banner */}
      {stats?.lowStockProducts > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-4 text-amber-900 text-xs shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <strong className="block font-bold">
                Low Inventory Warning ({stats.lowStockProducts} products)
              </strong>
              <span>
                Certain handcrafted candle lines have fallen to or below workshop threshold.
              </span>
            </div>
          </div>
          <Link
            to="/admin/inventory"
            className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-gold-300 font-semibold rounded-xl shrink-0 transition-colors"
          >
            Manage Stock &rarr;
          </Link>
        </div>
      )}

      {/* Comprehensive Executive Analytics Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Net Sales */}
        <div className="bg-white rounded-3xl p-5 border border-burgundy-900/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-burgundy-800/60 uppercase tracking-wider">
              Net Sales (Paid)
            </span>
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-burgundy-950">
            {formatPrice(stats?.netSales ?? stats?.totalRevenue ?? 0)}
          </div>
          <p className="text-[10px] text-emerald-800 font-medium">Excludes cancellations</p>
        </div>

        {/* Gross Sales */}
        <div className="bg-white rounded-3xl p-5 border border-burgundy-900/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-burgundy-800/60 uppercase tracking-wider">
              Gross Sales (Placed)
            </span>
            <div className="w-7 h-7 rounded-full bg-gold-100 flex items-center justify-center text-gold-700">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-burgundy-950">
            {formatPrice(stats?.grossSales ?? stats?.totalRevenue ?? 0)}
          </div>
          <p className="text-[10px] text-burgundy-800/60">Total demand value</p>
        </div>

        {/* Order Count */}
        <div className="bg-white rounded-3xl p-5 border border-burgundy-900/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-burgundy-800/60 uppercase tracking-wider">
              Order Volume
            </span>
            <div className="w-7 h-7 rounded-full bg-burgundy-100 flex items-center justify-center text-burgundy-900">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-burgundy-950">
            {stats?.totalOrders || 0}
          </div>
          <p className="text-[10px] text-burgundy-800/60">
            {stats?.paidOrders || 0} verified paid
          </p>
        </div>

        {/* Average Order Value */}
        <div className="bg-white rounded-3xl p-5 border border-burgundy-900/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-burgundy-800/60 uppercase tracking-wider">
              Avg Order Value
            </span>
            <div className="w-7 h-7 rounded-full bg-cream-200 flex items-center justify-center text-burgundy-900">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-burgundy-950">
            {formatPrice(stats?.averageOrderValue || 0)}
          </div>
          <p className="text-[10px] text-burgundy-800/60">Basket size metric</p>
        </div>

        {/* Cancellations & Refunds */}
        <div className="bg-white rounded-3xl p-5 border border-burgundy-900/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-burgundy-800/60 uppercase tracking-wider">
              Cancellations
            </span>
            <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-700">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-red-900">
            {stats?.cancellations?.count || 0} Orders
          </div>
          <p className="text-[10px] text-red-700 font-medium">
            {formatPrice(stats?.refundedAmount || stats?.cancellations?.amount || 0)} refunded
          </p>
        </div>

        {/* Low-Stock SKUs */}
        <div className="bg-white rounded-3xl p-5 border border-burgundy-900/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-burgundy-800/60 uppercase tracking-wider">
              Low Stock Alert
            </span>
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-amber-900">
            {stats?.lowStockProducts || 0} SKUs
          </div>
          <p className="text-[10px] text-amber-900 font-medium">
            <Link to="/admin/inventory" className="underline hover:text-amber-950">
              Restock needed
            </Link>
          </p>
        </div>
      </div>

      {/* Phase 10 Fulfilment Pipeline Operations Grid */}
      <div className="bg-white rounded-3xl p-6 border border-burgundy-900/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-burgundy-900/10 pb-3">
          <div>
            <span className="text-[10px] font-bold text-gold-600 uppercase tracking-wider block">
              Fulfilment Lifecycle
            </span>
            <h3 className="font-serif text-lg font-bold text-burgundy-900">
              Warehouse & Delivery Operations Status
            </h3>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs text-burgundy-800/80 hover:text-burgundy-950 font-semibold flex items-center space-x-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
          {/* Pending */}
          <Link
            to="/admin/orders?status=Pending"
            className="p-3.5 bg-cream-50 hover:bg-cream-100 rounded-2xl border border-burgundy-900/10 transition-all block group"
          >
            <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="font-serif font-bold text-xl text-burgundy-950">
              {stats?.pendingOrders || 0}
            </div>
            <span className="text-[10px] font-bold text-burgundy-800/70 uppercase tracking-wider">
              Pending
            </span>
          </Link>

          {/* Confirmed */}
          <Link
            to="/admin/orders?status=Confirmed"
            className="p-3.5 bg-cream-50 hover:bg-cream-100 rounded-2xl border border-burgundy-900/10 transition-all block group"
          >
            <CheckCircle2 className="w-4 h-4 text-blue-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="font-serif font-bold text-xl text-burgundy-950">
              {stats?.confirmedOrders || 0}
            </div>
            <span className="text-[10px] font-bold text-burgundy-800/70 uppercase tracking-wider">
              Confirmed
            </span>
          </Link>

          {/* Processing */}
          <Link
            to="/admin/orders?status=Processing"
            className="p-3.5 bg-cream-50 hover:bg-cream-100 rounded-2xl border border-burgundy-900/10 transition-all block group"
          >
            <RefreshCw className="w-4 h-4 text-indigo-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="font-serif font-bold text-xl text-burgundy-950">
              {stats?.processingOrders || 0}
            </div>
            <span className="text-[10px] font-bold text-burgundy-800/70 uppercase tracking-wider">
              Processing
            </span>
          </Link>

          {/* Packed */}
          <Link
            to="/admin/orders?status=Packed"
            className="p-3.5 bg-cream-50 hover:bg-cream-100 rounded-2xl border border-burgundy-900/10 transition-all block group"
          >
            <Box className="w-4 h-4 text-teal-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="font-serif font-bold text-xl text-burgundy-950">
              {stats?.packedOrders || 0}
            </div>
            <span className="text-[10px] font-bold text-burgundy-800/70 uppercase tracking-wider">
              Packed
            </span>
          </Link>

          {/* Shipped */}
          <Link
            to="/admin/orders?status=Shipped"
            className="p-3.5 bg-cream-50 hover:bg-cream-100 rounded-2xl border border-burgundy-900/10 transition-all block group"
          >
            <Truck className="w-4 h-4 text-purple-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="font-serif font-bold text-xl text-burgundy-950">
              {stats?.shippedOrders || 0}
            </div>
            <span className="text-[10px] font-bold text-burgundy-800/70 uppercase tracking-wider">
              Shipped
            </span>
          </Link>

          {/* Out for Delivery */}
          <Link
            to="/admin/delivery?status=Out for Delivery"
            className="p-3.5 bg-purple-50 hover:bg-purple-100 rounded-2xl border border-purple-200 transition-all block group"
          >
            <Truck className="w-4 h-4 text-purple-900 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="font-serif font-bold text-xl text-purple-950">
              {stats?.outForDeliveryOrders || 0}
            </div>
            <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider">
              Out for Del.
            </span>
          </Link>

          {/* Delivered */}
          <Link
            to="/admin/orders?status=Delivered"
            className="p-3.5 bg-emerald-50 hover:bg-emerald-100 rounded-2xl border border-emerald-200 transition-all block group"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="font-serif font-bold text-xl text-emerald-950">
              {stats?.deliveredOrders || 0}
            </div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              Delivered
            </span>
          </Link>

          {/* Failed Attempts */}
          <Link
            to="/admin/delivery?status=Failed Delivery"
            className="p-3.5 bg-red-50 hover:bg-red-100 rounded-2xl border border-red-200 transition-all block group"
          >
            <AlertTriangle className="w-4 h-4 text-red-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="font-serif font-bold text-xl text-red-950">
              {stats?.failedDeliveryOrders || 0}
            </div>
            <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider">
              Failed
            </span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Orders Stream & Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Incoming Orders Stream */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-burgundy-900/10 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-burgundy-900/10 pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-burgundy-900">
                Recent Orders Activity
              </h3>
              <p className="text-xs text-burgundy-800/60">
                Live incoming orders needing fulfillment and PIN validation
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-burgundy-900 hover:text-gold-600 flex items-center space-x-1"
            >
              <span>View All Orders &rarr;</span>
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12 text-xs text-burgundy-800/60">
              No orders placed yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-burgundy-900/10 text-burgundy-800/60 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="pb-3">Order Ref</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-burgundy-900/5">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-cream-50/50 transition-colors">
                      <td className="py-3 font-serif font-bold text-burgundy-900">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3">
                        <span className="font-medium text-burgundy-950 block">{ord.customerName}</span>
                        <span className="text-[11px] text-burgundy-800/60">{ord.city}</span>
                      </td>
                      <td className="py-3 font-bold text-burgundy-900">
                        {formatPrice(ord.total)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                            ord.orderStatus === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.orderStatus === 'Cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gold-100 text-burgundy-900'
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to={`/admin/orders/${ord.id}`}
                          className="px-3 py-1 bg-burgundy-900 text-gold-300 rounded-lg text-xs font-semibold hover:bg-burgundy-950 transition-colors inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Manage</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Best-Selling Products Table */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-burgundy-900/10 shadow-sm space-y-5">
          <div className="border-b border-burgundy-900/10 pb-4">
            <h3 className="font-serif text-lg font-bold text-burgundy-900">
              Top-Selling Candles
            </h3>
            <p className="text-xs text-burgundy-800/60">Best performers by volume and revenue</p>
          </div>

          <div className="space-y-3">
            {salesSummary?.topProducts?.length > 0 ? (
              salesSummary.topProducts.map((p) => (
                <div
                  key={p.productId}
                  className="p-3 bg-cream-50/70 rounded-2xl border border-burgundy-900/10 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded-xl border border-gold-500/20"
                      />
                    )}
                    <div>
                      <h4 className="font-serif font-bold text-burgundy-950 truncate max-w-[150px]">
                        {p.name}
                      </h4>
                      <span className="text-[11px] text-burgundy-800/60">
                        {p.unitsSold} units sold
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-serif font-bold text-burgundy-900">
                      {formatPrice(p.totalRevenue)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-burgundy-800/60 text-center py-4">
                No sales data recorded yet.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-burgundy-900/10 flex items-center justify-between">
            <Link
              to="/admin/products"
              className="text-xs font-bold text-burgundy-900 hover:text-gold-600"
            >
              Manage Catalog &rarr;
            </Link>
            <Link
              to="/admin/inventory"
              className="text-xs font-bold text-gold-700 hover:text-gold-900"
            >
              Update Stock &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
