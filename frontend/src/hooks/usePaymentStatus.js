import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import paymentStatusService from '../services/paymentStatus.service';

/**
 * Custom hook for real-time payment status updates
 * @returns {Object} Payment status state and handlers
 */
const usePaymentStatus = () => {
  const user = useSelector(selectUser);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');

  // Handle payment status updates
  const handlePaymentStatus = useCallback((data) => {
    setPaymentStatus(data);
  }, []);

  // Handle payment success
  const handlePaymentSuccess = useCallback((data) => {
    setPaymentStatus({
      status: 'success',
      data,
      timestamp: new Date()
    });
  }, []);

  // Handle payment failure
  const handlePaymentFailed = useCallback((data) => {
    setPaymentStatus({
      status: 'failed',
      data,
      timestamp: new Date()
    });
  }, []);

  // Handle connection errors
  const handleConnectionError = useCallback((data) => {
    setConnectionState('error');
  }, []);

  // Connect to payment status updates when user is available
  useEffect(() => {
    if (user?._id) {
      console.log('🔗 Setting up payment status tracking for user:', user._id);

      // Add event listeners
      paymentStatusService.addEventListener('paymentStatus', handlePaymentStatus);
      paymentStatusService.addEventListener('paymentSuccess', handlePaymentSuccess);
      paymentStatusService.addEventListener('paymentFailed', handlePaymentFailed);
      paymentStatusService.addEventListener('connectionError', handleConnectionError);

      // Connect to SSE
      paymentStatusService.connect(user._id);

      // Update connection state
      const updateConnectionState = () => {
        setConnectionState(paymentStatusService.getConnectionState());
        setIsConnected(paymentStatusService.isConnected());
      };

      updateConnectionState();

      // Set up interval to check connection state
      const interval = setInterval(updateConnectionState, 1000);

      // Cleanup on unmount
      return () => {
        clearInterval(interval);
        paymentStatusService.removeEventListener('paymentStatus', handlePaymentStatus);
        paymentStatusService.removeEventListener('paymentSuccess', handlePaymentSuccess);
        paymentStatusService.removeEventListener('paymentFailed', handlePaymentFailed);
        paymentStatusService.removeEventListener('connectionError', handleConnectionError);
        paymentStatusService.disconnect();
      };
    }
  }, [user?._id, handlePaymentStatus, handlePaymentSuccess, handlePaymentFailed, handleConnectionError]);

  // Reset payment status
  const resetPaymentStatus = useCallback(() => {
    setPaymentStatus(null);
  }, []);

  return {
    paymentStatus,
    isConnected,
    connectionState,
    resetPaymentStatus,
    // Helper functions
    isPaymentSuccessful: paymentStatus?.status === 'success',
    isPaymentFailed: paymentStatus?.status === 'failed',
    isPaymentProcessing: paymentStatus?.status === 'processing' || (!paymentStatus && isConnected),
  };
};

export default usePaymentStatus;
