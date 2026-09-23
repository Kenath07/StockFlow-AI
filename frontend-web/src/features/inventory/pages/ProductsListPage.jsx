import { useState, useEffect } from 'react';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import BarcodeVisual from '../../../components/common/BarcodeVisual';
import productService from '../../../services/api/productService';
import { formatCurrency } from '../../../utils/formatters';
import { Plus, Edit2, Trash2, Package, QrCode, Printer, Check, Copy, LayoutGrid, Tag, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

const DEFAULT_CATEGORIES = [
  { id: '8bd15010-ce37-4a50-996c-127e049b7ed4', name: 'Beverages' },
  { id: '3744c869-fcf9-4786-95ae-cfa5c1a2d719', name: 'Dairy & Chilled' },
  { id: '36538b28-fa93-407c-bfc9-45ae3eb4d191', name: 'Dry Goods & Staples' },
  { id: 'e13fa56b-bb15-4a0d-b165-7dddc89ad33f', name: 'Snacks & Confectionery' },
];

export default function ProductsListPage() {
  const { user, hasRole } = useAuth();
  const isAdmin = user?.role === 'Admin' || hasRole('Admin');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState(null);
  const [copied, setCopied] = useState(false);
  const [printQuantity, setPrintQuantity] = useState(20);
  const [previewMode, setPreviewMode] = useState('sheet');

  const [form, setForm] = useState({
    name: '',
    sku: '',
    categoryId: DEFAULT_CATEGORIES[0].id,
    unitOfMeasure: 'Unit',
    unitPrice: '',
    costPrice: '',
    barcode: '',
    description: '',
    initialStock: 0,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();

    // Real-time synchronization
    const interval = setInterval(() => {
      fetchProducts(true);
    }, 8000);

    const handleFocus = () => fetchProducts(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await productService.getCategories();
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
        setForm((prev) => ({
          ...prev,
          categoryId: prev.categoryId || data[0].id,
        }));
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchProducts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await productService.getAll();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      if (!silent) toast.error('Failed to load products');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for duplicate product names
    const normalizedName = form.name.trim().toLowerCase();
    const duplicate = products.find(
      (p) => p.name.trim().toLowerCase() === normalizedName && p.id !== editProduct?.id
    );
    if (duplicate) {
      toast.error(`A product with the name "${duplicate.name}" already exists (${duplicate.sku})! Please choose a unique name.`);
      return;
    }

    const unitPriceNum = parseFloat(form.unitPrice);
    if (isNaN(unitPriceNum) || unitPriceNum <= 0) {
      toast.error('Unit Price must be greater than 0 LKR (cannot be zero or negative)');
      return;
    }

    const costPriceNum = parseFloat(form.costPrice) || 0;
    if (costPriceNum < 0) {
      toast.error('Cost Price cannot be negative');
      return;
    }

    setSaving(true);
    try {
      const selectedCategory = form.categoryId || (categories.length > 0 ? categories[0].id : null);

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        description: form.description?.trim() || null,
        unitPrice: parseFloat(form.unitPrice) || 0,
        costPrice: parseFloat(form.costPrice) || 0,
        unitOfMeasure: form.unitOfMeasure || 'Unit',
        barcode: form.barcode?.trim() || null,
        categoryId: selectedCategory,
        initialStock: parseInt(form.initialStock) || 0,
        isActive: form.isActive !== false,
      };

      if (editProduct) {
        await productService.update(editProduct.id, payload);
        toast.success('Product updated successfully');
      } else {
        await productService.create(payload);
        toast.success('Product created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error('Save product error:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.title || 'Failed to save product';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      sku: '',
      categoryId: categories.length > 0 ? categories[0].id : '',
      unitOfMeasure: 'Unit',
      unitPrice: '',
      costPrice: '',
      barcode: '',
      description: '',
      initialStock: 0,
      isActive: true,
    });
    setEditProduct(null);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await productService.delete(productToDelete.id);
      toast.success(`Product "${productToDelete.name}" deleted successfully`);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      console.error('Delete product error:', err);
      const errMsg = err?.response?.data?.message || err?.response?.data?.title || 'Failed to delete product';
      toast.error(errMsg);
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId || (categories[0]?.id ?? ''),
      unitOfMeasure: product.unitOfMeasure || 'Unit',
      unitPrice: product.unitPrice ?? '',
      costPrice: product.costPrice ?? '',
      barcode: product.barcode || '',
      description: product.description || '',
      initialStock: product.quantityOnHand ?? 0,
      isActive: product.isActive !== false,
    });
    setShowModal(true);
  };

  const handlePrintBarcode = (count = printQuantity) => {
    if (!selectedBarcodeProduct) return;

    // Grab the rendered SVG vector barcode from the preview modal
    const svgElement = document.querySelector('#printable-barcode-preview svg') || document.querySelector('#printable-barcode-label svg');
    const svgHtml = svgElement ? svgElement.outerHTML : '';
    const code = selectedBarcodeProduct.barcode || selectedBarcodeProduct.sku;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    // Generate N identical sticker cards
    const stickersHtml = Array.from({ length: count }).map(() => `
      <div class="sticker-card">
        <div class="sticker-header">
          <span class="sf-badge">SF</span>
          <span class="sf-title">StockFlow AI • SME</span>
        </div>
        <div class="prod-name" title="${selectedBarcodeProduct.name}">${selectedBarcodeProduct.name}</div>
        <div class="meta-row">
          <span>SKU: <b>${selectedBarcodeProduct.sku}</b></span>
          <span>Price: <b style="color:#c2410c;">${formatCurrency(selectedBarcodeProduct.unitPrice)}</b></span>
        </div>
        <div class="barcode-box">
          ${svgHtml}
        </div>
        <div class="barcode-num">${code}</div>
      </div>
    `).join('');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>StockFlow AI - Barcode Sticker Sheet (${count}x)</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #0f172a;
            width: 100%;
            height: 100%;
          }
          .sheet-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: repeat(5, 1fr);
            gap: 2.5mm;
            width: 100%;
            height: 285mm;
          }
          .sticker-card {
            border: 1px dashed #cbd5e1;
            border-radius: 5px;
            padding: 3px 5px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            text-align: center;
            background: #ffffff;
            page-break-inside: avoid;
            overflow: hidden;
          }
          .sticker-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
            width: 100%;
            border-bottom: 0.5px solid #f1f5f9;
            padding-bottom: 1px;
          }
          .sf-badge {
            background: #ea580c;
            color: #ffffff;
            font-size: 6.5px;
            font-weight: 900;
            border-radius: 2px;
            padding: 0.5px 2.5px;
            line-height: 1;
          }
          .sf-title {
            font-size: 7px;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.2px;
          }
          .prod-name {
            font-size: 8px;
            font-weight: 700;
            color: #0f172a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            margin: 1px 0;
          }
          .meta-row {
            display: flex;
            justify-content: center;
            gap: 5px;
            font-size: 6.5px;
            color: #64748b;
          }
          .barcode-box {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            flex: 1;
            max-height: 28px;
            overflow: hidden;
            margin: 1px 0;
          }
          .barcode-box svg {
            max-width: 98%;
            max-height: 28px;
            height: auto;
          }
          .barcode-num {
            font-size: 6.5px;
            font-family: monospace;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="sheet-grid">
          ${stickersHtml}
        </div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 250);
  };

  const handleCopyBarcode = (barcode) => {
    navigator.clipboard.writeText(barcode);
    setCopied(true);
    toast.success('Barcode copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <div className="font-semibold text-stone-900 text-sm">{row.name}</div>
            <div className="text-xs text-stone-500">{row.categoryName || 'General'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      accessor: 'sku',
      render: (row) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
          {row.sku}
        </span>
      ),
    },
    {
      key: 'barcode',
      header: 'Barcode / QR',
      accessor: 'barcode',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (row.barcode || row.sku) setSelectedBarcodeProduct(row);
          }}
          className="inline-flex items-center gap-1.5 font-mono text-xs text-stone-600 hover:text-orange-600 bg-stone-50 hover:bg-orange-50 px-2 py-1 rounded-lg border border-stone-200 transition-all cursor-pointer"
          title="Click to view and print scannable barcode"
        >
          <QrCode className="w-3.5 h-3.5 text-orange-500" />
          <span>{row.barcode || row.sku}</span>
        </button>
      ),
    },
    {
      key: 'unitPrice',
      header: 'Price (LKR)',
      accessor: 'unitPrice',
      render: (row) => (
        <span className="font-bold text-stone-900 text-sm">
          {formatCurrency(row.unitPrice)}
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'Available Stock',
      accessor: 'quantityAvailable',
      render: (row) => {
        const qty = row.quantityAvailable ?? row.quantityOnHand ?? 0;
        const isLow = qty > 0 && qty <= 10;
        const isOut = qty <= 0;

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
              isOut
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : isLow
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            {qty} {row.unitOfMeasure || 'Units'}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
            row.isActive !== false
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              row.isActive !== false ? 'bg-emerald-500' : 'bg-stone-400'
            }`}
          />
          {row.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBarcodeProduct(row);
            }}
            title="View & Print Barcode Sticker"
            className="p-1.5 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-50 transition-all"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
            title="Edit Product"
            className="p-1.5 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-50 transition-all cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setProductToDelete(row);
              }}
              title="Delete Product (Admin Only)"
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Product Catalogue</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {products.length} products in inventory with real-time barcode telemetry
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        searchPlaceholder="Search by name, SKU, or barcode..."
      />

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editProduct ? 'Edit Product' : 'Add New Product'}
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-all shadow-xs"
            >
              {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Product Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Ceylon Black Tea 500g"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">SKU *</label>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                required
                placeholder="e.g. BEV-001"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Category</label>
              <select
                value={form.categoryId || (categories[0]?.id ?? '')}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Unit of Measure</label>
              <select
                value={form.unitOfMeasure}
                onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              >
                <option value="Unit">Unit / Item</option>
                <option value="Bottle">Bottle</option>
                <option value="Box">Box / Carton</option>
                <option value="Packet">Packet</option>
                <option value="Kg">Kilogram (kg)</option>
                <option value="Ltr">Liter (L)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Unit Price (LKR) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="850.00"
                value={form.unitPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.includes('-')) return;
                  setForm({ ...form, unitPrice: val });
                }}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Cost Price (LKR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="620.00"
                value={form.costPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.includes('-')) return;
                  setForm({ ...form, costPrice: val });
                }}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">
                Barcode (EAN-13 / Code 128)
              </label>
              <input
                value={form.barcode}
                placeholder="e.g. 4790001001001"
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            {!editProduct && (
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">Initial Stock</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.initialStock}
                  onChange={(e) => setForm({ ...form, initialStock: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            )}
          </div>

          {/* Real-time Live Barcode Preview */}
          {(form.barcode || form.sku) && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-col items-center">
              <span className="text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wider">
                Live Scannable Barcode Preview
              </span>
              <BarcodeVisual
                value={form.barcode || form.sku}
                height={45}
                width={1.8}
                fontSize={12}
              />
              <span className="text-[11px] text-stone-400 mt-1">
                Machine-readable barcode generated directly from input
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Product specifications..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
            />
          </div>
        </form>
      </Modal>

      {/* Barcode Sticker Preview & Print Modal */}
      {selectedBarcodeProduct && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedBarcodeProduct(null)}
          title="Product Barcode Sticker & Sheet Printing"
          size="lg"
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
              <button
                type="button"
                onClick={() =>
                  handleCopyBarcode(
                    selectedBarcodeProduct.barcode || selectedBarcodeProduct.sku
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition-colors self-start sm:self-auto"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Code'}
              </button>

              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedBarcodeProduct(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintBarcode(printQuantity)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition-all shadow-md shadow-orange-600/20 active:scale-[0.99]"
                >
                  <Printer className="w-4 h-4" />
                  Print {printQuantity} Labels (A4 Sheet)
                </button>
              </div>
            </div>
          }
        >
          <div className="flex flex-col space-y-4">
            {/* Hidden SVG generator for crisp print extraction */}
            <div id="printable-barcode-preview" className="hidden">
              <BarcodeVisual
                value={selectedBarcodeProduct.barcode || selectedBarcodeProduct.sku}
                height={35}
                width={1.4}
                fontSize={11}
              />
            </div>

            {/* Mode & Sheet Quantity Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80">
              <div className="flex items-center gap-1.5 bg-stone-200/70 p-1 rounded-lg w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewMode('sheet');
                    setPrintQuantity(20);
                  }}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    previewMode === 'sheet'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-orange-600" />
                  <span>20x Full Sheet (4×5)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewMode('single');
                    setPrintQuantity(1);
                  }}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    previewMode === 'single'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 text-orange-600" />
                  <span>Single Sticker (1x)</span>
                </button>
              </div>

              {/* Quantity Preset Selector */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs text-stone-500 font-medium">Quantity to Print:</span>
                <select
                  value={printQuantity}
                  onChange={(e) => setPrintQuantity(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value={20}>20 Labels (1 Full A4 Sheet)</option>
                  <option value={40}>40 Labels (2 Full A4 Sheets)</option>
                  <option value={10}>10 Labels (Half Sheet)</option>
                  <option value={1}>1 Label (Single)</option>
                </select>
              </div>
            </div>

            {/* PREVIEW: 20 Stickers Sheet (4 cols x 5 rows) */}
            {previewMode === 'sheet' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    A4 Sheet Layout: 4 Columns × 5 Rows = 20 Barcodes per Page
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Standard A4 Sheet (48mm × 55mm per label)
                  </span>
                </div>

                {/* 4x5 Scrollable Sheet Container */}
                <div className="max-h-[380px] overflow-y-auto p-3 bg-stone-100/70 rounded-xl border border-stone-200/80">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {Array.from({ length: Math.min(printQuantity, 20) }).map((_, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-lg border border-dashed border-stone-300 p-2 flex flex-col items-center justify-between text-center shadow-2xs hover:border-orange-300 transition-colors"
                      >
                        <div className="flex items-center justify-center gap-1 w-full border-b border-stone-100 pb-1">
                          <span className="bg-orange-600 text-white text-[7px] font-black rounded px-1 py-0.2 leading-tight">SF</span>
                          <span className="text-[7.5px] font-bold text-stone-600 uppercase tracking-tight">StockFlow AI</span>
                        </div>
                        <div className="font-bold text-stone-900 text-[9px] truncate w-full mt-1" title={selectedBarcodeProduct.name}>
                          {selectedBarcodeProduct.name}
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-[7.5px] text-stone-500 my-0.5">
                          <span className="font-mono">{selectedBarcodeProduct.sku}</span>
                          <span>•</span>
                          <span className="font-semibold text-orange-600">{formatCurrency(selectedBarcodeProduct.unitPrice)}</span>
                        </div>
                        <div className="w-full flex items-center justify-center my-0.5 max-h-[32px] overflow-hidden">
                          <BarcodeVisual
                            value={selectedBarcodeProduct.barcode || selectedBarcodeProduct.sku}
                            height={26}
                            width={1.1}
                            fontSize={8}
                            displayValue={false}
                          />
                        </div>
                        <div className="text-[7.5px] font-mono text-stone-400">
                          {selectedBarcodeProduct.barcode || selectedBarcodeProduct.sku}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* PREVIEW: Single Large Sticker (Ideal for screen-to-phone scan) */
              <div className="flex flex-col items-center text-center p-2 space-y-3">
                <div
                  id="printable-barcode-label"
                  className="w-full max-w-sm p-6 bg-white rounded-2xl border-2 border-dashed border-stone-300 flex flex-col items-center shadow-xs"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xs font-black">
                      SF
                    </div>
                    <span className="text-xs font-bold tracking-wider text-stone-800 uppercase">
                      StockFlow AI • SME Inventory
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 mb-0.5">
                    {selectedBarcodeProduct.name}
                  </h3>
                  <p className="text-xs text-stone-500 mb-3">
                    SKU: <span className="font-mono font-bold text-stone-800">{selectedBarcodeProduct.sku}</span> • Price: <span className="font-bold text-orange-600">{formatCurrency(selectedBarcodeProduct.unitPrice)}</span>
                  </p>

                  <BarcodeVisual
                    value={selectedBarcodeProduct.barcode || selectedBarcodeProduct.sku}
                    height={65}
                    width={2.2}
                    fontSize={14}
                    className="my-2"
                  />

                  <div className="mt-2 text-[11px] text-stone-400 font-mono">
                    Official Barcode: {selectedBarcodeProduct.barcode || selectedBarcodeProduct.sku}
                  </div>
                </div>
              </div>
            )}

            {/* Viva Demonstration Tip */}
            <div className="p-3 bg-orange-50/80 rounded-xl border border-orange-200/80 text-left w-full">
              <div className="flex items-center gap-2 text-orange-800 text-xs font-bold mb-1">
                <span>📱 Mobile Barcode Scanner Tip</span>
              </div>
              <p className="text-[12px] text-orange-950/80 leading-relaxed">
                Click <strong>"Print 20 Labels (A4 Sheet)"</strong> to print a full standard sheet of 20 stickers for warehouse boxes. Or switch to <strong>"Single Sticker"</strong> to scan directly from your phone camera using the StockFlow Mobile App!
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Delete Confirmation Modal */}
      <Modal
        isOpen={!!productToDelete}
        onClose={() => !deleting && setProductToDelete(null)}
        title="Delete Product"
        footer={
          <>
            <button
              type="button"
              disabled={deleting}
              onClick={() => setProductToDelete(null)}
              className="px-4 py-2 rounded-xl text-sm text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDeleteProduct}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-500 disabled:opacity-50 transition-all shadow-md shadow-rose-600/20 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete Product'}
            </button>
          </>
        }
      >
        {productToDelete && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Admin Authorization Required</p>
                <p className="text-xs text-rose-700 mt-0.5">This product will be removed from the active inventory catalogue.</p>
              </div>
            </div>
            <p className="text-sm text-stone-700">
              Are you sure you want to delete <strong className="text-stone-900">{productToDelete.name}</strong>?
            </p>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs font-mono text-stone-600 space-y-1">
              <div>SKU: <span className="font-bold text-stone-800">{productToDelete.sku}</span></div>
              <div>Barcode: <span className="font-bold text-stone-800">{productToDelete.barcode || '—'}</span></div>
              <div>Available Stock: <span className="font-bold text-stone-800">{productToDelete.quantityAvailable ?? productToDelete.quantityOnHand ?? 0} {productToDelete.unitOfMeasure || 'Units'}</span></div>
            </div>
            <p className="text-xs text-stone-500">
              Once deleted, this product will no longer appear in sales orders, mobile app scans, or active stock lists.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
