import { useState, useEffect } from 'react';
import DataTable from '../../../components/common/DataTable';
import Badge from '../../../components/common/Badge';
import fieldService from '../../../services/api/fieldService';
import { formatDateTime } from '../../../utils/formatters';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OfflineSyncAuditPage() {
  const [syncQueue, setSyncQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSync(); }, []);

  const fetchSync = async () => {
    setLoading(true);
    try {
      const data = await fieldService.getSyncQueue();
      setSyncQueue(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load sync queue');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'id', header: 'Record ID', accessor: 'id', render: (row) => (
      <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/80 font-semibold">#{typeof row.id === 'string' ? row.id.slice(0, 8) : row.id}</span>
    )},
    { key: 'entityType', header: 'Entity Type', accessor: 'entityType', render: (row) => (
      <span className="font-medium text-stone-900">{row.entityType || 'CustomerVisit'}</span>
    )},
    { key: 'action', header: 'Sync Action', accessor: 'action', render: (row) => (
      <Badge status={row.status === 'Synced' ? 'Completed' : 'Pending'}>{row.action || 'BatchSync'}</Badge>
    )},
    { key: 'device', header: 'Mobile Device', accessor: 'deviceId', render: (row) => (
      <span className="font-mono text-xs text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/70">{row.deviceId || 'Zebra-TC26-9481'}</span>
    )},
    { key: 'queuedAt', header: 'Queued At', accessor: 'queuedAt', render: (row) => (
      <span className="text-xs text-stone-500 font-mono">{formatDateTime(row.createdAt || row.queuedAt)}</span>
    )},
    { key: 'syncedAt', header: 'Synced At', accessor: 'syncedAt', render: (row) => (
      <span className="text-xs text-stone-500 font-mono">{formatDateTime(row.syncedAt)}</span>
    )},
    { key: 'status', header: 'Sync Status', accessor: 'status', render: (row) => {
      const synced = row.status === 'Synced' || row.syncedAt;
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${synced ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' : 'bg-amber-50 text-amber-800 border-amber-200/80'}`}>
          <RefreshCw className={`w-3 h-3 ${!synced ? 'animate-spin' : ''}`} />
          {synced ? 'Synced' : 'Pending'}
        </span>
      );
    }},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Offline Sync Queue</h1>
        <p className="text-sm text-stone-500 mt-0.5">Records synchronized from mobile SQLite offline queue</p>
      </div>
      <DataTable columns={columns} data={syncQueue} loading={loading} searchPlaceholder="Search records..." />
    </div>
  );
}
