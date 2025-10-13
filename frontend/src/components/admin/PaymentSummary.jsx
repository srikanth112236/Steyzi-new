import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  DollarSign, 
  Settings, 
  Phone, 
  Building2, 
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectSelectedBranch } from '../../store/slices/branch.slice';
import paymentInfoService from '../../services/paymentInfo.service';

const PaymentSummary = () => {
  const selectedBranch = useSelector(selectSelectedBranch);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedBranch) {
      fetchPaymentData();
    }
  }, [selectedBranch]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentInfoService.getPaymentInfo(selectedBranch._id);
      
      if (response.success && response.data) {
        setPaymentData(response.data);
      } else {
        setError('No payment information found');
      }
    } catch (err) {
      console.error('Error fetching payment data:', err);
      setError('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center text-center">
          <div>
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Information</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchPaymentData}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <CreditCard className="h-6 w-6 mr-3 text-blue-600" />
            Payment Summary
          </h3>
          <p className="text-gray-600 mt-1">
            Complete payment information for {selectedBranch?.name || 'selected branch'}
          </p>
        </div>
        <button
          onClick={fetchPaymentData}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UPI Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-green-600" />
            UPI Information
          </h4>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">UPI ID:</span>
              <p className="text-lg font-semibold text-gray-900">{paymentData.upiId}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">UPI Name:</span>
              <p className="text-lg font-semibold text-gray-900">{paymentData.upiName}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Account Holder:</span>
              <p className="text-lg font-semibold text-gray-900">{paymentData.accountHolderName}</p>
            </div>
          </div>
        </motion.div>

        {/* Pricing Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
            Pricing Information
          </h4>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Per Day Cost:</span>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(paymentData.perDayCost)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Advance Amount:</span>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(paymentData.advanceAmount)}</p>
            </div>
            <div className="pt-2 border-t border-blue-200">
              <span className="text-sm font-medium text-gray-600">Monthly Estimate:</span>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(paymentData.perDayCost * 30)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="h-5 w-5 mr-2 text-purple-600" />
            Payment Methods
          </h4>
          
          <div className="space-y-3">
            {paymentData.gpayNumber && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Google Pay:</span>
                  <p className="text-sm font-semibold text-gray-900">{paymentData.gpayNumber}</p>
                </div>
              </div>
            )}
            
            {paymentData.paytmNumber && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Paytm:</span>
                  <p className="text-sm font-semibold text-gray-900">{paymentData.paytmNumber}</p>
                </div>
              </div>
            )}
            
            {paymentData.phonepeNumber && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Phone className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">PhonePe:</span>
                  <p className="text-sm font-semibold text-gray-900">{paymentData.phonepeNumber}</p>
                </div>
              </div>
            )}
            
            {!paymentData.gpayNumber && !paymentData.paytmNumber && !paymentData.phonepeNumber && (
              <p className="text-sm text-gray-500 italic">No mobile payment numbers configured</p>
            )}
          </div>
        </motion.div>

        {/* Bank Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-orange-600" />
            Bank Information
          </h4>
          
          <div className="space-y-3">
            {paymentData.bankName && (
              <div>
                <span className="text-sm font-medium text-gray-600">Bank Name:</span>
                <p className="text-sm font-semibold text-gray-900">{paymentData.bankName}</p>
              </div>
            )}
            
            {paymentData.accountNumber && (
              <div>
                <span className="text-sm font-medium text-gray-600">Account Number:</span>
                <p className="text-sm font-semibold text-gray-900">
                  {paymentData.accountNumber.replace(/(.{4})/g, '$1 ').trim()}
                </p>
              </div>
            )}
            
            {paymentData.ifscCode && (
              <div>
                <span className="text-sm font-medium text-gray-600">IFSC Code:</span>
                <p className="text-sm font-semibold text-gray-900">{paymentData.ifscCode}</p>
              </div>
            )}
            
            {!paymentData.bankName && !paymentData.accountNumber && !paymentData.ifscCode && (
              <p className="text-sm text-gray-500 italic">No bank information configured</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* PG Rules */}
      {paymentData.pgRules && paymentData.pgRules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-red-600" />
            PG Rules & Regulations
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentData.pgRules.map((rule, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-red-200">
                <CheckCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{rule}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Payment Instructions */}
      {paymentData.paymentInstructions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-gray-600" />
            Payment Instructions
          </h4>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              {paymentData.paymentInstructions}
            </p>
          </div>
        </motion.div>
      )}

      {/* Last Updated */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Payment information configured</span>
          </div>
          <span>
            Last updated: {new Date(paymentData.updatedAt || paymentData.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;
