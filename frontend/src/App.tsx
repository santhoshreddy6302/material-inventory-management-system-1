import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MaterialList from './pages/materials/MaterialList';
import InventoryList from './pages/inventory/InventoryList';
import PurchaseOrderList from './pages/purchase/PurchaseOrderList';
import CreatePO from './pages/purchase/CreatePO';
import UsageList from './pages/usage/UsageList';
import WastageList from './pages/wastage/WastageList';
import ProjectList from './pages/projects/ProjectList';
import SiteList from './pages/sites/SiteList';
import SupplierList from './pages/suppliers/SupplierList';
import Reports from './pages/reports/Reports';
import AlertsPage from './pages/alerts/AlertsPage';
import Users from './pages/Users';
import Profile from './pages/Profile';
import TransferList from './pages/inventory/TransferList';
import LoadingSpinner from './components/common/LoadingSpinner';

// New Pages
import Labour from './pages/labour/Labour';
import Expenses from './pages/expenses/Expenses';
import Enquiries from './pages/enquiries/Enquiries';
import Milestones from './pages/milestones/Milestones';
import Subcontractors from './pages/subcontractors/Subcontractors';
import Machinery from './pages/machinery/Machinery';
import Progress from './pages/progress/Progress';

function PrivateRoute({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && user.role && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="materials"  element={<MaterialList />} />
        <Route path="inventory"  element={<InventoryList />} />
        <Route path="transfers"  element={<TransferList />} />
        <Route path="purchase-orders"     element={<PurchaseOrderList />} />
        <Route path="purchase-orders/new" element={<CreatePO />} />
        <Route path="usage"    element={<UsageList />} />
        <Route path="wastage"  element={<WastageList />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="sites"    element={<SiteList />} />
        <Route path="suppliers" element={<SupplierList />} />
        <Route path="reports"  element={<Reports />} />
        <Route path="alerts"   element={<AlertsPage />} />
        <Route path="users"    element={<PrivateRoute roles={['admin']}><Users /></PrivateRoute>} />
        <Route path="profile"  element={<Profile />} />
        
        {/* New Routes */}
        <Route path="labour"         element={<Labour />} />
        <Route path="expenses"       element={<Expenses />} />
        <Route path="enquiries"      element={<Enquiries />} />
        <Route path="milestones"     element={<Milestones />} />
        <Route path="subcontractors" element={<Subcontractors />} />
        <Route path="machinery"      element={<Machinery />} />
        <Route path="progress"       element={<Progress />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
