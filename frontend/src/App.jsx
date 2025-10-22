import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useSubscriptionManager } from './hooks/useSubscriptionManager';

// Layouts
import SuperadminLayout from './layouts/SuperadminLayout';
import AdminLayout from './layouts/AdminLayout';
import SupportLayout from './layouts/SupportLayout';
import SalesLayout, { SubSalesLayout } from './layouts/SalesLayout';

// Conditional Sales Layout Component
const SalesLayoutWrapper = () => {
  const { user } = useAuth();

  // Check if user is sub_sales staff (they have salesRole: 'sub_sales')
  if (user?.salesRole === 'sub_sales') {
    return <SubSalesLayout />;
  }

  // Default to SalesLayout for sales managers (they have role: 'sales_manager')
  return <SalesLayout />;
};

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import AdminLogin from './components/auth/AdminLogin';
import AdminForgotPassword from './components/auth/AdminForgotPassword';
import SupportLogin from './components/auth/SupportLogin';

// Page Components
import Dashboard from './pages/superadmin/Dashboard';
import Users from './pages/superadmin/Users';
import SupportStaff from './pages/superadmin/SupportStaff';
import AdminDashboard from './pages/admin/Dashboard';
import PgManagement from './pages/superadmin/PgManagement';
import PGManagement from './pages/admin/PGManagement';
import Residents from './pages/admin/Residents';
import ResidentOffboarding from './pages/admin/ResidentOffboarding';
import RoomSwitching from './pages/admin/RoomSwitching';
import MovedOut from './pages/admin/MovedOut';
import ResidentProfile from './pages/admin/ResidentProfile';
import Payments from './pages/admin/Payments';
import PaymentHistory from './components/admin/PaymentHistory';
import QRCodeManagement from './pages/admin/QRCodeManagement';
import RoomAvailability from './pages/admin/RoomAvailability';
import QRInterface from './pages/public/QRInterface';
import Settings from './pages/admin/Settings';
import PaymentCallback from './pages/admin/PaymentCallback';
import Tickets from './pages/admin/Tickets';
import Reports from './pages/admin/Reports';
import TicketManagement from './pages/superadmin/TicketManagement';
import TicketDetails from './pages/superadmin/TicketDetails';
import SupportTickets from './pages/support/Tickets';
import SupportDashboard from './pages/support/Dashboard';
import SupportProfile from './pages/support/Profile';
import SupportSettings from './pages/support/Settings';
import TicketAnalytics from './pages/support/TicketAnalytics';
import SupportTicketDetails from './pages/support/TicketDetails';
import SuperadminTicketAnalytics from './pages/superadmin/TicketAnalytics';
import RecentActivities from './pages/superadmin/RecentActivities';
import TicketActivities from './pages/superadmin/TicketActivities';
import SuperadminActivities from './pages/superadmin/SuperadminActivities';
import BranchActivities from './pages/admin/BranchActivities';
import AllActivities from './pages/admin/AllActivities';
import AdminActivities from './pages/admin/AdminActivities';
import SupportActivities from './pages/support/SupportActivities';
import SubscriptionManagement from './pages/superadmin/SubscriptionManagement';

// Common Components
import RoleRedirect from './components/common/RoleRedirect';
import ProtectedRoute from './components/common/ProtectedRoute';
import TokenExpiryTest from './components/debug/TokenExpiryTest';
import SubscriptionTest from './components/debug/SubscriptionTest';
import SubscriptionDebug from './components/debug/SubscriptionDebug';
import SubscriptionTestPage from './pages/admin/SubscriptionTestPage';
import UserManagement from './components/superadmin/UserManagement';
import NotificationsPage from './pages/admin/Notifications';
import PgReports from './pages/admin/Reports';
import SubscriberManagement from './pages/superadmin/SubscriberManagement';
import ResidentOnboarding from './pages/admin/ResidentOnboarding';

// Import Billing page
import Billing from './pages/superadmin/Billing';
import SecurityDashboard from './pages/superadmin/SecurityDashboard';

// Import Advanced Features
import RevenueDashboard from './pages/superadmin/RevenueDashboard';
import UsageDashboard from './pages/admin/UsageDashboard';
import CostCalculator from './pages/admin/CostCalculator';
import SelfServicePortal from './pages/admin/SelfServicePortal';

// Import Sales Pages
import SalesDashboard from './pages/sales/Dashboard';
import SubSalesStaff from './pages/sales/SubSalesStaff';
import SalesPGs from './pages/sales/PGs';
import SalesPGManagement from './pages/sales/SalesPGManagement';
import Performance from './pages/sales/Performance';
import SalesReports from './pages/sales/Reports';
import SalesSettings from './pages/sales/Settings';
import SalesManagerManagement from './pages/superadmin/SalesManagerManagement';
import SalesLogin from './pages/auth/SalesLogin';
import ChangePassword from './pages/sales/ChangePassword';
import SuperadminPayments from './pages/superadmin/Payments';
import SuperadminReports from './pages/superadmin/Reports';
// import SalesAnalytics from './pages/superadmin/SalesAnalytics';
import SalesAnalytics from './pages/superadmin/SalesAnalytics';

const App = () => {
  const { user, loading, hasCheckedAuth } = useAuth();
  const [showFallback, setShowFallback] = useState(false);
  const [forceRender, setForceRender] = useState(false);

  const { isInitialized: subscriptionInitialized } = useSubscriptionManager();

  useEffect(() => {
    console.log('🎬 App render state:', { user: !!user, loading, hasCheckedAuth });

    // Only set timers if we're actually loading
    if (loading && !forceRender) {
      const timer = setTimeout(() => {
        setShowFallback(true);
      }, 3000);

      // Force render after 8 seconds if still loading
      const forceTimer = setTimeout(() => {
        if (loading) {
          console.log('🚨 Force rendering app due to prolonged loading');
          setForceRender(true);
        }
      }, 8000);

      return () => {
        clearTimeout(timer);
        clearTimeout(forceTimer);
      };
    }
  }, [loading, forceRender]); // Remove user and hasCheckedAuth dependencies

  // Show loading screen while checking authentication (unless forced to render)
  if (loading && !forceRender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {showFallback ? 'Almost ready...' : 'Loading...'}
          </p>
          {showFallback && (
            <button 
              onClick={() => setForceRender(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue Anyway
            </button>
          )}
        </div>
      </div>
    );
  }

  console.log('🚀 App rendering routes...');

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/public/qr/:qrCode" element={<QRInterface />} />
      {/* Admin Public Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
      
      {/* Support Public Routes */}
      <Route path="/support-login" element={<SupportLogin />} />
      
      
      {/* Debug Routes */}
      <Route path="/token-expiry-test" element={<TokenExpiryTest />} />
      <Route path="/subscription-test" element={<SubscriptionTest />} />
      <Route path="/subscription-debug" element={<SubscriptionDebug />} />
      <Route path="/subscription-test-page" element={<SubscriptionTestPage />} />
      
      {/* Role-based Redirects */}
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/dashboard" element={<RoleRedirect />} />
      
      {/* Superadmin Routes */}
      <Route path="/superadmin" element={<SuperadminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="activities" element={<RecentActivities />} />
        <Route path="superadmin-activities" element={<SuperadminActivities />} />
        <Route path="ticket-activities" element={<TicketActivities />} />
        <Route path="pg-management" element={<PgManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="support-staff" element={<SupportStaff />} />
        <Route path="subscriptions" element={<SubscriptionManagement />} />
        <Route path="subscriber-management" element={<SubscriberManagement />} />
        <Route path="tickets" element={<TicketManagement />} />
        <Route path="tickets/:id" element={<TicketDetails />} />
        <Route path="payments" element={<SuperadminPayments />} />
        <Route path="analytics" element={<SuperadminTicketAnalytics />} />
        <Route path="reports" element={<SuperadminReports />} />
        <Route path="settings" element={<div className="p-8 text-center text-gray-500">Settings (Coming Soon)</div>} />
        <Route path="billing" element={<Billing />} />
        <Route path="sales-managers" element={<SalesManagerManagement />} />
        <Route path="sales-analytics" element={<SalesAnalytics />} />
        <Route path="security" element={<SecurityDashboard />} />
        <Route path="revenue" element={<RevenueDashboard />} />
      </Route>

      {/* Sales Manager Auth Routes */}
      <Route path="/sales/login" element={<SalesLogin />} />
      <Route path="/sales/change-password" element={<ChangePassword />} />
      
      {/* Admin Routes - Protected */}
      <Route path="/admin" element={
        <ProtectedRoute requireOnboarding={false}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="activities" element={<AllActivities />} />
        <Route path="admin-activities" element={<AdminActivities />} />
        <Route path="pg-management" element={
          <ProtectedRoute requireOnboarding={false}>
            <PGManagement />
          </ProtectedRoute>
        } />
        <Route path="payment/callback" element={<PaymentCallback />} />
        <Route path="settings" element={
          <ProtectedRoute requireOnboarding={false}>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="residents" element={
          <ProtectedRoute requireOnboarding={false}>
            <Residents />
          </ProtectedRoute>
        } />
        <Route path="residents/:id" element={
          <ProtectedRoute requireOnboarding={false}>
            <ResidentProfile />
          </ProtectedRoute>
        } />
           <Route path="onboarding" element={
          <ProtectedRoute requireOnboarding={false}>
            <ResidentOnboarding />
          </ProtectedRoute>
        } />
        <Route path="offboarding" element={
          <ProtectedRoute requireOnboarding={false}>
            <ResidentOffboarding />
          </ProtectedRoute>
        } />
       <Route path="room-switching" element={
          <ProtectedRoute requireOnboarding={false}>
            <RoomSwitching />
          </ProtectedRoute>
        } />
        <Route path="moved-out" element={
          <ProtectedRoute requireOnboarding={false}>
            <MovedOut />
          </ProtectedRoute>
        } />
        <Route path="payments" element={
          <ProtectedRoute requireOnboarding={false}>
            <Payments />
          </ProtectedRoute>
        } />
        <Route path="payment-history" element={
          <ProtectedRoute requireOnboarding={false}>
            <PaymentHistory />
          </ProtectedRoute>
        } />
        <Route path="notifications" element={
          <ProtectedRoute requireOnboarding={false}>
            <NotificationsPage   />
          </ProtectedRoute>
        } />
        <Route path="qr-management" element={
          <ProtectedRoute requireOnboarding={false}>
            <QRCodeManagement />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute requireOnboarding={false}>
            <ResidentProfile />
          </ProtectedRoute>
        } />

        <Route path="reports" element={
          <ProtectedRoute requireOnboarding={false}>
            <PgReports />
          </ProtectedRoute>
        } />
        <Route path="payments-report" element={
          <ProtectedRoute requireOnboarding={false}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="room-availability" element={
          <ProtectedRoute requireOnboarding={false}>
            <RoomAvailability />
          </ProtectedRoute>
        } />
        <Route path="branch-activities" element={
          <ProtectedRoute requireOnboarding={false}>
            <BranchActivities />
          </ProtectedRoute>
        } />
        <Route path="tickets" element={
          <ProtectedRoute requireOnboarding={false}>
            <Tickets />
          </ProtectedRoute>
        } />
        <Route path="usage-dashboard" element={
          <ProtectedRoute requireOnboarding={false}>
            <UsageDashboard />
          </ProtectedRoute>
        } />
        <Route path="cost-calculator" element={
          <ProtectedRoute requireOnboarding={false}>
            <CostCalculator />
          </ProtectedRoute>
        } />
        <Route path="self-service" element={
          <ProtectedRoute requireOnboarding={false}>
            <SelfServicePortal />
          </ProtectedRoute>
        } />
      </Route>

      {/* Support Routes */}
      <Route path="/support" element={<SupportLayout />}>
        <Route path="dashboard" element={<SupportDashboard />} />
        <Route path="tickets" element={<SupportTickets />} />
        <Route path="tickets/assigned" element={<SupportTickets />} />
        <Route path="tickets/:id" element={<SupportTicketDetails />} />
        <Route path="activities" element={<SupportActivities />} />
        <Route path="analytics" element={<TicketAnalytics />} />
        <Route path="profile" element={<SupportProfile />} />
        <Route path="settings" element={<SupportSettings />} />
      </Route>

      {/* Sales Routes */}
      <Route path="/sales" element={<SalesLayoutWrapper />}>
        <Route index element={<Navigate to="/sales/dashboard" replace />} />
        <Route path="dashboard" element={<SalesDashboard />} />
        <Route path="pg-management" element={<SalesPGManagement />} />
        <Route path="staff" element={<SubSalesStaff />} />
        <Route path="pgs" element={<SalesPGs />} />
        <Route path="my-pgs" element={<SalesPGs />} />
        <Route path="performance" element={<Performance />} />
        <Route path="reports" element={<SalesReports />} />
        <Route path="settings" element={<SalesSettings />} />
        <Route path="change-password" element={<ChangePassword />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App; 