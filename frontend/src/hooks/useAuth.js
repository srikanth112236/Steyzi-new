import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState, useRef } from 'react';
import { 
  login, 
  logout, 
  getCurrentUser,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectError
} from '../store/slices/authSlice';
import authService from '../services/auth.service';

export const useAuth = () => {
  const dispatch = useDispatch();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const authCheckInitiated = useRef(false);
  
  // Use selectors for better performance
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  const handleLogin = async (credentials) => {
    try {
      await dispatch(login(credentials)).unwrap();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Logout failed' };
    }
  };

  const handleGetCurrentUser = async () => {
    try {
      console.log('🔍 Checking current user...');
      await dispatch(getCurrentUser()).unwrap();
      console.log('✅ Current user check successful');
      return { success: true };
    } catch (error) {
      console.log('❌ Current user check failed:', error);
      return { success: false, error: error.message || 'Failed to get current user' };
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    // Prevent multiple auth checks
    if (authCheckInitiated.current) {
      return;
    }
    
    authCheckInitiated.current = true;
    
    const checkAuth = async () => {
      console.log('🚀 useAuth: Starting auth check...');
      console.log('👤 Current user from Redux:', user);
      console.log('🔐 Is authenticated from Redux:', isAuthenticated);
      console.log('⏳ Is loading from Redux:', isLoading);
      console.log('✅ Has checked auth:', hasCheckedAuth);
      
      try {
        // Check if we have tokens in localStorage
        const accessToken = authService.getAccessToken();
        const refreshToken = authService.getRefreshToken();
        const storedUser = authService.getCurrentUserFromStorage();
        
        console.log('🔑 Access token in localStorage:', !!accessToken);
        console.log('🔄 Refresh token in localStorage:', !!refreshToken);
        console.log('👤 Stored user in localStorage:', !!storedUser);
        
        if (accessToken && !user) {
          console.log('🔄 Have tokens but no Redux user, checking token validity...');
          
          // Check if token is actually valid before trying to authenticate
          if (authService.isAuthenticated()) {
            console.log('✅ Token is valid, fetching current user...');
            try {
              await handleGetCurrentUser();
            } catch (error) {
              console.log('❌ Failed to get current user, clearing auth:', error);
              authService.clearAuth();
            }
          } else {
            console.log('❌ Token is expired or invalid, user not authenticated');
          }
        } else if (!accessToken) {
          console.log('🚫 No access token found, user not authenticated');
        } else {
          console.log('✅ User already loaded from storage');
        }
      } catch (error) {
        console.log('❌ Auth check error:', error);
      } finally {
        // Always mark auth check as complete
        setHasCheckedAuth(true);
        console.log('✅ Auth check completed');
      }
    };

    checkAuth();
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (!hasCheckedAuth) {
        console.log('⏰ Auth check timeout, marking as complete');
        setHasCheckedAuth(true);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeout);
  }, []); // Empty dependency array to run only once

  // Return loading state only if we haven't checked auth yet and there's no user data
  const loading = !hasCheckedAuth;
  
  console.log('🎯 Final auth state:', { 
    user: !!user, 
    isAuthenticated, 
    loading, 
    hasCheckedAuth,
    isLoading 
  });

  return {
    user,
    isAuthenticated,
    loading,
    hasCheckedAuth,
    error,
    login: handleLogin,
    logout: handleLogout,
    getCurrentUser: handleGetCurrentUser,
  };
}; 