import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import StatCard from '../../../components/common/StatCard';
import Badge from '../../../components/common/Badge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import reportService from '../../../services/api/reportService';
import agentService from '../../../services/api/agentService';
import orderService from '../../../services/api/orderService';
import stockService from '../../../services/api/stockService';
import { formatCurrency, formatDateTime, formatRelativeTime } from '../../../utils/formatters';
import {
  Package, ShoppingCart, BrainCircuit, AlertTriangle,
  TrendingUp, Clock, CheckCircle2, XCircle, ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#6d28d9'];

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    lowStockCount: 0,
    activeWorkflows: 0,
    pendingApprovals: 0,
    openOrders: 0,
    lowStockItems: [],
    workflows: [],
    orders: [],
    stockLevels: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [lowStock, workflows, orders, stockLevels] = await Promise.allSettled([
        reportService.getLowStock(),
        agentService.getAll(),
        orderService.getAll(),
        stockService.getLevels(),
      ]);

      const lowStockData = lowStock.status === 'fulfilled' ? (Array.isArray(lowStock.value) ? lowStock.value : []) : [];
      const workflowData = workflows.status === 'fulfilled' ? (Array.isArray(workflows.value) ? workflows.value : []) : [];
      const orderData = orders.status === 'fulfilled' ? (Array.isArray(orders.value) ? orders.value : []) : [];
      const stockData = stockLevels.status === 'fulfilled' ? (Array.isArray(stockLevels.value) ? stockLevels.value : []) : [];

      setStats({
        lowStockCount: lowStockData.length,
        activeWorkflows: workflowData.length,
        pendingApprovals: workflowData.filter((w) => w.status === 'PendingManagerApproval').length,
        openOrders: orderData.filter((o) => o.status === 'Pending' || o.status === 'Confirmed').length,
        lowStockItems: lowStockData.slice(0, 5),
        workflows: workflowData.slice(0, 5),
        orders: orderData.slice(0, 5),
        stockLevels: stockData.slice(0, 8),
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  // Chart data
  const stockChartData = stats.stockLevels.map((s) => ({
    name: s.productName?.substring(0, 12) || s.sku || 'Item',
    stock: s.onHandQuantity || s.quantity || 0,
    threshold: s.minimumThreshold || s.reorderPoint || 10,
  }));

  const orderStatusData = [
    { name: 'Pending', value: stats.orders.filter((o) => o.status === 'Pending').length || 1 },
    { name: 'Confirmed', value: stats.orders.filter((o) => o.status === 'Confirmed').length || 1 },
    { name: 'Dispatched', value: stats.orders.filter((o) => o.status === 'Dispatched').length || 1 },
    { name: 'Fulfilled', value: stats.orders.filter((o) => o.status === 'Fulfilled').length || 1 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Welcome back, {user?.name || 'Manager'} 👋
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Here's what's happening with your inventory today.
          </p>
        </div>
        {stats.pendingApprovals > 0 && (
          <button
            onClick={() => navigate('/agent/approvals')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-800 text-sm font-semibold hover:bg-orange-100 transition-all shadow-xs"
          >
            <Clock className="w-4 h-4 text-orange-600" />
            {stats.pendingApprovals} Pending Approval{stats.pendingApprovals > 1 ? 's' : ''}
            <ArrowRight className="w-4 h-4 text-orange-600" />
          </button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          color="rose"
          subtitle="SKUs below threshold"
        />
        <StatCard
          title="AI Workflows"
          value={stats.activeWorkflows}
          icon={BrainCircuit}
          color="orange"
          subtitle="Total agent executions"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={Clock}
          color="orange"
          subtitle="Awaiting manager decision"
        />
        <StatCard
          title="Open Orders"
          value={stats.openOrders}
          icon={ShoppingCart}
          color="indigo"
          subtitle="Pending & confirmed"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Levels Chart */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-stone-900">Stock Levels vs Thresholds</h3>
            <button
              onClick={() => navigate('/inventory/stock')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stockChartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ea" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e7e5e4', borderRadius: '12px', fontSize: '12px', color: '#1c1917', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ color: '#1c1917', fontWeight: 'bold' }}
              />
              <Bar dataKey="stock" fill="#6366f1" radius={[6, 6, 0, 0]} name="On-Hand" />
              <Bar dataKey="threshold" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Threshold" opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-stone-900">Order Status Distribution</h3>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {orderStatusData.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e7e5e4', borderRadius: '12px', fontSize: '12px', color: '#1c1917', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {orderStatusData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Workflows */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-orange-600" /> Recent AI Workflows
            </h3>
            <button
              onClick={() => navigate('/agent/workflows')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {stats.workflows.length === 0 ? (
              <p className="text-sm text-stone-500 py-4 text-center">No workflows yet</p>
            ) : (
              stats.workflows.map((wf) => (
                <div
                  key={wf.id}
                  onClick={() => navigate(`/agent/workflows/${wf.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200/60 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center">
                      <BrainCircuit className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">Workflow #{wf.id}</p>
                      <p className="text-xs text-stone-500">{formatRelativeTime(wf.createdAt)}</p>
                    </div>
                  </div>
                  <Badge status={wf.status}>{wf.status}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Critical Stock Warnings
            </h3>
            <button
              onClick={() => navigate('/inventory/stock')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {stats.lowStockItems.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-emerald-600 font-medium">All stock levels healthy</p>
              </div>
            ) : (
              stats.lowStockItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
                      <Package className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{item.productName || item.product?.name || 'Product'}</p>
                      <p className="text-xs text-stone-500">SKU: {item.sku || item.product?.sku || '—'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-rose-600">{item.onHandQuantity ?? item.currentStock ?? 0} units</p>
                    <p className="text-xs text-stone-500">Min: {item.minimumThreshold ?? item.threshold ?? 0}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
