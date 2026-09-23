import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, RequireRole } from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import ProductsListPage from '../features/inventory/pages/ProductsListPage';
import StockLevelsPage from '../features/inventory/pages/StockLevelsPage';
import StockMovementsPage from '../features/inventory/pages/StockMovementsPage';
import ThresholdsPage from '../features/inventory/pages/ThresholdsPage';
import UtilisationReportsPage from '../features/inventory/pages/UtilisationReportsPage';
import OrdersListPage from '../features/orders/pages/OrdersListPage';
import OrderDetailPage from '../features/orders/pages/OrderDetailPage';
import CustomersListPage from '../features/orders/pages/CustomersListPage';
import FieldAgentsPage from '../features/field/pages/FieldAgentsPage';
import CustomerVisitsPage from '../features/field/pages/CustomerVisitsPage';
import DeviceCaptureAuditPage from '../features/field/pages/DeviceCaptureAuditPage';
import OfflineSyncAuditPage from '../features/field/pages/OfflineSyncAuditPage';
import WorkflowsListPage from '../features/agent/pages/WorkflowsListPage';
import WorkflowDetailPage from '../features/agent/pages/WorkflowDetailPage';
import PendingApprovalsPage from '../features/agent/pages/PendingApprovalsPage';
import AgentsDirectoryPage from '../features/agent/pages/AgentsDirectoryPage';
import NotificationAuditLogPage from '../features/agent/pages/NotificationAuditLogPage';
import { ROLES } from '../utils/constants';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected - Authenticated Layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route path="/dashboard" element={
          <RequireRole roles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.STOREKEEPER]}>
            <DashboardPage />
          </RequireRole>
        } />

        {/* Inventory - Component A */}
        <Route path="/inventory/products" element={<ProductsListPage />} />
        <Route path="/inventory/stock" element={
          <RequireRole roles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.STOREKEEPER]}>
            <StockLevelsPage />
          </RequireRole>
        } />
        <Route path="/inventory/movements" element={
          <RequireRole roles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.STOREKEEPER]}>
            <StockMovementsPage />
          </RequireRole>
        } />
        <Route path="/inventory/thresholds" element={
          <RequireRole roles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.STOREKEEPER]}>
            <ThresholdsPage />
          </RequireRole>
        } />
        <Route path="/inventory/reports" element={
          <RequireRole roles={[ROLES.ADMIN, ROLES.MANAGER]}>
            <UtilisationReportsPage />
          </RequireRole>
        } />

        {/* Orders - Component B */}
        <Route path="/orders" element={<OrdersListPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/customers" element={<CustomersListPage />} />

        {/* Field Operations - Component C */}
        <Route path="/field/agents" element={
          <RequireRole roles={[ROLES.ADMIN, ROLES.MANAGER]}>
            <FieldAgentsPage />
          </RequireRole>
        } />
        <Route path="/field/visits" element={
          <RequireRole roles={[ROLES.ADMIN, ROLES.MANAGER]}>
            <CustomerVisitsPage />
          </RequireRole>
        } />
        <Route path="/field/captures" element={
          <RequireRole roles={[ROLES.ADMIN, ROLES.MANAGER]}>
            <DeviceCaptureAuditPage />
          </RequireRole>
        } />
        <Route path="/field/sync-queue" element={
          <RequireRole roles={[ROLES.ADMIN, ROLES.MANAGER]}>
            <OfflineSyncAuditPage />
          </RequireRole>
        } />

        {/* Agent AI - Component D ★ */}
        <Route path="/agent/workflows" element={
          <RequireRole roles={[ROLES.ADMIN, ROLES.MANAGER]}>
            <WorkflowsListPage />
          </RequireRole>
        } />
        <Route path="/agent/workflows/:id" element={
          <RequireRole roles={[ROLES.ADMIN, ROLES.MANAGER]}>
            <WorkflowDetailPage />
          </RequireRole>
        } />
        <Route path="/agent/directory" element={
          <RequireRole roles={[ROLES.ADMIN, ROLES.MANAGER]}>
            <AgentsDirectoryPage />
          </RequireRole>
        } />
        <Route path="/agent/approvals" element={
          <RequireRole roles={[ROLES.MANAGER]}>
            <PendingApprovalsPage />
          </RequireRole>
        } />
        <Route path="/agent/notifications" element={
          <RequireRole roles={[ROLES.ADMIN, ROLES.MANAGER]}>
            <NotificationAuditLogPage />
          </RequireRole>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
