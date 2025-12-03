import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import authService from '../services/auth.service';

/**
 * Custom hook to handle token expiry detection and modal management
 * @returns {Object} Token expiry state and handlers
 */
export const useTokenExpiry = () => {
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const { user } = useSelector((state) => state.auth);

  /**
   * Check if token is expired
   * @returns {boolean} True if token is expired
   */
  const checkTokenExpiry = useCallback(() => {
    const token = authService.getAccessToken();
    if (!token) {
      return true;
    }

    try {
      // Decode JWT token to check expiry
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired (with 30 second buffer)
      const isExpired = payload.exp < (currentTime - 30);
      
      if (isExpired && !isTokenExpired) {
        setIsTokenExpired(true);
        setShowExpiryModal(true);
      }
      
      return isExpired;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }, [isTokenExpired]);

  /**
   * Handle token expiry
   */
  const handleTokenExpiry = useCallback(() => {
    setIsTokenExpired(true);
    setShowExpiryModal(true);
  }, []);

  /**
   * Close expiry modal
   */
  const closeExpiryModal = useCallback(() => {
    setShowExpiryModal(false);
  }, []);

  /**
   * Refresh token attempt with improved error handling
   */
  const handleRefreshToken = useCallback(async () => {
    try {
      console.log('🔄 Attempting token refresh...');
      
      const refreshToken = authService.getRefreshToken();
      if (!refreshToken) {
        console.log('❌ No refresh token available');
        throw new Error('No refresh token available');
      }

      // Attempt to refresh token
      const apiUrl = import.meta.env.VITE_API_URL 
        || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://api.steyzi.com/api');
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`, // Include refresh token in header as backup
        },
        body: JSON.stringify({ refreshToken }),
      });

      console.log('🔄 Token refresh response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Token refresh failed:', errorData);
        throw new Error(errorData.message || 'Token refresh failed');
      }

      const data = await response.json();
      console.log('✅ Token refresh response:', data);
      
      if (data.success && data.data?.accessToken) {
        // Store new token
        localStorage.setItem('accessToken', data.data.accessToken);
        
        // Update Redux state if needed
        setIsTokenExpired(false);
        setShowExpiryModal(false);
        
        console.log('✅ Token refreshed successfully');
        return true;
      } else {
        throw new Error(data.message || 'Invalid refresh response');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // Clear auth data on refresh failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      throw error;
    }
  }, []);

  /**
   * Get navigation path based on user role
   */
  const getLoginPath = useCallback(() => {
    if (user?.role === 'superadmin') {
      return '/login';
    } else {
      return '/admin/login';
    }
  }, [user?.role]);

  // Check token expiry periodically
  useEffect(() => {
    const checkExpiry = () => {
      checkTokenExpiry();
    };

    // Check immediately on mount
    checkExpiry();

    // Check every 30 minutes (1800000 ms) for activity indicator
    // This is less frequent to reduce unnecessary checks while still catching expired tokens
    const interval = setInterval(checkExpiry, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkTokenExpiry]);

  // Check token expiry on route changes
  useEffect(() => {
    checkTokenExpiry();
  }, [checkTokenExpiry]);

  // Listen for token expiry events from API
  useEffect(() => {
    const handleTokenExpired = (event) => {
      console.log('🚫 Token expiry event received:', event.detail);
      setIsTokenExpired(true);
      setShowExpiryModal(true);
    };

    window.addEventListener('tokenExpired', handleTokenExpired);

    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired);
    };
  }, []);

  // Listen for API errors that might indicate token expiry
  useEffect(() => {
    const handleApiError = (event) => {
      const { status, message } = event.detail || {};
      
      // Check for 401 errors or token-related errors
      if (status === 401 || 
          message?.includes('Invalid token') || 
          message?.includes('Token expired') ||
          message?.includes('Unauthorized')) {
        console.log('🚫 API error indicates token expiry:', event.detail);
        setIsTokenExpired(true);
        setShowExpiryModal(true);
      }
    };

    window.addEventListener('apiError', handleApiError);

    return () => {
      window.removeEventListener('apiError', handleApiError);
    };
  }, []);

  return {
    showExpiryModal,
    isTokenExpired,
    handleTokenExpiry,
    closeExpiryModal,
    handleRefreshToken,
    getLoginPath,
    checkTokenExpiry,
  };
}; 