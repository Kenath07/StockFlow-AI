import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import orderService from '../../../services/api/orderService';
import customerService from '../../../services/api/customerService';
import productService from '../../../services/api/productService';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { Plus, ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_TABS = ['All', 'Pending', 'Confirmed', 'Dispatched', 'Fulfilled', 'Cancelled'];

export default function OrdersListPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // New Order Form state
  const [orderForm, setOrderForm] = useState({
    customerId: '',
    notes: '',
    deliveryAddress: '',
    preferredDeliveryDate: '',
    lines: [
      { productId: '', quantity: 1, unitPrice: 0 },
    ],
  });

  useEffect(() => {
    fetchOrders();
    fetchInitialData();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getAll();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [custRes, prodRes] = await Promise.allSettled([
        customerService.getAll(),
        productService.getAll(),
      ]);

      const custData = custRes.status === 'fulfilled' ? (Array.isArray(custRes.value) ? custRes.value : []) : [];
      const prodData = prodRes.status === 'fulfilled' ? (Array.isArray(prodRes.value) ? prodRes.value : []) : [];

      setCustomers(custData);
      setProducts(prodData);

      if (custData.length > 0 && !orderForm.customerId) {
        setOrderForm((prev) => ({
          ...prev,
          customerId: custData[0].id,
          deliveryAddress: custData[0].address || '',
        }));
      }

      if (prodData.length > 0) {
        setOrderForm((prev) => ({
          ...prev,
          lines: [{ productId: prodData[0].id, quantity: 1, unitPrice: prodData[0].unitPrice || 0 }],
        }));
      }
    } catch (err) {
      console.error('Error fetching customers/products for order creation:', err);
    }
  };

  const openNewOrderModal = () => {
    if (customers.length > 0 && products.length > 0) {
      setOrderForm({
        customerId: customers[0].id,
        notes: '',
        deliveryAddress: customers[0].address || '',
        preferredDeliveryDate: '',
        lines: [
          { productId: products[0].id, quantity: 1, unitPrice: products[0].unitPrice || 0 },
        ],
      });
    }
    setShowModal(true);
  };

  const handleCustomerChange = (customerId) => {
    const cust = customers.find((c) => c.id === customerId);
    setOrderForm({
      ...orderForm,
      customerId,
      deliveryAddress: cust?.address || orderForm.deliveryAddress,
    });
  };

  const handleLineProductChange = (index, productId) => {
    const prod = products.find((p) => p.id === productId);
    const newLines = [...orderForm.lines];
    newLines[index] = {
      ...newLines[index],
      productId,
      unitPrice: prod?.unitPrice || 0,
    };
    setOrderForm({ ...orderForm, lines: newLines });
  };

  const handleLineQtyChange = (index, qty) => {
    const newLines = [...orderForm.lines];
    newLines[index] = {
      ...newLines[index],
      quantity: Math.max(1, parseInt(qty) || 1),
    };
    setOrderForm({ ...orderForm, lines: newLines });
  };

  const addLine = () => {
    const firstProd = products[0];
    setOrderForm({
      ...orderForm,
      lines: [
        ...orderForm.lines,
        { productId: firstProd ? firstProd.id : '', quantity: 1, unitPrice: firstProd?.unitPrice || 0 },
      ],
    });
  };

  const removeLine = (index) => {
    if (orderForm.lines.length <= 1) return;
    const newLines = orderForm.lines.filter((_, i) => i !== index);
    setOrderForm({ ...orderForm, lines: newLines });
  };

  const calculateTotal = () => {
    return orderForm.lines.reduce((acc, line) => acc + (line.quantity * (parseFloat(line.unitPrice) || 0)), 0);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.customerId) {
      toast.error('Please select a customer');
      return;
    }

    if (orderForm.lines.length === 0 || orderForm.lines.some((l) => !l.productId)) {
      toast.error('Please select at least one valid product');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (orderForm.preferredDeliveryDate && orderForm.preferredDeliveryDate < todayStr) {
      toast.error('Preferred delivery date cannot be in the past');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerId: orderForm.customerId,
        notes: orderForm.notes?.trim() || null,
        deliveryAddress: orderForm.deliveryAddress?.trim() || null,
        preferredDeliveryDate: orderForm.preferredDeliveryDate ? new Date(orderForm.preferredDeliveryDate).toISOString() : null,
        lines: orderForm.lines.map((l) => ({
          productId: l.productId,
          quantity: parseInt(l.quantity) || 1,
          unitPrice: parseFloat(l.unitPrice) || 0,
        })),
      };

      await orderService.create(payload);
      toast.success('Sales order created successfully');
      setShowModal(false);
      fetchOrders();
    } catch (err) {
      console.error('Create order error:', err);
      toast.error(err.response?.data?.message || err.response?.data?.title || 'Failed to create sales order');
    } finally {
      setSaving(false);
    }
  };

  const filtered = activeTab === 'All' ? orders : orders.filter((o) => o.status === activeTab);

  const columns = [
    {
      key: 'id',
      header: 'Order #',
      accessor: 'orderNumber',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-1 rounded-lg">
          {row.orderNumber || (row.id ? `#${row.id.substring(0, 8).toUpperCase()}` : '—')}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      accessor: (row) => row.customerName || '—',
      render: (row) => (
        <div>
          <p className="font-semibold text-stone-900">{row.customerName || 'Customer'}</p>
          <p className="text-xs text-stone-500">{row.deliveryAddress || ''}</p>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total Amount',
      accessor: 'totalAmount',
      render: (row) => (
        <span className="font-bold text-emerald-700">{formatCurrency(row.totalAmount)}</span>
      ),
    },
    {
      key: 'date',
      header: 'Order Date',
      accessor: (row) => row.orderDate || row.createdAt,
      render: (row) => formatDate(row.orderDate || row.createdAt),
    },
    {
      key: 'items',
      header: 'Items Count',
      accessor: (row) => row.lines?.length || row.lineCount || 0,
      render: (row) => (
        <span className="text-xs font-mono text-stone-600 font-medium">
          {(row.lines?.length || row.lineCount || 0)} item(s)
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Workflow Status',
      accessor: 'status',
      render: (row) => {
        const status = row.status || 'Pending';
        return <Badge status={status}>{status}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Orders Desk</h1>
          <p className="text-sm text-stone-500 mt-0.5">{orders.length} total orders across lifecycle</p>
        </div>
        <button
          onClick={openNewOrderModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/90 rounded-xl border border-stone-200/80 w-fit shadow-2xs">
        {STATUS_TABS.map((tab) => {
          const count = tab === 'All' ? orders.length : orders.filter((o) => o.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
            >
              {tab} {count > 0 && <span className="ml-1 text-[11px] opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchPlaceholder="Search by order #, customer..."
        onRowClick={(row) => navigate(`/orders/${row.id}`)}
      />

      {/* Create Order Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Sales Order"
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
              form="create-order-form"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xs"
            >
              {saving ? 'Creating Order...' : `Create Order (${formatCurrency(calculateTotal())})`}
            </button>
          </>
        }
      >
        <form id="create-order-form" onSubmit={handleCreateOrder} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Customer Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Select Customer *</label>
              <select
                value={orderForm.customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                {customers.length === 0 ? (
                  <option value="">No customers available</option>
                ) : (
                  customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.companyName} ({c.city || 'Colombo'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Preferred Delivery Date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={orderForm.preferredDeliveryDate}
                onChange={(e) => setOrderForm({ ...orderForm, preferredDeliveryDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Delivery Address</label>
            <input
              value={orderForm.deliveryAddress}
              placeholder="e.g. 123 Main Street, Colombo 03"
              onChange={(e) => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Line Items Section */}
          <div className="pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-stone-900">Order Line Items</label>
              <button
                type="button"
                onClick={addLine}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {orderForm.lines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
                  <div className="col-span-6">
                    <label className="text-xs text-stone-500 block mb-0.5 font-medium">Product</label>
                    <select
                      value={line.productId}
                      onChange={(e) => handleLineProductChange(index, e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatCurrency(p.unitPrice)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs text-stone-500 block mb-0.5 font-medium">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => handleLineQtyChange(index, e.target.value)}
                      required
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                    />
                  </div>

                  <div className="col-span-3 text-right">
                    <label className="text-xs text-stone-500 block mb-0.5 font-medium">Subtotal</label>
                    <span className="text-xs font-bold text-emerald-700">
                      {formatCurrency(line.quantity * (parseFloat(line.unitPrice) || 0))}
                    </span>
                  </div>

                  <div className="col-span-1 text-center pt-3">
                    {orderForm.lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="text-stone-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Notes / Instructions</label>
            <textarea
              rows={2}
              placeholder="e.g. Urgent morning delivery requested..."
              value={orderForm.notes}
              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
