import { useState, useEffect } from 'react';
import DataTable from '../../../components/common/DataTable';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import stockService from '../../../services/api/stockService';
import productService from '../../../services/api/productService';
import { formatDateTime, formatNumber } from '../../../utils/formatters';
import { ArrowLeftRight, Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StockMovementsPage() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    newQuantity: 0,
    reason: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMovements();
    fetchProducts();
  }, []);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const data = await stockService.getMovements();
      setMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load movements');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await productService.getAll();
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
        if (!form.productId) {
          setForm((prev) => ({
            ...prev,
            productId: data[0].id,
            newQuantity: data[0].quantityOnHand ?? 0,
          }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductChange = (productId) => {
    const selected = products.find((p) => p.id === productId);
    setForm({
      ...form,
      productId,
      newQuantity: selected?.quantityOnHand ?? 0,
    });
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId) return;
    setSaving(true);
    try {
      const payload = {
        productId: form.productId,
        newQuantity: parseInt(form.newQuantity) || 0,
        reason: form.reason?.trim() || 'Physical inventory cycle count adjustment',
      };

      await stockService.adjustStock(payload);
      toast.success('Stock adjustment recorded successfully');
      setShowModal(false);
      setForm({ productId: products[0]?.id || '', newQuantity: 0, reason: '' });
      fetchMovements();
    } catch (err) {
      console.error('Adjustment error:', err);
      toast.error(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  const formatUser = (userStr) => {
    if (!userStr) return 'Storekeeper';
    if (userStr.includes('@')) return userStr.split('@')[0];
    if (userStr.length > 20) return 'Storekeeper / Admin';
    return userStr;
  };

  const columns = [
    {
      key: 'date',
      header: 'Date & Time',
      accessor: (row) => row.performedAt || row.createdAt,
      render: (row) => (
        <span className="text-sm text-stone-600 font-medium">
          {formatDateTime(row.performedAt || row.createdAt)}
        </span>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      accessor: (row) => row.productName || 'Product',
      render: (row) => (
        <div>
          <p className="font-semibold text-stone-900">{row.productName || 'Product'}</p>
          <p className="text-xs text-stone-500 font-mono">{row.productSku || 'SKU'}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Movement Type',
      accessor: (row) => row.movementType || row.type || 'Adjustment',
      render: (row) => {
        const type = row.movementType || row.type || 'Adjustment';
        return <Badge status={type === 'Restock' || type === 'Purchase' ? 'Fulfilled' : type === 'Sale' ? 'Confirmed' : 'Pending'}>{type}</Badge>;
      },
    },
    {
      key: 'quantity',
      header: 'Qty Change',
      accessor: (row) => row.quantity ?? 0,
      render: (row) => {
        const qty = row.quantity ?? 0;
        return (
          <span className={`font-bold ${qty >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {qty >= 0 ? `+${formatNumber(qty)}` : formatNumber(qty)}
          </span>
        );
      },
    },
    {
      key: 'reference',
      header: 'Reference / Notes',
      accessor: (row) => row.referenceNumber || row.notes || '—',
      render: (row) => (
        <div>
          <span className="font-mono text-xs text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md">
            {row.referenceNumber || 'INITIAL'}
          </span>
          {row.notes && <p className="text-xs text-stone-500 mt-0.5 max-w-xs truncate">{row.notes}</p>}
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Performed By',
      accessor: (row) => row.performedBy || 'Storekeeper',
      render: (row) => (
        <span className="text-xs text-stone-500 font-medium">
          {formatUser(row.performedBy)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Stock Movement Ledger</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Chronological audit trail of all warehouse purchases, sales, and inventory adjustments
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Record Adjustment
        </button>
      </div>

      <DataTable
        columns={columns}
        data={movements}
        loading={loading}
        searchPlaceholder="Search movements, reference, or product..."
      />

      {/* Record Stock Adjustment Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Stock Adjustment"
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
              form="adjustment-form"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xs"
            >
              {saving ? 'Recording...' : 'Apply Adjustment'}
            </button>
          </>
        }
      >
        <form id="adjustment-form" onSubmit={handleAdjustmentSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Select Product *</label>
            <select
              value={form.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Current: {p.quantityOnHand ?? 0}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">
              New Counted Physical Quantity *
            </label>
            <input
              type="number"
              min="0"
              value={form.newQuantity}
              onChange={(e) => setForm({ ...form, newQuantity: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <p className="text-xs text-stone-500 mt-1">
              System will calculate the net +/- difference and log an immutable audit movement.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Reason / Notes *</label>
            <textarea
              rows={3}
              placeholder="e.g. Physical inventory count correction, damaged stock removal..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
