import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import orderService from '../../../services/api/orderService';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/formatters';
import {
  ArrowLeft, CheckCircle2, Truck, Package, XCircle,
  Clock, MapPin, Calendar, FileText, User, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_FLOW = [
  { key: 'Submitted', label: 'Submitted / Pending' },
  { key: 'Confirmed', label: 'Confirmed' },
  { key: 'Dispatched', label: 'Dispatched' },
  { key: 'Fulfilled', label: 'Fulfilled' },
];

const TRANSITIONS = {
  Submitted: {
    next: 'Confirmed',
    label: 'Confirm Order',
    icon: CheckCircle2,
    color: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20',
    description: 'Verify inventory reservation and approve order for warehouse dispatch.',
    roles: ['Admin', 'Manager', 'Storekeeper'],
  },
  Pending: {
    next: 'Confirmed',
    label: 'Confirm Order',
    icon: CheckCircle2,
    color: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20',
    description: 'Verify inventory reservation and approve order for warehouse dispatch.',
    roles: ['Admin', 'Manager', 'Storekeeper'],
  },
  Confirmed: {
    next: 'Dispatched',
    label: 'Dispatch Order',
    icon: Truck,
    color: 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20',
    description: 'Pack products and handover to field delivery officer.',
    roles: ['Admin', 'Manager', 'Storekeeper'],
  },
  Dispatched: {
    next: 'Fulfilled',
    label: 'Mark Fulfilled (Delivered)',
    icon: Package,
    color: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20',
    description: 'Confirm customer received items, payment collected, and finalize stock movements.',
    roles: ['Admin', 'Manager', 'Storekeeper'],
  },
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const data = await orderService.getById(id);
      setOrder(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleTransition = async () => {
    const transition = TRANSITIONS[order?.status];
    if (!transition) return;
    setTransitioning(true);
    try {
      await orderService.updateStatus(id, {
        newStatus: transition.next,
        reason: `Status progressed to ${transition.next} by ${user?.name || user?.email}`,
      });
      toast.success(`Order successfully transitioned to ${transition.next}`);
      setShowConfirmModal(false);
      fetchOrder();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Status transition failed');
    } finally {
      setTransitioning(false);
    }
  };

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    setTransitioning(true);
    try {
      await orderService.cancel(id, {
        newStatus: 'Cancelled',
        reason: cancelReason.trim() || 'Order cancelled by management',
      });
      toast.success('Order cancelled and reserved stock released');
      setShowCancelModal(false);
      fetchOrder();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading order details..." />;
  if (!order) return null;

  const currentStatus = order.status || 'Submitted';
  const transition = TRANSITIONS[currentStatus];
  const orderLines = order.lines || order.orderLines || [];

  // Determine current active timeline index
  const getTimelineIndex = (status) => {
    if (status === 'Fulfilled') return 3;
    if (status === 'Dispatched') return 2;
    if (status === 'Confirmed') return 1;
    return 0; // Submitted or Pending
  };

  const currentIdx = getTimelineIndex(currentStatus);
  const isTerminal = currentStatus === 'Fulfilled' || currentStatus === 'Cancelled';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-stone-900">
                Order #{order.orderNumber || (order.id ? order.id.substring(0, 8).toUpperCase() : '')}
              </h1>
              <Badge status={currentStatus}>{currentStatus}</Badge>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Created {formatDateTime(order.orderDate || order.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!isTerminal && hasRole(['Admin', 'Manager']) && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 rounded-xl text-sm text-rose-700 border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-all flex items-center gap-2 font-semibold shadow-2xs"
            >
              <XCircle className="w-4 h-4" /> Cancel Order
            </button>
          )}

          {transition && hasRole(transition.roles) && (
            <button
              onClick={() => setShowConfirmModal(true)}
              className={`px-5 py-2 rounded-xl text-sm text-white font-semibold transition-all flex items-center gap-2 shadow-xs ${transition.color}`}
            >
              <transition.icon className="w-4 h-4" /> {transition.label}
            </button>
          )}
        </div>
      </div>

      {/* Interactive Status Progression Timeline */}
      <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between">
          {STATUS_FLOW.map((step, idx) => {
            const isDone = currentStatus !== 'Cancelled' && idx <= currentIdx;
            const isCurrent = currentStatus !== 'Cancelled' && idx === currentIdx;

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      currentStatus === 'Cancelled'
                        ? 'bg-stone-100 text-stone-400 border border-stone-200'
                        : isDone
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-200'
                        : 'bg-stone-100 text-stone-500 border border-stone-200'
                    }`}
                  >
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-xs mt-2 font-semibold ${
                      isCurrent
                        ? 'text-indigo-700'
                        : isDone
                        ? 'text-stone-700'
                        : 'text-stone-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < STATUS_FLOW.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 transition-all ${
                      currentStatus !== 'Cancelled' && idx < currentIdx
                        ? 'bg-indigo-600'
                        : 'bg-stone-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Order Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer & Delivery Information */}
        <div className="space-y-6">
          <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" /> Customer Information
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-stone-500 font-medium">Customer Name</p>
                <p className="text-stone-900 font-semibold mt-0.5">{order.customerName || 'Standard Customer'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 font-medium">Delivery Address</p>
                <p className="text-stone-700 mt-0.5">{order.deliveryAddress || 'Store Pickup / Warehouse'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 font-medium">Preferred Delivery Date</p>
                <p className="text-stone-700 mt-0.5">
                  {order.preferredDeliveryDate ? formatDate(order.preferredDeliveryDate) : 'Standard Dispatch Window'}
                </p>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-amber-600" /> Order Notes
              </h3>
              <p className="text-sm text-stone-800 bg-stone-50 p-3 rounded-xl border border-stone-200">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        {/* Order Line Items Table */}
        <div className="lg:col-span-2 bg-white/85 backdrop-blur-md rounded-2xl border border-stone-200/80 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" /> Order Line Items ({orderLines.length})
            </h3>
            <span className="text-xs text-stone-500 font-medium">Inventory Reserved</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs text-stone-600 uppercase tracking-wider">
                  <th className="pb-3 font-bold">Product</th>
                  <th className="pb-3 font-bold text-center">Qty</th>
                  <th className="pb-3 font-bold text-right">Unit Price</th>
                  <th className="pb-3 font-bold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orderLines.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-stone-500">
                      No line items attached.
                    </td>
                  </tr>
                ) : (
                  orderLines.map((line) => (
                    <tr key={line.id || Math.random()} className="hover:bg-stone-50/70">
                      <td className="py-3.5">
                        <p className="font-semibold text-stone-900">{line.productName}</p>
                        <p className="text-xs text-stone-500 font-mono">{line.productSku || 'SKU'}</p>
                      </td>
                      <td className="py-3.5 text-center font-bold text-stone-900">
                        {line.quantity}
                      </td>
                      <td className="py-3.5 text-right text-stone-700 font-medium">
                        {formatCurrency(line.unitPrice)}
                      </td>
                      <td className="py-3.5 text-right font-bold text-emerald-700">
                        {formatCurrency(line.totalPrice ?? (line.quantity * line.unitPrice))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Grand Total Summary */}
          <div className="pt-4 border-t border-stone-200 flex justify-end">
            <div className="text-right space-y-1">
              <span className="text-xs text-stone-500 font-medium block">Total Payable Amount</span>
              <span className="text-2xl font-bold text-emerald-700 block">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Progressing Workflow */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={transition?.label || 'Update Status'}
        footer={
          <>
            <button
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTransition}
              disabled={transitioning}
              className={`px-5 py-2 rounded-xl text-sm text-white font-semibold transition-all shadow-xs ${transition?.color}`}
            >
              {transitioning ? 'Updating...' : `Confirm → ${transition?.next}`}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-stone-700">
            Are you sure you want to transition this order to{' '}
            <strong className="text-stone-900 font-bold">{transition?.next}</strong>?
          </p>
          <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
            {transition?.description}
          </p>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Sales Order"
        footer={
          <>
            <button
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={transitioning}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-all shadow-xs"
            >
              {transitioning ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCancelOrder} className="space-y-4">
          <p className="text-sm text-stone-700">
            Cancelling this order will immediately release all reserved inventory items back into available warehouse stock.
          </p>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Cancellation Reason *</label>
            <textarea
              rows={3}
              placeholder="e.g. Customer requested cancellation, out of stock..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
