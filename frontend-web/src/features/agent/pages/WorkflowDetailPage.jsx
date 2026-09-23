import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Badge from '../../../components/common/Badge';
import TriggerBadge from '../../../components/common/TriggerBadge';
import Modal from '../../../components/common/Modal';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import agentService from '../../../services/api/agentService';
import { useAuth } from '../../../context/AuthContext';
import { formatDateTime, formatCurrency, formatNumber } from '../../../utils/formatters';
import {
  ArrowLeft, BrainCircuit, CheckCircle2, XCircle, Clock,
  Package, TrendingUp, Shield, Wrench, ThumbsUp, ThumbsDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const PIPELINE_AGENTS = [
  { name: 'InventoryAnalystAgent', label: 'Inventory Analyst', desc: 'Detects stock below safety threshold', icon: Package, color: 'indigo' },
  { name: 'DemandOrderContextAgent', label: 'Demand Analyst', desc: 'Computes sales velocity & 30-day run rate', icon: TrendingUp, color: 'blue' },
  { name: 'FieldContextAgent', label: 'Field Context', desc: 'Factors in visit notes & field demand', icon: BrainCircuit, color: 'orange' },
  { name: 'ReorderAdvisorAgent', label: 'Reorder Advisor', desc: 'Generates proposal quantity & justification', icon: Wrench, color: 'amber' },
  { name: 'ValidatorAgent', label: 'Validator', desc: 'Schema & business rule validation', icon: Shield, color: 'emerald' },
];

export default function WorkflowDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApproval, setShowApproval] = useState(false);
  const [approvalAction, setApprovalAction] = useState('approve');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchWorkflow(); }, [id]);

  const fetchWorkflow = async () => {
    setLoading(true);
    try {
      const data = await agentService.getById(id);
      setWorkflow(data);
    } catch (err) {
      toast.error('Failed to load workflow');
      navigate('/agent/workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async () => {
    setProcessing(true);
    try {
      if (approvalAction === 'approve') {
        await agentService.approve(id, { managerNotes: 'Approved via dashboard' });
        toast.success('Proposal approved! Stock will be updated.');
      } else {
        await agentService.reject(id, { reason: rejectReason || 'Rejected by manager' });
        toast.success('Proposal rejected.');
      }
      setShowApproval(false);
      fetchWorkflow();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading workflow..." />;
  if (!workflow) return null;

  const steps = workflow.steps || [];
  const proposals = workflow.proposals || workflow.reorderProposals || [];
  const toolCalls = workflow.toolCallLogs || workflow.toolCalls || [];
  const validations = workflow.validationResults || workflow.validations || [];
  const isPending = workflow.status === 'PendingManagerApproval';

  // Determine completed step index
  const getStepStatus = (agentName) => {
    const step = steps.find((s) => s.agentName === agentName || s.name === agentName);
    if (step) {
      if (step.status === 'Completed' || step.isCompleted) return 'completed';
      if (step.status === 'Failed') return 'failed';
      if (step.status === 'Executing' || step.status === 'Running') return 'running';
      return 'completed'; // if step exists with any other status, treat as completed
    }
    // Fallback: if workflow completed, all agents completed
    if (['Completed', 'Approved', 'PendingManagerApproval'].includes(workflow.status)) return 'completed';
    if (workflow.status === 'Executing') return 'pending';
    return 'pending';
  };

  const getStepData = (agentName) => {
    return steps.find((s) => s.agentName === agentName || s.name === agentName);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/85 backdrop-blur-md border border-stone-200/80 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/agent/workflows')}
            className="p-2.5 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-all border border-stone-200"
            title="Back to workflows"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-stone-900 tracking-tight">
                Workflow #{workflow.id?.substring(0, 8)}...
              </h1>
              <Badge status={workflow.status}>{workflow.status}</Badge>
              <TriggerBadge source={workflow.triggerSource || workflow.triggeredBy || 'System'} />
            </div>
            <p className="text-xs text-stone-500 mt-0.5 font-mono truncate">
              ID: {workflow.id} • Created {formatDateTime(workflow.createdAt)}
            </p>
          </div>
        </div>

        {isPending && (hasRole('Manager') || hasRole('Admin')) && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { setApprovalAction('reject'); setShowApproval(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 transition-all"
            >
              <ThumbsDown className="w-4 h-4" /> Reject
            </button>
            <button
              onClick={() => { setApprovalAction('approve'); setShowApproval(true); }}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-md shadow-emerald-600/20"
            >
              <ThumbsUp className="w-4 h-4" /> Approve Reorder
            </button>
          </div>
        )}
      </div>

      {/* 5-Agent Pipeline Visual */}
      <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 shadow-xs p-6">
        <h3 className="text-sm font-semibold text-stone-900 mb-6 flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-orange-600" /> Agent Pipeline Execution
        </h3>
        <div className="flex items-start justify-between">
          {PIPELINE_AGENTS.map((agent, i) => {
            const status = getStepStatus(agent.name);
            const step = getStepData(agent.name);
            const colorMap = {
              indigo: 'from-indigo-500 to-indigo-600',
              blue: 'from-blue-500 to-blue-600',
              orange: 'from-orange-500 to-amber-600',
              amber: 'from-amber-500 to-amber-600',
              emerald: 'from-emerald-500 to-emerald-600',
            };
            return (
              <div key={agent.name} className="flex items-start flex-1">
                <div className="flex flex-col items-center text-center">
                  <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    status === 'completed'
                      ? `bg-gradient-to-br ${colorMap[agent.color]} shadow-md`
                      : status === 'running'
                      ? 'bg-indigo-50 border-2 border-indigo-500 animate-pulse'
                      : status === 'failed'
                      ? 'bg-red-50 border border-red-300'
                      : 'bg-stone-100 border border-stone-200'
                  }`}>
                    <agent.icon className={`w-6 h-6 ${
                      status === 'completed' ? 'text-white' : status === 'failed' ? 'text-red-500' : 'text-stone-400'
                    }`} />
                    {status === 'completed' && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {status === 'failed' && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center border-2 border-white">
                        <XCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-stone-900 mt-3 max-w-[100px]">{agent.label}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5 max-w-[120px]">{agent.desc}</p>
                  {step?.durationMs > 0 && (
                    <p className="text-[10px] text-indigo-600 font-mono mt-1">{step.durationMs}ms</p>
                  )}
                  {step?.toolCalls?.length > 0 && (
                    <p className="text-[10px] text-amber-700 font-mono mt-0.5">{step.toolCalls.length} tool call(s)</p>
                  )}
                </div>
                {i < PIPELINE_AGENTS.length - 1 && (
                  <div className={`flex-1 h-0.5 mt-7 mx-2 ${
                    status === 'completed' ? 'bg-gradient-to-r from-indigo-500 to-indigo-400' : 'bg-stone-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reorder Proposals & Execution Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Reorder Proposals */}
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 shadow-xs p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" /> Reorder Proposals
            </h3>
            <span className="text-xs text-stone-500 font-medium">
              {proposals.length} item{proposals.length !== 1 ? 's' : ''} proposed
            </span>
          </div>

          {proposals.length === 0 ? (
            <div className="text-center py-8 text-stone-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-stone-600">No reorder proposals generated</p>
              <p className="text-xs text-stone-400 mt-1">Stock levels are currently above minimum thresholds</p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((p, i) => {
                const rawScore = p.confidenceScore ?? p.confidence;
                const confidencePct = rawScore != null
                  ? (rawScore <= 1 ? Math.round(rawScore * 100) : Math.min(Math.round(rawScore), 100))
                  : null;
                const proposedQty = p.proposedQuantity ?? p.reorderQuantity ?? p.quantity ?? 0;
                const sku = p.productSku || p.sku || p.product?.sku || 'SKU';
                const productName = p.productName || p.product?.name || 'Product';

                return (
                  <div key={i} className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80 space-y-3 overflow-hidden">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-900 truncate">{productName}</p>
                        <p className="text-xs text-stone-500 font-mono mt-0.5">{sku}</p>
                      </div>
                      <Badge status={p.isApproved ? 'Approved' : (p.status || workflow.status)}>
                        {p.isApproved ? 'Approved' : (p.status || 'Proposed')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs">
                        <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Current Stock</p>
                        <p className="text-sm font-bold text-stone-900 mt-0.5">{formatNumber(p.currentStock ?? p.onHandQuantity ?? 0)}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs">
                        <p className="text-[10px] text-indigo-600 uppercase tracking-wider font-semibold">Reorder Qty</p>
                        <p className="text-sm font-bold text-indigo-600 mt-0.5">{formatNumber(proposedQty)}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs">
                        <p className="text-[10px] text-emerald-700 uppercase tracking-wider font-semibold">Est. Cost</p>
                        <p className="text-sm font-bold text-emerald-700 mt-0.5">
                          {formatCurrency(
                            Number(p.estimatedCost) > 0
                              ? Number(p.estimatedCost)
                              : proposedQty * (Number(p.costPrice || p.unitPrice || 0) > 0 ? Number(p.costPrice || p.unitPrice * 0.7) : 250)
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Confidence Bar */}
                    {confidencePct != null && (
                      <div className="pt-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-stone-600 font-medium">AI Confidence Score</span>
                          <span className="text-xs font-bold text-orange-600">{confidencePct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden relative">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 transition-all duration-700"
                            style={{ width: `${confidencePct}%`, maxWidth: '100%' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* AI Justification */}
                    {(p.justification || p.reasoning) && (
                      <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                        <p className="text-[11px] font-semibold text-indigo-700 mb-1 uppercase tracking-wider">AI Reasoning</p>
                        <p className="text-xs text-stone-700 italic leading-relaxed">"{p.justification || p.reasoning}"</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Validation Checklist */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 shadow-xs p-6">
            <h3 className="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" /> Validation Checklist
            </h3>
            {validations.length === 0 ? (
              <div className="space-y-3">
                {[
                  'Schema Validator: All required fields present & non-negative',
                  'Business Rule: Reorder within supplier batch limits',
                  'Financial Sanity: Within working capital threshold'
                ].map((v, i) => {
                  const passed = ['PendingManagerApproval', 'Approved', 'Completed'].includes(workflow.status);
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50/70 border border-stone-200/70">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${passed ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-500'}`}>
                        {passed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <span className={`text-sm ${passed ? 'text-stone-800' : 'text-stone-500'}`}>{v}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {validations.map((v, i) => {
                  const hasErrors = v.failureReasons && v.failureReasons !== '[]' && v.failureReasons.trim().length > 0;
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-stone-50/70 border border-stone-200/70">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${v.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {v.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-stone-900 truncate">
                            {v.validatorName || v.ruleName || v.name || 'Rule Check'}
                          </p>
                          {hasErrors && (
                            <p className="text-xs text-red-600 mt-0.5">{v.failureReasons}</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v.passed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80' : 'bg-red-50 text-red-800 border border-red-200/80'}`}>
                        {v.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tool Call Logs */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 shadow-xs p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" /> Tool Call Audit Log
              </h3>
              <span className="text-xs text-stone-500 font-medium">
                {toolCalls.length} call{toolCalls.length !== 1 ? 's' : ''} executed
              </span>
            </div>

            {toolCalls.length === 0 ? (
              <p className="text-sm text-stone-500 py-6 text-center">No tool calls recorded</p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {toolCalls.map((tc, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-stone-50/70 border border-stone-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-md">
                          {tc.toolName || tc.name}
                        </span>
                        {tc.success !== undefined && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${tc.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80' : 'bg-red-50 text-red-800 border border-red-200/80'}`}>
                            {tc.success ? '✓ OK' : '✗ FAIL'}
                          </span>
                        )}
                      </div>
                      {(tc.durationMs || tc.executionDuration) != null && (
                        <span className="text-xs text-stone-500 font-mono">{tc.durationMs || tc.executionDuration}ms</span>
                      )}
                    </div>

                    {(tc.inputJson || tc.input) && (
                      <div>
                        <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Input</span>
                        <div className="mt-1 p-2 rounded-lg bg-white border border-stone-200 font-mono text-[11px] text-stone-800 break-all whitespace-pre-wrap max-h-20 overflow-y-auto">
                          {typeof (tc.inputJson || tc.input) === 'string'
                            ? (tc.inputJson || tc.input)
                            : JSON.stringify(tc.inputJson || tc.input, null, 2)}
                        </div>
                      </div>
                    )}

                    {(tc.outputJson || tc.output) && (
                      <div>
                        <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Output</span>
                        <div className="mt-1 p-2 rounded-lg bg-white border border-stone-200 font-mono text-[11px] text-stone-800 break-all whitespace-pre-wrap max-h-24 overflow-y-auto">
                          {typeof (tc.outputJson || tc.output) === 'string'
                            ? (tc.outputJson || tc.output)
                            : JSON.stringify(tc.outputJson || tc.output, null, 2)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      <Modal
        isOpen={showApproval}
        onClose={() => setShowApproval(false)}
        title={approvalAction === 'approve' ? '✅ Approve Reorder Proposal' : '❌ Reject Reorder Proposal'}
        size="sm"
        footer={
          <>
            <button onClick={() => setShowApproval(false)} className="px-4 py-2 rounded-xl text-sm text-stone-600 hover:text-stone-900 transition-colors">Cancel</button>
            <button
              onClick={handleApproval}
              disabled={processing}
              className={`px-5 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all ${
                approvalAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20' : 'bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/20'
              }`}
            >
              {processing ? 'Processing...' : approvalAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </>
        }
      >
        {approvalAction === 'approve' ? (
          <div className="space-y-3">
            <p className="text-sm text-stone-700">
              Are you sure you want to <strong className="text-emerald-700">approve</strong> this reorder proposal?
            </p>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-medium">
              ⚡ Approving will automatically trigger stock procurement execution and update inventory levels.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-stone-700">
              Please provide a reason for <strong className="text-red-600">rejecting</strong> this proposal:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Supplier price change pending..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
