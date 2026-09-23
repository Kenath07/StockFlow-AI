import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import StatCard from '../../../components/common/StatCard';
import Badge from '../../../components/common/Badge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import productService from '../../../services/api/productService';
import customerService from '../../../services/api/customerService';
import fieldService from '../../../services/api/fieldService';
import reportService from '../../../services/api/reportService';
import agentService from '../../../services/api/agentService';
import { formatDateTime, formatRelativeTime } from '../../../utils/formatters';
import {
  ShieldCheck, Users, Package, MapPin, ScanLine, RefreshCw,
  BrainCircuit, Bell, ArrowRight, CheckCircle2, AlertCircle, Plus
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalAgents: 0,
    onDutyAgents: 0,
    totalVisits: 0,
    totalCaptures: 0,
    syncQueuePending: 0,
    syncQueueTotal: 0,
    activeWorkflows: 0,
    recentCaptures: [],
    recentVisits: [],
    syncItems: [],
    notifications: [],
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [
        productsRes,
        customersRes,
        agentsRes,
        visitsRes,
        capturesRes,
        syncRes,
        workflowsRes,
        notifRes,
      ] = await Promise.allSettled([
        productService.getAll(),
        customerService.getAll(),
        fieldService.getAgents(),
        fieldService.getVisits(),
        fieldService.getCaptures(),
        fieldService.getSyncQueue(),
        agentService.getAll(),
        reportService.getNotifications(10),
      ]);

      const products = productsRes.status === 'fulfilled' ? (productsRes.value?.items || (Array.isArray(productsRes.value) ? productsRes.value : [])) : [];
      const customers = customersRes.status === 'fulfilled' ? (Array.isArray(customersRes.value) ? customersRes.value : []) : [];
      const agents = agentsRes.status === 'fulfilled' ? (Array.isArray(agentsRes.value) ? agentsRes.value : []) : [];
      const visits = visitsRes.status === 'fulfilled' ? (Array.isArray(visitsRes.value) ? visitsRes.value : []) : [];
      const captures = capturesRes.status === 'fulfilled' ? (Array.isArray(capturesRes.value) ? capturesRes.value : []) : [];
      const sync = syncRes.status === 'fulfilled' ? (Array.isArray(syncRes.value) ? syncRes.value : []) : [];
      const workflows = workflowsRes.status === 'fulfilled' ? (Array.isArray(workflowsRes.value) ? workflowsRes.value : []) : [];
      const notifs = notifRes.status === 'fulfilled' ? (Array.isArray(notifRes.value) ? notifRes.value : []) : [];

      const onDuty = agents.filter((a) => a.isOnDuty || a.status === 'Active' || a.status === 'OnDuty').length;
      const pendingSync = sync.filter((s) => s.status === 'Pending' || !s.isSynced).length;

      setStats({
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalAgents: agents.length,
        onDutyAgents: onDuty,
        totalVisits: visits.length,
        totalCaptures: captures.length,
        syncQueuePending: pendingSync,
        syncQueueTotal: sync.length,
        activeWorkflows: workflows.length,
        recentCaptures: captures.slice(0, 5),
        recentVisits: visits.slice(0, 5),
        syncItems: sync.slice(0, 5),
        notifications: notifs.slice(0, 6),
      });
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading system administration dashboard..." />;

  const fieldActivityData = [
    { name: 'Visits', count: stats.totalVisits },
    { name: 'Captures', count: stats.totalCaptures },
    { name: 'Sync Items', count: stats.syncQueueTotal },
    { name: 'Workflows', count: stats.activeWorkflows },
  ];

  const syncStatusData = [
    { name: 'Synced', value: Math.max(0, stats.syncQueueTotal - stats.syncQueuePending) || 1 },
    { name: 'Pending Sync', value: stats.syncQueuePending || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Welcome & System Health Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-6 w-6 text-orange-600" />
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Admin System Overview — {user?.fullName || 'Administrator'}
            </h1>
          </div>
          <p className="text-sm text-stone-500">
            Master Data, Field Operations Infrastructure, Offline Sync & Device Audit Center.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/inventory/products')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-xs shadow-blue-500/20 active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
          <button
            onClick={() => navigate('/field/sync-queue')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-sm font-semibold transition shadow-2xs"
          >
            <RefreshCw className="h-4 w-4 text-emerald-600" /> Sync Queue
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Master Products"
          value={stats.totalProducts}
          icon={Package}
          color="indigo"
          subtitle="Catalog items"
          onClick={() => navigate('/inventory/products')}
        />
        <StatCard
          title="Field Agents On-Duty"
          value={`${stats.onDutyAgents} / ${stats.totalAgents}`}
          icon={Users}
          color="emerald"
          subtitle="Active field staff"
          onClick={() => navigate('/field/agents')}
        />
        <StatCard
          title="Device Captures"
          value={stats.totalCaptures}
          icon={ScanLine}
          color="orange"
          subtitle="QR Scans & Geotags"
          onClick={() => navigate('/field/captures')}
        />
        <StatCard
          title="Sync Queue Health"
          value={stats.syncQueuePending === 0 ? 'Healthy' : `${stats.syncQueuePending} Pending`}
          icon={RefreshCw}
          color={stats.syncQueuePending === 0 ? 'emerald' : 'amber'}
          subtitle={`${stats.syncQueueTotal} Total Payloads`}
          onClick={() => navigate('/field/sync-queue')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-stone-900">Field Operations Activity</h3>
            <span className="text-xs text-stone-500 font-medium">Total event logs</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fieldActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ea" />
                <XAxis dataKey="name" stroke="#78716c" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#78716c" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e5e4', borderRadius: '0.75rem', color: '#1c1917', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#1c1917', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-stone-900">Offline Sync Integrity</h3>
            <span className="text-xs text-stone-500 font-medium">Payload status</span>
          </div>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={syncStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e5e4', borderRadius: '0.75rem', color: '#1c1917', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around text-xs text-stone-600 font-medium pt-2 border-t border-stone-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Synced ({stats.syncQueueTotal - stats.syncQueuePending})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pending ({stats.syncQueuePending})
            </span>
          </div>
        </div>
      </div>

      {/* Admin Audit & Monitoring Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Device Captures */}
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-orange-600" />
              <h3 className="text-base font-bold text-stone-900">Recent Device Captures (QR/GPS)</h3>
            </div>
            <button
              onClick={() => navigate('/field/captures')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {stats.recentCaptures.length === 0 ? (
              <p className="text-sm text-stone-500 py-4 text-center">No device captures recorded yet.</p>
            ) : (
              stats.recentCaptures.map((c) => (
                <div key={c.id || Math.random()} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-orange-50 text-orange-700 text-xs font-mono font-bold border border-orange-200">
                      {c.captureType || 'QR_SCAN'}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{c.payload || c.metadata || 'Device Capture'}</p>
                      <p className="text-xs text-stone-500">Agent: {c.fieldAgentName || 'Field Agent'} • {formatRelativeTime(c.capturedAt || c.createdAt)}</p>
                    </div>
                  </div>
                  <Badge status={c.isVerified ? 'Fulfilled' : 'Pending'}>{c.isVerified ? 'Verified' : 'Logged'}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Third-Party Notification Logs */}
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-bold text-stone-900">System Notification Gateway (SMS/Email)</h3>
            </div>
          </div>

          <div className="space-y-3">
            {stats.notifications.length === 0 ? (
              <p className="text-sm text-stone-500 py-4 text-center">No notification dispatch logs yet.</p>
            ) : (
              stats.notifications.map((n) => (
                <div key={n.id || Math.random()} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                        {n.channel || 'EMAIL'}
                      </span>
                      <p className="text-sm font-semibold text-stone-900">{n.subject || 'System Alert'}</p>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">To: {n.recipient} • {formatDateTime(n.createdAt)}</p>
                  </div>
                  <Badge
                    status={n.status === 'Sent' || n.status === 'Delivered' ? 'Fulfilled' : 'Pending'}
                  >
                    {n.status || 'Sent'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
