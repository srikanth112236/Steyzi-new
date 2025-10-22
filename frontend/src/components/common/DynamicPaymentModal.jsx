import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Loader,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Clock,
  RefreshCw,
  Info,
  Shield,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import razorpayPaymentService from '../../services/razorpayPayment.service';

const DynamicPaymentModal = ({
  isOpen,
  onClose,
  paymentConfig,
  onSuccess,
  onError,
  title = 'Payment',
  subtitle = 'Complete your payment securely'
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // null, 'processing', 'success', 'error'
  const [paymentData, setPaymentData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes timeout

  useEffect(() => {
    if (paymentStatus === 'processing' && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && paymentStatus === 'processing') {
      handlePaymentTimeout();
    }
  }, [paymentStatus, timeRemaining]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePaymentTimeout = () => {
    setPaymentStatus('error');
    toast.error('Payment timeout. Please try again.');
    onError?.({ message: 'Payment timeout', code: 'TIMEOUT' });
  };

  const handlePayment = async () => {
    if (!paymentConfig) {
      toast.error('Payment configuration is missing');
      return;
    }

    try {
      setLoading(true);
      setPaymentStatus('processing');
      setTimeRemaining(300); // Reset timer

      // Validate payment config
      razorpayPaymentService.validatePaymentConfig(paymentConfig);

      // Process payment with callbacks
      const result = await razorpayPaymentService.processDynamicPayment({
        ...paymentConfig,
        callbacks: {
          onSuccess: (response) => {
            console.log('Payment successful:', response);
            setPaymentStatus('success');
            setPaymentData(response);
            toast.success('Payment completed successfully!');
            onSuccess?.(response);
          },
          onError: (error) => {
            console.error('Payment failed:', error);
            setPaymentStatus('error');
            toast.error('Payment failed. Please try again.');
            onError?.(error);
          },
          onDismiss: () => {
            console.log('Payment dismissed by user');
            setPaymentStatus(null);
            setLoading(false);
          }
        }
      });

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      setLoading(false);
      toast.error(error.message || 'Payment failed');
      onError?.(error);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setPaymentStatus(null);
    setPaymentData(null);
    handlePayment();
  };

  const handleClose = () => {
    if (paymentStatus === 'processing') {
      const confirm = window.confirm('Payment is in progress. Are you sure you want to cancel?');
      if (!confirm) return;
    }
    setPaymentStatus(null);
    setPaymentData(null);
    setRetryCount(0);
    setTimeRemaining(300);
    onClose();
  };

  const getPaymentTypeIcon = (type) => {
    const icons = {
      subscription: <CreditCard className="h-6 w-6" />,
      addon: <Zap className="h-6 w-6" />,
      premium: <Shield className="h-6 w-6" />,
      donation: <DollarSign className="h-6 w-6" />,
      custom: <Info className="h-6 w-6" />
    };
    return icons[type] || <CreditCard className="h-6 w-6" />;
  };

  const getPaymentTypeColor = (type) => {
    const colors = {
      subscription: 'bg-blue-500',
      addon: 'bg-green-500',
      premium: 'bg-yellow-500',
      donation: 'bg-red-500',
      custom: 'bg-purple-500'
    };
    return colors[type] || 'bg-blue-500';
  };

  const renderPaymentForm = () => (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${getPaymentTypeColor(paymentConfig?.type)}`}>
            {getPaymentTypeIcon(paymentConfig?.type)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{paymentConfig?.description || 'Payment'}</h3>
            <p className="text-sm text-gray-600">{paymentConfig?.type || 'custom'}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Amount:</span>
          <span className="text-xl font-bold text-gray-900">
            {razorpayPaymentService.formatAmount(paymentConfig?.amount || 0)}
          </span>
        </div>

        {paymentConfig?.billingCycle && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">Billing Cycle:</span>
            <span className="text-sm font-medium text-gray-900 capitalize">
              {paymentConfig.billingCycle}
            </span>
          </div>
        )}
      </div>

      {/* Payment Methods Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Available Payment Methods</h4>
        <div className="grid grid-cols-2 gap-3">
          {razorpayPaymentService.getSupportedMethods().map(method => (
            <div key={method.code} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
              <span className="text-lg">{method.icon}</span>
              <span className="text-sm text-gray-700">{method.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleClose}
          className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handlePayment}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              <span>Pay Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderProcessingState = () => (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <Loader className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Processing Payment</h3>
        <p className="text-gray-600">Please complete the payment in the popup window</p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-center space-x-2 text-blue-700">
          <Clock className="h-4 w-4" />
          <span className="text-sm">Time remaining: {formatTime(timeRemaining)}</span>
        </div>
      </div>
      <button
        onClick={handleClose}
        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
      >
        Cancel Payment
      </button>
    </div>
  );

  const renderSuccessState = () => (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Payment Successful!</h3>
        <p className="text-gray-600">Your payment has been processed successfully</p>
      </div>

      {paymentData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-left">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Amount:</span>
              <span className="font-medium text-green-900">
                {razorpayPaymentService.formatAmount(paymentData.amount || paymentConfig?.amount)}
              </span>
            </div>
            {paymentData.paymentId && (
              <div className="flex justify-between">
                <span className="text-green-700">Payment ID:</span>
                <span className="font-medium text-green-900 font-mono text-xs">
                  {paymentData.paymentId}
                </span>
              </div>
            )}
            {paymentData.orderId && (
              <div className="flex justify-between">
                <span className="text-green-700">Order ID:</span>
                <span className="font-medium text-green-900 font-mono text-xs">
                  {paymentData.orderId}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleClose}
        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
      >
        Continue
      </button>
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Payment Failed</h3>
        <p className="text-gray-600">Something went wrong with your payment</p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <p className="text-sm text-red-700">
          {paymentData?.message || 'Please try again or contact support if the issue persists.'}
        </p>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleClose}
          className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
        >
          Cancel
        </button>
        {retryCount < 3 && (
          <button
            onClick={handleRetry}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Payment</span>
          </button>
        )}
      </div>

      {retryCount >= 3 && (
        <p className="text-xs text-gray-500">
          Maximum retry attempts reached. Please contact support.
        </p>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition duration-200"
            disabled={paymentStatus === 'processing'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!paymentStatus && renderPaymentForm()}
          {paymentStatus === 'processing' && renderProcessingState()}
          {paymentStatus === 'success' && renderSuccessState()}
          {paymentStatus === 'error' && renderErrorState()}
        </div>
      </div>
    </div>
  );
};

export default DynamicPaymentModal;
