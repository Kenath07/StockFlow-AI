// User roles
export const ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  STOREKEEPER: 'Storekeeper',
  FIELD_SALES: 'FieldSales',
};

// Order status values
export const ORDER_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  DISPATCHED: 'Dispatched',
  FULFILLED: 'Fulfilled',
  CANCELLED: 'Cancelled',
};

// Workflow status values
export const WORKFLOW_STATUS = {
  PLANNING: 'Planning',
  EXECUTING: 'Executing',
  PENDING_APPROVAL: 'PendingManagerApproval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

// Movement types
export const MOVEMENT_TYPE = {
  SALE: 'Sale',
  PURCHASE: 'Purchase',
  ADJUSTMENT: 'Adjustment',
  RETURN: 'Return',
  TRANSFER: 'Transfer',
};

// Status color mapping
export const STATUS_COLORS = {
  Pending: { bg: 'bg-amber-50 border border-amber-200/80', text: 'text-amber-800', dot: 'bg-amber-500' },
  Confirmed: { bg: 'bg-blue-50 border border-blue-200/80', text: 'text-blue-800', dot: 'bg-blue-500' },
  Dispatched: { bg: 'bg-orange-50 border border-orange-200/80', text: 'text-orange-800', dot: 'bg-orange-500' },
  Fulfilled: { bg: 'bg-emerald-50 border border-emerald-200/80', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  Cancelled: { bg: 'bg-red-50 border border-red-200/80', text: 'text-red-800', dot: 'bg-red-500' },
  Planning: { bg: 'bg-sky-50 border border-sky-200/80', text: 'text-sky-800', dot: 'bg-sky-500' },
  Executing: { bg: 'bg-indigo-50 border border-indigo-200/80', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  PendingManagerApproval: { bg: 'bg-orange-50 border border-orange-200/80', text: 'text-orange-800', dot: 'bg-orange-500' },
  Approved: { bg: 'bg-emerald-50 border border-emerald-200/80', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  Rejected: { bg: 'bg-rose-50 border border-rose-200/80', text: 'text-rose-800', dot: 'bg-rose-500' },
  Completed: { bg: 'bg-teal-50 border border-teal-200/80', text: 'text-teal-800', dot: 'bg-teal-500' },
  Failed: { bg: 'bg-red-50 border border-red-200/80', text: 'text-red-800', dot: 'bg-red-500' },
};

export const LOGIN_PRESETS = [
  { label: '👑 Admin', email: 'admin@stockflow.ai', password: 'Admin@123', role: 'Admin' },
  { label: '💼 Manager', email: 'manager@stockflow.ai', password: 'Manager@123', role: 'Manager' },
  { label: '📦 Storekeeper', email: 'storekeeper@stockflow.ai', password: 'Store@123', role: 'Storekeeper' },
  { label: '📱 Field Sales', email: 'officer@stockflow.ai', password: 'Officer@123', role: 'FieldSales' },
];

// Navigation items per role
export const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STOREKEEPER] },
    ],
  },
  {
    section: 'Inventory',
    items: [
      { label: 'Products', path: '/inventory/products', icon: 'Package', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STOREKEEPER] },
      { label: 'Stock Levels', path: '/inventory/stock', icon: 'BarChart3', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STOREKEEPER] },
      { label: 'Movements', path: '/inventory/movements', icon: 'ArrowLeftRight', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STOREKEEPER] },
      { label: 'Thresholds', path: '/inventory/thresholds', icon: 'Gauge', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STOREKEEPER] },
      { label: 'Utilisation Reports', path: '/inventory/reports', icon: 'PieChart', roles: [ROLES.ADMIN, ROLES.MANAGER] },
    ],
  },
  {
    section: 'Orders',
    items: [
      { label: 'Orders Desk', path: '/orders', icon: 'ShoppingCart', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.STOREKEEPER] },
      { label: 'Customers', path: '/customers', icon: 'Users', roles: [ROLES.ADMIN, ROLES.MANAGER] },
    ],
  },
  {
    section: 'Field Operations',
    items: [
      { label: 'Field Agents', path: '/field/agents', icon: 'UserCheck', roles: [ROLES.ADMIN, ROLES.MANAGER] },
      { label: 'Visit Logs', path: '/field/visits', icon: 'MapPin', roles: [ROLES.ADMIN, ROLES.MANAGER] },
      { label: 'Device Captures', path: '/field/captures', icon: 'ScanLine', roles: [ROLES.ADMIN, ROLES.MANAGER] },
      { label: 'Sync Queue', path: '/field/sync-queue', icon: 'RefreshCw', roles: [ROLES.ADMIN, ROLES.MANAGER] },
    ],
  },
  {
    section: 'AI Agent',
    items: [
      { label: 'Workflows', path: '/agent/workflows', icon: 'BrainCircuit', roles: [ROLES.ADMIN, ROLES.MANAGER] },
      { label: 'Agent Intelligence', path: '/agent/directory', icon: 'Cpu', roles: [ROLES.ADMIN, ROLES.MANAGER] },
      { label: 'Approvals', path: '/agent/approvals', icon: 'CheckCircle2', roles: [ROLES.MANAGER] },
      { label: 'Notification Log', path: '/agent/notifications', icon: 'Bell', roles: [ROLES.ADMIN, ROLES.MANAGER] },
    ],
  },
];
