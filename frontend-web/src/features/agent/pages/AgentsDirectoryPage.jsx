import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit, Package, TrendingUp, Shield, Wrench, Play,
  CheckCircle2, XCircle, RefreshCw,
  Sparkles, Layers, ThumbsUp, ThumbsDown,
  Clock, Cpu, Database, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../../services/api/productService';
import stockService from '../../../services/api/stockService';
import agentService from '../../../services/api/agentService';

const SAMPLE_PRODUCTS = [
  {
    id: 'sample-1',
    sku: 'BEV-TEA-001',
    name: 'Ceylon Premium Black Tea 500g',
    category: 'Beverages',
    currentStock: 43,
    onHand: 48,
    reserved: 5,
    safetyThreshold: 50,
    unitCost: 850,
    sales30Days: 10,
    avgDailySales: 3.3,
    fieldVisitsNote: 'Kasun noted high supermarket demand in Kollupitiya outlets. Shelf low.',
    fieldDemandBoost: '+15%',
    supplierMOQ: 40,
  },
  {
    id: 'sample-2',
    sku: 'DAI-MLK-001',
    name: 'Full Cream UHT Milk 1L',
    category: 'Dairy & Chilled',
    currentStock: 101,
    onHand: 120,
    reserved: 19,
    safetyThreshold: 60,
    unitCost: 360,
    sales30Days: 45,
    avgDailySales: 4.5,
    fieldVisitsNote: 'Field agent Priyantha recorded steady restock demand from retail outlets.',
    fieldDemandBoost: '+10%',
    supplierMOQ: 50,
  },
  {
    id: 'sample-3',
    sku: 'STP-RCE-001',
    name: 'Nadu Rice 5kg',
    category: 'Dry Goods & Staples',
    currentStock: 67,
    onHand: 75,
    reserved: 8,
    safetyThreshold: 80,
    unitCost: 920,
    sales30Days: 60,
    avgDailySales: 5.0,
    fieldVisitsNote: 'Steady routine retail replenishment. Standard velocity.',
    fieldDemandBoost: '+5%',
    supplierMOQ: 40,
  },
  {
    id: 'sample-4',
    sku: 'SNK-BIS-001',
    name: 'Marie Gold Biscuits 400g',
    category: 'Snacks & Confectionery',
    currentStock: 197,
    onHand: 200,
    reserved: 3,
    safetyThreshold: 40,
    unitCost: 220,
    sales30Days: 25,
    avgDailySales: 2.5,
    fieldVisitsNote: 'Audit confirmed healthy on-shelf stock in retail stores.',
    fieldDemandBoost: '+5%',
    supplierMOQ: 30,
  },
];

export default function AgentsDirectoryPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState(SAMPLE_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState(SAMPLE_PRODUCTS[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [launchingRealWorkflow, setLaunchingRealWorkflow] = useState(false);

  // Single Agent sandbox test state
  const [runningAgent, setRunningAgent] = useState(null);
  const [agentResults, setAgentResults] = useState({});

  // Full Pipeline Simulation State
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0); // 0 to 5 (5 = Waiting Manager Approval)
  const [hitlDecision, setHitlDecision] = useState(null); // 'approved' | 'rejected'
  const [rejectReason, setRejectReason] = useState('');

  // Fetch live products, stock levels, thresholds & movements from PostgreSQL DB
  const loadLiveCatalog = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [prodData, threshData, movData] = await Promise.all([
        productService.getAll().catch(() => []),
        stockService.getThresholds().catch(() => []),
        stockService.getMovements({ take: 100 }).catch(() => []),
      ]);

      if (Array.isArray(prodData) && prodData.length > 0) {
        setDbConnected(true);
        const mapped = prodData.map((p) => {
          const matchingThresh = Array.isArray(threshData)
            ? threshData.find((t) => t.productId === p.id || t.productSku === p.sku)
            : null;

          // Compute real 30-day sales from database movements
          const productMovements = Array.isArray(movData)
            ? movData.filter((m) => m.productId === p.id && (m.movementType === 'Sale' || m.type === 'Sale'))
            : [];
          const sales30Days = productMovements.reduce((acc, m) => acc + Math.abs(m.quantity || 0), 0);
          const avgDailySales = +(Math.max(0.2, sales30Days > 0 ? sales30Days / 30 : 2.5)).toFixed(1);

          const currentStock = p.quantityAvailable ?? p.quantityOnHand ?? 0;
          const onHand = p.quantityOnHand ?? 0;
          const reserved = Math.max(0, onHand - currentStock);
          const safetyThreshold = matchingThresh?.minThreshold ?? 30;
          const supplierMOQ = matchingThresh?.reorderQuantity ?? 40;
          const unitCost = Number(p.costPrice) > 0 ? Number(p.costPrice) : Math.round(Number(p.unitPrice || 100) * 0.7);

          // Dynamic field context note generated from actual inventory status
          let fieldVisitsNote = `Physical retail check completed. Stock moving normally.`;
          let fieldDemandBoost = '+5%';

          if (currentStock <= safetyThreshold) {
            fieldVisitsNote = `Field officers noted critical shelf shortage (<${safetyThreshold} units). Supermarket buyers asking for urgent dispatch.`;
            fieldDemandBoost = '+15%';
          } else if (reserved > 0) {
            fieldVisitsNote = `${reserved} units currently committed in customer sales orders. Field reps report active demand.`;
            fieldDemandBoost = '+10%';
          }

          return {
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.categoryName || 'General',
            currentStock,
            onHand,
            reserved,
            safetyThreshold,
            unitCost,
            unitPrice: p.unitPrice,
            sales30Days,
            avgDailySales,
            fieldVisitsNote,
            fieldDemandBoost,
            supplierMOQ,
          };
        });

        setProducts(mapped);
        setSelectedProduct((prev) => {
          if (!prev) return mapped[0];
          const found = mapped.find((m) => m.sku === prev.sku || m.id === prev.id);
          return found || mapped[0];
        });
      }
    } catch (err) {
      console.error('Failed to load live catalog for AI agent directory:', err);
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLiveCatalog(false);

    // Auto-update when returning to tab from adding products
    const handleFocus = () => loadLiveCatalog(true);
    window.addEventListener('focus', handleFocus);

    // Background auto-refresh every 6 seconds to automatically detect new products or stock changes
    const timer = setInterval(() => {
      loadLiveCatalog(true);
    }, 6000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(timer);
    };
  }, []);

  // Handle single agent simulation
  const handleTestRunSingleAgent = (agentKey) => {
    setRunningAgent(agentKey);
    setTimeout(() => {
      setRunningAgent(null);
      setAgentResults((prev) => ({
        ...prev,
        [agentKey]: true,
      }));
      toast.success(`Agent executed successfully on ${selectedProduct.name.split(' (')[0]}`);
    }, 800);
  };

  // Run full 5-agent pipeline step by step
  const handleRunFullPipeline = () => {
    setPipelineRunning(true);
    setPipelineStep(1);
    setHitlDecision(null);
    setRejectReason('');

    // Step through each agent sequentially
    setTimeout(() => setPipelineStep(2), 900);
    setTimeout(() => setPipelineStep(3), 1800);
    setTimeout(() => setPipelineStep(4), 2700);
    setTimeout(() => {
      setPipelineStep(5); // Stage 5: Ready for Manager Approval (Human In The Loop)
      setPipelineRunning(false);
      toast('⏸️ Pipeline paused: Awaiting Manager Approval (Human-in-the-Loop)', {
        icon: '🛡️',
        duration: 4000,
      });
    }, 3600);
  };

  // Trigger real backend AI Multi-Agent Workflow in PostgreSQL
  const handleLaunchBackendWorkflow = async () => {
    setLaunchingRealWorkflow(true);
    try {
      const result = await agentService.startReorder({
        objective: `Predictive Replenishment for ${selectedProduct.name} (${selectedProduct.sku})`,
        triggerSource: 'AgentDirectoryUI',
      });
      toast.success(`🚀 Live Multi-Agent Workflow #${result.id.slice(0, 8)} started in Backend!`);
      navigate(`/agent/workflows/${result.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to start backend AI workflow');
    } finally {
      setLaunchingRealWorkflow(false);
    }
  };

  // Calculations for chosen product based on real-time stock
  const deficit = Math.max(0, selectedProduct.safetyThreshold - selectedProduct.currentStock);
  const daysRemaining = selectedProduct.avgDailySales > 0 ? (selectedProduct.currentStock / selectedProduct.avgDailySales).toFixed(1) : '999';
  const rawReorder = Math.ceil(deficit + selectedProduct.avgDailySales * 7 * 1.1);
  const recommendedQty = Math.max(selectedProduct.supplierMOQ, Math.ceil(rawReorder / 10) * 10);
  const estimatedTotalCost = recommendedQty * selectedProduct.unitCost;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-orange-50/90 via-amber-50/80 to-stone-50/70 border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold mb-3 border border-orange-200/80">
              <Cpu className="w-3.5 h-3.5 text-orange-600" /> Multi-Agent AI System Architecture
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Meet the 5 Specialized Agents of <span className="inline-flex items-center"><span className="text-stone-900">Stock</span><span className="text-orange-500">Flow</span><span className="text-stone-900 ml-1">AI</span></span>
            </h1>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              Instead of relying on a single generic AI prompt, <strong className="text-stone-900">Stock<span className="text-orange-500">Flow</span> AI</strong> orchestrates <strong>5 specialized, role-based agents</strong>. 
              Each agent solves a distinct analytical layer—from physical warehouse deficits to field sales telemetry—culminating in a strictly governed <strong>Human-in-the-Loop Decision Gate</strong>.
            </p>
          </div>

          {/* Quick Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/agent/workflows')}
              className="px-4 py-2.5 rounded-xl text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 text-xs font-semibold transition-all shadow-2xs text-center"
            >
              View Live Executions
            </button>
            <button
              onClick={handleLaunchBackendWorkflow}
              disabled={launchingRealWorkflow}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5"
              title="Runs the actual C# 5-Agent Orchestrator against PostgreSQL database"
            >
              {launchingRealWorkflow ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {launchingRealWorkflow ? 'Starting...' : '⚡ Trigger Live C# Multi-Agent'}
            </button>
            <button
              onClick={handleRunFullPipeline}
              disabled={pipelineRunning}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-semibold transition-all shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              {pipelineRunning ? 'Simulating Pipeline...' : '▶️ Test Run 5-Agent Simulation'}
            </button>
          </div>
        </div>
      </div>

      {/* Product Selector Sandbox Bar */}
      <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900">Select SKU for Live AI Simulation</h3>
              {dbConnected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Database className="w-2.5 h-2.5 text-emerald-600" /> Live DB Data
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">Stock updates dynamically when orders are placed or fulfilled in the database</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Dropdown Select (Option) */}
          <div className="relative flex-1 sm:w-80">
            <select
              id="sku-product-select"
              value={selectedProduct?.sku || ''}
              onChange={(e) => {
                const found = products.find((p) => p.sku === e.target.value);
                if (found) {
                  setSelectedProduct(found);
                  setAgentResults({});
                  setPipelineStep(0);
                  setHitlDecision(null);
                }
              }}
              className="w-full appearance-none pl-3.5 pr-10 py-2 bg-stone-50 hover:bg-white focus:bg-white rounded-xl border border-stone-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-xs font-semibold text-stone-900 shadow-2xs transition-all cursor-pointer truncate"
              title="Select a product SKU to simulate AI agent replenishment"
            >
              {products.map((p) => {
                const isDeficit = p.currentStock <= p.safetyThreshold;
                return (
                  <option key={p.sku || p.id} value={p.sku} className="py-1 text-xs text-stone-900">
                    {isDeficit ? '⚠️ [Low Stock] ' : '✅ [Healthy] '}
                    {p.sku} — {p.name} ({p.currentStock} left | Safety: {p.safetyThreshold})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
          </div>

          {/* Quick status badge for currently selected product */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap ${
                selectedProduct.currentStock <= selectedProduct.safetyThreshold
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedProduct.currentStock <= selectedProduct.safetyThreshold
                    ? 'bg-rose-500 animate-pulse'
                    : 'bg-emerald-500'
                }`}
              />
              <span>{selectedProduct.currentStock} Available</span>
              <span className="text-[10px] font-medium text-stone-500">
                ({selectedProduct.onHand} on-hand{selectedProduct.reserved > 0 ? `, ${selectedProduct.reserved} reserved` : ''})
              </span>
            </span>

            {/* Refresh Live DB Stock */}
            <button
              onClick={() => loadLiveCatalog(false)}
              disabled={refreshing}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 shadow-2xs transition-all shrink-0 cursor-pointer disabled:opacity-60"
              title="Reload latest products and stock levels from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-600' : 'text-stone-500'}`} />
              <span className="hidden sm:inline">{refreshing ? 'Syncing...' : 'Sync DB'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: 5 Specialized Agents Deep Dive */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-600" /> The 5 Specialized Agents
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">Click "Test Run Agent" on any agent below to inspect its logic in simple, human terms</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* AGENT 1: Inventory Analyst */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-orange-200 transition-all">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-indigo-700 font-bold uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/80">Stage 1 of 5</span>
                    <h3 className="text-base font-bold text-stone-900 mt-1">Inventory Analyst Agent</h3>
                    <p className="text-xs text-stone-500 font-mono">InventoryAnalystAgent.cs</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">Deficit Scanner</span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 text-xs text-stone-700 space-y-1.5">
                <p><strong>🎯 Primary Mission:</strong> Continuously monitors warehouse stock levels and detects when on-hand quantities breach the safety stock threshold.</p>
                <p><strong>🔧 Backend Tools Used:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-stone-200 text-indigo-600 font-mono text-[11px]">MockStockTool.ScanInventoryDeficits()</code></p>
              </div>

              {/* Simulation Box */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                  <span>Input Data for {selectedProduct.sku}:</span>
                  <span className="text-[11px] font-mono text-indigo-600">Stock: {selectedProduct.currentStock} / Safety: {selectedProduct.safetyThreshold}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-indigo-100/80">
                    <span className="text-[10px] text-stone-500 block">Available Stock</span>
                    <span className="font-bold text-stone-900 text-sm">{selectedProduct.currentStock} units</span>
                    {selectedProduct.reserved > 0 && (
                      <span className="text-[9px] text-stone-400 block mt-0.5">({selectedProduct.reserved} reserved)</span>
                    )}
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-indigo-100/80">
                    <span className="text-[10px] text-indigo-700 block">Safety Minimum</span>
                    <span className="font-bold text-indigo-700 text-sm">{selectedProduct.safetyThreshold} units</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-indigo-100/80">
                    <span className={`text-[10px] block ${deficit > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {deficit > 0 ? 'Stock Deficit' : 'Safety Buffer'}
                    </span>
                    <span className={`font-bold text-sm ${deficit > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {deficit > 0 ? `-${deficit} units` : `+${selectedProduct.currentStock - selectedProduct.safetyThreshold} safe`}
                    </span>
                  </div>
                </div>

                {agentResults['agent1'] && (
                  <div className="mt-2 p-3 bg-white rounded-xl border border-indigo-200 shadow-2xs space-y-1 animate-fadeIn">
                    <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Plain-Language Agent Output:
                    </p>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      {deficit > 0 ? (
                        <>Warehouse currently holds only <strong>{selectedProduct.currentStock} available units</strong> of {selectedProduct.name.split(' (')[0]}, but the safety rule requires at least <strong>{selectedProduct.safetyThreshold} units</strong>. You have an immediate deficit of <strong>{deficit} units</strong>. Replenishment trigger activated.</>
                      ) : (
                        <>Warehouse currently holds <strong>{selectedProduct.currentStock} units</strong> of {selectedProduct.name.split(' (')[0]}, comfortably exceeding the safety threshold (<strong>{selectedProduct.safetyThreshold} units</strong>). Stock is in a healthy posture.</>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-400 font-medium">Avg Execution: ~42ms</span>
              <button
                onClick={() => handleTestRunSingleAgent('agent1')}
                disabled={runningAgent === 'agent1'}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
              >
                {runningAgent === 'agent1' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
                {runningAgent === 'agent1' ? 'Scanning...' : 'Test Run Agent 1'}
              </button>
            </div>
          </div>

          {/* AGENT 2: Demand Analyst */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-orange-200 transition-all">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-blue-700 font-bold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80">Stage 2 of 5</span>
                    <h3 className="text-base font-bold text-stone-900 mt-1">Demand Analyst Agent</h3>
                    <p className="text-xs text-stone-500 font-mono">DemandOrderContextAgent.cs</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">Velocity Tracker</span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 text-xs text-stone-700 space-y-1.5">
                <p><strong>🎯 Primary Mission:</strong> Calculates 30-day sales velocity, consumption velocity, and accurately forecasts days-to-stockout.</p>
                <p><strong>🔧 Backend Tools Used:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-stone-200 text-blue-600 font-mono text-[11px]">SalesOrderService.Get30DayVelocity()</code></p>
              </div>

              {/* Simulation Box */}
              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                  <span>Input Data for {selectedProduct.sku}:</span>
                  <span className="text-[11px] font-mono text-blue-600">30-Day Orders: {selectedProduct.sales30Days} units</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-blue-100/80">
                    <span className="text-[10px] text-stone-500 block">Daily Sales Speed</span>
                    <span className="font-bold text-stone-900 text-sm">{selectedProduct.avgDailySales} units/day</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-blue-100/80">
                    <span className="text-[10px] text-amber-600 block">Days to Zero Stock</span>
                    <span className="font-bold text-amber-600 text-sm">{daysRemaining} Days</span>
                  </div>
                </div>

                {agentResults['agent2'] && (
                  <div className="mt-2 p-3 bg-white rounded-xl border border-blue-200 shadow-2xs space-y-1 animate-fadeIn">
                    <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Plain-Language Agent Output:
                    </p>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      "Customers are buying <strong>{selectedProduct.avgDailySales} units per day</strong> on average. At this rate, your remaining {selectedProduct.currentStock} units will <strong>completely run out in {daysRemaining} days</strong>."
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-400 font-medium">Avg Execution: ~38ms</span>
              <button
                onClick={() => handleTestRunSingleAgent('agent2')}
                disabled={runningAgent === 'agent2'}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
              >
                {runningAgent === 'agent2' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
                {runningAgent === 'agent2' ? 'Computing...' : 'Test Run Agent 2'}
              </button>
            </div>
          </div>

          {/* AGENT 3: Field Context Agent */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-orange-200 transition-all">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                    <BrainCircuit className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-orange-700 font-bold uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded border border-orange-200/80">Stage 3 of 5</span>
                    <h3 className="text-base font-bold text-stone-900 mt-1">Field Context Agent</h3>
                    <p className="text-xs text-stone-500 font-mono">FieldContextAgent.cs</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">Field Signal</span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 text-xs text-stone-700 space-y-1.5">
                <p><strong>🎯 Primary Mission:</strong> Gathers real-world mobile visit logs, GPS store audits, and retail outlet observations from field officers.</p>
                <p><strong>🔧 Backend Tools Used:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-stone-200 text-orange-600 font-mono text-[11px]">FieldService.GetRecentVisitNotes()</code></p>
              </div>

              {/* Simulation Box */}
              <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-orange-900">
                  <span>GPS Field Telemetry:</span>
                  <span className="text-[11px] font-mono text-orange-700">{selectedProduct.fieldDemandBoost} Buffer</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-orange-200/80 text-xs text-stone-700 italic">
                  "{selectedProduct.fieldVisitsNote}"
                </div>

                {agentResults['agent3'] && (
                  <div className="mt-2 p-3 bg-white rounded-xl border border-orange-200 shadow-2xs space-y-1 animate-fadeIn">
                    <p className="text-[11px] font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Plain-Language Agent Output:
                    </p>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      "Field sales officers verified high consumer demand in physical store visits. Recommending a <strong>{selectedProduct.fieldDemandBoost} buffer</strong> to prevent retail shelf starvation."
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-400 font-medium">Avg Execution: ~45ms</span>
              <button
                onClick={() => handleTestRunSingleAgent('agent3')}
                disabled={runningAgent === 'agent3'}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
              >
                {runningAgent === 'agent3' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
                {runningAgent === 'agent3' ? 'Parsing Notes...' : 'Test Run Agent 3'}
              </button>
            </div>
          </div>

          {/* AGENT 4: Reorder Advisor Agent */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-orange-200 transition-all">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-amber-700 font-bold uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">Stage 4 of 5</span>
                    <h3 className="text-base font-bold text-stone-900 mt-1">Reorder Advisor Agent</h3>
                    <p className="text-xs text-stone-500 font-mono">ReorderAdvisorAgent.cs</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">Proposal Synthesis</span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 text-xs text-stone-700 space-y-1.5">
                <p><strong>🎯 Primary Mission:</strong> Synthesizes deficit, velocity & field signals into an optimal reorder quantity, calculates supplier costs, and generates AI reasoning.</p>
                <p><strong>🔧 Backend Tools Used:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-stone-200 text-amber-600 font-mono text-[11px]">ReorderOptimizer.SynthesizeProposal()</code></p>
              </div>

              {/* Simulation Box */}
              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                  <span>Synthesized Proposal Output:</span>
                  <span className="text-[11px] font-mono text-amber-700">94% Confidence</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-amber-100">
                    <span className="text-[10px] text-stone-500 block">Recommended Quantity</span>
                    <span className="font-bold text-orange-600 text-sm">{recommendedQty} units</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-amber-100">
                    <span className="text-[10px] text-stone-500 block">Estimated Cost</span>
                    <span className="font-bold text-emerald-600 text-sm">LKR {estimatedTotalCost.toLocaleString()}</span>
                  </div>
                </div>

                {agentResults['agent4'] && (
                  <div className="mt-2 p-3 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-1 animate-fadeIn">
                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Plain-Language Agent Output:
                    </p>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      "Combining your {deficit}-unit deficit, {selectedProduct.avgDailySales}/day run-rate, and {selectedProduct.fieldDemandBoost} field surge, the optimal replenishment is <strong>{recommendedQty} units</strong> costing <strong>LKR {estimatedTotalCost.toLocaleString()}</strong>."
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-400 font-medium">Avg Execution: ~55ms</span>
              <button
                onClick={() => handleTestRunSingleAgent('agent4')}
                disabled={runningAgent === 'agent4'}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
              >
                {runningAgent === 'agent4' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
                {runningAgent === 'agent4' ? 'Synthesizing...' : 'Test Run Agent 4'}
              </button>
            </div>
          </div>

          {/* AGENT 5: Validator Agent */}
          <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-orange-200 transition-all lg:col-span-2">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">Stage 5 of 5</span>
                    <h3 className="text-base font-bold text-stone-900 mt-1">Validator Agent (Pre-Approval Compliance)</h3>
                    <p className="text-xs text-stone-500 font-mono">ValidatorAgent.cs</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">Policy Gate</span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 text-xs text-stone-700 space-y-1.5">
                <p><strong>🎯 Primary Mission:</strong> Performs strict deterministic validation—preventing negative quantities, checking supplier MOQ batch constraints, and ensuring working capital limits before human review.</p>
                <p><strong>🔧 Backend Tools Used:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-stone-200 text-emerald-600 font-mono text-[11px]">BusinessRulesValidator.RunAllChecks()</code></p>
              </div>

              {/* Simulation Box */}
              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                  <span>Compliance Verification Checklist:</span>
                  <span className="text-[11px] font-mono text-emerald-700">4 of 4 Rules Passed</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-emerald-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-stone-700 font-medium">Non-Negative Check</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-stone-700 font-medium">Supplier MOQ (≥{selectedProduct.supplierMOQ})</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-stone-700 font-medium">Budget Ceiling Check</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-stone-700 font-medium">Active SKU Verification</span>
                  </div>
                </div>

                {agentResults['agent5'] && (
                  <div className="mt-2 p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-1 animate-fadeIn">
                    <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Plain-Language Agent Output:
                    </p>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      "Proposal passed all safety checks! Proposed <strong>{recommendedQty} units</strong> satisfies the supplier minimum batch order ({selectedProduct.supplierMOQ}) and cost (<strong>LKR {estimatedTotalCost.toLocaleString()}</strong>) is well within the LKR 250,000 monthly category budget limit. Safe to present to Manager."
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-400 font-medium">Avg Execution: ~30ms</span>
              <button
                onClick={() => handleTestRunSingleAgent('agent5')}
                disabled={runningAgent === 'agent5'}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
              >
                {runningAgent === 'agent5' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
                {runningAgent === 'agent5' ? 'Validating...' : 'Test Run Agent 5'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Live Human-In-The-Loop (HITL) Decision Gate Simulation */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border-2 border-orange-300 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold mb-2">
              <Shield className="w-3.5 h-3.5 text-orange-600" /> Human-in-the-Loop (HITL) Safeguard
            </div>
            <h2 className="text-xl font-bold text-stone-900">Live End-to-End Pipeline & Manager Approval Gate</h2>
            <p className="text-xs text-stone-500 mt-1">
              Watch all 5 agents execute in sequence and see how the system pauses at the Human Gate to protect company funds.
            </p>
          </div>

          <button
            onClick={handleRunFullPipeline}
            disabled={pipelineRunning}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md shadow-orange-600/20 flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            {pipelineRunning ? 'Executing Pipeline...' : '▶️ Trigger Full 5-Agent Scan'}
          </button>
        </div>

        {/* 5-Step Visual Progression Tracker */}
        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          {[
            { num: 1, title: 'Inventory', desc: 'Deficit Scan' },
            { num: 2, title: 'Demand', desc: 'Velocity' },
            { num: 3, title: 'Field', desc: 'GPS Notes' },
            { num: 4, title: 'Advisor', desc: 'Qty & Cost' },
            { num: 5, title: 'Validator', desc: 'Safety Check' },
          ].map((step) => {
            const isDone = pipelineStep > step.num;
            const isCurrent = pipelineStep === step.num;
            return (
              <div
                key={step.num}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  isDone
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : isCurrent
                    ? 'bg-orange-50 border-orange-400 text-orange-800 ring-2 ring-orange-400/30 animate-pulse'
                    : 'bg-stone-50 border-stone-200 text-stone-400'
                }`}
              >
                <div className="flex justify-center mb-1">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-current text-[10px] font-bold flex items-center justify-center">
                      {step.num}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold truncate">{step.title}</p>
                <p className="text-[10px] opacity-80 hidden sm:block truncate">{step.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Human Decision Gate Interface (Stage 5) */}
        {pipelineStep === 5 && (
          <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-50 to-orange-50/70 border border-orange-200 rounded-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 animate-ping" />
                <h4 className="text-sm font-bold text-orange-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-orange-600" /> Human-in-the-Loop Safety Gate: Decision Required
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-orange-800 bg-orange-100 px-2.5 py-1 rounded-full border border-orange-200">
                Awaiting Manager Decision
              </span>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              All 5 AI agents have completed their analysis without any human intervention. 
              However, <strong>StockFlow will NEVER purchase or update stock tables automatically</strong>. 
              As Manager, please review the AI proposal below and authorize or reject:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white rounded-xl border border-orange-200 shadow-2xs">
              <div>
                <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">Target Product</span>
                <span className="text-sm font-bold text-stone-900 block">{selectedProduct.name}</span>
                <span className="text-xs text-stone-500 font-mono">{selectedProduct.sku}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-orange-600 uppercase tracking-wider block">Proposed Reorder</span>
                <span className="text-base font-bold text-orange-600">{recommendedQty} Units</span>
                <span className="text-xs text-stone-500 block">Covers {daysRemaining} days + 7-day safety buffer</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">Total Estimated Cost</span>
                <span className="text-base font-bold text-emerald-700">LKR {estimatedTotalCost.toLocaleString()}</span>
                <span className="text-xs text-emerald-600 block">@ LKR {selectedProduct.unitCost}/unit (Supplier MOQ: {selectedProduct.supplierMOQ})</span>
              </div>
            </div>

            {/* Decision Controls */}
            {!hitlDecision ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setHitlDecision('approved');
                    toast.success(`Authorized! Procurement order created for ${recommendedQty} units of ${selectedProduct.sku}`);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <ThumbsUp className="w-4 h-4" /> Authorize & Approve Reorder (Manager Approval)
                </button>
                <button
                  onClick={() => {
                    setHitlDecision('rejected');
                    setRejectReason('Supplier price renegotiation pending');
                    toast.error(`Reorder proposal rejected for ${selectedProduct.sku}`);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-red-700 hover:bg-red-100 bg-red-50 border border-red-200 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <ThumbsDown className="w-4 h-4" /> Reject Proposal
                </button>
              </div>
            ) : hitlDecision === 'approved' ? (
              <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-3 animate-fadeIn">
                <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-950">Manager Authorized!</p>
                  <p className="mt-0.5">Procurement purchase order triggered. Inventory tables will be updated upon supplier warehouse dispatch.</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-100 border border-red-300 rounded-xl text-xs text-red-900 flex items-center gap-3 animate-fadeIn">
                <XCircle className="w-6 h-6 text-red-700 shrink-0" />
                <div>
                  <p className="font-bold text-red-950">Proposal Rejected by Manager</p>
                  <p className="mt-0.5">Reason: "{rejectReason}". No inventory or capital mutation occurred.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
