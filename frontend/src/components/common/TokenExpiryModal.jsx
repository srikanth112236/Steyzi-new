import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, LogOut, RefreshCw, Clock, Shield, X } from 'lucide-react';
import { logout, clearAuth } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

/**
 * Token Expiry Modal Component
 * Shows when user's authentication token has expired
 * Handles navigation based on user role with improved UX
 */
const TokenExpiryModal = ({ isOpen, onClose, onRefresh }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(10);
  
  // Get user from localStorage as fallback if Redux state is empty
  const getUserFromStorage = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };
  
  const currentUser = user || getUserFromStorage();

  // Listen for token expiry events to get error details
  useEffect(() => {
    const handleTokenExpired = (event) => {
      console.log('🚫 TokenExpiryModal: Received token expiry event:', event.detail);
      if (event.detail?.message) {
        setErrorMessage(event.detail.message);
      }
    };

    window.addEventListener('tokenExpired', handleTokenExpired);

    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired);
    };
  }, []);

  // Countdown timer for auto-logout
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Reset countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setCountdown(10);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      // Clear auth data immediately without API call since token is expired
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Clear Redux state to prevent auto-login
      dispatch(clearAuth());
      
      // Navigate based on user role
      if (currentUser?.role === 'superadmin') {
        navigate('/login');
      } else {
        navigate('/admin/login');
      }
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear auth and redirect
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Clear Redux state to prevent auto-login
      dispatch(clearAuth());
      
      if (currentUser?.role === 'superadmin') {
        navigate('/login');
      } else {
        navigate('/admin/login');
      }
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      const success = await onRefresh();
      if (success) {
        toast.success('Session refreshed successfully!');
        onClose();
      } else {
        throw new Error('Refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      toast.error('Failed to refresh session. Please log in again.');
      handleLogout();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleContinue = () => {
    // Force logout and redirect
    handleLogout();
  };

  const handleCancelCountdown = () => {
    // Stop the countdown and keep modal open
    setCountdown(0);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
          className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        >
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Session Expired
                  </h3>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <Clock className="w-4 h-4 mr-1" />
                    Your authentication session has expired
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelCountdown}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-900 font-medium mb-1">
                      Security Notice
                    </p>
                    <p className="text-blue-800 text-sm">
                      {errorMessage || 'Your authentication session has expired for security reasons. Please log in again to continue using the application.'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Important:</strong> Any unsaved work may be lost.
                </p>
                <p className="text-xs text-gray-500">
                  You will be automatically logged out in {countdown} seconds.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {onRefresh && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Refreshing Session...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try to Refresh Session
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleContinue}
                className="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 border border-gray-200 hover:border-gray-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log In Again
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <p className="text-xs text-gray-600 text-center">
                You will be redirected to the appropriate login page based on your role ({currentUser?.role || 'user'})
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TokenExpiryModal; 