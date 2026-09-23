import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import Badge from '../../../components/common/Badge';
import TriggerBadge from '../../../components/common/TriggerBadge';
import agentService from '../../../services/api/agentService';
import { formatDateTime, formatRelativeTime } from '../../../utils/formatters';
import { BrainCircuit, Zap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WorkflowsListPage() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => { fetchWorkflows(); }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const data = await agentService.getAll();
      setWorkflows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await agentService.startReorder();
      toast.success('AI Reorder scan triggered!');
      fetchWorkflows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger workflow');
    } finally {
      setTriggering(false);
    }
  };

  const navigate = useNavigate();

  const columns = [
    { key: 'id', header: 'Workflow', accessor: 'id', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
          <BrainCircuit className="w-4 h-4 text-orange-600" />
        </div>
        <div className="min-w-0">
          <span className="font-semibold text-stone-900 font-mono text-sm">#{row.id?.substring(0, 8)}</span>
          <p className="text-xs text-stone-500 truncate max-w-[220px]">
            {row.objective || 'Automated Replenishment'}
          </p>
        </div>
      </div>
    )},
    {
      key: 'trigger',
      header: 'Triggered By',
      accessor: (row) => row.triggerSource || row.triggeredBy || 'System',
      render: (row) => <TriggerBadge source={row.triggerSource || row.triggeredBy || 'System'} />,
    },
    { key: 'steps', header: 'Steps', accessor: (row) => <span className="text-stone-700 font-medium">{row.steps?.length ?? row.totalSteps ?? '—'}</span> },
    { key: 'proposals', header: 'Proposals', accessor: (row) => <span className="text-stone-700 font-medium">{row.proposals?.length ?? row.proposalCount ?? '—'}</span> },
    { key: 'created', header: 'Created', accessor: 'createdAt', render: (row) => <span className="text-xs text-stone-500 font-mono">{formatDateTime(row.createdAt)}</span> },
    { key: 'status', header: 'Status', accessor: 'status', render: (row) => <Badge status={row.status}>{row.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-orange-600" /> AI Agent Workflows
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">Multi-agent reorder pipeline executions</p>
        </div>
        <button
          onClick={handleTrigger}
          disabled={triggering}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white text-sm font-semibold hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 transition-all shadow-md shadow-orange-500/25 active:scale-[0.99]"
        >
          {triggering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Trigger AI Reorder Scan
            </>
          )}
        </button>
      </div>

      <DataTable
        columns={columns}
        data={workflows}
        loading={loading}
        searchPlaceholder="Search workflows..."
        onRowClick={(row) => navigate(`/agent/workflows/${row.id}`)}
      />
    </div>
  );
}
