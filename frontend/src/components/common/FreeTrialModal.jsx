import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  X,
  CheckCircle,
  Clock,
  Users,
  Shield,
  Zap,
  Star,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import subscriptionService from '../../services/subscription.service';

const FreeTrialModal = ({ 
  isOpen, 
  onClose, 
  onTrialActivated, 
  subscriptionErrorDetails 
}) => {
  const dispatch = useDispatch();
  const [isActivating, setIsActivating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Welcome, 2: Features, 3: Activation, 4: Post-Activation
  const [activationError, setActivationError] = useState(null);

  // Determine if this is a trial limit error or trial activation
  const isTrialLimitError = subscriptionErrorDetails?.trialLimit || subscriptionErrorDetails?.trialExpired;
  const isTrialActive = subscriptionErrorDetails?.billingCycle === 'trial' || subscriptionErrorDetails?.isTrialActive;

  const handleActivateTrial = async () => {
    try {
      setIsActivating(true);

      // Get current user ID from localStorage or context
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData._id) {
        toast.error('User information not found. Please login again.');
        return;
      }

      const response = await subscriptionService.activateFreeTrial(userData._id);

      if (response.success) {
        // Move to post-activation step
        setCurrentStep(4);

        // Call the callback to refresh subscription data
        if (onTrialActivated) {
          await onTrialActivated();
        }
      } else {
        // Store the error for UI display instead of just showing toast
        setActivationError(response);
        toast.error(response.message || 'Failed to activate free trial');
      }
    } catch (error) {
      console.error('Error activating trial:', error);
      toast.error('Failed to activate free trial. Please try again.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleLogoutAndRelogin = () => {
    // Dispatch logout action
    dispatch(logout());

    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Show guidance toast
    toast.success('Free Trial Activated! Please log in again.', {
      duration: 5000,
      icon: '🚀',
      style: {
        background: '#4CAF50',
        color: 'white',
        fontWeight: 'bold'
      }
    });

    // Close the modal
    onClose();
  };

  const trialFeatures = [
    {
      icon: Users,
      title: 'Full Resident Management',
      description: 'Onboard, manage, and track all your residents with complete CRUD operations'
    },
    {
      icon: Shield,
      title: 'Payment Processing',
      description: 'Generate QR codes, process payments, and track all financial transactions'
    },
    {
      icon: Zap,
      title: 'Advanced Features',
      description: 'Ticket system, analytics, reports, bulk operations, and more'
    },
    {
      icon: Star,
      title: 'Premium Support',
      description: 'Email notifications, SMS alerts, and priority customer support'
    }
  ];

  const renderTrialLimitError = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="text-center"
      >
        <div className="mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Free Trial Bed Limit Reached
          </h2>
          <p className="text-gray-600 mb-4">
            {subscriptionErrorDetails?.message ||
              `Your free trial allows up to ${subscriptionErrorDetails?.limit || 10} beds. You've used ${subscriptionErrorDetails?.currentUsage || 0} beds and need ${subscriptionErrorDetails?.requested || 0} more.`}
          </p>

          {/* Usage Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{subscriptionErrorDetails?.currentUsage || 0}</div>
                <div className="text-sm text-gray-600">Beds Used</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{subscriptionErrorDetails?.limit || 10}</div>
                <div className="text-sm text-gray-600">Trial Limit</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{subscriptionErrorDetails?.requested || 0} beds needed</div>
                <div className="text-sm text-gray-600">Additional beds required</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-3">
          <button
            onClick={() => {
              onClose();
              // Navigate to subscription selection for upgrade
              window.location.href = '/admin/subscription-selection';
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            🚀 Upgrade to Add More Beds
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    );
  };

  const renderErrorState = () => {
    if (!activationError) return null;

    const { code, message, subscription, lastTrial } = activationError;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="text-center"
      >
        <div className="mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Trial Status
          </h2>
          <p className="text-gray-600">
            {message}
          </p>
        </div>

        {/* Show subscription details if they have an active subscription */}
        {subscription && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                {subscription.type === 'trial' ? 'Active Free Trial' : 'Active Subscription'}
              </h3>
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                <span>
                  {subscription.daysRemaining} days remaining
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-600">Expires</div>
                <div className="font-semibold text-blue-700">
                  {new Date(subscription.endDate).toLocaleDateString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Status</div>
                <div className="font-semibold text-green-600 capitalize">
                  {subscription.status}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show last trial details if trial was used before */}
        {lastTrial && (
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 mb-6 border border-gray-200">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Previous Trial Details
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-600">Ended</div>
                <div className="font-semibold text-gray-700">
                  {new Date(lastTrial.endDate).toLocaleDateString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Status</div>
                <div className={`font-semibold capitalize ${
                  lastTrial.wasCancelled ? 'text-red-600' :
                  lastTrial.isExpired ? 'text-orange-600' : 'text-gray-600'
                }`}>
                  {lastTrial.wasCancelled ? 'Cancelled' :
                   lastTrial.isExpired ? 'Expired' : 'Completed'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center space-x-3">
          {code === 'ALREADY_HAS_ACTIVE_SUBSCRIPTION' && subscription?.type === 'trial' && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200"
            >
              Continue with Trial
            </button>
          )}

          {code === 'TRIAL_EXPIRED' && (
            <button
              onClick={() => {
                onClose();
                // Navigate to subscription selection
                window.location.href = '/admin/subscription-selection';
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
            >
              Upgrade Now
            </button>
          )}

          {code === 'TRIAL_CANCELLED' && (
            <button
              onClick={() => {
                // Could open support chat or contact form
                toast('Please contact support to reactivate your trial', { icon: 'ℹ️' });
              }}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-200"
            >
              Contact Support
            </button>
          )}

          <button
            onClick={() => {
              setActivationError(null);
              setCurrentStep(1);
            }}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Start
          </button>
        </div>
      </motion.div>
    );
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      <div className="mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to PG Maintenance Pro! 🎉
        </h2>
        <p className="text-gray-600 text-lg">
          Start your <span className="font-semibold text-blue-600">14-day FREE trial</span> and unlock all premium features
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border border-blue-200">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">14</div>
            <div className="text-sm text-gray-600">Days</div>
          </div>
          <div className="w-px h-12 bg-blue-200"></div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">FREE</div>
            <div className="text-sm text-gray-600">Access</div>
          </div>
          <div className="w-px h-12 bg-purple-200"></div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">ALL</div>
            <div className="text-sm text-gray-600">Features</div>
          </div>
        </div>
        <p className="text-sm text-gray-700">
          No credit card required. Cancel anytime during the trial period.
        </p>
      </div>

      <div className="flex justify-center space-x-3">
        <button
          onClick={() => setCurrentStep(2)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Explore Features
          <ArrowRight className="inline-block h-4 w-4 ml-2" />
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Maybe Later
        </button>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Everything You Need Included
        </h2>
        <p className="text-gray-600">
          Access all premium features during your trial
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {trialFeatures.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6 border border-green-200">
        <div className="flex items-center justify-center space-x-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          <span className="font-semibold">No setup fees • No hidden costs • Cancel anytime</span>
        </div>
      </div>

      <div className="flex justify-center space-x-3">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Start My Free Trial
          <Sparkles className="inline-block h-4 w-4 ml-2" />
        </button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => {
    // Show trial limit error if this is a trial limit scenario
    if (isTrialLimitError) {
      return renderTrialLimitError();
    }

    // Show error state if there's an activation error
    if (activationError) {
      return renderErrorState();
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="text-center"
      >
      <div className="mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Ready to Get Started?
        </h2>
        <p className="text-gray-600">
          Activate your 14-day free trial now and unlock all premium features instantly
        </p>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6 border border-purple-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Trial Duration:</span>
            <span className="font-semibold text-purple-700">14 Days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">All Features:</span>
            <span className="font-semibold text-green-600">✓ Unlocked</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Setup Required:</span>
            <span className="font-semibold text-blue-600">None</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Auto-Renewal:</span>
            <span className="font-semibold text-orange-600">Disabled</span>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs">!</span>
          </div>
          <div className="text-left">
            <p className="text-sm text-yellow-800 font-medium mb-1">
              Important: Trial Reminder
            </p>
            <p className="text-xs text-yellow-700">
              You'll receive email notifications 3 days before your trial expires.
              You can cancel anytime or upgrade to continue using premium features.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-3">
        <button
          onClick={() => setCurrentStep(2)}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={isActivating}
        >
          ← Back
        </button>
        <button
          onClick={handleActivateTrial}
          disabled={isActivating}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isActivating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Activating Trial...
            </>
          ) : (
            <>
              🚀 Activate My Free Trial
            </>
          )}
        </button>
      </div>
    </motion.div>
    );
  };

  const renderPostActivationStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      <div className="mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Free Trial Activated! 🎉
        </h2>
        <p className="text-gray-600 text-lg">
          Your 14-day trial with full access is now active.
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6 border border-green-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Trial Duration:</span>
            <span className="font-semibold text-green-700">14 Days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Access Level:</span>
            <span className="font-semibold text-blue-600">Full Platform</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Modules Unlocked:</span>
            <span className="font-semibold text-purple-600">All Modules</span>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs">!</span>
          </div>
          <div className="text-left">
            <p className="text-sm text-yellow-800 font-medium mb-1">
              Important: Next Steps
            </p>
            <p className="text-xs text-yellow-700">
              For security reasons, please log out and log back in to apply your new trial access.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-3">
        <button
          onClick={handleLogoutAndRelogin}
          className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Logout and Relogin
          <ArrowRight className="inline-block h-4 w-4 ml-2" />
        </button>
      </div>
    </motion.div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isTrialLimitError
                  ? 'bg-gradient-to-br from-orange-500 to-red-600'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
              }`}>
                {isTrialLimitError ? (
                  <AlertTriangle className="h-5 w-5 text-white" />
                ) : (
                  <Gift className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {isTrialLimitError ? 'Upgrade Required' : 'Free Trial Activation'}
                </h2>
                <p className="text-sm text-gray-600">
                  {isTrialLimitError ? 'Your trial bed limit has been reached' : 'Unlock all premium features'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={isActivating}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      step <= currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-8 h-0.5 mx-2 transition-colors ${
                        step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-2">
              <p className="text-xs text-gray-500">
                {currentStep === 1 && "Welcome • 14-Day Free Trial"}
                {currentStep === 2 && "Features • Premium Access"}
                {currentStep === 3 && "Activation • Get Started"}
                {currentStep === 4 && "Post-Activation • Complete"}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderPostActivationStep()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FreeTrialModal;
