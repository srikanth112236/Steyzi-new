import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle,
  TrendingUp,
  Calendar,
  Bell,
  QrCode,
  FileText,
  Star,
  Rocket,
  Heart,
  Target,
  MessageSquare,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WelcomeModal = ({ 
  isOpen, 
  onClose,
  userName,
  onGetStarted
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const features = [
    {
      icon: Users,
      title: 'Resident Management',
      description: 'Easily onboard, manage, and track all your residents in one place',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: CreditCard,
      title: 'Payment Processing',
      description: 'Accept payments seamlessly with QR codes and automated tracking',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Get real-time insights into your PG operations and finances',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: MessageSquare,
      title: 'Ticket System',
      description: 'Handle maintenance requests and support tickets efficiently',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: QrCode,
      title: 'QR Code Payments',
      description: 'Enable quick and secure payment collection with QR codes',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Your data is protected with enterprise-grade security',
      color: 'from-teal-500 to-cyan-500'
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Increase Efficiency',
      description: 'Automate daily operations and save hours every day'
    },
    {
      icon: DollarSign,
      title: 'Boost Revenue',
      description: 'Track payments, reduce defaults, and optimize pricing'
    },
    {
      icon: Target,
      title: 'Better Decisions',
      description: 'Data-driven insights to grow your PG business'
    },
    {
      icon: Heart,
      title: 'Happy Residents',
      description: 'Improve resident satisfaction with better service'
    }
  ];

  const steps = [
    {
      title: 'Welcome',
      subtitle: 'Let\'s get you started'
    },
    {
      title: 'Features',
      subtitle: 'Discover what you can do'
    },
    {
      title: 'Benefits',
      subtitle: 'Why choose us'
    }
  ];

  const handleGetStarted = () => {
    onClose();
    if (onGetStarted) {
      onGetStarted();
    } else {
      navigate('/admin/dashboard');
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  if (!isOpen) return null;

  const renderWelcomeStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      <div className="mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
        >
          <Rocket className="h-12 w-12 text-white" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-gray-900 mb-3"
        >
          Welcome, {userName || 'PG Owner'}! 👋
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
        >
          We're thrilled to have you on board! Let's take a quick tour of how our platform can transform your PG management experience.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 mb-8 border border-blue-100"
        >
          <div className="flex items-center justify-center space-x-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">100%</div>
              <div className="text-sm text-gray-600">Digital</div>
            </div>
            <div className="w-px h-12 bg-blue-200"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">24/7</div>
              <div className="text-sm text-gray-600">Support</div>
            </div>
            <div className="w-px h-12 bg-purple-200"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600 mb-1">Easy</div>
              <div className="text-sm text-gray-600">To Use</div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderFeaturesStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Powerful Features at Your Fingertips
        </h2>
        <p className="text-gray-600">
          Everything you need to manage your PG efficiently
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-h-96 overflow-y-auto pr-2">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border-2 border-gray-100 rounded-xl p-5 hover:border-blue-300 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );

  const renderBenefitsStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Why PG Owners Love Us
        </h2>
        <p className="text-gray-600">
          Join thousands of successful PG managers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all"
            >
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
        </div>
        <p className="text-center text-gray-700 font-medium">
          "This platform has completely transformed how I manage my PG. Highly recommended!"
        </p>
        <p className="text-center text-sm text-gray-500 mt-2">
          - Satisfied PG Owner
        </p>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Gradient */}
          <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {steps[currentStep].title}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {steps[currentStep].subtitle}
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

            {/* Progress Indicator */}
            <div className="relative mt-6">
              <div className="flex items-center justify-center space-x-2">
                {steps.map((step, index) => (
                  <React.Fragment key={index}>
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          index <= currentStep
                            ? 'bg-white text-blue-600 shadow-lg scale-110'
                            : 'bg-white/30 text-white/70'
                        }`}
                      >
                        {index < currentStep ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`w-16 h-1 mx-2 transition-all ${
                            index < currentStep
                              ? 'bg-white'
                              : 'bg-white/30'
                          }`}
                        />
                      )}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-8 overflow-y-auto">
            {currentStep === 0 && renderWelcomeStep()}
            {currentStep === 1 && renderFeaturesStep()}
            {currentStep === 2 && renderBenefitsStep()}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 border-t border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Skip Tour
              </button>
              
              <div className="flex items-center space-x-3">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-6 py-3 text-gray-700 hover:text-gray-900 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-all font-medium"
                  >
                    Previous
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
                >
                  <span>
                    {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                  </span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WelcomeModal;

