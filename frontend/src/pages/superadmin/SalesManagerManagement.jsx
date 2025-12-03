import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Users,
  Edit,
  Trash2,
  MoreHorizontal,
  X,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Mail,
  Key,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import salesManagerService from '../../services/salesManager.service';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const SalesManagerManagement = () => {
  const [salesManagers, setSalesManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [filters, setFilters] = useState({
    status: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newManagerForm, setNewManagerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    commissionRate: 10  // Default commission rate
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    commissionRate: ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSalesManagers();
  }, []);

  const fetchSalesManagers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await salesManagerService.getAllSalesManagers({ status: filters.status });
      setSalesManagers(response.data || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch Sales Managers');
      toast.error(error.response?.data?.message || 'Failed to fetch Sales Managers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSalesManager = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please check the form and fix any errors before submitting.', {
        duration: 3000,
        style: {
          background: '#fee2e2',
          color: '#991b1b',
          border: '1px solid #fca5a5'
        }
      });
      return;
    }

    try {
      // Clean and format phone with +91 prefix
      const cleanedPhone = newManagerForm.phone.replace(/[\s\-+]/g, '');
      if (cleanedPhone.length !== 10) {
        setFormErrors({...formErrors, phone: 'Please enter exactly 10 digits for the phone number.'});
        toast.error('Phone number must be exactly 10 digits. Please check and try again.', {
          duration: 4000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fca5a5'
          }
        });
        return;
      }
      
      const formattedData = {
        ...newManagerForm,
        phone: `+91${cleanedPhone}`
      };
      
      const response = await salesManagerService.createSalesManager(formattedData);
      toast.success('Sales Manager added successfully! Login credentials have been sent via email.', {
        duration: 4000,
        style: {
          background: '#d1fae5',
          color: '#065f46',
          border: '1px solid #6ee7b7'
        }
      });
      setSalesManagers([...salesManagers, response.data.data]);
      setShowAddModal(false);
      resetForm();
      fetchSalesManagers(); // Refresh the list
    } catch (error) {
      // Get error message from different possible locations
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to add Sales Manager';
      
      // Clear previous errors first
      const newErrors = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        commissionRate: ''
      };
      
      // Parse error message to identify which field has the issue
      const lowerErrorMessage = errorMessage.toLowerCase();
      
      // Check for email duplicate error
      if (lowerErrorMessage.includes('email') && 
          (lowerErrorMessage.includes('already exists') || 
           lowerErrorMessage.includes('already registered') ||
           lowerErrorMessage.includes('email already'))) {
        newErrors.email = 'This email is already registered. Please use a different email address.';
        toast.error('This email is already in use. Please try a different email address.', {
          duration: 4000,
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fcd34d'
          }
        });
      } 
      // Check for phone duplicate error
      else if ((lowerErrorMessage.includes('phone') || lowerErrorMessage.includes('mobile')) && 
               (lowerErrorMessage.includes('already exists') || 
                lowerErrorMessage.includes('already registered') ||
                lowerErrorMessage.includes('phone number already'))) {
        newErrors.phone = 'This phone number is already registered. Please use a different phone number.';
        toast.error('This phone number is already in use. Please try a different phone number.', {
          duration: 4000,
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fcd34d'
          }
        });
      }
      // Check for phone validation error (must be 10 digits)
      else if ((lowerErrorMessage.includes('phone') || lowerErrorMessage.includes('mobile')) && 
               (lowerErrorMessage.includes('10 digits') || 
                lowerErrorMessage.includes('must be') ||
                lowerErrorMessage.includes('validation failed') ||
                lowerErrorMessage.includes('exactly 10'))) {
        // Extract more specific error message if available
        let phoneErrorMsg = 'Please enter exactly 10 digits for the phone number.';
        if (lowerErrorMessage.includes('excluding country code')) {
          phoneErrorMsg = 'Phone number must be exactly 10 digits (excluding the +91 country code).';
        }
        newErrors.phone = phoneErrorMsg;
        toast.error('Phone number must be exactly 10 digits. Please check the number and try again.', {
          duration: 4000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fca5a5'
          }
        });
      }
      // Check for email validation error
      else if (lowerErrorMessage.includes('email') && 
               (lowerErrorMessage.includes('valid') || 
                lowerErrorMessage.includes('invalid') ||
                lowerErrorMessage.includes('validation failed'))) {
        newErrors.email = 'Please enter a valid email address.';
        toast.error('Please enter a valid email address and try again.', {
          duration: 4000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fca5a5'
          }
        });
      }
      // Generic error - make it more user-friendly
      else {
        // Try to extract a more user-friendly message
        let friendlyMessage = errorMessage;
        if (lowerErrorMessage.includes('validation failed')) {
          friendlyMessage = 'Please check all fields and ensure they are filled correctly.';
        } else if (lowerErrorMessage.includes('failed to create') || lowerErrorMessage.includes('failed to update')) {
          friendlyMessage = 'Unable to save. Please check the information and try again.';
        }
        toast.error(friendlyMessage, {
          duration: 4000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fca5a5'
          }
        });
      }
      
      setFormErrors(newErrors);
      
      // Scroll to the first error field if any
      if (newErrors.email || newErrors.phone) {
        setTimeout(() => {
          const errorField = document.querySelector('.border-red-500');
          if (errorField) {
            errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorField.focus();
          }
        }, 100);
      }
    }
  };

  const handleUpdateSalesManager = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please check the form and fix any errors before submitting.', {
        duration: 3000,
        style: {
          background: '#fee2e2',
          color: '#991b1b',
          border: '1px solid #fca5a5'
        }
      });
      return;
    }

    try {
      // Clean and format phone with +91 prefix
      const cleanedPhone = newManagerForm.phone.replace(/[\s\-+]/g, '');
      if (cleanedPhone.length !== 10) {
        setFormErrors({...formErrors, phone: 'Please enter exactly 10 digits for the phone number.'});
        toast.error('Phone number must be exactly 10 digits. Please check and try again.', {
          duration: 4000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fca5a5'
          }
        });
        return;
      }
      
      const phoneValue = `+91${cleanedPhone}`;
      
      const formattedData = {
        ...newManagerForm,
        phone: phoneValue
      };
      
      const response = await salesManagerService.updateSalesManager(
        selectedManager._id, 
        formattedData
      );
      toast.success('Sales Manager information updated successfully!', {
        duration: 3000,
        style: {
          background: '#d1fae5',
          color: '#065f46',
          border: '1px solid #6ee7b7'
        }
      });
      setSalesManagers(salesManagers.map(manager =>
        manager._id === selectedManager._id ? response.data.data : manager
      ));
      setShowEditModal(false);
      resetForm();
      fetchSalesManagers(); // Refresh the list
    } catch (error) {
      // Get error message from different possible locations
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to update Sales Manager';
      
      // Clear previous errors first
      const newErrors = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        commissionRate: ''
      };
      
      // Parse error message to identify which field has the issue
      const lowerErrorMessage = errorMessage.toLowerCase();
      
      // Check for email duplicate error
      if (lowerErrorMessage.includes('email') && 
          (lowerErrorMessage.includes('already exists') || 
           lowerErrorMessage.includes('already registered') ||
           lowerErrorMessage.includes('email already'))) {
        newErrors.email = 'This email is already registered. Please use a different email address.';
        toast.error('This email is already in use. Please try a different email address.', {
          duration: 4000,
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fcd34d'
          }
        });
      } 
      // Check for phone duplicate error
      else if ((lowerErrorMessage.includes('phone') || lowerErrorMessage.includes('mobile')) && 
               (lowerErrorMessage.includes('already exists') || 
                lowerErrorMessage.includes('already registered') ||
                lowerErrorMessage.includes('phone number already'))) {
        newErrors.phone = 'This phone number is already registered. Please use a different phone number.';
        toast.error('This phone number is already in use. Please try a different phone number.', {
          duration: 4000,
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fcd34d'
          }
        });
      }
      // Check for phone validation error (must be 10 digits)
      else if ((lowerErrorMessage.includes('phone') || lowerErrorMessage.includes('mobile')) && 
               (lowerErrorMessage.includes('10 digits') || 
                lowerErrorMessage.includes('must be') ||
                lowerErrorMessage.includes('validation failed') ||
                lowerErrorMessage.includes('exactly 10'))) {
        // Extract more specific error message if available
        let phoneErrorMsg = 'Please enter exactly 10 digits for the phone number.';
        if (lowerErrorMessage.includes('excluding country code')) {
          phoneErrorMsg = 'Phone number must be exactly 10 digits (excluding the +91 country code).';
        }
        newErrors.phone = phoneErrorMsg;
        toast.error('Phone number must be exactly 10 digits. Please check the number and try again.', {
          duration: 4000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fca5a5'
          }
        });
      }
      // Check for email validation error
      else if (lowerErrorMessage.includes('email') && 
               (lowerErrorMessage.includes('valid') || 
                lowerErrorMessage.includes('invalid') ||
                lowerErrorMessage.includes('validation failed'))) {
        newErrors.email = 'Please enter a valid email address.';
        toast.error('Please enter a valid email address and try again.', {
          duration: 4000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fca5a5'
          }
        });
      }
      // Generic error - make it more user-friendly
      else {
        // Try to extract a more user-friendly message
        let friendlyMessage = errorMessage;
        if (lowerErrorMessage.includes('validation failed')) {
          friendlyMessage = 'Please check all fields and ensure they are filled correctly.';
        } else if (lowerErrorMessage.includes('failed to create') || lowerErrorMessage.includes('failed to update')) {
          friendlyMessage = 'Unable to save. Please check the information and try again.';
        }
        toast.error(friendlyMessage, {
          duration: 4000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fca5a5'
          }
        });
      }
      
      setFormErrors(newErrors);
      
      // Scroll to the first error field if any
      if (newErrors.email || newErrors.phone) {
        setTimeout(() => {
          const errorField = document.querySelector('.border-red-500');
          if (errorField) {
            errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorField.focus();
          }
        }, 100);
      }
    }
  };

  const handleDeleteSalesManager = async (salesManagerId) => {
    if (!window.confirm('Are you sure you want to delete this Sales Manager?')) return;

    try {
      await salesManagerService.deleteSalesManager(salesManagerId);
      toast.success('Sales Manager deleted successfully');
      setSalesManagers(salesManagers.filter(manager => manager._id !== salesManagerId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete Sales Manager');
    }
  };

  const resetForm = () => {
    setNewManagerForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      commissionRate: 10
    });
    setFormErrors({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      commissionRate: ''
    });
    setSelectedManager(null);
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePhone = (phone) => {
    // Remove any spaces, dashes, or country code if user typed it
    const cleanedPhone = phone.replace(/[\s\-+]/g, '').trim();
    
    if (!cleanedPhone) {
      return 'Phone number is required';
    }
    
    // Check if it contains only digits
    if (!/^[0-9]+$/.test(cleanedPhone)) {
      return 'Phone number can only contain digits (0-9)';
    }
    
    // Check if it's exactly 10 digits
    if (cleanedPhone.length !== 10) {
      return `Phone number must be exactly 10 digits. You entered ${cleanedPhone.length} digit${cleanedPhone.length !== 1 ? 's' : ''}.`;
    }
    
    return '';
  };

  const validateForm = () => {
    const errors = {
      firstName: !newManagerForm.firstName.trim() ? 'First name is required' : 
                 newManagerForm.firstName.trim().length < 2 ? 'First name must be at least 2 characters' : '',
      lastName: !newManagerForm.lastName.trim() ? 'Last name is required' : 
                newManagerForm.lastName.trim().length < 2 ? 'Last name must be at least 2 characters' : '',
      email: validateEmail(newManagerForm.email),
      phone: validatePhone(newManagerForm.phone),
      commissionRate: newManagerForm.commissionRate < 0 || newManagerForm.commissionRate > 100 
        ? 'Commission rate must be between 0 and 100' : ''
    };

    setFormErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    // Remove any non-digit characters except + at the start
    value = value.replace(/[^\d+]/g, '');
    
    // If user types +91, remove it and keep only digits
    if (value.startsWith('+91')) {
      value = value.substring(3);
    }
    
    // Limit to 10 digits
    if (value.length > 10) {
      value = value.substring(0, 10);
    }
    
    setNewManagerForm({...newManagerForm, phone: value});
    // Clear error when user starts typing
    if (formErrors.phone) {
      setFormErrors({...formErrors, phone: ''});
    }
  };

  const handleViewManager = (manager) => {
    setSelectedManager(manager);
    setShowViewModal(true);
  };

  const handleDeleteManager = (manager) => {
    setManagerToDelete(manager);
    setShowDeleteModal(true);
  };

  const confirmDeleteManager = async () => {
    if (!managerToDelete) return;

    try {
      setLoading(true);
      await salesManagerService.deleteSalesManager(managerToDelete._id);
      toast.success('Sales Manager deleted successfully');
      setShowDeleteModal(false);
      setManagerToDelete(null);
      fetchSalesManagers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete Sales Manager');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (manager) => {
    setSelectedManager(manager);
    setShowResetPasswordModal(true);
  };

  const confirmResetPassword = async () => {
    if (!selectedManager) return;

    try {
      setResettingPassword(true);
      await salesManagerService.resetPassword(selectedManager._id);
      toast.success('Password reset initiated. New credentials will be sent via email.');
      setShowResetPasswordModal(false);
      setSelectedManager(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const renderAddEditModal = (isEdit = false) => {
    const manager = isEdit ? selectedManager : {};

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8 flex flex-col max-h-[90vh]"
        >
          {/* Header - Fixed */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Edit Sales Manager' : 'Add Sales Manager'}
            </h2>
            <button 
              onClick={() => {
                isEdit ? setShowEditModal(false) : setShowAddModal(false);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 px-4 py-4">
            <form 
              onSubmit={isEdit ? handleUpdateSalesManager : handleAddSalesManager} 
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                  <Input
                    type="text"
                    value={newManagerForm.firstName}
                    onChange={(e) => {
                      setNewManagerForm({...newManagerForm, firstName: e.target.value});
                      if (formErrors.firstName) {
                        setFormErrors({...formErrors, firstName: ''});
                      }
                    }}
                    className={`h-9 text-sm ${formErrors.firstName ? 'border-red-500' : ''}`}
                  />
                  {formErrors.firstName && (
                    <p className="text-[10px] text-red-500 mt-0.5">{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                  <Input
                    type="text"
                    value={newManagerForm.lastName}
                    onChange={(e) => {
                      setNewManagerForm({...newManagerForm, lastName: e.target.value});
                      if (formErrors.lastName) {
                        setFormErrors({...formErrors, lastName: ''});
                      }
                    }}
                    className={`h-9 text-sm ${formErrors.lastName ? 'border-red-500' : ''}`}
                  />
                  {formErrors.lastName && (
                    <p className="text-[10px] text-red-500 mt-0.5">{formErrors.lastName}</p>
                  )}
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${formErrors.email ? 'text-red-600' : 'text-gray-700'}`}>
                  Email {formErrors.email && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    value={newManagerForm.email}
                    onChange={(e) => {
                      setNewManagerForm({...newManagerForm, email: e.target.value});
                      if (formErrors.email) {
                        setFormErrors({...formErrors, email: ''});
                      }
                    }}
                    onBlur={(e) => {
                      const error = validateEmail(e.target.value);
                      if (error) {
                        setFormErrors({...formErrors, email: error});
                      }
                    }}
                    className={`h-9 text-sm ${formErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200 bg-red-50' : ''}`}
                  />
                  {formErrors.email && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {formErrors.email && (
                  <div className="mt-1 flex items-start space-x-1">
                    <svg className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-[10px] text-red-600 font-medium leading-tight">{formErrors.email}</p>
                  </div>
                )}
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${formErrors.phone ? 'text-red-600' : 'text-gray-700'}`}>
                  Phone Number {formErrors.phone && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 font-medium z-10">+91</span>
                  <Input
                    type="tel"
                    value={newManagerForm.phone}
                    onChange={handlePhoneChange}
                    onBlur={(e) => {
                      const error = validatePhone(e.target.value);
                      if (error) {
                        setFormErrors({...formErrors, phone: error});
                      }
                    }}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    className={`h-9 text-sm pl-12 ${formErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-200 bg-red-50' : ''}`}
                  />
                  {formErrors.phone && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {formErrors.phone && (
                  <div className="mt-1 flex items-start space-x-1">
                    <svg className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-[10px] text-red-600 font-medium leading-tight">{formErrors.phone}</p>
                  </div>
                )}
                {!formErrors.phone && (
                  <p className="text-[10px] text-gray-500 mt-0.5">Enter 10-digit mobile number (India)</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                <Input
                  type="number"
                  value={newManagerForm.commissionRate}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setNewManagerForm({...newManagerForm, commissionRate: value});
                    if (formErrors.commissionRate) {
                      setFormErrors({...formErrors, commissionRate: ''});
                    }
                  }}
                  min="0"
                  max="100"
                  step="0.1"
                  className={`h-9 text-sm ${formErrors.commissionRate ? 'border-red-500' : ''}`}
                />
                {formErrors.commissionRate && (
                  <p className="text-[10px] text-red-500 mt-0.5">{formErrors.commissionRate}</p>
                )}
              </div>
            </form>
          </div>

          {/* Sticky Footer with Action Buttons */}
          <div className="border-t border-gray-200 p-4 bg-white rounded-b-xl flex-shrink-0">
            <div className="flex justify-end space-x-2">
              <Button 
                type="button"
                variant="outline"
                onClick={() => {
                  isEdit ? setShowEditModal(false) : setShowAddModal(false);
                  resetForm();
                }}
                className="h-8 px-3 text-xs"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                onClick={isEdit ? handleUpdateSalesManager : handleAddSalesManager}
                className="h-8 px-3 text-xs"
              >
                {isEdit ? 'Update' : 'Add'} Sales Manager
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderViewModal = () => {
    if (!selectedManager) return null;

    // Extract phone number without country code for display
    const displayPhone = selectedManager?.phone?.replace(/^\+91/, '') || 'N/A';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] my-8"
        >
          {/* Header - Fixed */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Sales Manager Details</h2>
                  <p className="text-blue-100 text-xs">{selectedManager?.salesUniqueId || 'N/A'}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowViewModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Preview Section with Cyan Background */}
          <div className="bg-cyan-50 border-b border-cyan-200 p-4 flex-shrink-0">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {(selectedManager?.firstName?.[0] || '').toUpperCase()}
                    {(selectedManager?.lastName?.[0] || '').toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {selectedManager?.firstName || 'N/A'} {selectedManager?.lastName || ''}
                    </h3>
                    <p className="text-xs text-gray-500">{selectedManager?.email || 'N/A'}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-medium ${
                  selectedManager?.status === 'active' ? 'bg-green-100 text-green-800' :
                  selectedManager?.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedManager?.status || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {selectedManager?.firstName || 'N/A'} {selectedManager?.lastName || ''}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Email</label>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5 break-all">
                    {selectedManager?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    +91 {displayPhone}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Commission Rate</label>
                  <p className="text-sm font-semibold text-green-600 mt-0.5">
                    {selectedManager?.commissionRate || 10}%
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Unique ID</label>
                  <p className="text-sm font-semibold text-blue-600 font-mono mt-0.5">
                    {selectedManager?.salesUniqueId || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Status</label>
                  <div className="mt-0.5">
                    <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-medium ${
                      selectedManager?.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedManager?.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedManager?.status || 'N/A'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Created Date</label>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {selectedManager?.createdAt ? new Date(selectedManager.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer with Action Buttons */}
          <div className="border-t border-gray-200 p-4 bg-white rounded-b-xl flex-shrink-0">
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedManager(selectedManager);
                  // Extract phone without +91 for edit form
                  const phoneForEdit = selectedManager?.phone?.replace(/^\+91/, '') || '';
                  setNewManagerForm({
                    firstName: selectedManager?.firstName || '',
                    lastName: selectedManager?.lastName || '',
                    email: selectedManager?.email || '',
                    phone: phoneForEdit,
                    commissionRate: selectedManager?.commissionRate || 10
                  });
                  setShowEditModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs flex-1"
              >
                <Edit className="h-3 w-3 mr-1.5" />
                Edit Manager
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowViewModal(false);
                  handleResetPassword(selectedManager);
                }}
                className="border-orange-300 text-orange-600 hover:bg-orange-50 h-8 px-3 text-xs flex-1"
              >
                <Key className="h-3 w-3 mr-1.5" />
                Reset Password
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderDeleteModal = () => {
    if (!managerToDelete) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Delete Sales Manager</h2>
                <p className="text-red-100">This action cannot be undone</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the sales manager <strong>{managerToDelete?.firstName || 'N/A'} {managerToDelete?.lastName || ''}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This will permanently remove the sales manager account and all associated data. This action cannot be reversed.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setManagerToDelete(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteManager}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Deleting...' : 'Delete Manager'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResetPasswordModal = () => {
    if (!selectedManager) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Key className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Reset Password</h2>
                <p className="text-orange-100">Send new credentials via email</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                This will reset the password for <strong>{selectedManager?.firstName || 'N/A'} {selectedManager?.lastName || ''}</strong> and send new login credentials via email.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> The sales manager will receive an email with new temporary password and will be required to change it on next login.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setSelectedManager(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmResetPassword}
                disabled={resettingPassword}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {resettingPassword ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredSalesManagers = salesManagers.filter(manager => {
    // Ensure manager object exists and has required properties
    if (!manager || !manager.firstName) return false;

    const matchesSearch =
      manager.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (manager.salesUniqueId && manager.salesUniqueId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = !filters.status || manager.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredSalesManagers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedManagers = filteredSalesManagers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to first page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, searchTerm]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg border border-red-200 p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-red-600 text-sm mb-6">{error}</p>
          <Button 
            onClick={fetchSalesManagers}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Modern Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                Sales Managers
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Manage and track your sales team leaders
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Add Sales Manager</span>
          </Button>
        </motion.div>

        {/* Modern Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search Sales Managers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full h-11 text-sm sm:text-base border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="sm:col-span-1">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full h-11 px-3 py-2.5 border border-gray-300 rounded-lg text-sm sm:text-base bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-1 flex items-center justify-end">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{filteredSalesManagers.length}</span> manager{filteredSalesManagers.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </motion.div>

      {/* Sales Managers List - Modern Responsive Design */}
      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600">Loading sales managers...</p>
          </div>
        </div>
      ) : filteredSalesManagers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sales Managers Found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filters.status
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first sales manager'}
          </p>
          {!searchTerm && !filters.status && (
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Sales Manager
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Sales Managers
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({filteredSalesManagers.length})
                </span>
              </h2>
              {totalPages > 1 && (
                <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-600">
                  <span>Page {currentPage} of {totalPages}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Desktop Table View (lg and above) */}
          <div className="hidden lg:block overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Name
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Email
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Unique ID
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        Status
                      </th>
                      <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    <AnimatePresence>
                      {paginatedManagers.map((manager, index) => (
                        <motion.tr
                          key={manager?._id || Math.random()}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.15, delay: index * 0.02 }}
                          className="hover:bg-blue-50/50 transition-colors duration-100 border-b border-gray-100"
                        >
                          {/* Name */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className="flex-shrink-0 w-8 h-8">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                                  <Users className="h-4 w-4 text-white" />
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {manager?.firstName || 'N/A'} {manager?.lastName || ''}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="text-sm text-gray-600 truncate max-w-[250px] flex items-center">
                              <Mail className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-400" />
                              <span className="truncate">{manager?.email || 'N/A'}</span>
                            </div>
                          </td>

                          {/* Unique ID */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="text-sm text-blue-600 font-mono truncate max-w-[180px]">
                              {manager?.salesUniqueId || 'N/A'}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${
                              manager?.status === 'active' 
                                ? 'bg-green-100 text-green-800 border-green-200' :
                              manager?.status === 'inactive' 
                                ? 'bg-gray-100 text-gray-800 border-gray-200' :
                                'bg-red-100 text-red-800 border-red-200'
                            }`}>
                              {manager?.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {manager?.status || 'N/A'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleViewManager(manager)}
                                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-100"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedManager(manager);
                                  // Extract phone without +91 for edit form
                                  const phoneForEdit = manager.phone?.replace(/^\+91/, '') || '';
                                  setNewManagerForm({
                                    firstName: manager.firstName,
                                    lastName: manager.lastName,
                                    email: manager.email,
                                    phone: phoneForEdit,
                                    commissionRate: manager.commissionRate || 10
                                  });
                                  setShowEditModal(true);
                                }}
                                className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-100"
                                title="Edit Manager"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleResetPassword(manager)}
                                className="p-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-100"
                                title="Reset Password"
                              >
                                <Key className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteManager(manager)}
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-100"
                                title="Delete Manager"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-b-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative ml-3 inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-gray-700">
                        Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(endIndex, filteredSalesManagers.length)}</span> of{' '}
                        <span className="font-medium">{filteredSalesManagers.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-1.5 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        
                        {/* Page Numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-medium transition-colors ${
                                  currentPage === page
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <span key={page} className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 bg-white text-xs font-medium text-gray-700">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-1.5 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tablet View (md to lg) */}
          <div className="hidden md:block lg:hidden overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase">Name</th>
                      <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase">Email</th>
                      <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                      <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    <AnimatePresence>
                      {paginatedManagers.map((manager, index) => (
                        <motion.tr
                          key={manager?._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.15, delay: index * 0.02 }}
                          className="hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Users className="h-4 w-4 text-white" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {manager?.firstName || 'N/A'} {manager?.lastName || ''}
                                </div>
                                <div className="text-xs text-gray-500 truncate max-w-[150px]">
                                  {manager?.salesUniqueId || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="text-sm text-gray-600 truncate max-w-[200px] flex items-center">
                              <Mail className="h-3 w-3 mr-1 flex-shrink-0 text-gray-400" />
                              <span className="truncate">{manager?.email || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                              manager?.status === 'active' 
                                ? 'bg-green-100 text-green-800 border border-green-200' :
                              manager?.status === 'inactive' 
                                ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                                'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {manager?.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {manager?.status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleViewManager(manager)}
                                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-all"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedManager(manager);
                                  // Extract phone without +91 for edit form
                                  const phoneForEdit = manager.phone?.replace(/^\+91/, '') || '';
                                  setNewManagerForm({
                                    firstName: manager.firstName,
                                    lastName: manager.lastName,
                                    email: manager.email,
                                    phone: phoneForEdit,
                                    commissionRate: manager.commissionRate || 10
                                  });
                                  setShowEditModal(true);
                                }}
                                className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-all"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleResetPassword(manager)}
                                className="p-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-all"
                                title="Reset"
                              >
                                <Key className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteManager(manager)}
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mobile View */}
          <div className="block md:hidden space-y-3 p-4">
            {paginatedManagers.map((manager, index) => (
              <motion.div
                key={manager?._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-bold text-gray-900 truncate">
                        {manager?.firstName || 'N/A'} {manager?.lastName || ''}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5 flex items-center">
                        <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{manager?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                    manager?.status === 'active' 
                      ? 'bg-green-100 text-green-800 border border-green-200' :
                    manager?.status === 'inactive' 
                      ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {manager?.status === 'active' && <CheckCircle className="h-3 w-3 mr-1 inline" />}
                    {manager?.status || 'N/A'}
                  </span>
                </div>
                
                <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-xs text-gray-600 mb-1">Unique ID</div>
                  <div className="text-sm text-blue-600 font-mono font-semibold truncate">
                    {manager?.salesUniqueId || 'N/A'}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewManager(manager)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedManager(manager);
                        // Extract phone without +91 for edit form
                        const phoneForEdit = manager.phone?.replace(/^\+91/, '') || '';
                        setNewManagerForm({
                          firstName: manager.firstName,
                          lastName: manager.lastName,
                          email: manager.email,
                          phone: phoneForEdit,
                          commissionRate: manager.commissionRate || 10
                        });
                        setShowEditModal(true);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-all"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleResetPassword(manager)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                      title="Reset Password"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteManager(manager)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                <span className="text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

        {/* Add Sales Manager Modal */}
        {showAddModal && renderAddEditModal()}

        {/* Edit Sales Manager Modal */}
        {showEditModal && renderAddEditModal(true)}

        {/* View Sales Manager Modal */}
        {showViewModal && renderViewModal()}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && renderDeleteModal()}

        {/* Reset Password Modal */}
        {showResetPasswordModal && renderResetPasswordModal()}
      </div>
    </div>
  );
};

export default SalesManagerManagement;
