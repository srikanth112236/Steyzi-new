import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  QrCode,
  MessageSquare,
  Star,
  Rocket,
  Heart,
  Target,
  Plus,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const WelcomeSection = ({ 
  userName,
  onGetStarted
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const features = [
    {
      icon: Users,
      title: 'Resident Management',
      description: 'Onboard, manage, and track residents seamlessly'
    },
    {
      icon: CreditCard,
      title: 'Payment Processing',
      description: 'QR codes and automated payment tracking'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Real-time insights into operations and finances'
    },
    {
      icon: MessageSquare,
      title: 'Ticket System',
      description: 'Handle maintenance requests efficiently'
    },
    {
      icon: QrCode,
      title: 'QR Payments',
      description: 'Quick and secure payment collection'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade data protection'
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Increase Efficiency',
      description: 'Automate operations, save time daily'
    },
    {
      icon: Target,
      title: 'Better Decisions',
      description: 'Data-driven insights for growth'
    },
    {
      icon: Heart,
      title: 'Happy Residents',
      description: 'Improve satisfaction with better service'
    }
  ];

  const steps = ['Welcome', 'Features', 'Benefits'];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-cyan-50 py-8 px-4">
      <div className="max-w-full mx-auto">
        {/* Compact Header */}
        <div className="bg-white rounded-xl shadow-sm border border-cyan-100 overflow-hidden mb-4">
          <div className="bg-cyan-100 px-6 py-4 border-b border-cyan-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-cyan-200 rounded-lg flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-cyan-700" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {steps[currentStep]}
                  </h2>
                  <p className="text-xs text-gray-600">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                </div>
              </div>

              {/* Compact Progress Indicator */}
              <div className="flex items-center space-x-1.5">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index <= currentStep
                        ? 'bg-cyan-600 w-6'
                        : 'bg-cyan-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Content Section - Compact */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                    className="w-16 h-16 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4"
                  >
                    <Rocket className="h-8 w-8 text-cyan-600" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome, {userName || 'PG Owner'}! 👋
                  </h2>
                  
                  <p className="text-sm text-gray-600 mb-6 max-w-xl mx-auto leading-relaxed">
                    Transform your PG management with our powerful platform. Let's get you started!
                  </p>

                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                    {[
                      { label: '100%', sub: 'Digital' },
                      { label: '24/7', sub: 'Support' },
                      { label: 'Easy', sub: 'To Use' }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
                        <div className="text-xl font-bold text-cyan-700 mb-0.5">{stat.label}</div>
                        <div className="text-xs text-gray-600">{stat.sub}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="features"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-5">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      Powerful Features
                    </h2>
                    <p className="text-xs text-gray-600">
                      Everything you need in one place
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white border border-gray-200 rounded-lg p-3 hover:border-cyan-300 hover:shadow-sm transition-all cursor-pointer group"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-9 h-9 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-200 transition-colors">
                              <Icon className="h-4 w-4 text-cyan-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-gray-900 mb-0.5">
                                {feature.title}
                              </h3>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {feature.description}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="benefits"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-5">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      Why PG Owners Love Us
                    </h2>
                    <p className="text-xs text-gray-600">
                      Join thousands of successful managers
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {benefits.map((benefit, index) => {
                      const Icon = benefit.icon;
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all"
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-3">
                              <Icon className="h-5 w-5 text-cyan-600" />
                            </div>
                            <h3 className="font-semibold text-sm text-gray-900 mb-1">
                              {benefit.title}
                            </h3>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {benefit.description}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <p className="text-center text-sm text-gray-700 font-medium mb-1">
                      "This platform has completely transformed how I manage my PG."
                    </p>
                    <p className="text-center text-xs text-gray-500">
                      - Satisfied PG Owner
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Compact Footer Actions */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                  currentStep === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                <span>Previous</span>
              </button>
              
              <div className="flex items-center space-x-2">
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 transition-all shadow-sm hover:shadow-md flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={onGetStarted}
                    className="px-6 py-2 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 transition-all shadow-sm hover:shadow-md flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar - Compact */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Sparkles, label: 'Easy Setup', color: 'cyan' },
            { icon: Shield, label: 'Secure', color: 'cyan' },
            { icon: TrendingUp, label: 'Grow Fast', color: 'cyan' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="bg-white border border-cyan-200 rounded-lg p-3 flex items-center space-x-3 hover:shadow-sm transition-all"
              >
                <div className={`w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 text-cyan-600`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
