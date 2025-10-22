import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../../store/slices/authSlice';
import api from '../../services/api';
import usePaymentStatus from '../../hooks/usePaymentStatus';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Use real-time payment status hook
  const {
    paymentStatus,
    isConnected,
    connectionState,
    isPaymentSuccessful,
    isPaymentFailed,
    resetPaymentStatus
  } = usePaymentStatus();

  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    // Handle URL parameters for backward compatibility
    const paymentId = searchParams.get('razorpay_payment_id');
    const paymentLinkId = searchParams.get('razorpay_payment_link_id');
    const paymentLinkReferenceId = searchParams.get('razorpay_payment_link_reference_id');
    const paymentLinkStatus = searchParams.get('razorpay_payment_link_status');

    // Set initial payment details from URL if available
    if (paymentId && paymentLinkId) {
      setPaymentDetails({
        paymentId,
        paymentLinkId,
        referenceId: paymentLinkReferenceId,
        status: paymentLinkStatus
      });
    }

    // Handle real-time payment status updates
    if (isPaymentSuccessful && paymentStatus?.data) {
      toast.success('Payment completed successfully! Your subscription has been activated.');

      // Refresh user data to get updated subscription
      dispatch(getCurrentUser());

      // Redirect to dashboard after showing success message
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
        resetPaymentStatus(); // Reset for next payment
      }, 3000);

    } else if (isPaymentFailed && paymentStatus?.data) {
      toast.error('Payment failed. Please try again.');

      // Redirect to dashboard after showing error
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
        resetPaymentStatus(); // Reset for next payment
      }, 3000);
    }

    // Handle URL-based callback (fallback)
    if (paymentId && paymentLinkId && !paymentStatus) {
      // Payment was successful via URL params
      toast.success('Payment completed successfully! Your subscription has been activated.');

      dispatch(getCurrentUser());

      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 3000);

    } else if (paymentLinkStatus === 'cancelled' || paymentLinkStatus === 'expired') {
      // Payment was cancelled or expired
      toast.error('Payment was cancelled or expired. Please try again.');

      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 3000);

    } else if (!paymentId && !paymentLinkId && !isPaymentSuccessful && !isPaymentFailed) {
      // No payment information - might be direct access or waiting for real-time update
      if (!isConnected) {
        toast.error('Payment status tracking not available. Please refresh the page.');

        setTimeout(() => {
          navigate('/admin/dashboard', { replace: true });
        }, 3000);
      }
    }
  }, [searchParams, paymentStatus, isPaymentSuccessful, isPaymentFailed, isConnected, navigate, dispatch, resetPaymentStatus]);

  const getStatusIcon = () => {
    if (isPaymentSuccessful) {
      return <CheckCircle className="h-16 w-16 text-green-600" />;
    } else if (isPaymentFailed) {
      return <XCircle className="h-16 w-16 text-red-600" />;
    } else if (isConnected && !paymentStatus) {
      return <Loader className="h-16 w-16 text-blue-600 animate-spin" />;
    } else {
      return <AlertCircle className="h-16 w-16 text-yellow-600" />;
    }
  };

  const getStatusMessage = () => {
    if (isPaymentSuccessful) {
      return {
        title: 'Payment Successful!',
        message: 'Your subscription has been activated successfully.',
        subMessage: 'You will be redirected to your dashboard shortly.'
      };
    } else if (isPaymentFailed) {
      return {
        title: 'Payment Failed',
        message: 'Your payment could not be processed.',
        subMessage: 'You will be redirected to your dashboard shortly.'
      };
    } else if (isConnected && !paymentStatus) {
      return {
        title: 'Processing Payment...',
        message: 'Please wait while we verify your payment.',
        subMessage: ''
      };
    } else {
      return {
        title: 'Connecting to Payment Status...',
        message: 'Establishing real-time connection to track your payment.',
        subMessage: connectionState !== 'connected' ? `Connection: ${connectionState}` : ''
      };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center"
      >
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>

        {/* Status Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {statusInfo.title}
        </h1>

        {/* Status Message */}
        <p className="text-gray-600 mb-4">
          {statusInfo.message}
        </p>

        {/* Sub Message */}
        {statusInfo.subMessage && (
          <p className="text-sm text-gray-500 mb-6">
            {statusInfo.subMessage}
          </p>
        )}

        {/* Payment Details (only show for success/failed) */}
        {(paymentDetails || (paymentStatus?.data && (isPaymentSuccessful || isPaymentFailed))) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment Details</h3>
            <div className="space-y-1 text-xs text-gray-600">
              {/* Show details from URL params or real-time data */}
              {paymentDetails?.paymentId && (
                <div>Payment ID: {paymentDetails.paymentId}</div>
              )}
              {paymentDetails?.paymentLinkId && (
                <div>Payment Link ID: {paymentDetails.paymentLinkId}</div>
              )}
              {paymentDetails?.referenceId && (
                <div>Reference ID: {paymentDetails.referenceId}</div>
              )}
              {/* Show details from real-time data */}
              {paymentStatus?.data?.paymentId && (
                <div>Payment ID: {paymentStatus.data.paymentId}</div>
              )}
              {paymentStatus?.data?.orderId && (
                <div>Order ID: {paymentStatus.data.orderId}</div>
              )}
              {paymentStatus?.data?.amount && (
                <div>Amount: ₹{paymentStatus.data.amount}</div>
              )}
              {paymentStatus?.data?.planName && (
                <div>Plan: {paymentStatus.data.planName}</div>
              )}
              {paymentStatus?.data?.error && (
                <div className="text-red-600">Error: {paymentStatus.data.error}</div>
              )}
              {paymentDetails?.error && (
                <div className="text-red-600">Error: {paymentDetails.error}</div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => navigate('/admin/dashboard', { replace: true })}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Go to Dashboard
        </button>

        {/* Processing Indicator */}
        {(isConnected && !paymentStatus) && (
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Loader className="h-4 w-4 animate-spin" />
            <span>
              {connectionState === 'connecting' ? 'Connecting to payment status...' :
               connectionState === 'connected' ? 'Waiting for payment confirmation...' :
               'Establishing connection...'}
            </span>
          </div>
        )}

        {/* Connection Status */}
        {!isConnected && (
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            <span>Real-time updates unavailable - using fallback method</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentCallback;
