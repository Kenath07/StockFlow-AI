import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Package,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import PageHeader from '../../../components/layout/PageHeader';
import StatCard from '../../../components/common/StatCard';
import Badge from '../../../components/common/Badge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import reportService from '../../../services/api/reportService';
import { formatDateTime } from '../../../utils/formatters';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function UtilisationReportsPage() {
  const [loading, setLoading] = useState(true);
  const [lowStockReport, setLowStockReport] = useState(null);
  const [velocityReport, setVelocityReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [lowStockRes, velocityRes] = await Promise.allSettled([
        reportService.getLowStock(),
        reportService.getSalesVelocity(),
      ]);

      if (lowStockRes.status === 'fulfilled') setLowStockReport(lowStockRes.value);
      if (velocityRes.status === 'fulfilled') setVelocityReport(velocityRes.value);
    } catch (error) {
      console.error('Failed to fetch reports', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Generating utilisation reports..." />;
  }

  const lowStockItems = lowStockReport?.items || [];
  const velocityItems = velocityReport?.items || [];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Utilisation Reports"
        subtitle="Stock depletion, reorder urgency, and sales velocity analytics"
        icon={BarChart3}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products Below Threshold"
          value={lowStockItems.length.toString()}
          icon={AlertTriangle}
          trend={lowStockItems.length > 5 ? 'down' : 'up'}
          trendValue="Attention Required"
          color="rose"
        />
        <StatCard
          title="Top Selling Item"
          value={velocityItems.length > 0 ? velocityItems[0].name : 'N/A'}
          icon={TrendingUp}
          trend="up"
          trendValue={velocityItems.length > 0 ? `${velocityItems[0].totalUnitsSold} units sold` : ''}
          color="emerald"
        />
        <StatCard
          title="Total Units Sold (30 Days)"
          value={velocityItems.reduce((acc, curr) => acc + curr.totalUnitsSold, 0).toString()}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Avg Daily Demand (Top Items)"
          value={velocityItems.length > 0 ? velocityItems.reduce((acc, curr) => acc + curr.avgDailyDemand, 0).toFixed(1) : '0'}
          icon={BarChart3}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Urgency Chart */}
        <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            Stock Depletion Urgency
          </h3>
          <div className="h-[300px]">
            {lowStockItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lowStockItems.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="urgencyScore" name="Urgency Score (%)" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-stone-500 text-sm">
                No items currently below threshold.
              </div>
            )}
          </div>
        </div>

        {/* Sales Velocity Chart */}
        <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Sales Velocity Distribution (Top 5)
          </h3>
          <div className="h-[300px]">
            {velocityItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={velocityItems.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="totalUnitsSold"
                    nameKey="name"
                  >
                    {velocityItems.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-stone-500 text-sm">
                No sales data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Table */}
      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200/60 bg-stone-50/50">
          <h3 className="font-bold text-stone-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Critical Stock Action Required
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">On Hand</th>
                <th className="px-5 py-3">Min Threshold</th>
                <th className="px-5 py-3">Suggested Reorder</th>
                <th className="px-5 py-3 text-right">Urgency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item) => (
                  <tr key={item.productId} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-stone-900">{item.name}</div>
                      <div className="text-xs text-stone-500">SKU: {item.sku}</div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge text={item.category} color="stone" />
                    </td>
                    <td className="px-5 py-3 font-semibold text-rose-600">
                      {item.quantityOnHand}
                    </td>
                    <td className="px-5 py-3 text-stone-500">
                      {item.minThreshold}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-emerald-600 font-medium">+{item.reorderQuantity}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="w-24 h-2 bg-stone-100 rounded-full ml-auto overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${Math.min(item.urgencyScore, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-stone-500 mt-1">{item.urgencyScore}%</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-stone-500">
                    No items require reordering at this time.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
