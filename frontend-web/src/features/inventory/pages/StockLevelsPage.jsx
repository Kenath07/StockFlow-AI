import { useState, useEffect } from 'react';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import stockService from '../../../services/api/stockService';
import { formatNumber } from '../../../utils/formatters';
import { BarChart3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StockLevelsPage() {
  const [stockLevels, setStockLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdjust, setShowAdjust] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: '', reason: 'Audit Discrepancy', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchLevels(); }, []);

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const [levelsRes, thresholdsRes] = await Promise.allSettled([
        stockService.getLevels(),
        stockService.getThresholds(),
      ]);

      const levelsData = levelsRes.status === 'fulfilled' && Array.isArray(levelsRes.value) ? levelsRes.value : [];
      const thresholdsData = thresholdsRes.status === 'fulfilled' && Array.isArray(thresholdsRes.value) ? thresholdsRes.value : [];

      // Create a lookup map for thresholds by productId
      const thresholdMap = new Map();
      thresholdsData.forEach((t) => {
        const pid = t.productId || t.id;
        if (pid) thresholdMap.set(pid, t);
      });

      // Merge stock levels with thresholds and normalize fields
      const merged = levelsData.map((s) => {
        const pid = s.productId || s.id;
        const t = thresholdMap.get(pid);
        const onHand = s.quantityOnHand ?? s.onHandQuantity ?? s.quantity ?? 0;
        const reserved = s.quantityReserved ?? s.reservedQuantity ?? 0;
        const available = s.quantityAvailable ?? Math.max(0, onHand - reserved);
        const minThreshold = t?.minThreshold ?? t?.minimumThreshold ?? s.minimumThreshold ?? s.minThreshold ?? 0;
        const reorderQty = t?.reorderQuantity ?? s.reorderQuantity ?? 0;
        const sku = s.productSku || s.sku || s.product?.sku || '—';
        const name = s.productName || s.name || s.product?.name || 'Product';

        return {
          ...s,
          productId: pid,
          productName: name,
          productSku: sku,
          quantityOnHand: onHand,
          quantityReserved: reserved,
          quantityAvailable: available,
          minThreshold: minThreshold,
          reorderQuantity: reorderQty,
        };
      });

      setStockLevels(merged);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load stock levels');
    } finally {
      setLoading(false);
    }
  };

  const getStockHealth = (available, threshold) => {
    const avail = Number(available) ?? 0;
    const thresh = Number(threshold) ?? 0;

    if (avail <= 0) {
      return { label: 'Out of Stock', color: 'rose', icon: '🔴' };
    }
    if (thresh > 0) {
      if (avail <= thresh * 0.5) {
        return { label: 'Critical Deficit', color: 'rose', icon: '🔴' };
      }
      if (avail <= thresh) {
        return { label: 'Low Stock', color: 'amber', icon: '🟡' };
      }
    }
    return { label: 'Healthy', color: 'emerald', icon: '🟢' };
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await stockService.adjustStock({
        productId: selectedItem?.productId || selectedItem?.id,
        quantity: parseInt(adjustForm.quantity),
        reason: adjustForm.reason,
        notes: adjustForm.notes,
      });
      toast.success('Stock adjusted');
      setShowAdjust(false);
      fetchLevels();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Adjustment failed');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'product', header: 'Product', accessor: (row) => row.productName, render: (row) => (
      <div>
        <p className="font-bold text-stone-900 leading-tight">{row.productName}</p>
        <p className="text-xs text-stone-500 font-mono mt-0.5">{row.productSku}</p>
      </div>
    )},
    { key: 'onHand', header: 'On-Hand', accessor: (row) => row.quantityOnHand, render: (row) => (
      <span className="font-bold text-stone-900">{formatNumber(row.quantityOnHand)}</span>
    )},
    { key: 'reserved', header: 'Reserved', accessor: (row) => row.quantityReserved, render: (row) => (
      <span className="text-amber-700 font-semibold">{formatNumber(row.quantityReserved)}</span>
    )},
    { key: 'available', header: 'Available', accessor: (row) => row.quantityAvailable, render: (row) => {
      const isLow = row.minThreshold > 0 && row.quantityAvailable <= row.minThreshold;
      return (
        <span className={`font-bold ${isLow ? 'text-amber-700' : 'text-emerald-700'}`}>
          {formatNumber(row.quantityAvailable)}
        </span>
      );
    }},
    { key: 'threshold', header: 'Min Threshold', accessor: (row) => row.minThreshold, render: (row) => (
      <span className="text-stone-600 font-medium">{formatNumber(row.minThreshold)}</span>
    )},
    { key: 'reorder', header: 'Reorder Qty', accessor: (row) => row.reorderQuantity, render: (row) => (
      <span className="text-stone-600 font-medium">{formatNumber(row.reorderQuantity)}</span>
    )},
    { key: 'health', header: 'Health', sortable: false, render: (row) => {
      const health = getStockHealth(row.quantityAvailable, row.minThreshold);
      const colorMap = {
        emerald: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
        amber: 'bg-amber-50 text-amber-800 border border-amber-200/80',
        rose: 'bg-rose-50 text-rose-800 border border-rose-200/80',
      };
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${colorMap[health.color]}`}>
          {health.icon} {health.label}
        </span>
      );
    }},
    { key: 'action', header: '', sortable: false, render: (row) => (
      <button
        onClick={(e) => { e.stopPropagation(); setSelectedItem(row); setShowAdjust(true); setAdjustForm({ quantity: '', reason: 'Audit Discrepancy', notes: '' }); }}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-800 bg-orange-50 border border-orange-200/80 hover:bg-orange-100 transition-all shadow-2xs"
      >
        Adjust
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="pt-1">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Stock Levels</h1>
        <p className="text-sm text-stone-500 mt-0.5">Real-time inventory quantities across all SKUs</p>
      </div>

      <DataTable columns={columns} data={stockLevels} loading={loading} searchPlaceholder="Search products..." />

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={showAdjust}
        onClose={() => setShowAdjust(false)}
        title={`Adjust Stock — ${selectedItem?.productName || selectedItem?.product?.name || 'Product'}`}
        size="sm"
        footer={
          <>
            <button onClick={() => setShowAdjust(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100">Cancel</button>
            <button onClick={handleAdjust} disabled={saving || !adjustForm.quantity} className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xs">
              {saving ? 'Adjusting...' : 'Apply Adjustment'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAdjust} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Quantity Change *</label>
            <input type="number" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} placeholder="e.g. +50 or -10" required className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            <p className="text-xs text-stone-500 mt-1">Use positive for additions, negative for removals</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Reason</label>
            <select value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
              <option value="Audit Discrepancy">Audit Discrepancy</option>
              <option value="Breakage">Breakage</option>
              <option value="Supplier Return">Supplier Return</option>
              <option value="Damage">Damage</option>
              <option value="Received Stock">Received Stock</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Notes</label>
            <textarea rows={2} value={adjustForm.notes} onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
