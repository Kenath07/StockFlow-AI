import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut, Bell, Search, X, CheckCircle2, AlertTriangle,
  Clock, Package, ArrowRight, ExternalLink, Sparkles
} from 'lucide-react';
import { getInitials, formatDateTime } from '../../utils/formatters';
import agentService from '../../services/api/agentService';
import reportService from '../../services/api/reportService';
import productService from '../../services/api/productService';

// Map pathname to page title
const getPageTitle = (pathname) => {
  const map = {
    '/dashboard': 'Executive Dashboard',
    '/inventory/products': 'Product Catalogue',
    '/inventory/stock': 'Stock Levels',
    '/inventory/movements': 'Stock Movements',
    '/inventory/thresholds': 'Reorder Thresholds',
    '/inventory/reports': 'Utilisation Reports',
    '/orders': 'Orders Desk',
    '/customers': 'Customer Directory',
    '/field/agents': 'Field Agents',
    '/field/visits': 'Visit Logs',
    '/field/captures': 'Device Captures',
    '/field/sync-queue': 'Sync Queue',
    '/agent/workflows': 'AI Workflows',
    '/agent/approvals': 'Pending Approvals',
    '/agent/directory': 'Agent Intelligence',
    '/agent/notifications': 'Notification Audit Log',
  };
  if (map[pathname]) return map[pathname];
  for (const [path, title] of Object.entries(map)) {
    if (pathname.startsWith(path)) return title;
  }
  return 'StockFlow AI';
};

const roleBadgeColors = {
  Admin: 'bg-orange-50 text-orange-800 border border-orange-200/70',
  Manager: 'bg-amber-50 text-amber-800 border border-amber-200/70',
  Storekeeper: 'bg-emerald-50 text-emerald-800 border border-emerald-200/70',
  FieldSales: 'bg-sky-50 text-sky-800 border border-sky-200/70',
};

const QUICK_PAGES = [
  { name: 'Dashboard', path: '/dashboard', category: 'Overview' },
  { name: 'Product Catalogue', path: '/inventory/products', category: 'Inventory' },
  { name: 'Stock Levels', path: '/inventory/stock', category: 'Inventory' },
  { name: 'Stock Movements', path: '/inventory/movements', category: 'Inventory' },
  { name: 'Reorder Thresholds', path: '/inventory/thresholds', category: 'Inventory' },
  { name: 'Utilisation Reports', path: '/inventory/reports', category: 'Inventory' },
  { name: 'Orders Desk', path: '/orders', category: 'Orders' },
  { name: 'Customer Directory', path: '/customers', category: 'Orders' },
  { name: 'AI Workflows', path: '/agent/workflows', category: 'AI Agent' },
  { name: 'Pending Approvals', path: '/agent/approvals', category: 'AI Agent' },
  { name: 'Agent Intelligence', path: '/agent/directory', category: 'AI Agent' },
  { name: 'Notification Audit Log', path: '/agent/notifications', category: 'AI Agent' },
  { name: 'Field Agents', path: '/field/agents', category: 'Field Ops' },
  { name: 'Visit Logs', path: '/field/visits', category: 'Field Ops' },
  { name: 'Device Captures', path: '/field/captures', category: 'Field Ops' },
  { name: 'Sync Queue', path: '/field/sync-queue', category: 'Field Ops' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);

  // Notifications State
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  // Search State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const searchInputRef = useRef(null);

  // Fetch real notifications and pending approval alerts
  useEffect(() => {
    fetchNotificationData();
  }, [location.pathname]);

  // Keyboard shortcut (Ctrl+K or /) for Global Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when search modal opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
      loadProducts();
    } else {
      setSearchQuery('');
    }
  }, [searchOpen]);

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const loadProducts = async () => {
    try {
      const res = await productService.getAll();
      const list = Array.isArray(res) ? res : (res?.items || []);
      setProducts(list);
    } catch {
      // silently fail
    }
  };

  const getReadStorageKey = () => `stockflow_read_notifications_${user?.id || user?.email || 'default'}`;
  const getReadTimestampKey = () => `stockflow_last_read_time_${user?.id || user?.email || 'default'}`;

  const getReadIds = () => {
    try {
      const stored = localStorage.getItem(getReadStorageKey());
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  };

  const getLastReadTime = () => {
    try {
      const stored = localStorage.getItem(getReadTimestampKey());
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  };

  const fetchNotificationData = async () => {
    try {
      const [workflowsRes, lowStockRes, auditRes] = await Promise.allSettled([
        agentService.getAll(),
        reportService.getLowStock(),
        reportService.getNotificationAudit(),
      ]);

      const items = [];

      // 1. Pending Approvals
      if (workflowsRes.status === 'fulfilled' && Array.isArray(workflowsRes.value)) {
        const pending = workflowsRes.value.filter((w) => w.status === 'PendingManagerApproval');
        pending.forEach((w) => {
          items.push({
            id: `wf-${w.id}`,
            type: 'approval',
            title: `Workflow #${w.id?.substring(0, 8)} Requires Decision`,
            subtitle: `${w.proposals?.length || 1} product reorder proposal(s) awaiting review`,
            time: w.createdAt,
            link: '/agent/approvals',
            urgent: true,
          });
        });
      }

      // 2. Low Stock Alerts
      if (lowStockRes.status === 'fulfilled' && Array.isArray(lowStockRes.value)) {
        const lowItems = lowStockRes.value.slice(0, 3);
        lowItems.forEach((p) => {
          items.push({
            id: `stock-${p.productId || p.sku}`,
            type: 'low_stock',
            title: `Low Stock: ${p.name || p.productName || p.sku}`,
            subtitle: `Only ${p.quantityOnHand ?? 0} units left (Min: ${p.minThreshold ?? 10})`,
            time: new Date().toISOString(),
            link: '/inventory/thresholds',
            urgent: true,
          });
        });
      }

      // 3. System dispatch logs
      if (auditRes.status === 'fulfilled' && Array.isArray(auditRes.value)) {
        auditRes.value.slice(0, 3).forEach((n) => {
          items.push({
            id: `notif-${n.id}`,
            type: 'dispatch',
            title: n.subject || `${n.channel} Alert Dispatched`,
            subtitle: `To: ${n.recipient || 'Recipient'} • Status: ${n.status}`,
            time: n.createdAt || n.sentAt,
            link: '/agent/notifications',
            urgent: n.status === 'Failed',
          });
        });
      }

      const readIds = getReadIds();
      const lastReadTime = getLastReadTime();

      const enriched = items.map((item) => {
        const itemTime = item.time ? new Date(item.time).getTime() : 0;
        const isRead = readIds.has(item.id) || (lastReadTime > 0 && itemTime > 0 && itemTime <= lastReadTime);
        return {
          ...item,
          isRead,
        };
      });

      setNotifications(enriched);
      setUnreadCount(enriched.filter((i) => !i.isRead).length);
    } catch (err) {
      console.error('Failed to load header notifications:', err);
    }
  };

  const handleMarkAllRead = () => {
    const readIds = getReadIds();
    notifications.forEach((item) => readIds.add(item.id));
    try {
      localStorage.setItem(getReadStorageKey(), JSON.stringify(Array.from(readIds)));
      localStorage.setItem(getReadTimestampKey(), Date.now().toString());
    } catch (e) {
      console.warn('Failed to save read state to localStorage', e);
    }
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (item) => {
    const readIds = getReadIds();
    readIds.add(item.id);
    try {
      localStorage.setItem(getReadStorageKey(), JSON.stringify(Array.from(readIds)));
    } catch (e) {
      console.warn('Failed to save read state to localStorage', e);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setNotifOpen(false);
    navigate(item.link);
  };

  const filteredPages = QUICK_PAGES.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter((p) =>
    (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-200/80 shadow-xs">
        <div className="flex items-center justify-between h-16 px-6">
          {/* Left - Page Title */}
          <div>
            <h2 className="text-lg font-bold text-stone-900">{pageTitle}</h2>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/70 hover:border-stone-300 transition-all text-xs font-medium group"
              title="Search (Ctrl + K)"
            >
              <Search className="w-4 h-4 text-stone-400 group-hover:text-stone-600 transition-colors" />
              <span className="hidden sm:inline text-stone-400">Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-stone-400 bg-stone-100 rounded-md border border-stone-200/80">
                ⌘K
              </kbd>
            </button>

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative p-2 rounded-xl text-stone-500 hover:text-stone-900 transition-all ${
                  notifOpen ? 'bg-stone-100 text-stone-900' : 'hover:bg-stone-100'
                }`}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white/95 backdrop-blur-xl border border-stone-200/90 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-stone-900 text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">
                          {unreadCount} urgent
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[340px] overflow-y-auto divide-y divide-stone-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-stone-400">
                        <CheckCircle2 className="w-8 h-8 stroke-1 mx-auto mb-1.5 text-emerald-500" />
                        <p className="text-sm font-medium text-stone-700">All caught up!</p>
                        <p className="text-xs text-stone-400 mt-0.5">No pending approvals or alerts.</p>
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={`p-3.5 hover:bg-stone-50 cursor-pointer transition-colors flex items-start gap-3 ${
                            item.isRead ? 'opacity-65' : 'bg-orange-50/20'
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {item.type === 'approval' ? (
                              <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                                <Clock className="w-4 h-4" />
                              </div>
                            ) : item.type === 'low_stock' ? (
                              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                                <Bell className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-xs truncate ${item.isRead ? 'font-medium text-stone-700' : 'font-bold text-stone-900'}`}>
                                {item.title}
                              </p>
                              {!item.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5 leading-snug line-clamp-2">{item.subtitle}</p>
                            <span className="text-[10px] text-stone-400 mt-1 block">
                              {formatDateTime(item.time)}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-stone-300 shrink-0 self-center" />
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 bg-stone-50/80 border-t border-stone-100 text-center">
                    <button
                      onClick={() => {
                        setNotifOpen(false);
                        navigate('/agent/notifications');
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
                    >
                      View all notification logs <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-stone-200" />

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                {getInitials(user?.name || user?.fullName || user?.email)}
              </div>
              <div className="hidden md:flex md:flex-col md:items-start">
                <p className="text-sm font-semibold text-stone-900 leading-tight">
                  {user?.name || user?.fullName || user?.email}
                </p>
                <span className={`mt-0.5 inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold ${roleBadgeColors[user?.role] || 'bg-stone-100 text-stone-600 border border-stone-200'}`}>
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all"
                title="Logout"
              >
                <LogOut className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Command Palette Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200/90 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-stone-200/80 gap-3">
              <Search className="w-5 h-5 text-stone-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages, products, SKUs..."
                className="w-full bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-400 border border-stone-200">
                  ESC
                </kbd>
              )}
            </div>

            {/* Results Body */}
            <div className="max-h-[380px] overflow-y-auto p-2 space-y-3">
              {/* Pages & Views */}
              {filteredPages.length > 0 && (
                <div>
                  <p className="px-3 py-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Navigation Pages
                  </p>
                  <div className="space-y-0.5">
                    {filteredPages.slice(0, 6).map((page) => (
                      <button
                        key={page.path}
                        onClick={() => {
                          setSearchOpen(false);
                          navigate(page.path);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm text-stone-700 hover:bg-indigo-50 hover:text-indigo-900 transition-colors group"
                      >
                        <span className="font-medium">{page.name}</span>
                        <span className="text-xs text-stone-400 group-hover:text-indigo-600 transition-colors">
                          {page.category} &rarr;
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Found */}
              {searchQuery && filteredProducts.length > 0 && (
                <div>
                  <p className="px-3 py-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Matched Products
                  </p>
                  <div className="space-y-0.5">
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSearchOpen(false);
                          navigate('/inventory/products');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm text-stone-700 hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-stone-400" />
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs text-stone-400 font-mono">({p.sku})</span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-600">
                          {p.quantityOnHand ?? 0} in stock
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchQuery && filteredPages.length === 0 && filteredProducts.length === 0 && (
                <div className="py-8 text-center text-stone-400">
                  <p className="text-sm">No results found for "{searchQuery}"</p>
                  <p className="text-xs text-stone-400 mt-1">Try searching for "Products", "Orders", or a product SKU</p>
                </div>
              )}
            </div>

            {/* Footer Tips */}
            <div className="px-4 py-2 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between text-[11px] text-stone-400">
              <span>Quick navigation &amp; live catalogue search</span>
              <span>Press <kbd className="font-mono bg-white px-1 border rounded text-stone-500">ESC</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
