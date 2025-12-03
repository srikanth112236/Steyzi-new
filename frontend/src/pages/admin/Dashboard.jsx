import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Home, 
  Activity, 
  RefreshCw, 
  Shield,
  Calendar,
  AlertCircle,
  UserMinus,
  MessageSquare,
  Bell,
  ArrowUpRight,
  UserPlus,
  Building2,
  TrendingDown,
  X,
  MapPin,
  Phone,
  Mail,
  Plus,
  Settings
} from 'lucide-react';

import { selectSelectedBranch, selectBranches, initializeBranches, setBranches } from '../../store/slices/branch.slice';
import { selectPgConfigured, updateAuthState } from '../../store/slices/authSlice';
import DefaultBranchModal from '../../components/admin/DefaultBranchModal';
import PGConfigurationModal from '../../components/admin/PGConfigurationModal';
import WelcomeSection from '../../components/common/WelcomeSection';
import maintainerService from '../../services/maintainer.service';

const SetupWizard = ({ onComplete }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  console.log('SetupWizard: User data:', { userId: user?._id, pgId: user?.pgId, role: user?.role });
  const [currentStep, setCurrentStep] = useState(1);
  const [maintainers, setMaintainers] = useState([]);
  const [showMaintainerModal, setShowMaintainerModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalSteps = 4;

  const steps = [
    { number: 1, title: "Welcome", description: "Getting Started" },
    { number: 2, title: "Add Maintainers", description: "Create your team" },
    { number: 3, title: "Create Branch", description: "Set up your first branch" },
    { number: 4, title: "Configure PG", description: "Set sharing types" }
  ];

  // Fetch maintainers when component mounts
  useEffect(() => {
    fetchMaintainers();
  }, []);

  // Monitor maintainers state for debugging
  useEffect(() => {
    console.log('Maintainers state updated, count:', maintainers.length);
  }, [maintainers]);

  const fetchMaintainers = async () => {
    try {
      setLoading(true);
      const response = await maintainerService.getAllMaintainers();

      if (response.success && response.data && Array.isArray(response.data.maintainers)) {
        setMaintainers(response.data.maintainers);
    } else {
        console.warn('Invalid maintainers response:', response);
        setMaintainers([]);
      }
    } catch (error) {
      console.error('Error fetching maintainers:', error);
      setMaintainers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleMaintainerAdded = async (maintainerData) => {
    console.log('SetupWizard: handleMaintainerAdded called with:', maintainerData);
    setShowMaintainerModal(false);

    // Normalize maintainer data to match the API response structure
    let normalizedMaintainer = maintainerData;

    // If the maintainer data doesn't have a user object, create one
    if (!normalizedMaintainer.user && (normalizedMaintainer.firstName || normalizedMaintainer.email)) {
      normalizedMaintainer = {
        ...normalizedMaintainer,
        user: {
          _id: normalizedMaintainer.userId || normalizedMaintainer._id,
          firstName: normalizedMaintainer.firstName,
          lastName: normalizedMaintainer.lastName || '',
          email: normalizedMaintainer.email,
          phone: normalizedMaintainer.phone || normalizedMaintainer.mobile
        }
      };
    }

    console.log('SetupWizard: Normalized maintainer:', normalizedMaintainer);

    // Immediately add the new maintainer to the list for instant UI update
    if (normalizedMaintainer && normalizedMaintainer._id) {
      setMaintainers(prev => [...prev, normalizedMaintainer]);
      console.log('SetupWizard: Added maintainer to local state, ID:', normalizedMaintainer._id);
    } else {
      console.error('SetupWizard: Maintainer data invalid, no _id found');
    }

    // Also refresh from server to ensure consistency
    try {
      await fetchMaintainers();
    } catch (error) {
      console.error('Failed to refresh maintainers after adding:', error);
      // If refresh fails, at least we have the maintainer in local state
    }
  };

  const handleBranchCreated = (branchData) => {
    console.log('SetupWizard: handleBranchCreated called with:', branchData);
    setShowBranchModal(false);
    setCurrentStep(4);
    setShowConfigModal(true);
  };

  const handleConfigurationComplete = async (configData) => {
    console.log('Configuration completed:', configData);
    setShowConfigModal(false);

    try {
      // Refresh PG data to get updated configuration status
      const pgService = (await import('../../services/pg.service')).default;
      const pgResponse = await pgService.getPGDetails(user.pgId);
      console.log('PG details response in config complete:', pgResponse);

      if (pgResponse.success && pgResponse.data) {
        // Update auth state with fresh PG data
        const isConfigured = pgResponse.data.isConfigured || false;
        console.log('Setting PG configured to:', isConfigured);
        dispatch(updateAuthState({
          pgConfigured: isConfigured
        }));
      } else {
        // Fallback: just mark as configured
        console.log('PG response failed, setting configured to true as fallback');
        dispatch(updateAuthState({ pgConfigured: true }));
      }
    } catch (error) {
      console.error('Error refreshing PG data:', error);
      // Fallback: just mark as configured
      console.log('Error refreshing PG data, setting configured to true as fallback');
      dispatch(updateAuthState({ pgConfigured: true }));
    }

    onComplete && onComplete();
  };

  const handleWizardClose = () => {
    setShowMaintainerModal(false);
    setShowBranchModal(false);
    setShowConfigModal(false);
    onComplete && onComplete();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6 py-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to PG Setup</h2>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                Let's get your PG management system up and running! We'll guide you through setting up your first branch and configuring sharing types.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-lg mx-auto">
              <h3 className="font-semibold text-blue-900 mb-2">What we'll do:</h3>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>• Add maintainers to manage your PG</li>
                <li>• Create your default branch</li>
                <li>• Configure sharing types and pricing</li>
              </ul>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 py-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Add Your Team</h2>
              <p className="text-gray-600">Create maintainer accounts for your PG management team</p>
            </div>
              
            {maintainers.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="h-7 w-7 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1.5">No Maintainers Yet</h3>
                <p className="text-sm text-gray-600 mb-5 max-w-sm mx-auto">You need at least one maintainer to manage your PG operations.</p>
                <button
                  onClick={() => setShowMaintainerModal(true)}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm shadow-sm hover:shadow-md flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Your First Maintainer</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Your Maintainers</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{maintainers.length} {maintainers.length === 1 ? 'maintainer' : 'maintainers'} added</p>
                  </div>
                  <button
                    onClick={() => setShowMaintainerModal(true)}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium flex items-center space-x-1.5 shadow-sm hover:shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Another</span>
                  </button>
                </div>
            
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {maintainers.map((maintainer, index) => {
                    const firstName = maintainer.user?.firstName || maintainer.firstName || 'Unknown';
                    const lastName = maintainer.user?.lastName || maintainer.lastName || '';
                    const email = maintainer.user?.email || maintainer.email || '';
                    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
                    
                    return (
                      <motion.div
                        key={maintainer._id || maintainer.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-white font-semibold text-sm">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 truncate">
                            {firstName} {lastName}
                          </div>
                          <div className="text-xs text-gray-500 truncate mt-0.5">{email}</div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-green-500 rounded-full" title="Active"></div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      
      case 3:
        return (
          <div className="py-4">
            {maintainers.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">Maintainers Required</h3>
                <p className="text-sm text-gray-600 mb-5">Add at least one maintainer first</p>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
                >
                  Go Back to Add Maintainers
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Ready to Create Branch</h3>
                <button
                  onClick={() => setShowBranchModal(true)}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium text-sm shadow-sm hover:shadow-md flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Default Branch</span>
                </button>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6 py-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto">
              <Settings className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Configure Your PG</h2>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                Set up sharing types and pricing for your PG. This will be used for room allocation and billing.
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 max-w-lg mx-auto">
              <h3 className="font-semibold text-purple-900 mb-2">Configuration includes:</h3>
              <ul className="text-sm text-purple-800 space-y-1 text-left">
                <li>• Different sharing types (1-sharing, 2-sharing, etc.)</li>
                <li>• Pricing for each sharing type</li>
                <li>• Room allocation settings</li>
              </ul>
            </div>
            {showConfigModal ? (
              <div className="flex items-center justify-center space-x-2 text-purple-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span className="font-medium">Opening Configuration...</span>
              </div>
            ) : (
              <button
                onClick={() => setShowConfigModal(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Start Configuration
              </button>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return maintainers.length > 0;
      case 3:
        return maintainers.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <>
      {/* Modal Backdrop with proper spacing */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
        {/* Modal Container - Optimized and properly sized */}
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header with close button - Fixed */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">PG Setup Wizard</h2>
                <p className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</p>
              </div>
            </div>
            <button
              onClick={handleWizardClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Progress Indicator - Fixed */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    step.number <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-1 mx-2 transition-all duration-200 ${
                      step.number < currentStep
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">{steps[currentStep - 1]?.title}</h3>
              <p className="text-sm text-gray-600">{steps[currentStep - 1]?.description}</p>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
            <div className="max-h-full">
              {renderStepContent()}
            </div>
          </div>

          {/* Footer with navigation - Sticky at bottom */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              onClick={handleWizardClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
            >
              Cancel Setup
            </button>

            <div className="flex items-center space-x-3">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                >
                  Previous
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
                    canProceedToNext()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 font-medium"
                >
                  Complete Setup
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
        
      {/* Modals */}
      {/* We'll add the maintainer modal here */}
      {showMaintainerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add New Maintainer</h2>
              <p className="text-sm text-gray-600 mt-1">Create a maintainer account</p>
            </div>
            <div className="p-6">
              {/* Simple maintainer form */}
              <MaintainerQuickForm
                onSubmit={(data) => {
                  // Handle maintainer creation
                  handleMaintainerAdded(data);
                }}
                onCancel={() => setShowMaintainerModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      <DefaultBranchModal
        isOpen={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        onBranchCreated={handleBranchCreated}
        pgId={user?.pgId}
      />

      <PGConfigurationModal
        isOpen={showConfigModal}
        onClose={handleWizardClose}
        onConfigured={handleConfigurationComplete}
      />
    </>
  );
};

// Simple maintainer form component with proper validations
const MaintainerQuickForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  // Validation functions
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'firstName':
        if (!value.trim()) {
          error = 'First name is required';
        } else if (value.trim().length < 2) {
          error = 'First name must be at least 2 characters';
        } else if (value.trim().length > 50) {
          error = 'First name cannot exceed 50 characters';
        }
        break;
      case 'lastName':
        if (!value.trim()) {
          error = 'Last name is required';
        } else if (value.trim().length < 2) {
          error = 'Last name must be at least 2 characters';
        } else if (value.trim().length > 50) {
          error = 'Last name cannot exceed 50 characters';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (!value.trim()) {
          error = 'Phone number is required';
        } else if (!/^[0-9]{10}$/.test(value.trim())) {
          error = 'Phone number must be exactly 10 digits';
        }
        break;
      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Remove non-numeric characters for phone field
    let processedValue = value;
    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, processedValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });
    setErrors(newErrors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true
    });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      const response = await maintainerService.createMaintainer({
        ...formData,
        pgId: null // Will be set by the service
      });

      if (response.success) {
        toast.success('Maintainer added successfully!');

        // Handle different response structures
        let maintainerData = response.data;
        if (response.data && response.data.maintainer) {
          maintainerData = response.data.maintainer;
        }

        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: ''
        });
        setErrors({});
        setTouched({});
        onSubmit(maintainerData);
      } else {
        toast.error(response.message || 'Failed to add maintainer');
      }
    } catch (error) {
      console.error('Error adding maintainer:', error);
      
      // Handle API error responses
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        const errorMessages = Object.values(error.response.data.errors).filter(Boolean);
        if (errorMessages.length > 0) {
          toast.error(errorMessages[0]);
        }
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to add maintainer';
        toast.error(errorMessage);
        
        // Set field-specific errors if provided
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-4 py-2.5 border rounded-lg transition-all ${
              errors.firstName
                ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                : touched.firstName && !errors.firstName
                ? 'border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500'
                : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="Enter first name"
          />
          {/* Fixed height error container to prevent layout shift */}
          <div className="h-6 mt-1">
            {errors.firstName && (
              <p className="text-sm text-red-600 flex items-center animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                <span>{errors.firstName}</span>
              </p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-4 py-2.5 border rounded-lg transition-all ${
              errors.lastName
                ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                : touched.lastName && !errors.lastName
                ? 'border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500'
                : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="Enter last name"
          />
          {/* Fixed height error container to prevent layout shift */}
          <div className="h-6 mt-1">
            {errors.lastName && (
              <p className="text-sm text-red-600 flex items-center animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                <span>{errors.lastName}</span>
              </p>
            )}
          </div>
        </div>
      </div>
        
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full px-4 py-2.5 border rounded-lg transition-all ${
            errors.email
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : touched.email && !errors.email
              ? 'border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500'
              : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }`}
          placeholder="example@email.com"
        />
        {/* Fixed height error container to prevent layout shift */}
        <div className="h-6 mt-1">
          {errors.email && (
            <p className="text-sm text-red-600 flex items-center animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={10}
          className={`w-full px-4 py-2.5 border rounded-lg transition-all ${
            errors.phone
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : touched.phone && !errors.phone
              ? 'border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500'
              : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }`}
          placeholder="10-digit phone number"
        />
        {/* Fixed height container for error/hint to prevent layout shift */}
        <div className="h-6 mt-1">
          {errors.phone ? (
            <p className="text-sm text-red-600 flex items-center animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
              <span>{errors.phone}</span>
            </p>
          ) : touched.phone && !errors.phone ? (
            <p className="text-xs text-gray-500">Enter 10 digits only</p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Adding...</span>
            </>
          ) : (
            <span>Add Maintainer</span>
          )}
        </button>
      </div>
    </form>
  );
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const selectedBranch = useSelector(selectSelectedBranch);
  const reduxBranches = useSelector(selectBranches);
  const pgConfigured = useSelector(selectPgConfigured);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [forceShowWizard, setForceShowWizard] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [hasNoBranches, setHasNoBranches] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);

  // Fetch branches and determine setup state
  const checkBranchesAndSetupState = async () => {
    try {
      console.log('Dashboard: Fetching branches for initial check...');
      console.log('Dashboard: User data:', { userId: user?._id, pgId: user?.pgId, role: user?.role });
      const response = await api.get('/branches');
      console.log('Dashboard: Initial branches API response:', response);
      const fetchedBranches = response.data?.data?.branches || response.data?.branches || [];
      console.log('Dashboard: Initial branches fetched:', fetchedBranches.length, fetchedBranches);
      // Update Redux state
      dispatch(setBranches(fetchedBranches));
      setHasNoBranches(fetchedBranches.length === 0);

      // Check PG configuration status if we have branches
      if (reduxBranches.length > 0 && user?.pgId) {
        try {
          const pgService = (await import('../../services/pg.service')).default;
          const pgResponse = await pgService.getPGDetails(user.pgId);
          if (pgResponse.success && pgResponse.data) {
            const freshPgConfigured = pgResponse.data.isConfigured || false;
            // Update auth state with fresh PG data
            dispatch(updateAuthState({
              pgConfigured: freshPgConfigured
            }));
          }
        } catch (pgError) {
          console.error('Error checking PG configuration:', pgError);
        }
      }

      // TEMP: For testing - always show dashboard if user has pgConfigured OR has branches
      console.log('Dashboard: Initial check - branches:', reduxBranches.length, 'pgConfigured:', pgConfigured, 'willLoadDashboard:', pgConfigured || reduxBranches.length > 0);

      if (pgConfigured || reduxBranches.length > 0) {
        console.log('Loading dashboard because pgConfigured=true OR branches exist');
        loadDashboardData();
      } else {
        setLoading(false);
      }

      // Reset first load after initial check
      setIsFirstLoad(false);
    } catch (error) {
      console.error('Error checking branches:', error);
      setLoading(false);
      setHasNoBranches(true);
      setIsFirstLoad(false);
    }
  };

  // Initialize state with default values to prevent undefined errors
  const [dashboardData, setDashboardData] = useState({
    residents: {
      total: 0,
      active: 0,
      pending: 0,
      movedOut: 0,
      thisMonth: 0,
      byStatus: { active: 0, pending: 0, inactive: 0 },
      byGender: { male: 0, female: 0 }
    },
    financial: {
      totalRevenue: 0,
      monthlyRevenue: 0,
      pendingPayments: 0,
      overduePayments: 0,
      revenueGrowth: 0,
      averageRent: 0
    },
    occupancy: {
      totalRooms: 0,
      occupiedRooms: 0,
      availableRooms: 0,
      occupancyRate: 0,
      occupancyTrend: 0
    },
    tickets: {
      open: 0,
      urgent: 0,
      resolved: 0,
      total: 0,
      resolutionRate: 0
    },
    pg: {
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      totalBranches: 0
    }
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [pendingTasks, setPendingTasks] = useState({
    payments: { pending: 0, overdue: 0, total: 0, totalAmount: 0 },
    tickets: { open: 0, urgent: 0, total: 0 },
    residents: { pending: 0, onboarding: 0, offboarding: 0 },
    details: {
      pendingPayments: [],
      overduePayments: [],
      openTickets: [],
      pendingResidents: []
    }
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Get user from Redux or localStorage as fallback
    const currentUser = user || (() => {
      try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
      } catch (e) {
        return null;
      }
    })();

    if (!currentUser) {
      navigate('/admin/login');
      return;
    }

    const userRole = currentUser?.role;
    if (!userRole || !['admin', 'maintainer'].includes(userRole)) {
      console.error('Access denied - User role:', userRole, 'User:', currentUser);
      toast.error('Access denied. Admin or Maintainer privileges required.');
      navigate('/login');
      return;
    }

    // Initialize branch state to ensure it's always an array
    dispatch(initializeBranches());

    checkBranchesAndSetupState();
  }, [user, navigate, dispatch]);

  // Update setupCompleted when pgConfigured changes
  useEffect(() => {
    if (pgConfigured && !setupCompleted) {
      console.log('pgConfigured became true, marking setup as completed');
      setSetupCompleted(true);
    }
  }, [pgConfigured, setupCompleted]);

  // Re-check setup state when pgConfigured changes
  useEffect(() => {
    console.log('pgConfigured changed to:', pgConfigured, 'isFirstLoad:', isFirstLoad, 'loading:', loading);
    if (!isFirstLoad && !loading && pgConfigured && hasNoBranches) {
      console.log('pgConfigured became true and hasNoBranches is true - should show dashboard now');
      // If PG is configured but we still think there are no branches, re-check
      checkBranchesAndSetupState();
    }
  }, [pgConfigured, isFirstLoad, loading, hasNoBranches]);

  const handleSetupComplete = async () => {
    console.log('Setup complete called, refreshing data...');
    setShowSetupWizard(false);
    setForceShowWizard(false);
    setSetupCompleted(true); // Mark setup as completed
    try {
      // Fetch updated branches
      console.log('SetupWizard: Fetching branches after setup completion...');
      const response = await api.get('/branches');
      console.log('SetupWizard: Branches API response:', response);
      const fetchedBranches = response.data.branches || [];
      console.log('Fetched branches after setup:', fetchedBranches.length, fetchedBranches);
      setBranches(fetchedBranches);
      setHasNoBranches(fetchedBranches.length === 0);

      // Refresh PG configuration status
      let isPgConfigured = false;
      if (user?.pgId) {
        const pgService = (await import('../../services/pg.service')).default;
        const pgResponse = await pgService.getPGDetails(user.pgId);
        console.log('PG response after setup:', pgResponse);

        if (pgResponse.success && pgResponse.data) {
          isPgConfigured = pgResponse.data.isConfigured || false;
          console.log('PG configured status:', isPgConfigured);
          dispatch(updateAuthState({
            pgConfigured: isPgConfigured
          }));
        }
      }

      console.log('Setup complete - branches:', fetchedBranches.length, 'PG configured:', isPgConfigured);

      // TEMP: If we have branches after setup, show dashboard
      if (fetchedBranches.length > 0) {
        console.log('Loading dashboard data after setup completion...');
        loadDashboardData();
      } else {
        console.log('Setup completed but no branches found, staying on setup prompt');
      }
    } catch (error) {
      console.error('Error fetching data after setup:', error);
      toast.error('Failed to load data after setup');
    }
  };

  const handleOpenSetupWizard = () => {
    setForceShowWizard(true);
    setShowSetupWizard(true);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // If no branches exist but PG is configured, show basic dashboard
      if (reduxBranches.length === 0 && pgConfigured) {
        console.log('No branches but PG configured - showing basic dashboard');
        setLoading(false);
        return;
      }

      // If no branch is selected yet, wait (global selector will set it)
      if (!selectedBranch) {
        setLoading(false);
        return;
      }

      // Extract branch ID from selectedBranch object
      const branchId = selectedBranch._id || selectedBranch;

      if (!branchId) {
        setLoading(false);
        toast.error('Invalid branch selected. Please select a valid branch.');
        return;
      }

      // Fetch all dashboard data in parallel
      const [overviewResponse, activitiesResponse, tasksResponse] = await Promise.all([
        api.get(`/dashboard/overview?branchId=${branchId}`),
        api.get(`/dashboard/activities?branchId=${branchId}`),
        api.get(`/dashboard/pending-tasks?branchId=${branchId}`)
      ]);

      if (overviewResponse.data.success) {
        setDashboardData(overviewResponse.data.data);
      }

      if (activitiesResponse.data.success) {
        setRecentActivities(activitiesResponse.data.data);
        const tickets = activitiesResponse.data.data.filter(activity => activity.type === 'ticket');
        setRecentTickets(tickets.slice(0, 6));
      }

      if (tasksResponse.data.success) {
        setPendingTasks(tasksResponse.data.data);
      }

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      if (error.response?.status === 404) {
        toast.error('Dashboard API endpoints not found. Please check server configuration.');
      } else if (error.response?.status === 400) {
        toast.error('Invalid branch ID. Please select a valid branch.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
        navigate('/admin/login');
      } else {
        toast.error('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Dashboard refreshed');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'active':
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get user from Redux or localStorage as fallback
  const currentUser = user || (() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  })();

  if (!currentUser || !currentUser?.role || !['admin', 'maintainer'].includes(currentUser.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Debug: Show current state when not loading
  if (!loading && !isFirstLoad) {
    console.log('Dashboard state - branches:', reduxBranches.length, 'pgConfigured:', pgConfigured, 'setupCompleted:', setupCompleted, 'willShowSetup:', !setupCompleted && !pgConfigured && hasNoBranches);
  }

  // Never show setup if setup is completed or PG is configured
  if (!setupCompleted && !pgConfigured && hasNoBranches && !loading && !isFirstLoad && !showSetupWizard && !forceShowWizard) {
    return (
      <WelcomeSection
        userName={currentUser?.firstName || currentUser?.email?.split('@')[0] || 'PG Owner'}
        onGetStarted={handleOpenSetupWizard}
      />
    );
  }

  // Show setup wizard ONLY when explicitly triggered by user action
  // Never show on initial page load
  if (showSetupWizard === true || forceShowWizard === true) {
  return (
    <div className="min-h-screen bg-gray-50">
        <SetupWizard onComplete={handleSetupComplete} />
      </div>
    );
  }
      
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-2 lg:px-2">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">PG Admin</h1>
                  <p className="text-xs text-gray-500">Management System</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-full mx-auto px-4 sm:px-6 lg:px-2 py-8">
        {/* Ambient gradient orbs */}
        <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-300/20 to-cyan-400/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br from-cyan-200/20 to-blue-300/20 blur-2xl" />
        
        {(!selectedBranch || loading) ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <>
            {/* Dashboard Title Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Monitor, manage, and optimize your PG operations with ease.</p>
            </div>

            {/* Main Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Revenue - Featured Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-emerald-100">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {Math.abs(dashboardData.financial.revenueGrowth || 0)}%
                      </div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {formatCurrency(dashboardData.financial.totalRevenue)}
                  </h3>
                  <p className="text-emerald-100 font-medium">Total Revenue</p>
                  <p className="text-emerald-200 text-sm mt-1">Increased from last month</p>
                </div>
              </motion.div>

                {/* Monthly Revenue */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-emerald-600 text-sm">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        +12%
                      </div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">
                    {formatCurrency(dashboardData.financial.monthlyRevenue)}
                  </h3>
                  <p className="text-gray-600 font-medium">This Month</p>
                  <p className="text-gray-500 text-sm mt-1">Increased from last month</p>
                </motion.div>

                {/* Pending Payments */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-emerald-600 text-sm">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        +5%
                      </div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">
                    {dashboardData.financial.pendingPayments}
                  </h3>
                  <p className="text-gray-600 font-medium">Pending</p>
                  <p className="text-gray-500 text-sm mt-1">Awaiting payment</p>
                </motion.div>

                {/* Overdue Payments */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-rose-600 text-sm">
                        <TrendingDown className="h-4 w-4 mr-1" />
                        -2%
                      </div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">
                    {dashboardData.financial.overduePayments}
                  </h3>
                  <p className="text-gray-600 font-medium">Overdue</p>
                  <p className="text-gray-500 text-sm mt-1">Requires attention</p>
                </motion.div>
              </div>
          

            {/* Analytics and Progress Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Revenue Analytics Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Revenue Analytics</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">This Month</span>
                  </div>
                </div>
                
                {/* Simple Bar Chart */}
                <div className="space-y-4">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-8 text-sm text-gray-600 font-medium">{day}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.random() * 80 + 20}%` }}
                        ></div>
                      </div>
                      <div className="w-12 text-sm text-gray-600 text-right">
                        {Math.floor(Math.random() * 50 + 20)}%
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Reminders Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Reminders</h3>
                  <Bell className="h-5 w-5 text-gray-400" />
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Payment Collection</h4>
                      <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Today</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Collect rent from residents - 02:00 PM - 04:00 PM</p>
                    <button className="w-full bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium">
                      Start Collection
                    </button>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Maintenance Check</h4>
                      <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">Tomorrow</span>
                    </div>
                    <p className="text-sm text-gray-600">Room 101 - AC repair scheduled</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Residents Overview Cards */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-cyan-600" />
                Residents Overview
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Residents */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-green-600 text-sm">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        +{dashboardData.residents.thisMonth}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4">
                    {dashboardData.residents.total}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">Total Residents</p>
                </motion.div>

                {/* Active Residents */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                      <UserPlus className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4">
                    {dashboardData.residents.active}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                </motion.div>

                {/* Pending Residents */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4">
                    {dashboardData.residents.pending}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                </motion.div>

                {/* Moved Out */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-slate-500 to-slate-700 rounded-xl">
                      <UserMinus className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4">
                    {dashboardData.residents.movedOut}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">Moved Out</p>
                </motion.div>
              </div>
            </div>

            {/* Tickets Overview Cards - Horizontal Row */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-orange-600" />
                Tickets Overview
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Tickets */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4">
                    {dashboardData.tickets.total}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                </motion.div>

                {/* Open Tickets */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4">
                    {dashboardData.tickets.open}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">Open</p>
                </motion.div>

                {/* Urgent Tickets */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                      <Bell className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4">
                    {dashboardData.tickets.urgent}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">Urgent</p>
                </motion.div>

                {/* Resolved Tickets */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mt-4">
                    {dashboardData.tickets.resolved}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                </motion.div>
              </div>
            </div>

            {/* Team Collaboration and Project Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Team Collaboration */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Team Collaboration</h3>
                  <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                    + Add Member
                  </button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { name: "Alexandra Deff", task: "Payment Processing", status: "Completed", color: "emerald" },
                    { name: "Edwin Adenike", task: "Resident Onboarding", status: "In Progress", color: "blue" },
                    { name: "Isaac Oluwatemilorun", task: "Maintenance Check", status: "Pending", color: "amber" },
                    { name: "David Oshodi", task: "Room Allocation", status: "In Progress", color: "blue" }
                  ].map((member, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.task}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.color === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                        member.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {member.status}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Project Progress */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">PG Progress</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">41%</div>
                    <div className="text-sm text-gray-600">Operations Complete</div>
                  </div>
                </div>
                
                {/* Progress Circle */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${2 * Math.PI * 50 * (1 - 0.41)}`}
                      className="text-emerald-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">41%</div>
                      <div className="text-xs text-gray-600">Complete</div>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Completed (41%)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">In Progress (35%)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Pending (24%)</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Tickets - Modern Card List */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-orange-600" />
                  Recent Tickets
                </h2>
                <Link
                  to="/admin/tickets"
                  className="flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  View All
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentTickets.length > 0 ? (
                  recentTickets.map((ticket, index) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <MessageSquare className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                        {ticket.title}
                      </h3>
                      
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDate(ticket.timestamp)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent tickets found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activities - Compact List */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Recent Activities
                </h2>
                <Link
                  to="/admin/reports"
                  className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {recentActivities.length > 0 ? (
                    recentActivities.slice(0, 5).map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className={`p-2 rounded-lg mr-4 ${
                          activity.type === 'payment' ? 'bg-green-100' :
                          activity.type === 'resident' ? 'bg-blue-100' :
                          'bg-orange-100'
                        }`}>
                          {activity.type === 'payment' && <CreditCard className="h-4 w-4 text-green-600" />}
                          {activity.type === 'resident' && <Users className="h-4 w-4 text-blue-600" />}
                          {activity.type === 'ticket' && <MessageSquare className="h-4 w-4 text-orange-600" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {activity.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-500">
                            {formatDate(activity.timestamp)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No recent activities found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Removed Time Tracker and Activity Monitor per requirements */}

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Occupancy Rate */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
                    <Home className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-green-600 text-sm">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {dashboardData.occupancy.occupancyTrend > 0 ? '+' : ''}{dashboardData.occupancy.occupancyTrend}
                    </div>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {dashboardData.occupancy.occupancyRate}%
                </h3>
                <p className="text-sm font-medium text-gray-600 mb-2">Occupancy Rate</p>
                <p className="text-xs text-gray-500">
                  {dashboardData.occupancy.occupiedRooms}/{dashboardData.occupancy.totalRooms} rooms
                </p>
              </motion.div>

              {/* Average Rent */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {formatCurrency(dashboardData.financial.averageRent)}
                </h3>
                <p className="text-sm font-medium text-gray-600 mb-2">Average Rent</p>
                <p className="text-xs text-gray-500">
                  Per resident per month
                </p>
              </motion.div>

              {/* Ticket Resolution Rate */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {dashboardData.tickets.resolutionRate}%
                </h3>
                <p className="text-sm font-medium text-gray-600 mb-2">Resolution Rate</p>
                <p className="text-xs text-gray-500">
                  Tickets resolved successfully
                </p>
              </motion.div>

              {/* Room Availability */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer"
                onClick={() => navigate('/admin/room-availability')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                    <Home className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-purple-600 text-sm">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      View
                    </div>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {dashboardData.occupancy.availableRooms}
                </h3>
                <p className="text-sm font-medium text-gray-600 mb-2">Available Rooms</p>
                <p className="text-xs text-gray-500">
                  Click to view detailed availability
                </p>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 