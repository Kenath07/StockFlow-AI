import { useAuth } from '../../../context/AuthContext';
import { ROLES } from '../../../utils/constants';
import AdminDashboardPage from './AdminDashboardPage';
import ManagerDashboardPage from './ManagerDashboardPage';
import StorekeeperDashboardPage from './StorekeeperDashboardPage';

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === ROLES.ADMIN) {
    return <AdminDashboardPage />;
  }

  if (user?.role === ROLES.STOREKEEPER) {
    return <StorekeeperDashboardPage />;
  }

  // Default for Manager & any elevated operations
  return <ManagerDashboardPage />;
}
