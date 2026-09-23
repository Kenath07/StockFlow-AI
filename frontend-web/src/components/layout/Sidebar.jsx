import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS } from '../../utils/constants';
import {
  LayoutDashboard, Package, BarChart3, ArrowLeftRight, Gauge,
  ShoppingCart, Users, UserCheck, MapPin, ScanLine, RefreshCw,
  BrainCircuit, CheckCircle2, ChevronLeft, ChevronRight, ChevronDown, Zap, Cpu, PieChart, Bell
} from 'lucide-react';

import BrandLogo from '../common/BrandLogo';

const iconMap = {
  LayoutDashboard, Package, BarChart3, ArrowLeftRight, Gauge,
  ShoppingCart, Users, UserCheck, MapPin, ScanLine, RefreshCw,
  BrainCircuit, CheckCircle2, Cpu, PieChart, Bell
};

const SECTION_ICONS = {
  Overview: LayoutDashboard,
  Inventory: Package,
  Orders: ShoppingCart,
  'Field Operations': MapPin,
  'AI Agent': Cpu,
};

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user } = useAuth();
  const location = useLocation();

  // Filter sections by role
  const filteredNavItems = NAV_ITEMS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(user?.role)),
  })).filter((section) => section.items.length > 0);

  // Accordion state: All sections closed by default except Overview
  const [openSections, setOpenSections] = useState({
    Overview: true,
    Inventory: false,
    Orders: false,
    'Field Operations': false,
    'AI Agent': false,
  });

  // Auto-expand section containing current active path on location change
  useEffect(() => {
    filteredNavItems.forEach((section) => {
      const hasActiveChild = section.items.some(
        (item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/')
      );
      if (hasActiveChild) {
        setOpenSections((prev) => ({
          ...prev,
          [section.section]: true,
        }));
      }
    });
  }, [location.pathname]);

  const toggleSection = (sectionName) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-white/90 backdrop-blur-xl border-r border-stone-200/80 transition-all duration-300 flex flex-col shadow-xs ${
        collapsed ? 'w-[72px]' : 'w-[270px]'
      }`}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-stone-200/80 shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/80 border border-orange-200/70 flex items-center justify-center shrink-0 shadow-xs overflow-hidden p-1.5">
          <img src="/logo.png" alt="StockFlow AI Logo" className="w-full h-full object-contain drop-shadow-xs" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <BrandLogo size="md" theme="dark" showSubtitle={false} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-3 scrollbar-hide">
        {filteredNavItems.map((section) => {
          const isOverview = section.section === 'Overview';
          const isSectionOpen = openSections[section.section] ?? true;
          const SectionIcon = SECTION_ICONS[section.section] || Package;
          const hasActiveChild = section.items.some(
            (item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          );

          if (isOverview) {
            return (
              <div key={section.section} className="space-y-1">
                {section.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-orange-50 text-orange-700 shadow-2xs border border-orange-200/90 font-semibold'
                          : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/80'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      {Icon && (
                        <Icon
                          className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                            isActive ? 'text-orange-600' : 'text-stone-500 group-hover:text-stone-700'
                          }`}
                        />
                      )}
                      {!collapsed && <span>{item.label}</span>}
                      {isActive && !collapsed && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          }

          return (
            <div key={section.section} className="space-y-1">
              {!collapsed ? (
                /* Boxed Expandable Header for Full Sidebar */
                <button
                  type="button"
                  onClick={() => toggleSection(section.section)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 group ${
                    hasActiveChild
                      ? 'bg-stone-100/90 text-stone-900 border border-stone-200/90 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <SectionIcon
                      className={`w-4 h-4 transition-colors ${
                        hasActiveChild ? 'text-orange-600' : 'text-stone-400 group-hover:text-stone-600'
                      }`}
                    />
                    <span className="uppercase tracking-wider text-[11px]">{section.section}</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                      isSectionOpen ? 'rotate-180 text-orange-600' : 'group-hover:text-stone-600'
                    }`}
                  />
                </button>
              ) : null}

              {/* Sub-items list with collapsible animation */}
              {(collapsed || isSectionOpen) && (
                <div className={!collapsed ? 'ml-2 pl-2.5 border-l-2 border-stone-200/80 space-y-1 my-1' : 'space-y-1'}>
                  {section.items.map((item) => {
                    const Icon = iconMap[item.icon];
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-orange-50 text-orange-800 shadow-2xs border border-orange-200 font-semibold'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
                        }`}
                        title={collapsed ? item.label : undefined}
                      >
                        {Icon && (
                          <Icon
                            className={`w-[17px] h-[17px] shrink-0 transition-colors ${
                              isActive ? 'text-orange-600' : 'text-stone-400 group-hover:text-stone-600'
                            }`}
                          />
                        )}
                        {!collapsed && <span className="text-[13px]">{item.label}</span>}
                        {isActive && !collapsed && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-stone-200/80 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100/80 transition-all text-xs font-semibold"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </aside>
  );
}
