import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '../../utils/subscriptionUtils';
import authService from '../../services/auth.service';

const ProtectedRoute = ({ children, requireOnboarding = false }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { canAccessRoute } = useSubscription();
  const location = useLocation();

  // Double-check authentication with direct token validation
  const isReallyAuthenticated = authService.isAuthenticated();

  console.log('🔍 ProtectedRoute: Auth check for path:', location.pathname);
  console.log('🔍 ProtectedRoute: Redux auth:', { isAuthenticated, user: !!user, userRole: user?.role });
  console.log('🔍 ProtectedRoute: Direct auth check:', isReallyAuthenticated);

  // If not authenticated, redirect to appropriate login based on current path
  if (!isReallyAuthenticated || !isAuthenticated || !user) {
    console.log('🔒 ProtectedRoute: User not authenticated, redirecting to login');
    
    // Determine redirect path based on current location
    const currentPath = window.location.pathname;
    let redirectPath = '/login'; // Default for superadmin

    if (currentPath.startsWith('/admin')) {
      redirectPath = '/admin/login';
    } else if (currentPath.startsWith('/superadmin')) {
      redirectPath = '/login';
    }
    
    console.log(`🔒 ProtectedRoute: Redirecting to ${redirectPath}`);
    return <Navigate to={redirectPath} replace />;
  }

  // Onboarding removed - no onboarding checks needed

  // Check subscription restrictions for admin users on other routes
  if (user?.role === 'admin') {
    const canAccess = canAccessRoute(location.pathname);
    if (!canAccess) {
      console.log('🚫 ProtectedRoute: User subscription does not allow access to this route, redirecting to dashboard');
      return <Navigate to="/admin" replace />;
    }
  }

  // For non-admin users or routes that don't require onboarding check
  console.log('✅ ProtectedRoute: Allowing access');
  return children;
};

export default ProtectedRoute; 