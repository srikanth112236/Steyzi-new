import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Save,
  Package,
  DollarSign,
  Bed,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Info,
  Building2,
  Settings,
  Users,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import subscriptionService from '../../../services/subscription.service';
import SubscriptionCalculator from './SubscriptionCalculator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import authService from '../../../services/auth.service';

const SubscriptionForm = ({ isOpen, onClose, subscription, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  // Custom Plan State
  const [isCustomPlan, setIsCustomPlan] = useState(false);
  const [selectedPG, setSelectedPG] = useState(null);
  const [availablePGs, setAvailablePGs] = useState([]);
  const [pgSearchTerm, setPgSearchTerm] = useState('');
  const [loadingPGs, setLoadingPGs] = useState(false);
  
  // Update state and form data to include custom plan details
  const [formData, setFormData] = useState({
    planName: '',
    planDescription: '',
    billingCycle: 'monthly',
    basePrice: 0,
    annualDiscount: 0,
    baseBedCount: 10,
    topUpPricePerBed: 0,
    maxBedsAllowed: null,
    // Multiple Branch Support
    allowMultipleBranches: false,
    branchCount: 1,
    bedsPerBranch: null,
    costPerBranch: 0,
    features: [],
    modules: [],
    status: 'active',
    isPopular: false,
    isRecommended: false,
    trialPeriodDays: 0,
    setupFee: 0,
    // Custom Plan Support
    isCustomPlan: false,
    assignedPG: null
  });

  const [newFeature, setNewFeature] = useState({ name: '', description: '', enabled: true });
  const availableModules = subscriptionService.getAvailableModules();

  // Update useEffect to handle editing custom plans
  useEffect(() => {
    if (subscription) {
      setFormData({
        ...subscription,
        isCustomPlan: subscription.isCustomPlan || false,
        assignedPG: subscription.assignedPG || null,
      });

      // If it's a custom plan, load PG details
      if (subscription.isCustomPlan && subscription.assignedPG) {
        loadPGs(subscription.assignedPG.name);
      }
    }
  }, [subscription]);

  // Update useEffect to handle custom plan loading with role context
  useEffect(() => {
    // Load PGs for custom plan selection
    const loadPGsForCustomPlan = async () => {
      try {
        setLoadingPGs(true);
        
        // Get current user's role and PG details
        const currentUser = await authService.getCurrentUser();
        
        const response = await subscriptionService.getPGsForCustomPlans('', {
          role: currentUser.user?.role || currentUser.role,
          userPGId: currentUser.user?.pgId || currentUser.pgId
        });
        
        if (response.success) {
          setAvailablePGs(response.data);
        } else {
          toast.error(response.message || 'Failed to load PGs');
        }
      } catch (error) {
        console.error('Error loading PGs:', error);
        toast.error('Failed to load PGs for custom plan');
      } finally {
        setLoadingPGs(false);
      }
    };

    // If custom plan is enabled or editing an existing custom plan, load PGs
    if (formData.isCustomPlan) {
      loadPGsForCustomPlan();
    }
  }, [formData.isCustomPlan]);

  // Update selectedPG adminName when availablePGs are loaded
  React.useEffect(() => {
    if (selectedPG && availablePGs.length > 0) {
      const pgData = availablePGs.find(pg => pg._id === selectedPG._id);
      if (pgData && selectedPG.adminName === 'N/A') {
        setSelectedPG(prev => ({
          ...prev,
          adminName: pgData.adminName || 'N/A'
        }));
      }
    }
  }, [availablePGs, selectedPG]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Custom Plan Handlers
  const handleCustomPlanToggle = async (enabled) => {
    setIsCustomPlan(enabled);
    setFormData(prev => ({
      ...prev,
      isCustomPlan: enabled,
      assignedPG: enabled ? prev.assignedPG : null
    }));

    if (enabled && availablePGs.length === 0) {
      await loadPGs();
    }

    if (!enabled) {
      setSelectedPG(null);
    }
  };

  const loadPGs = async (search = '') => {
    try {
      setLoadingPGs(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/subscriptions/pgs-for-custom-plans?search=${encodeURIComponent(search)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setAvailablePGs(result.data);
      } else {
        toast.error('Failed to load PGs');
      }
    } catch (error) {
      console.error('Error loading PGs:', error);
      toast.error('Failed to load PGs');
    } finally {
      setLoadingPGs(false);
    }
  };

  const handlePGSelection = (pgId) => {
    const selectedPGData = availablePGs.find(pg => pg._id === pgId);
    setSelectedPG(selectedPGData);
    setFormData(prev => ({
      ...prev,
      assignedPG: pgId
    }));
  };

  const handlePGSearch = (searchTerm) => {
    setPgSearchTerm(searchTerm);
    if (searchTerm.length >= 2 || searchTerm.length === 0) {
      loadPGs(searchTerm);
    }
  };

  const handleAddFeature = () => {
    if (!newFeature.name.trim()) {
      toast.error('Feature name is required');
      return;
    }

    setFormData(prev => ({
      ...prev,
      features: [...prev.features, { ...newFeature }]
    }));

    setNewFeature({ name: '', description: '', enabled: true });
  };

  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleToggleFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) =>
        i === index ? { ...f, enabled: !f.enabled } : f
      )
    }));
  };

 

  // Get submodules for a module
  const getModuleSubmodules = (moduleName) => {
    const submoduleMap = {
      resident_management: [
        { key: 'residents', label: 'Residents' },
        { key: 'onboarding', label: 'Onboarding' },
        { key: 'offboarding', label: 'Offboarding' },
        { key: 'room_switching', label: 'Room Switching' },
        { key: 'moved_out', label: 'Moved Out' }
      ],
      payment_tracking: [
        { key: 'payments', label: 'Payments' },
        { key: 'payment_history', label: 'Payment History' },
        { key: 'payment_reports', label: 'Payment Reports' }
      ],
      room_allocation: [
        { key: 'rooms', label: 'Rooms' },
        { key: 'room_availability', label: 'Room Availability' },
        { key: 'room_assignments', label: 'Room Assignments' }
      ],
      qr_code_payments: [
        { key: 'qr_generation', label: 'QR Generation' },
        { key: 'qr_scanning', label: 'QR Scanning' },
        { key: 'payment_processing', label: 'Payment Processing' }
      ],
      ticket_system: [
        { key: 'tickets', label: 'Tickets' },
        { key: 'ticket_categories', label: 'Ticket Categories' },
        { key: 'ticket_priorities', label: 'Ticket Priorities' }
      ],
      analytics_reports: [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'reports', label: 'Reports' },
        { key: 'charts', label: 'Charts' },
        { key: 'exports', label: 'Exports' }
      ],
      bulk_upload: [
        { key: 'file_upload', label: 'File Upload' },
        { key: 'data_validation', label: 'Data Validation' },
        { key: 'bulk_import', label: 'Bulk Import' }
      ],
      email_notifications: [
        { key: 'email_templates', label: 'Email Templates' },
        { key: 'email_sending', label: 'Email Sending' },
        { key: 'email_history', label: 'Email History' }
      ],
      sms_notifications: [
        { key: 'sms_templates', label: 'SMS Templates' },
        { key: 'sms_sending', label: 'SMS Sending' },
        { key: 'sms_history', label: 'SMS History' }
      ],
      multi_branch: [
        { key: 'branch_management', label: 'Branch Management' },
        { key: 'branch_switching', label: 'Branch Switching' },
        { key: 'branch_reports', label: 'Branch Reports' }
      ],
      custom_reports: [
        { key: 'report_builder', label: 'Report Builder' },
        { key: 'custom_queries', label: 'Custom Queries' },
        { key: 'report_scheduling', label: 'Report Scheduling' }
      ],
      api_access: [
        { key: 'api_keys', label: 'API Keys' },
        { key: 'api_endpoints', label: 'API Endpoints' },
        { key: 'api_logs', label: 'API Logs' }
      ],
      mobile_app: [
        { key: 'mobile_sync', label: 'Mobile Sync' },
        { key: 'push_notifications', label: 'Push Notifications' },
        { key: 'offline_mode', label: 'Offline Mode' }
      ],
      advanced_analytics: [
        { key: 'advanced_charts', label: 'Advanced Charts' },
        { key: 'predictive_analytics', label: 'Predictive Analytics' },
        { key: 'data_insights', label: 'Data Insights' }
      ]
    };

    return submoduleMap[moduleName] || [];
  };

  const isModuleSelected = (moduleName) => {
    return formData.modules.some(m => m.moduleName === moduleName);
  };

  const handleToggleModule = (moduleName, enabled) => {
    setFormData(prev => {
      const existingModuleIndex = prev.modules.findIndex(m => m.moduleName === moduleName);

      if (existingModuleIndex >= 0) {
        // Update existing module
        const updatedModules = [...prev.modules];
        updatedModules[existingModuleIndex] = {
          ...updatedModules[existingModuleIndex],
          enabled
        };
        return {
          ...prev,
          modules: updatedModules
        };
      } else {
        // Add new module with default permissions
        const defaultPermissions = {};
        getModuleSubmodules(moduleName).forEach(submodule => {
          defaultPermissions[submodule.key] = {
            create: true,
            read: true,
            update: true,
            delete: true
          };
        });

        return {
          ...prev,
          modules: [...prev.modules, {
            moduleName,
            enabled: true,
            limit: null,
            permissions: defaultPermissions
          }]
        };
      }
    });
  };

  const handleModuleLimitChange = (moduleName, limit) => {
    setFormData(prev => {
      const updatedModules = prev.modules.map(module =>
        module.moduleName === moduleName
          ? { ...module, limit }
          : module
      );
      return {
        ...prev,
        modules: updatedModules
      };
    });
  };

  const handlePermissionChange = (moduleName, submoduleKey, permission, enabled) => {
    setFormData(prev => {
      const updatedModules = prev.modules.map(module => {
        if (module.moduleName === moduleName) {
          const currentPermissions = module.permissions || {};
          const submodulePermissions = currentPermissions[submoduleKey] || {
            create: true,
            read: true,
            update: true,
            delete: true
          };

          const updatedPermissions = {
            ...currentPermissions,
            [submoduleKey]: {
              ...submodulePermissions,
              [permission]: enabled
            }
          };

          return {
            ...module,
            permissions: updatedPermissions
          };
        }
        return module;
      });

      return {
        ...prev,
        modules: updatedModules
      };
    });
  };

  const handleToggleSubmodulePermissions = (moduleName, submoduleKey) => {
    setFormData(prev => {
      const updatedModules = prev.modules.map(module => {
        if (module.moduleName === moduleName) {
          const currentPermissions = module.permissions || {};
          const submodulePermissions = currentPermissions[submoduleKey] || {
            create: true,
            read: true,
            update: true,
            delete: true
          };

          const allEnabled = Object.values(submodulePermissions).every(p => p);
          const newPermissionState = !allEnabled; // Toggle all permissions

          const updatedPermissions = {
            ...currentPermissions,
            [submoduleKey]: {
              create: newPermissionState,
              read: newPermissionState,
              update: newPermissionState,
              delete: newPermissionState
            }
          };

          return {
            ...module,
            permissions: updatedPermissions
          };
        }
        return module;
      });

      return {
        ...prev,
        modules: updatedModules
      };
    });
  };

  // Update handleSubmit to validate and set PG email for custom plan
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate custom plan requirements
    if (formData.isCustomPlan) {
      if (!formData.assignedPG) {
        toast.error('Please select a PG for the custom plan');
        return;
      }

      // Find the selected PG's details
      const selectedPGDetails = availablePGs.find(pg => pg._id === formData.assignedPG);
      
      if (!selectedPGDetails || !selectedPGDetails.email) {
        toast.error('Invalid PG selection. Please choose a PG with a valid email.');
        return;
      }
    }

    try {
      setLoading(true);

      // Convert formData to ensure permissions are properly serialized
      const submissionData = {
        ...formData,
        modules: formData.modules.map(module => ({
          ...module,
          permissions: module.permissions instanceof Map
            ? Object.fromEntries(module.permissions)
            : module.permissions || {}
        }))
      };
      
      let result;
      if (subscription) {
        result = await subscriptionService.updateSubscription(subscription._id, submissionData);
      } else {
        result = await subscriptionService.createSubscription(submissionData);
      }

      if (result.success) {
        toast.success(result.message);
        onSuccess();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
      toast.error('Failed to save subscription plan');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {subscription ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
              </h2>
              <p className="text-sm text-gray-600">
                Configure pricing and features for your subscription plan
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.planName}
                  onChange={(e) => handleInputChange('planName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Starter Plan, Professional, Enterprise"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.planDescription}
                  onChange={(e) => handleInputChange('planDescription', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your subscription plan..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Cycle <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.billingCycle}
                  onChange={(e) => handleInputChange('billingCycle', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Custom Plan Section */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-purple-600" />
              Custom Plan Settings
            </h3>

            {/* Custom Plan Toggle */}
            <div className="mb-4">
              <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={isCustomPlan}
                  onChange={(e) => handleCustomPlanToggle(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Create Custom Plan for Specific PG</span>
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-3">
                Enable this option to create a custom plan that will only be visible to a specific PG
              </p>
            </div>

            {/* PG Selection */}
            {isCustomPlan && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select PG for Custom Plan
                  </label>
                  <Select
                    value={formData.assignedPG}
                    onValueChange={(selectedPG) => {
                      setFormData(prev => ({
                        ...prev,
                        assignedPG: selectedPG
                      }));
                    }}
                    disabled={loadingPGs}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Search and select a PG..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingPGs ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          Loading PGs...
                        </div>
                      ) : availablePGs.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No PGs found
                        </div>
                      ) : (
                        availablePGs.map((pg) => (
                          <SelectItem key={pg._id} value={pg._id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{pg.name}</span>
                              <span className="text-xs text-gray-500">
                                {pg.email} • {pg.phone || 'No phone'}
                              </span>
                              <span className="text-xs text-gray-400">
                                Admin: {pg.adminName}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.assignedPG && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      This custom plan will only be visible to the selected PG: <strong>{availablePGs.find(pg => pg._id === formData.assignedPG)?.name}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing Section */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Pricing Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter base price"
                  required
                />
              </div>

              {formData.billingCycle === 'annual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.annualDiscount}
                    onChange={(e) => handleInputChange('annualDiscount', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Setup Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.setupFee}
                  onChange={(e) => handleInputChange('setupFee', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trial Period (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.trialPeriodDays}
                  onChange={(e) => handleInputChange('trialPeriodDays', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Bed Management Section */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Bed className="h-5 w-5 mr-2 text-purple-600" />
                Bed Management & Top-up Pricing
              </h3>
              <button
                type="button"
                onClick={() => setShowCalculator(!showCalculator)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showCalculator ? 'Hide' : 'Show'} Calculator
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Bed Count <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.baseBedCount}
                  onChange={(e) => handleInputChange('baseBedCount', parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Beds included in base price</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Top-up Price per Bed (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.topUpPricePerBed}
                  onChange={(e) => handleInputChange('topUpPricePerBed', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Price for each extra bed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Beds Allowed
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxBedsAllowed || ''}
                  onChange={(e) => handleInputChange('maxBedsAllowed', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Unlimited"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
              </div>
            </div>

            {/* Calculator */}
            {showCalculator && (
              <div className="mt-4">
                <SubscriptionCalculator
                  baseBedCount={formData.baseBedCount}
                  basePrice={formData.basePrice}
                  topUpPricePerBed={formData.topUpPricePerBed}
                  billingCycle={formData.billingCycle}
                  annualDiscount={formData.annualDiscount}
                  allowMultipleBranches={formData.allowMultipleBranches}
                  branchCount={formData.branchCount}
                  bedsPerBranch={formData.bedsPerBranch}
                  costPerBranch={formData.costPerBranch}
                />
              </div>
            )}
          </div>

          {/* Multiple Branch Support Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-green-600" />
              Multiple Branch Support
            </h3>

            {/* Toggle for Multiple Branches */}
            <div className="mb-4">
              <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.allowMultipleBranches}
                  onChange={(e) => {
                    const isEnabled = e.target.checked;
                    handleInputChange('allowMultipleBranches', isEnabled);
                    // Reset branch fields when disabled
                    if (!isEnabled) {
                      handleInputChange('branchCount', 1);
                      handleInputChange('bedsPerBranch', null);
                      handleInputChange('costPerBranch', 0);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Allow Multiple Branches</span>
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-3">
                Enable this option to allow users to create multiple PG branches with this subscription plan
              </p>
            </div>

            {/* Branch Configuration Fields */}
            {formData.allowMultipleBranches && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-green-200"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Branches <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.branchCount}
                    onChange={(e) => handleInputChange('branchCount', parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Max branches allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum number of branches a user can create</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beds per Branch
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.bedsPerBranch || ''}
                    onChange={(e) => handleInputChange('bedsPerBranch', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Default: ${formData.baseBedCount}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to use base bed count per branch</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost per Branch (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costPerBranch}
                    onChange={(e) => handleInputChange('costPerBranch', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional cost per branch"
                  />
                  <p className="text-xs text-gray-500 mt-1">Additional monthly cost for each extra branch</p>
                </div>
              </motion.div>
            )}

            {/* Branch Configuration Info */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>💡 Branch Pricing:</strong> First branch is included in base price. Additional branches are charged at the specified cost per branch rate.
                {formData.allowMultipleBranches && (
                  <span className="block mt-1">
                    <strong>Example:</strong> With {formData.branchCount} max branches and ₹{formData.costPerBranch}/month per additional branch, total cost increases by ₹{(formData.branchCount - 1) * formData.costPerBranch} for maximum branches.
                  </span>
                )}
              </p>
            </div>
          </motion.div>

          {/* Features Section */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-yellow-600" />
              Plan Features
            </h3>
            
            {/* Add Feature */}
            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newFeature.name}
                  onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Feature name"
                />
                <input
                  type="text"
                  value={newFeature.description}
                  onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Description (optional)"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Feature</span>
                </button>
              </div>
            </div>

            {/* Features List */}
            {formData.features.length > 0 && (
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(index)}
                        className={`p-1 rounded ${
                          feature.enabled ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{feature.name}</p>
                        {feature.description && (
                          <p className="text-xs text-gray-600">{feature.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modules Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-indigo-600" />
              Module Permissions
            </h3>
            
            <div className="space-y-4">
              {availableModules.map(module => {
                const moduleData = formData.modules.find(m => m.moduleName === module.value);
                const isEnabled = moduleData?.enabled || false;

                return (
                  <div key={module.value} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Module Header */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => handleToggleModule(module.value, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                        <span className="text-lg">{module.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{module.label}</span>
                      </div>
                  <div className="flex items-center space-x-2">
                        <label className="text-xs text-gray-600">Limit:</label>
                        <input
                          type="number"
                          min="1"
                          value={moduleData?.limit || ''}
                          onChange={(e) => handleModuleLimitChange(module.value, e.target.value ? parseInt(e.target.value) : null)}
                          disabled={!isEnabled}
                          className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                          placeholder="Unlimited"
                        />
                      </div>
                    </div>

                    {/* Submodule Permissions */}
                    {isEnabled && (
                      <div className="p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Permissions by Feature:</h4>
                        <div className="space-y-3">
                          {getModuleSubmodules(module.value).map(submodule => {
                            const permissions = moduleData?.permissions?.[submodule.key] || {
                              create: true,
                              read: true,
                              update: true,
                              delete: true
                            };

                            return (
                              <div key={submodule.key} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-900">{submodule.label}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSubmodulePermissions(module.value, submodule.key)}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    {Object.values(permissions).every(p => p) ? 'Disable All' : 'Enable All'}
                                  </button>
                  </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {[
                                    { key: 'create', label: 'Create', color: 'green' },
                                    { key: 'read', label: 'Read', color: 'blue' },
                                    { key: 'update', label: 'Update', color: 'yellow' },
                                    { key: 'delete', label: 'Delete', color: 'red' }
                                  ].map(perm => (
                                    <label key={perm.key} className="flex items-center space-x-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={permissions[perm.key] || false}
                                        onChange={(e) => handlePermissionChange(module.value, submodule.key, perm.key, e.target.checked)}
                                        className={`w-3 h-3 text-${perm.color}-600 border-gray-300 rounded focus:ring-${perm.color}-500`}
                                      />
                                      <span className={`text-xs text-${perm.color}-700`}>{perm.label}</span>
                </label>
              ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional Settings */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Settings</h3>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.isPopular}
                  onChange={(e) => handleInputChange('isPopular', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">Mark as Popular</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.isRecommended}
                  onChange={(e) => handleInputChange('isRecommended', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Mark as Recommended</span>
                </div>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{subscription ? 'Update Plan' : 'Create Plan'}</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionForm;
