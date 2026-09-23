import { useState, useEffect } from 'react';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import stockService from '../../../services/api/stockService';
import productService from '../../../services/api/productService';
import { formatNumber } from '../../../utils/formatters';
import { Gauge, Edit2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ThresholdsPage() {
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    minThreshold: 10,
    reorderQuantity: 20,
    alertEnabled: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchThresholds();

    // Real-time synchronization
    const interval = setInterval(() => {
      fetchThresholds(true);
    }, 8000);

    const handleFocus = () => fetchThresholds(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchThresholds = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [thresholdsRes, productsRes, levelsRes] = await Promise.allSettled([
        stockService.getThresholds(),
        productService.getAll(),
        stockService.getLevels(),
      ]);

      const thresholdsData = thresholdsRes.status === 'fulfilled' && Array.isArray(thresholdsRes.value) ? thresholdsRes.value : [];
      const rawProducts = productsRes.status === 'fulfilled' ? (productsRes.value?.items || (Array.isArray(productsRes.value) ? productsRes.value : [])) : [];
      const levelsData = levelsRes.status === 'fulfilled' && Array.isArray(levelsRes.value) ? levelsRes.value : [];

      // Create lookup maps
      const productMap = new Map();
      rawProducts.forEach((p) => {
        if (p.id) productMap.set(p.id, p);
      });

      const levelMap = new Map();
      levelsData.forEach((l) => {
        const pid = l.productId || l.id;
        if (pid) levelMap.set(pid, l);
      });

      // Merge thresholds with product SKU and real-time stock levels
      const merged = thresholdsData.map((t) => {
        const pid = t.productId || t.id;
        const prod = productMap.get(pid);
        const lvl = levelMap.get(pid);

        const sku = prod?.sku || lvl?.productSku || t.productSku || t.sku || '—';
        const name = t.productName || prod?.name || lvl?.productName || 'Product';
        const currentStock = lvl?.quantityOnHand ?? lvl?.onHandQuantity ?? t.currentStock ?? t.quantityOnHand ?? 0;
        const minThreshold = t.minThreshold ?? t.minimumThreshold ?? 10;
        const reorderQty = t.reorderQuantity ?? 20;

        return {
          ...t,
          productId: pid,
          productName: name,
          productSku: sku,
          currentStock: currentStock,
          minThreshold: minThreshold,
          reorderQuantity: reorderQty,
        };
      });

      setThresholds(merged);
    } catch (err) {
      console.error('Failed to load thresholds:', err);
      if (!silent) toast.error('Failed to load thresholds');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const openEdit = (row) => {
    setSelectedProduct(row);
    setForm({
      minThreshold: row.minThreshold ?? row.minimumThreshold ?? 10,
      reorderQuantity: row.reorderQuantity ?? 20,
      alertEnabled: row.alertEnabled !== false,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSaving(true);
    try {
      const payload = {
        minThreshold: parseInt(form.minThreshold) || 0,
        reorderQuantity: parseInt(form.reorderQuantity) || 0,
        alertEnabled: form.alertEnabled,
      };

      await stockService.updateThreshold(selectedProduct.productId, payload);
      toast.success(`Threshold updated for ${selectedProduct.productName}`);
      setShowModal(false);
      fetchThresholds();
    } catch (err) {
      console.error('Threshold update error:', err);
      toast.error(err.response?.data?.message || 'Failed to update threshold');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'product',
      header: 'Product',
      accessor: (row) => row.productName || '—',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200/80 flex items-center justify-center shrink-0">
            <Gauge className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <p className="font-bold text-stone-900 leading-tight">{row.productName}</p>
            <p className="text-xs text-stone-500 font-mono mt-0.5">{row.productSku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'current',
      header: 'Current Stock',
      accessor: (row) => row.currentStock,
      render: (row) => {
        const qty = row.currentStock ?? 0;
        const min = row.minThreshold ?? 10;
        const isLow = qty <= min;
        return (
          <span className={`font-bold ${isLow ? 'text-rose-700' : 'text-emerald-700'}`}>
            {formatNumber(qty)}
          </span>
        );
      },
    },
    {
      key: 'minimum',
      header: 'Min Threshold',
      accessor: (row) => row.minThreshold,
      render: (row) => (
        <span className="text-amber-800 font-bold px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200/80">
          {formatNumber(row.minThreshold)}
        </span>
      ),
    },
    {
      key: 'reorderQty',
      header: 'Reorder Quantity',
      accessor: (row) => row.reorderQuantity,
      render: (row) => (
        <span className="text-orange-800 font-bold px-2 py-0.5 rounded-lg bg-orange-50 border border-orange-200/80">
          +{formatNumber(row.reorderQuantity)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Stock Status',
      sortable: false,
      render: (row) => {
        const current = row.currentStock ?? 0;
        const min = row.minThreshold ?? 10;
        const below = current <= min;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
              below ? 'bg-rose-50 text-rose-800 border border-rose-200/80' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
            }`}
          >
            {below ? <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            {below ? 'Low Stock — Reorder Needed' : 'Adequate Stock'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openEdit(row);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-800 bg-orange-50 hover:bg-orange-100 transition-all border border-orange-200/80 shadow-2xs"
        >
          <Edit2 className="w-3.5 h-3.5" /> Configure
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Reorder Thresholds & Safety Stock</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Configure automated minimum safety stock and AI reorder quantities per SKU
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={thresholds}
        loading={loading}
        searchPlaceholder="Search products or SKU..."
      />

      {/* Edit Threshold Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Configure Safety Stock — ${selectedProduct?.productName || ''}`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="threshold-form"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-all shadow-xs"
            >
              {saving ? 'Saving...' : 'Save Threshold'}
            </button>
          </>
        }
      >
        <form id="threshold-form" onSubmit={handleSave} className="space-y-4">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-sm">
            <span className="text-stone-600 font-medium">Current Warehouse Stock:</span>
            <span className="font-bold text-stone-900 text-base">
              {selectedProduct?.currentStock ?? selectedProduct?.quantityOnHand ?? 0} units
            </span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Minimum Safety Threshold *
            </label>
            <input
              type="number"
              min="1"
              value={form.minThreshold}
              onChange={(e) => setForm({ ...form, minThreshold: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
            <p className="text-xs text-stone-500 mt-1">
              When current stock drops at or below this number, AI will trigger a reorder alert.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              Standard Reorder Quantity *
            </label>
            <input
              type="number"
              min="1"
              value={form.reorderQuantity}
              onChange={(e) => setForm({ ...form, reorderQuantity: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
            <p className="text-xs text-stone-500 mt-1">
              Recommended replenishment batch size for the AI Agent reorder proposal.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="alertEnabled"
              checked={form.alertEnabled}
              onChange={(e) => setForm({ ...form, alertEnabled: e.target.checked })}
              className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="alertEnabled" className="text-sm font-medium text-stone-700">
              Enable automated AI reorder notifications for this SKU
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
