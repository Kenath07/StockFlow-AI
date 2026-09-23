import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../../components/common/Badge';
import TriggerBadge from '../../../components/common/TriggerBadge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import agentService from '../../../services/api/agentService';
import { formatDateTime, formatCurrency, formatNumber } from '../../../utils/formatters';
import { CheckCircle2, XCircle, Clock, BrainCircuit, ThumbsUp, ThumbsDown, Package } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import toast from 'react-hot-toast';

export default function PendingApprovalsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedWf, setSelectedWf] = useState(null);
  const [action, setAction] = useState('approve');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await agentService.getAll();
      const all = Array.isArray(data) ? data : [];
      setWorkflows(all.filter((w) => w.status === 'PendingManagerApproval'));
    } catch (err) {
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedWf) return;
    setProcessing(true);
    try {
      if (action === 'approve') {
        await agentService.approve(selectedWf.id, { managerNotes: 'Approved' });
        toast.success('Proposal approved!');
      } else {
        await agentService.reject(selectedWf.id, { reason: rejectReason || 'Rejected' });
        toast.success('Proposal rejected');
      }
      setShowModal(false);
      fetchPending();
    } catch (err) {
      toast.error('Action failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading pending approvals..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
          <Clock className="w-6 h-6 text-amber-600" /> Pending Approvals
        </h1>
        <p className="text-sm text-stone-500 mt-0.5">{workflows.length} proposal{workflows.length !== 1 ? 's' : ''} awaiting manager decision</p>
      </div>

      {workflows.length === 0 ? (
        <EmptyState
          title="No pending approvals"
          description="All AI reorder proposals have been reviewed."
          icon={CheckCircle2}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workflows.map((wf) => {
            const proposals = wf.proposals || wf.reorderProposals || [];
            return (
              <div key={wf.id} className="bg-white/85 backdrop-blur-md rounded-2xl border border-amber-200/80 p-5 hover:border-amber-400/80 shadow-xs hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                      <BrainCircuit className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">Workflow #{wf.id?.substring(0, 8) || wf.id}</p>
                      <p className="text-xs text-stone-500 font-mono">{formatDateTime(wf.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TriggerBadge source={wf.triggerSource || wf.triggeredBy || 'System'} />
                    <Badge status="PendingManagerApproval">Pending</Badge>
                  </div>
                </div>

                {proposals.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {proposals.slice(0, 3).map((p, i) => {
                      const qty = p.proposedQuantity ?? p.reorderQuantity ?? p.quantity ?? 0;
                      return (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50/80 border border-stone-200/70">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-stone-400" />
                            <div>
                              <span className="text-sm font-medium text-stone-800">{p.productName || 'Product'}</span>
                              {p.productSku && <span className="text-xs text-stone-400 ml-1.5 font-mono">({p.productSku})</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-indigo-600">{formatNumber(qty)} units</span>
                            {p.estimatedCost > 0 && (
                              <p className="text-2xs text-stone-400">{formatCurrency(p.estimatedCost)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/agent/workflows/${wf.id}`)}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 border border-stone-200 hover:text-stone-900 hover:bg-stone-100 transition-all text-center"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => { setSelectedWf(wf); setAction('reject'); setRejectReason(''); setShowModal(true); }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 transition-all flex items-center gap-1"
                  >
                    <ThumbsDown className="w-3 h-3" /> Reject
                  </button>
                  <button
                    onClick={() => { setSelectedWf(wf); setAction('approve'); setShowModal(true); }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1"
                  >
                    <ThumbsUp className="w-3 h-3" /> Approve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={action === 'approve' ? 'Approve Proposal' : 'Reject Proposal'} size="sm"
        footer={<>
          <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm text-stone-600 hover:text-stone-900 transition-colors">Cancel</button>
          <button onClick={handleAction} disabled={processing} className={`px-5 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all ${action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20' : 'bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/20'}`}>
            {processing ? 'Processing...' : 'Confirm'}
          </button>
        </>}
      >
        {action === 'reject' ? (
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Rejection reason..." rows={3} className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none transition-all" />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-stone-700">
              Are you sure you want to approve this reorder proposal? Stock procurement execution will be triggered automatically.
            </p>
            {selectedWf?.proposals?.length > 0 && (
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs text-stone-700">
                <span className="font-semibold text-stone-900 block">Restock items:</span>
                {selectedWf.proposals.map((p, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{p.productName} ({p.productSku})</span>
                    <strong className="text-indigo-600">
                      {formatNumber(p.proposedQuantity ?? p.reorderQuantity ?? p.quantity ?? 0)} units
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
