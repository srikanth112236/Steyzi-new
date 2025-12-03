import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Lock,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

/**
 * Subscription Upgrade Modal Component
 * Reusable modal that shows when trial is ending soon (< 1 day remaining)
 * Can be used in multiple places throughout the application
 */
const SubscriptionUpgradeModal = ({
  isOpen,
  onClose,
  trialTimeLeft,
  onUpgradeClick
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      navigate('/admin/subscription-selection');
    }
    onClose();
  };

  if (!trialTimeLeft || trialTimeLeft.expired) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-[10001] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-500 via-cyan-600 to-teal-600 px-6 py-5 text-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Lock className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Trial Ending Soon</h2>
                      <p className="text-cyan-100 text-sm mt-0.5">
                        {trialTimeLeft.days > 0 
                          ? `${trialTimeLeft.days}d ${trialTimeLeft.hours}h left`
                          : `${trialTimeLeft.hours}h ${trialTimeLeft.minutes}m left`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/90 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Warning Message */}
                  <div className="bg-cyan-50 border-2 border-cyan-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-6 w-6 text-cyan-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-cyan-900 mb-1">Upgrade to Continue Using Steyzi</h3>
                        <p className="text-sm text-cyan-800">
                          Your free trial is ending soon. Subscribe to a paid plan to continue using all features without restrictions and ensure uninterrupted service.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-cyan-600" />
                      <span>Benefits of Upgrading</span>
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {[
                        'Unlimited beds and rooms',
                        'Multiple branches support',
                        'Advanced analytics & reports',
                        'Priority customer support',
                        'No data restrictions',
                        'Regular feature updates'
                      ].map((benefit, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time Remaining Card */}
                  <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-4 border border-cyan-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Time Remaining</p>
                        <p className="text-2xl font-bold text-cyan-700">
                          {trialTimeLeft.days > 0 
                            ? `${trialTimeLeft.days}d ${trialTimeLeft.hours}h`
                            : `${trialTimeLeft.hours}h ${trialTimeLeft.minutes}m`}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-cyan-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer - Sticky */}
              <div className="border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleUpgrade}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-600 text-white rounded-xl font-bold hover:from-cyan-700 hover:via-cyan-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center justify-center space-x-2"
                  >
                    <span>View Subscription Plans</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionUpgradeModal;
