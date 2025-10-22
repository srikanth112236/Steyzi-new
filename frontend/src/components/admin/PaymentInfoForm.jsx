import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  User, 
  Building2, 
  Phone, 
  Save, 
  Upload,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  DollarSign,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import paymentInfoService from '../../services/paymentInfo.service';
import BranchSelector from '../common/BranchSelector';
import { useSelector } from 'react-redux';
import { selectSelectedBranch } from '../../store/slices/branch.slice';

const PaymentSummary = ({ data, onEdit }) => {
  return (
    <div className="space-y-6">
      {/* UPI Information Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
            Payment Summary
          </h3>
          <button
            onClick={onEdit}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center"
          >
            <Settings className="h-4 w-4 mr-2" />
            Edit Settings
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* UPI Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">UPI Information</h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">UPI ID:</span>
                <p className="text-sm font-medium text-gray-900">{data.upiId}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">UPI Name:</span>
                <p className="text-sm font-medium text-gray-900">{data.upiName}</p>
              </div>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Pricing Information</h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Per Day Cost:</span>
                <p className="text-sm font-medium text-gray-900">₹{data.perDayCost}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Advance Amount:</span>
                <p className="text-sm font-medium text-gray-900">₹{data.advanceAmount}</p>
              </div>
            </div>
          </div>

          {/* Payment Apps */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Apps</h4>
            <div className="space-y-2">
              {data.gpayNumber && (
                <div>
                  <span className="text-sm text-gray-500">Google Pay:</span>
                  <p className="text-sm font-medium text-gray-900">{data.gpayNumber}</p>
                </div>
              )}
              {data.paytmNumber && (
                <div>
                  <span className="text-sm text-gray-500">Paytm:</span>
                  <p className="text-sm font-medium text-gray-900">{data.paytmNumber}</p>
                </div>
              )}
              {data.phonepeNumber && (
                <div>
                  <span className="text-sm text-gray-500">PhonePe:</span>
                  <p className="text-sm font-medium text-gray-900">{data.phonepeNumber}</p>
                </div>
              )}
              {!data.gpayNumber && !data.paytmNumber && !data.phonepeNumber && (
                <p className="text-sm text-gray-500">No payment apps configured</p>
              )}
            </div>
          </div>

          {/* PG Rules */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">PG Rules</h4>
            {data.pgRules && data.pgRules.length > 0 ? (
              <ul className="space-y-1">
                {data.pgRules.map((rule, index) => (
                  <li key={index} className="text-sm text-gray-900 flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    {rule}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No rules configured</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const PaymentInfoForm = () => {
  const globalSelectedBranch = useSelector(selectSelectedBranch);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    upiId: '',
    upiName: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    gpayNumber: '',
    paytmNumber: '',
    phonepeNumber: '',
    paymentInstructions: 'Please make payment and upload screenshot for verification.',
    perDayCost: 0,
    advanceAmount: 0,
    pgRules: [],
    qrCodeImagePath: ''
  });
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (!selectedBranch && globalSelectedBranch) {
      setSelectedBranch(globalSelectedBranch);
    }
  }, [globalSelectedBranch, selectedBranch]);

  useEffect(() => {
    if (selectedBranch) {
      fetchPaymentInfo();
    }
  }, [selectedBranch]);

  const fetchPaymentInfo = async () => {
    try {
      setLoading(true);
      const response = await paymentInfoService.getPaymentInfo(selectedBranch._id);
      
      if (response.success && response.data) {
        const data = response.data;
        setFormData({
          upiId: data.upiId || '',
          upiName: data.upiName || '',
          accountHolderName: data.accountHolderName || '',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          ifscCode: data.ifscCode || '',
          gpayNumber: data.gpayNumber || '',
          paytmNumber: data.paytmNumber || '',
          phonepeNumber: data.phonepeNumber || '',
          paymentInstructions: data.paymentInstructions || 'Please make payment and upload screenshot for verification.',
          perDayCost: data.perDayCost || 0,
          advanceAmount: data.advanceAmount || 0,
          pgRules: data.pgRules || [],
          qrCodeImagePath: data.qrCodeImagePath || ''
        });
        setInitialData(data);
      } else {
        // Try to get onboarding data as fallback
        try {
          const onboardingResponse = await fetch('/api/onboarding/status', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (onboardingResponse.ok) {
            const onboardingData = await onboardingResponse.json();
            if (onboardingData.success && onboardingData.data) {
              // Look for payment settings in onboarding data
              const paymentStep = onboardingData.data.steps?.find(step => step.stepId === 'payment_settings');
              if (paymentStep && paymentStep.data) {
                const paymentData = paymentStep.data;
                setFormData({
                  upiId: paymentData.upiId || '',
                  upiName: paymentData.upiName || '',
                  accountHolderName: paymentData.accountHolderName || '',
                  bankName: paymentData.bankName || '',
                  accountNumber: paymentData.accountNumber || '',
                  ifscCode: paymentData.ifscCode || '',
                  gpayNumber: paymentData.gpayNumber || '',
                  paytmNumber: paymentData.paytmNumber || '',
                  phonepeNumber: paymentData.phonepeNumber || '',
                  paymentInstructions: paymentData.paymentInstructions || 'Please make payment and upload screenshot for verification.',
                  perDayCost: paymentData.perDayCost || 0,
                  advanceAmount: paymentData.advanceAmount || 0,
                  pgRules: paymentData.pgRules || [],
                  qrCodeImagePath: ''
                });
                setInitialData(paymentData);
                return;
              }
            }
          }
        } catch (onboardingError) {
          console.log('No onboarding data available:', onboardingError);
        }
        
        // No data yet for this branch; clear form to allow fresh entry
        setInitialData(null);
        setFormData(prev => ({
          ...prev,
          upiId: '',
          upiName: '',
          accountHolderName: '',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          gpayNumber: '',
          paytmNumber: '',
          phonepeNumber: '',
          perDayCost: 0,
          advanceAmount: 0,
          pgRules: [],
          qrCodeImagePath: ''
        }));
      }
    } catch (error) {
      console.error('Error fetching payment info:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load payment information');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedBranch) {
      toast.error('Please select a branch first');
      return;
    }

    if (!formData.upiId || !formData.upiName || !formData.accountHolderName || formData.perDayCost <= 0) {
      toast.error('Please fill in all required fields including per day cost');
      return;
    }

    try {
      setSaving(true);
      
      const response = await paymentInfoService.savePaymentInfo(selectedBranch._id, formData);
      
      if (response.success) {
        toast.success('Payment information saved successfully');
        const savedData = response.data;
        setInitialData(savedData);
        setFormData({
          upiId: savedData.upiId || '',
          upiName: savedData.upiName || '',
          accountHolderName: savedData.accountHolderName || '',
          bankName: savedData.bankName || '',
          accountNumber: savedData.accountNumber || '',
          ifscCode: savedData.ifscCode || '',
          gpayNumber: savedData.gpayNumber || '',
          paytmNumber: savedData.paytmNumber || '',
          phonepeNumber: savedData.phonepeNumber || '',
          paymentInstructions: savedData.paymentInstructions || 'Please make payment and upload screenshot for verification.',
          perDayCost: savedData.perDayCost || 0,
          advanceAmount: savedData.advanceAmount || 0,
          pgRules: savedData.pgRules || [],
          qrCodeImagePath: savedData.qrCodeImagePath || ''
        });
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 3000);
      } else {
        toast.error(response.message || 'Failed to save payment information');
      }
    } catch (error) {
      console.error('Error saving payment info:', error);
      toast.error('Failed to save payment information');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!initialData) return true;
    
    return Object.keys(formData).some(key => {
      return formData[key] !== (initialData[key] || '');
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!selectedBranch) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-6 w-6 text-yellow-600" />
        </div>
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Branch Required</h3>
        <p className="text-yellow-700">
          Please select a branch from the top navigation to manage payment information.
        </p>
      </div>
    );
  }

  const handleSubmitSuccess = async (response) => {
    if (response.success) {
      toast.success('Payment information saved successfully');
      const savedData = response.data;
      setInitialData(savedData);
      setFormData({
        upiId: savedData.upiId || '',
        upiName: savedData.upiName || '',
        accountHolderName: savedData.accountHolderName || '',
        bankName: savedData.bankName || '',
        accountNumber: savedData.accountNumber || '',
        ifscCode: savedData.ifscCode || '',
        gpayNumber: savedData.gpayNumber || '',
        paytmNumber: savedData.paytmNumber || '',
        phonepeNumber: savedData.phonepeNumber || '',
        paymentInstructions: savedData.paymentInstructions || 'Please make payment and upload screenshot for verification.',
        perDayCost: savedData.perDayCost || 0,
        advanceAmount: savedData.advanceAmount || 0,
        pgRules: savedData.pgRules || [],
        qrCodeImagePath: savedData.qrCodeImagePath || ''
      });
      setJustSaved(true);
      setIsEditing(false); // Exit edit mode after successful save
      setTimeout(() => setJustSaved(false), 3000);
    } else {
      toast.error(response.message || 'Failed to save payment information');
    }
  };

  return (
    <div className="max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <CreditCard className="h-6 w-6 mr-3 text-blue-600" />
          Payment Information
        </h2>
        <p className="text-gray-600 mt-1">
          Configure payment details for your PG branches. The same UPI ID or app number can be reused across branches.
        </p>
      </div>

      {/* Branch Selector */}
      <div className="mb-6">
        <BranchSelector
          selectedBranch={selectedBranch}
          onBranchChange={(branch) => {
            setSelectedBranch(branch);
            setIsEditing(false); // Reset edit mode when branch changes
          }}
        />
      </div>

      {!selectedBranch ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Branch</h3>
          <p className="text-gray-600">Please select a branch above to configure payment information</p>
        </div>
      ) : !isEditing && initialData ? (
        <PaymentSummary 
          data={initialData} 
          onEdit={() => setIsEditing(true)}
        />
      ) : (
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            setSaving(true);
            const response = await paymentInfoService.savePaymentInfo(selectedBranch._id, formData);
            await handleSubmitSuccess(response);
          } catch (error) {
            console.error('Error saving payment info:', error);
            toast.error('Failed to save payment information');
          } finally {
            setSaving(false);
          }
        }} className="space-y-6">
        {/* UPI Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
            UPI Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UPI ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.upiId}
                onChange={(e) => handleInputChange('upiId', e.target.value)}
                placeholder="example@paytm"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UPI Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.upiName}
                onChange={(e) => handleInputChange('upiName', e.target.value)}
                placeholder="Name as registered in UPI"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>

        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-green-600" />
            Account Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.accountHolderName}
                onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                placeholder="Full name as per bank records"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Toggle Bank Details */}
            <div className="flex items-center justify-between py-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700">Bank Account Details (Optional)</span>
              <button
                type="button"
                onClick={() => setShowBankDetails(!showBankDetails)}
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
              >
                {showBankDetails ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Show
                  </>
                )}
              </button>
            </div>

            {showBankDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    placeholder="Bank Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    placeholder="Account Number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                    placeholder="IFSC Code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Payment App Numbers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="h-5 w-5 mr-2 text-purple-600" />
            Payment App Numbers (Optional)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GPay Number</label>
              <input
                type="tel"
                value={formData.gpayNumber}
                onChange={(e) => handleInputChange('gpayNumber', e.target.value)}
                placeholder="GPay registered number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paytm Number</label>
              <input
                type="tel"
                value={formData.paytmNumber}
                onChange={(e) => handleInputChange('paytmNumber', e.target.value)}
                placeholder="Paytm registered number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PhonePe Number</label>
              <input
                type="tel"
                value={formData.phonepeNumber}
                onChange={(e) => handleInputChange('phonepeNumber', e.target.value)}
                placeholder="PhonePe registered number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>

        {/* Pricing Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Pricing Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Per Day Cost (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.perDayCost}
                onChange={(e) => handleInputChange('perDayCost', parseFloat(e.target.value) || 0)}
                placeholder="Enter per day cost"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advance Amount (₹)
              </label>
              <input
                type="number"
                value={formData.advanceAmount}
                onChange={(e) => handleInputChange('advanceAmount', parseFloat(e.target.value) || 0)}
                placeholder="Enter advance amount"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These pricing details will be used for resident billing and payment calculations.
            </p>
          </div>
        </motion.div>

        {/* PG Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-red-600" />
            PG Rules & Regulations
          </h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">
              Select the rules that apply to your PG. These will be displayed to residents.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'No smoking inside the premises',
                'No alcohol consumption',
                'No loud music after 10 PM',
                'Visitors allowed only during day time',
                'Maintain cleanliness in common areas',
                'No cooking in rooms',
                'Respect other residents privacy',
                'Follow COVID-19 safety guidelines',
                'No pets allowed',
                'Monthly rent to be paid in advance'
              ].map(rule => (
                <label key={rule} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pgRules.includes(rule)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleInputChange('pgRules', [...formData.pgRules, rule]);
                      } else {
                        handleInputChange('pgRules', formData.pgRules.filter(r => r !== rule));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{rule}</span>
                </label>
              ))}
            </div>
          </div>
          
          {formData.pgRules.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Selected Rules ({formData.pgRules.length}):</strong> {formData.pgRules.join(', ')}
              </p>
            </div>
          )}
        </motion.div>

        {/* Payment Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
            Payment Instructions
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions for Residents
            </label>
            <textarea
              rows={3}
              value={formData.paymentInstructions}
              onChange={(e) => handleInputChange('paymentInstructions', e.target.value)}
              placeholder="Enter instructions that will be shown to residents..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              These instructions will be displayed to residents when they make payments via QR code
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-600">
            {justSaved ? (
              <div className="flex items-center text-green-600 animate-pulse">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="font-medium">Just saved!</span>
              </div>
            ) : initialData ? (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                Last updated: {new Date(initialData.updatedAt).toLocaleDateString()} at {new Date(initialData.updatedAt).toLocaleTimeString()}
              </div>
            ) : (
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-orange-600 mr-1" />
                No payment information configured
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                if (initialData) {
                  setIsEditing(false);
                  setFormData({
                    ...initialData,
                    pgRules: initialData.pgRules || []
                  });
                } else {
                  fetchPaymentInfo();
                }
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {initialData ? 'Cancel' : 'Reset'}
            </button>
            
            <button
              type="submit"
              disabled={saving || !hasChanges()}
              className={`px-6 py-2 rounded-lg transition-all flex items-center ${
                !hasChanges() && !saving
                  ? 'bg-green-100 text-green-700 border border-green-200 cursor-default'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : !hasChanges() ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Saving...' : !hasChanges() ? 'All Changes Saved' : 'Save Payment Info'}
            </button>
          </div>
        </div>
      </form>
      )}
    </div>
  );
};

export default PaymentInfoForm; 