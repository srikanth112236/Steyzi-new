import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '../../utils/subscriptionUtils';
import authService from '../../services/auth.service';
import { selectSubscription } from '../../store/slices/authSlice';

const ProtectedRoute = ({ children, requireOnboarding = false }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const subscription = useSelector(selectSubscription);
  const { canAccessRoute } = useSubscription();
  const location = useLocation();

  // Double-check authentication with direct token validation
  // This is critical to catch expired tokens even if Redux state hasn't updated
  const isReallyAuthenticated = authService.isAuthenticated();

  console.log('🔍 ProtectedRoute: Auth check for path:', location.pathname);
  console.log('🔍 ProtectedRoute: Redux auth:', { isAuthenticated, user: !!user, userRole: user?.role });
  console.log('🔍 ProtectedRoute: Direct auth check:', isReallyAuthenticated);

  // If not authenticated or token expired, redirect to appropriate login
  // This ensures expired tokens are caught immediately
  if (!isReallyAuthenticated || !isAuthenticated || !user) {
    console.log('🔒 ProtectedRoute: User not authenticated or token expired, redirecting to login');
    
    // Clear any stale auth data
    if (!isReallyAuthenticated) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    
    // Determine redirect path based on current location
    const currentPath = window.location.pathname;
    let redirectPath = '/login'; // Default for superadmin

    if (currentPath.startsWith('/admin')) {
      redirectPath = '/admin/login';
    } else if (currentPath.startsWith('/superadmin')) {
      redirectPath = '/login';
    } else if (currentPath.startsWith('/support')) {
      redirectPath = '/support-login';
    } else if (currentPath.startsWith('/sales')) {
      redirectPath = '/sales/login';
    }
    
    console.log(`🔒 ProtectedRoute: Redirecting to ${redirectPath}`);
    return <Navigate to={redirectPath} replace />;
  }

  // Onboarding removed - no onboarding checks needed

  // Check subscription restrictions for admin users on other routes
  if (user?.role === 'admin') {
    console.log('🔍 ProtectedRoute: Checking subscription access for admin user');
    console.log('🔍 ProtectedRoute: Subscription data:', subscription);
    console.log('🔍 ProtectedRoute: Route path:', location.pathname);

    const canAccess = canAccessRoute(location.pathname);
    console.log('🔍 ProtectedRoute: Can access route:', canAccess);

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