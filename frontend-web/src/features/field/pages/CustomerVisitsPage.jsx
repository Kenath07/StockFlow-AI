import { useState, useEffect } from 'react';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import fieldService from '../../../services/api/fieldService';
import customerService from '../../../services/api/customerService';
import { formatDateTime } from '../../../utils/formatters';
import { MapPin, Plus, UserCheck, QrCode, CheckCircle2, Clock, RefreshCw, Activity, CalendarCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerVisitsPage() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    fieldAgentId: '',
    customerId: '',
    customerName: '',
    latitude: 6.9271,
    longitude: 79.8612,
    addressSnapshot: '',
    notes: '',
  });

  useEffect(() => {
    fetchVisits();
    loadInitialData();

    // Auto-sync when supervisor returns to tab
    const handleFocus = () => fetchVisits(true);
    window.addEventListener('focus', handleFocus);

    // Background auto-refresh every 6 seconds to immediately detect new mobile visits
    const timer = setInterval(() => {
      fetchVisits(true);
    }, 6000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(timer);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [custList, agentList] = await Promise.all([
        customerService.getCustomers({ pageSize: 100 }),
        fieldService.getAgents(),
      ]);
      const custData = custList.items || custList || [];
      setCustomers(custData);
      setAgents(Array.isArray(agentList) ? agentList : []);

      if (agentList?.length > 0) {
        setFormData(prev => ({ ...prev, fieldAgentId: agentList[0].id }));
      }
      if (custData?.length > 0) {
        setFormData(prev => ({
          ...prev,
          customerId: custData[0].id,
          customerName: custData[0].name,
          latitude: custData[0].latitude || 6.9271,
          longitude: custData[0].longitude || 79.8612,
          addressSnapshot: custData[0].address || '',
        }));
      }
    } catch {
      // initial data fallback
    }
  };

  const fetchVisits = async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const data = await fieldService.getVisits();
      setVisits(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load customer visits:', err);
      if (!silent) toast.error('Failed to load visits');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCustomerChange = (customerId) => {
    const selected = customers.find(c => c.id === customerId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        customerId: selected.id,
        customerName: selected.name,
        latitude: selected.latitude || prev.latitude,
        longitude: selected.longitude || prev.longitude,
        addressSnapshot: selected.address || '',
      }));
    }
  };

  const handleSubmitVisit = async (e) => {
    e.preventDefault();
    if (!formData.fieldAgentId || !formData.customerId) {
      toast.error('Please select both an Agent and a Customer');
      return;
    }

    setSaving(true);
    try {
      await fieldService.createVisit(formData.fieldAgentId, {
        customerId: formData.customerId,
        customerName: formData.customerName,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        addressSnapshot: formData.addressSnapshot,
        notes: formData.notes,
      });
      toast.success('Customer visit logged successfully!');
      setIsModalOpen(false);
      setFormData(prev => ({ ...prev, notes: '' }));
      fetchVisits();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log visit');
    } finally {
      setSaving(false);
    }
  };

  // Summary counts
  const totalVisits = visits.length;
  const completedVisits = visits.filter(v => Boolean(v.checkOutAt || v.checkOutTime)).length;
  const activeVisits = totalVisits - completedVisits;

  const columns = [
    {
      key: 'agent',
      header: 'Field Officer',
      accessor: (row) => row.fieldAgentName || row.agentName || 'Field Officer',
      render: (row) => {
        const displayName = row.fieldAgentName || row.agentName || 'Field Officer';
        const initials = displayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-indigo-50 to-indigo-100 border border-indigo-200/80 flex items-center justify-center font-bold text-xs text-indigo-700 shadow-2xs">
              {initials || 'FA'}
            </div>
            <div>
              <span className="font-semibold text-stone-900 block text-sm leading-tight">{displayName}</span>
              <span className="font-mono text-[11px] text-stone-500 font-medium">
                {row.fieldAgentCode || (row.fieldAgentId ? `ID: ${String(row.fieldAgentId).slice(0, 8)}` : 'Live Visit')}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'customer',
      header: 'Customer Visited',
      accessor: (row) => row.customerName || row.customer?.name || '—',
      render: (row) => (
        <div>
          <span className="font-semibold text-stone-900 text-sm block">{row.customerName || row.customer?.name || '—'}</span>
          {row.addressSnapshot && (
            <span className="text-xs text-stone-500 truncate block max-w-[220px]" title={row.addressSnapshot}>
              {row.addressSnapshot}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'checkIn',
      header: 'Visit Check-in',
      accessor: 'visitedAt',
      render: (row) => (
        <span className="text-xs text-stone-700 font-mono flex items-center gap-1.5 font-medium">
          <Clock className="w-3.5 h-3.5 text-stone-400" />
          {formatDateTime(row.visitedAt || row.checkInTime || row.createdAt)}
        </span>
      ),
    },
    {
      key: 'checkOut',
      header: 'Check-out Status',
      accessor: 'checkOutAt',
      render: (row) => {
        const isCheckedOut = Boolean(row.checkOutAt || row.checkOutTime);
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isCheckedOut
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                : 'bg-amber-50 text-amber-800 border-amber-200/80'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isCheckedOut ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            {isCheckedOut ? `Completed (${formatDateTime(row.checkOutAt || row.checkOutTime)})` : 'Active In-Store'}
          </span>
        );
      },
    },
    {
      key: 'gps',
      header: 'GPS Verification',
      sortable: false,
      render: (row) => (
        row.latitude && row.longitude ? (
          <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
            <MapPin className="w-3 h-3 text-emerald-600" /> {parseFloat(row.latitude).toFixed(4)}, {parseFloat(row.longitude).toFixed(4)}
          </span>
        ) : <span className="text-stone-400 text-xs">—</span>
      ),
    },
    {
      key: 'captures',
      header: 'QR / Scans',
      accessor: 'captureCount',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded-lg border border-orange-200">
          <QrCode className="w-3 h-3 text-orange-600" /> {row.captureCount || row.deviceCaptureCount || 0} scan(s)
        </span>
      ),
    },
    {
      key: 'notes',
      header: 'Outcome / Notes',
      accessor: 'notes',
      render: (row) => (
        <span className="text-xs text-stone-700 max-w-[240px] truncate block" title={row.notes}>
          {row.notes || row.outcome || 'Routine store audit completed'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900">Customer Visit Logs</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Audit Trail
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Chronological audit log of mobile field officer visits, GPS locations, and retail stock inspections
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchVisits(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-600' : 'text-stone-500'}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Visits'}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Log Customer Visit
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-stone-500">Total Visits Logged</div>
            <div className="text-xl font-bold text-stone-900 mt-0.5">{totalVisits}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-stone-500">Completed Audits</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">{completedVisits}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-stone-500">Active In-Store</div>
            <div className="text-xl font-bold text-amber-800 mt-0.5">{activeVisits}</div>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={visits} loading={loading} searchPlaceholder="Search visits by customer, agent, or notes..." />

      {/* Log Visit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Customer Field Visit" size="md">
        <form onSubmit={handleSubmitVisit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">Field Sales Officer *</label>
            <select
              value={formData.fieldAgentId}
              onChange={(e) => setFormData({ ...formData, fieldAgentId: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            >
              <option value="" disabled>Select assigned officer...</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name || a.employeeCode} ({a.employeeCode || 'Agent'}) — {a.assignedRegion || a.region || 'Western'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">Customer / Store *</label>
            <select
              value={formData.customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            >
              <option value="" disabled>Select visited store...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city || 'Store'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">GPS Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">GPS Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">Visit Purpose / Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Conducted shelf stock audit, recorded tea replenishment requirement."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 text-sm font-medium rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              {saving ? 'Logging Visit...' : 'Save & Log Visit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
