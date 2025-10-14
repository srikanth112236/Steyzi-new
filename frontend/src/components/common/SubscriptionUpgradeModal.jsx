import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowRight 
} from 'lucide-react';

const SubscriptionUpgradeModal = ({ 
  isOpen, 
  onClose, 
  currentPlan, 
  limitReached,
  limitDetails 
}) => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Sample plans (replace with actual plans from backend)
  const upgradePlans = [
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 999,
      features: [
        'Unlimited Rooms',
        'Unlimited Beds',
        'Advanced Analytics',
        'Priority Support'
      ],
      recommended: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: 1999,
      features: [
        'Unlimited Everything',
        'Custom Integrations',
        'Dedicated Account Manager',
        '24/7 Premium Support'
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-100 text-yellow-600 rounded-full p-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Upgrade Your Subscription
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Current Limit Details */}
        {limitReached && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800">Limit Reached</h3>
                <p className="text-red-700 text-sm">
                  {limitDetails?.message || 'You have reached your current plan\'s limits.'}
                </p>
              </div>
            </div>
            <div className="mt-2 text-sm text-red-600">
              <p>Current Usage:</p>
              {Object.entries(limitDetails?.currentUsage || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key.replace('_', ' ')}:</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade Plans */}
        <div className="grid md:grid-cols-2 gap-6">
          {upgradePlans.map(plan => (
            <motion.div
              key={plan.id}
              whileHover={{ scale: 1.05 }}
              className={`
                border rounded-xl p-6 transition-all 
                ${selectedPlan === plan.id 
                  ? 'border-blue-500 bg-blue-50 shadow-lg' 
                  : 'border-gray-200 hover:border-blue-300'}
              `}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                {plan.recommended && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Recommended
                  </span>
                )}
              </div>
              
              <div className="text-3xl font-bold text-blue-600 mb-4">
                ₹{plan.price}/month
              </div>
              
              <ul className="space-y-2 mb-6">
                {plan.features.map(feature => (
                  <li 
                    key={feature} 
                    className="flex items-center space-x-2 text-gray-700"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                className={`
                  w-full py-3 rounded-lg transition-all
                  ${selectedPlan === plan.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-50'}
                `}
              >
                {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            disabled={!selectedPlan}
            className={`
              px-6 py-2 rounded-lg flex items-center space-x-2
              ${selectedPlan 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
            `}
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionUpgradeModal;
