import { useState, useEffect } from 'react';
import DataTable from '../../../components/common/DataTable';
import Badge from '../../../components/common/Badge';
import PageHeader from '../../../components/layout/PageHeader';
import reportService from '../../../services/api/reportService';
import { formatDateTime } from '../../../utils/formatters';
import { Bell, Mail, Smartphone, RefreshCw, Send, AlertCircle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationAuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await reportService.getNotificationAudit();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load notification audit logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'Email': return <Mail className="w-4 h-4 text-blue-500" />;
      case 'Sms': return <Smartphone className="w-4 h-4 text-emerald-500" />;
      case 'Push': return <Bell className="w-4 h-4 text-amber-500" />;
      default: return <MessageSquare className="w-4 h-4 text-stone-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Sent': return <Badge status="Confirmed" text="Sent" />;
      case 'Failed': return <Badge status="Failed" text="Failed" />;
      case 'Pending': return <Badge status="Pending" text="Pending" />;
      default: return <Badge text={status} />;
    }
  };

  const columns = [
    {
      key: 'channel',
      header: 'Channel',
      accessor: 'channel',
      render: (row) => (
        <div className="flex items-center gap-2">
          {getChannelIcon(row.channel)}
          <span className="font-medium text-stone-700">{row.channel}</span>
        </div>
      ),
    },
    {
      key: 'recipient',
      header: 'Recipient',
      accessor: 'recipient',
      render: (row) => (
        <span className="font-mono text-xs text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/70">
          {row.recipient}
        </span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject / Title',
      accessor: 'subject',
      render: (row) => (
        <span className="text-sm text-stone-900 font-medium truncate max-w-[200px] block">
          {row.subject || 'No Subject'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created At',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs text-stone-500">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: 'sentAt',
      header: 'Sent At',
      accessor: 'sentAt',
      render: (row) => (
        <span className="text-xs text-stone-500">
          {row.sentAt ? formatDateTime(row.sentAt) : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: 'status',
      render: (row) => getStatusBadge(row.status),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Notification Audit Log"
        subtitle="System-wide dispatch history for Email, SMS, and Push alerts"
        icon={Bell}
      >
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-stone-400' : ''}`} />
          Refresh Log
        </button>
      </PageHeader>

      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          searchPlaceholder="Search notifications by recipient or subject..."
        />
      </div>
    </div>
  );
}
