import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  CreditCard,
  Zap,
  DollarSign,
  Gift,
  FileText,
  BarChart3,
  Link as LinkIcon,
  Settings
} from 'lucide-react';

// Import our new dynamic payment system
import DynamicPaymentModal from '../common/DynamicPaymentModal';
import razorpayPaymentService from '../../services/razorpayPayment.service';
import {
  createSubscriptionPayment,
  createAddonPayment,
  createCustomPayment,
  PAYMENT_TYPES,
  getPaymentTypeDisplayName
} from '../../utils/paymentConfig';

const DynamicRazorpayExample = () => {
  const { user } = useSelector((state) => state.auth);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPaymentConfig, setCurrentPaymentConfig] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Example payment configurations
  const paymentExamples = [
    {
      id: 'subscription',
      title: 'New Subscription',
      description: 'Start a new subscription plan',
      icon: <CreditCard className="h-6 w-6" />,
      config: {
        type: PAYMENT_TYPES.SUBSCRIPTION,
        amount: 500000, // ₹5000 in paise
        description: 'Premium Plan - 50 beds, 2 branches',
        subscriptionPlanId: 'example-plan-id',
        bedCount: 50,
        branchCount: 2,
        billingCycle: 'monthly',
        prefill: user ? {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: user.phone
        } : undefined
      }
    },
    {
      id: 'addon-beds',
      title: 'Add Beds',
      description: 'Add additional beds to subscription',
      icon: <Zap className="h-6 w-6" />,
      config: {
        type: PAYMENT_TYPES.ADDON,
        amount: 100000, // ₹1000 in paise
        description: 'Add 10 beds to existing subscription',
        addonType: 'beds',
        quantity: 10,
        targetSubscriptionId: 'current-subscription-id'
      }
    },
    {
      id: 'addon-branches',
      title: 'Add Branches',
      description: 'Add additional branches to subscription',
      icon: <Settings className="h-6 w-6" />,
      config: {
        type: PAYMENT_TYPES.ADDON,
        amount: 200000, // ₹2000 in paise
        description: 'Add 1 branch to existing subscription',
        addonType: 'branches',
        quantity: 1,
        targetSubscriptionId: 'current-subscription-id'
      }
    },
    {
      id: 'donation',
      title: 'Make a Donation',
      description: 'Support the platform development',
      icon: <Gift className="h-6 w-6" />,
      config: {
        type: PAYMENT_TYPES.DONATION,
        amount: 50000, // ₹500 in paise
        description: 'Donation to support PG Maintenance System',
        prefill: user ? {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: user.phone
        } : undefined
      }
    },
    {
      id: 'custom-fee',
      title: 'Custom Fee Payment',
      description: 'Pay for custom services',
      icon: <FileText className="h-6 w-6" />,
      config: {
        type: PAYMENT_TYPES.FEE,
        amount: 250000, // ₹2500 in paise
        description: 'Custom maintenance service fee',
        customFields: {
          serviceType: 'maintenance',
          priority: 'high'
        }
      }
    }
  ];

  const handlePaymentExample = (example) => {
    setCurrentPaymentConfig(example.config);
    setShowPaymentModal(true);
  };

  const handleQuickPay = async (presetType, amount, description) => {
    try {
      const result = await razorpayPaymentService.quickPay(presetType, {
        amount,
        description,
        prefill: user ? {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: user.phone
        } : undefined
      });

      if (result.success) {
        toast.success('Payment completed successfully!');
      } else {
        toast.error('Payment failed');
      }
    } catch (error) {
      toast.error(error.message || 'Payment failed');
    }
  };

  const handleBatchPayments = async () => {
    const batchConfigs = [
      {
        type: PAYMENT_TYPES.CUSTOM,
        amount: 10000, // ₹100
        description: 'Batch payment 1',
        metadata: { batchId: 'batch-001', item: 1 }
      },
      {
        type: PAYMENT_TYPES.CUSTOM,
        amount: 20000, // ₹200
        description: 'Batch payment 2',
        metadata: { batchId: 'batch-001', item: 2 }
      }
    ];

    try {
      const results = await razorpayPaymentService.processBatchPayments(batchConfigs);
      console.log('Batch payment results:', results);

      if (results.success) {
        toast.success(`Batch payment completed: ${results.summary.successful}/${results.summary.total} successful`);
      } else {
        toast.error(`Batch payment failed: ${results.summary.failed} failed`);
      }
    } catch (error) {
      toast.error('Batch payment failed');
    }
  };

  const handleCreatePaymentLink = async (type, amount, description) => {
    try {
      const result = await razorpayPaymentService.createDynamicPaymentLink({
        type,
        amount,
        description,
        customer: user ? {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: user.phone
        } : undefined
      });

      if (result.success) {
        toast.success('Payment link created successfully!');
        console.log('Payment link:', result.data.payment_url);
        // You could copy this to clipboard or display it
      }
    } catch (error) {
      toast.error('Failed to create payment link');
    }
  };

  const handleGetAnalytics = async () => {
    try {
      const result = await razorpayPaymentService.getPaymentAnalytics();
      if (result.success) {
        setAnalytics(result.data);
        toast.success('Analytics loaded successfully!');
      }
    } catch (error) {
      toast.error('Failed to load analytics');
    }
  };

  const handlePaymentSuccess = (result) => {
    console.log('Payment successful:', result);
    toast.success('Payment completed successfully!');
    setShowPaymentModal(false);
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    toast.error('Payment failed. Please try again.');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dynamic Razorpay Integration
        </h1>
        <p className="text-gray-600">
          Comprehensive payment system with dynamic configuration support
        </p>
      </div>

      {/* Payment Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentExamples.map((example) => (
          <div
            key={example.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-200"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                {example.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{example.title}</h3>
                <p className="text-sm text-gray-600">{example.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Amount:</span>{' '}
                {razorpayPaymentService.formatAmount(example.config.amount)}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Type:</span>{' '}
                {getPaymentTypeDisplayName(example.config.type)}
              </div>
              <button
                onClick={() => handlePaymentExample(example)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center space-x-2"
              >
                <CreditCard className="h-4 w-4" />
                <span>Pay Now</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Pay Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="h-6 w-6 mr-2 text-yellow-500" />
          Quick Pay Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => handleQuickPay('subscription', 100000, 'Quick subscription payment')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200 text-left"
          >
            <div className="flex items-center space-x-3 mb-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Quick Subscription</span>
            </div>
            <div className="text-sm text-gray-600">₹1000</div>
          </button>

          <button
            onClick={() => handleQuickPay('addon', 50000, 'Quick addon payment')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200 text-left"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Zap className="h-5 w-5 text-green-500" />
              <span className="font-medium">Quick Addon</span>
            </div>
            <div className="text-sm text-gray-600">₹500</div>
          </button>

          <button
            onClick={() => handleQuickPay('premium', 200000, 'Quick premium payment')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200 text-left"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Settings className="h-5 w-5 text-orange-500" />
              <span className="font-medium">Quick Premium</span>
            </div>
            <div className="text-sm text-gray-600">₹2000</div>
          </button>

          <button
            onClick={handleBatchPayments}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200 text-left"
          >
            <div className="flex items-center space-x-3 mb-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Batch Payment</span>
            </div>
            <div className="text-sm text-gray-600">Multiple items</div>
          </button>
        </div>
      </div>

      {/* Payment Links */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <LinkIcon className="h-6 w-6 mr-2 text-indigo-500" />
          Payment Links
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleCreatePaymentLink('subscription', 150000, 'Monthly subscription')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200 text-left"
          >
            <div className="font-medium text-gray-900 mb-1">Subscription Link</div>
            <div className="text-sm text-gray-600">₹1500 - Monthly plan</div>
          </button>

          <button
            onClick={() => handleCreatePaymentLink('donation', 100000, 'Platform donation')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200 text-left"
          >
            <div className="font-medium text-gray-900 mb-1">Donation Link</div>
            <div className="text-sm text-gray-600">₹1000 - Support us</div>
          </button>

          <button
            onClick={handleGetAnalytics}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200 text-left"
          >
            <div className="font-medium text-gray-900 mb-1">View Analytics</div>
            <div className="text-sm text-gray-600">Payment insights</div>
          </button>
        </div>
      </div>

      {/* Analytics Display */}
      {analytics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-green-500" />
            Payment Analytics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalPayments}</div>
              <div className="text-sm text-blue-700">Total Payments</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analytics.successfulPayments}</div>
              <div className="text-sm text-green-700">Successful</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{analytics.failedPayments}</div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {razorpayPaymentService.formatAmount(analytics.totalAmount)}
              </div>
              <div className="text-sm text-yellow-700">Total Amount</div>
            </div>
          </div>

          {analytics.typeBreakdown && Object.keys(analytics.typeBreakdown).length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Payment Types</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(analytics.typeBreakdown).map(([type, count]) => (
                  <span
                    key={type}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {getPaymentTypeDisplayName(type)}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Features Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Dynamic Razorpay Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Frontend Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Dynamic payment configuration</li>
              <li>• Multiple payment types support</li>
              <li>• Configurable checkout themes</li>
              <li>• Batch payment processing</li>
              <li>• Payment analytics dashboard</li>
              <li>• Retry mechanisms with backoff</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Backend Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Dynamic order creation</li>
              <li>• Enhanced webhook handling</li>
              <li>• Payment link generation</li>
              <li>• Addon payment processing</li>
              <li>• Custom payment types</li>
              <li>• Comprehensive logging</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <DynamicPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentConfig={currentPaymentConfig}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        title="Complete Payment"
        subtitle="Secure payment powered by Razorpay"
      />
    </div>
  );
};

export default DynamicRazorpayExample;
