import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertCircle,
  Lock,
  Zap,
  Shield,
  BarChart3,
  Users,
  CreditCard,
  ArrowRight,
  Sparkles,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TrialExpiredModal = ({ 
  isOpen, 
  onClose,
  trialEndDate,
  subscription
}) => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Resident Management',
      description: 'Manage all your residents seamlessly'
    },
    {
      icon: CreditCard,
      title: 'Payment Processing',
      description: 'Track payments and generate invoices'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Get insights into your PG operations'
    },
    {
      icon: Shield,
      title: 'Ticket System',
      description: 'Handle maintenance and support requests'
    },
    {
      icon: Zap,
      title: 'Advanced Features',
      description: 'Access all premium functionality'
    },
    {
      icon: TrendingUp,
      title: 'Growth Tools',
      description: 'Scale your PG business efficiently'
    }
  ];

  const handleUpgrade = () => {
    onClose();
    navigate('/admin/subscription-history');
  };

  if (!isOpen) return null;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-6">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30">
                  <Lock className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Free Trial Expired
                  </h2>
                  <p className="text-white/90 text-sm">
                    Upgrade to continue using all features
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Expired Notice */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6 mb-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Your Free Trial Has Ended
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Your 14-day free trial expired on <span className="font-semibold text-orange-600">{formatDate(trialEndDate)}</span>. 
                    To continue accessing your PG data and all premium features, please upgrade to a subscription plan.
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Expired: {formatDate(trialEndDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Access Restriction Notice */}
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Lock className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900 mb-1">
                    Access Restricted
                  </p>
                  <p className="text-sm text-red-800">
                    Without an active subscription, you cannot view or manage your PG data. Upgrade now to restore full access.
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  What You'll Get with a Subscription
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {feature.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Upgrade Benefits */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6 border border-purple-200">
              <h4 className="font-bold text-gray-900 mb-4 text-center">
                Why Upgrade Now?
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">24/7</div>
                  <div className="text-sm text-gray-700">Access Anytime</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">100%</div>
                  <div className="text-sm text-gray-700">Data Security</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">∞</div>
                  <div className="text-sm text-gray-700">Unlimited Support</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 border-t border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 text-gray-700 hover:text-gray-900 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-all font-medium"
              >
                Maybe Later
              </button>
              <button
                onClick={handleUpgrade}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
              >
                <span>Upgrade to Subscription</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <p className="text-center text-xs text-gray-500 mt-4">
              Secure payment • Cancel anytime • No hidden fees
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TrialExpiredModal;

