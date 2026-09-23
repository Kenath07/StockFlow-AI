import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import StatCard from '../../../components/common/StatCard';
import Badge from '../../../components/common/Badge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import stockService from '../../../services/api/stockService';
import productService from '../../../services/api/productService';
import reportService from '../../../services/api/reportService';
import { formatDateTime } from '../../../utils/formatters';
import {
  Package, AlertTriangle, ArrowLeftRight, ScanLine,
  ArrowRight, Plus, RefreshCw, BarChart3, Gauge
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function StorekeeperDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    totalMovements: 0,
    stockLevels: [],
    lowStockItems: [],
    recentMovements: [],
  });

  useEffect(() => {
    fetchStorekeeperData();
  }, []);

  const fetchStorekeeperData = async () => {
    setLoading(true);
    try {
      const [productsRes, lowStockRes, movementsRes, stockRes] = await Promise.allSettled([
        productService.getAll(),
        reportService.getLowStock(),
        stockService.getMovements({ limit: 10 }),
        stockService.getLevels(),
      ]);

      const products = productsRes.status === 'fulfilled' ? (Array.isArray(productsRes.value) ? productsRes.value : (productsRes.value?.items || [])) : [];
      const lowStock = lowStockRes.status === 'fulfilled' ? (Array.isArray(lowStockRes.value) ? lowStockRes.value : []) : [];
      const movements = movementsRes.status === 'fulfilled' ? (Array.isArray(movementsRes.value) ? movementsRes.value : (movementsRes.value?.items || [])) : [];
      const stock = stockRes.status === 'fulfilled' ? (Array.isArray(stockRes.value) ? stockRes.value : []) : [];

      setStats({
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        totalMovements: movements.length,
        stockLevels: stock.slice(0, 8),
        lowStockItems: lowStock.slice(0, 6),
        recentMovements: movements.slice(0, 6),
      });
    } catch (err) {
      console.error('Storekeeper dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading warehouse inventory..." />;

  const stockChartData = stats.stockLevels.map((s) => ({
    name: s.productName?.substring(0, 12) || s.sku || 'Item',
    stock: s.onHandQuantity ?? s.quantityOnHand ?? s.quantity ?? 0,
    threshold: s.minimumThreshold ?? s.reorderPoint ?? 10,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Storekeeper Desk 👋
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Logged in as {user?.name || user?.fullName || 'Storekeeper'} &bull; Warehouse Stock &amp; Floor Operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/inventory/products')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-50 hover:border-stone-300 transition-all shadow-xs"
          >
            <ScanLine className="w-4 h-4 text-stone-500" />
            Product Catalogue
          </button>
          <button
            onClick={() => navigate('/inventory/movements')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-xs hover:shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Stock Movement
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Catalogued SKUs"
          value={stats.totalProducts}
          icon={Package}
          color="indigo"
          subtitle="Active warehouse items"
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          color={stats.lowStockCount > 0 ? "rose" : "emerald"}
          subtitle="Below safety threshold"
        />
        <StatCard
          title="Recent Movements"
          value={stats.totalMovements}
          icon={ArrowLeftRight}
          color="amber"
          subtitle="Inbound & Outbound logs"
        />
        <StatCard
          title="Threshold Monitors"
          value={stats.stockLevels.length}
          icon={Gauge}
          color="teal"
          subtitle="Monitored stock items"
        />
      </div>

      {/* Main Charts / Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Levels Chart */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Stock on Hand vs Min Threshold</h3>
              <p className="text-xs text-stone-500">Live warehouse bin comparison</p>
            </div>
            <button
              onClick={() => navigate('/inventory/stock')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors flex items-center gap-1"
            >
              Full list <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {stockChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stockChartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ea" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e7e5e4',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  labelStyle={{ color: '#1c1917', fontWeight: 'bold' }}
                />
                <Bar dataKey="stock" fill="#6366f1" radius={[6, 6, 0, 0]} name="On Hand" />
                <Bar dataKey="threshold" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Min Threshold" opacity={0.65} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-stone-400">
              <BarChart3 className="w-10 h-10 stroke-1 mb-2 text-stone-300" />
              <p className="text-sm">No stock data available</p>
            </div>
          )}
        </div>

        {/* Low Stock Attention List */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Low Stock Urgent Attention
              </h3>
              <p className="text-xs text-stone-500">Items requiring immediate reorder or replenishment</p>
            </div>
            <button
              onClick={() => navigate('/inventory/thresholds')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors flex items-center gap-1"
            >
              Thresholds <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {stats.lowStockItems.length > 0 ? (
            <div className="space-y-2.5">
              {stats.lowStockItems.map((item, idx) => (
                <div
                  key={item.id || item.productId || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-50/70 border border-stone-200/60 hover:bg-stone-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-100/80 text-rose-700 flex items-center justify-center font-bold text-xs">
                      !
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{item.productName || item.name || item.sku}</p>
                      <p className="text-xs text-stone-500">SKU: {item.sku || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-600">
                      {item.onHandQuantity ?? item.quantityOnHand ?? 0} on hand
                    </span>
                    <p className="text-2xs text-stone-400">Min: {item.minimumThreshold ?? item.reorderPoint ?? 0}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-stone-400">
              <Package className="w-10 h-10 stroke-1 mb-2 text-emerald-400" />
              <p className="text-sm font-medium text-stone-700">All stock levels healthy!</p>
              <p className="text-xs text-stone-400">No items currently below minimum threshold</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Movements Feed */}
      <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Recent Warehouse Stock Movements</h3>
            <p className="text-xs text-stone-500">Latest receipts, dispatches, and manual adjustments</p>
          </div>
          <button
            onClick={() => navigate('/inventory/movements')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors flex items-center gap-1"
          >
            All movements <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {stats.recentMovements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="text-xs text-stone-400 uppercase bg-stone-50/50 border-b border-stone-200/70">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Product / SKU</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3">Reference / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {stats.recentMovements.map((m, idx) => (
                  <tr key={m.id || idx} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-xs text-stone-500">{formatDateTime(m.createdAt || m.date)}</td>
                    <td className="py-2.5 px-3 font-medium text-stone-900">{m.productName || m.sku || 'Item'}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={m.type === 'Receipt' || m.type === 'Purchase' ? 'success' : m.type === 'Sale' ? 'default' : 'warning'}>
                        {m.type || 'Movement'}
                      </Badge>
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold ${(m.quantity || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {(m.quantity || 0) > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-stone-500 truncate max-w-xs">{m.reference || m.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-stone-400">
            <RefreshCw className="w-8 h-8 stroke-1 mx-auto mb-2 text-stone-300" />
            <p className="text-sm">No stock movements recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
