import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Loader2, 
  MapPin, 
  Phone, 
  Mail, 
  Building2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectLabel,
  SelectGroup,
  SelectSeparator
} from "../ui/select";

import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "../ui/popover";

import { Calendar as CalendarComponent } from "../ui/calendar";

import pgService from '../../services/pg.service';

const PgFormModal = ({ isOpen, onClose, pg = null, onSuccess, isSalesMode = false }) => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark: ''
    },
    contact: {
      phone: '',
      email: '',
      alternatePhone: ''
    },
    property: {
      type: 'Gents PG'
    },
    status: 'active', // Add status field
    ...(isSalesMode && {
      salesManager: '',
      salesStaff: ''
    })
  });

  const [errors, setErrors] = useState({});

  const isEdit = !!pg;

  // Status options
  const statusOptions = [
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'inactive', label: 'Inactive', color: 'gray' },
    { value: 'maintenance', label: 'Maintenance', color: 'yellow' },
    { value: 'full', label: 'Full', color: 'red' },
    { value: 'under_renovation', label: 'Under Renovation', color: 'orange' },
    { value: 'pending_approval', label: 'Pending Approval', color: 'blue' },
    { value: 'suspended', label: 'Suspended', color: 'red' },
    { value: 'closed', label: 'Closed', color: 'gray' },
    { value: 'limited_occupancy', label: 'Limited Occupancy', color: 'purple' }
  ];

  // Property type options (matches backend validation)
  const propertyTypeOptions = [
    { value: 'Gents PG', label: 'Gents PG' },
    { value: 'Ladies PG', label: 'Ladies PG' },
    { value: 'Coliving PG', label: 'Coliving PG' },
    { value: 'PG', label: 'PG' },
    { value: 'Hostel', label: 'Hostel' },
    { value: 'Apartment', label: 'Apartment' },
    { value: 'Independent', label: 'Independent' }
  ];

  // Load PG data for editing or initialize for new PG
  useEffect(() => {
    if (isEdit && pg) {
      setFormData({
        name: pg.name || '',
        description: pg.description || '',
        address: {
          street: pg.address?.street || '',
          city: pg.address?.city || '',
          state: pg.address?.state || '',
          pincode: pg.address?.pincode || '',
          landmark: pg.address?.landmark || ''
        },
        contact: {
          phone: pg.contact?.phone || '',
          email: pg.contact?.email || '',
          alternatePhone: pg.contact?.alternatePhone || ''
        },
        property: {
          type: pg.property?.type || 'Gents PG'
        },
        status: pg.status || 'active', // Add status
        ...(isSalesMode && {
          salesManager: pg.salesManager || '',
          salesStaff: pg.salesStaff || ''
        })
      });
    } else if (isSalesMode && !isEdit) {
      // Auto-populate sales fields for new PGs in sales mode
      let salesManager = '';
      let salesStaff = '';

      if (user?.salesRole === 'sub_sales') {
        // For sub_sales users, salesManager is their parent manager
        salesManager = user.parentSalesPerson?.fullName || '';
        salesStaff = `${user.firstName} ${user.lastName}`;
      } else if (user?.role === 'sales_manager') {
        // For sales managers, they are the salesManager
        salesManager = `${user.firstName} ${user.lastName}`;
        salesStaff = ''; // Leave empty for manager to fill
      }

      setFormData(prev => ({
        ...prev,
        salesManager,
        salesStaff
      }));
    }
  }, [pg, isEdit, isSalesMode, user]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Form data being submitted:', formData);
      
      // Validate form data
      const validation = pgService.validatePGData(formData);
      console.log('Validation result:', validation);
      
      if (!validation.isValid) {
        const errorObj = {};
        validation.errors.forEach(error => {
          errorObj[error.field] = error.message;
        });
        console.log('Validation errors:', errorObj);
        setErrors(errorObj);
        toast.error('Please fix the validation errors');
        return;
      }

      // Format data for API submission
      const formattedData = pgService.formatPGDataForAPI(formData);
      console.log('Formatted data for API:', formattedData);

      let response;
      if (isEdit) {
        response = await pgService.updatePG(pg._id, formattedData);
      } else {
        if (isSalesMode) {
          response = await pgService.createPGSales(formattedData);
        } else {
          response = await pgService.createPG(formattedData);
        }
      }

      console.log('API response:', response);

      if (response.success) {
        toast.success(isEdit ? 'PG updated successfully!' : 'PG created successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isEdit ? 'Edit PG' : 'Add New PG'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {isEdit ? 'Update PG information' : 'Create a new PG property'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PG Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter PG name"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Type
                    </label>
                    <Select
                      value={formData.property.type}
                      onValueChange={(value) => handleInputChange('property.type', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Property Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PG Status
                    </label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select PG Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter PG description"
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Address Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['address.street'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter street address"
                    />
                    {errors['address.street'] && <p className="mt-1 text-sm text-red-600">{errors['address.street']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['address.city'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter city"
                    />
                    {errors['address.city'] && <p className="mt-1 text-sm text-red-600">{errors['address.city']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['address.state'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter state"
                    />
                    {errors['address.state'] && <p className="mt-1 text-sm text-red-600">{errors['address.state']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      value={formData.address.pincode}
                      onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['address.pincode'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                    />
                    {errors['address.pincode'] && <p className="mt-1 text-sm text-red-600">{errors['address.pincode']}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Landmark
                    </label>
                    <input
                      type="text"
                      value={formData.address.landmark}
                      onChange={(e) => handleInputChange('address.landmark', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter nearby landmark"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.contact.phone}
                      onChange={(e) => handleInputChange('contact.phone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['contact.phone'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                    />
                    {errors['contact.phone'] && <p className="mt-1 text-sm text-red-600">{errors['contact.phone']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.contact.email}
                      onChange={(e) => handleInputChange('contact.email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['contact.email'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                    {errors['contact.email'] && <p className="mt-1 text-sm text-red-600">{errors['contact.email']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alternate Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.contact.alternatePhone}
                      onChange={(e) => handleInputChange('contact.alternatePhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter alternate phone number"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              {/* Sales Information - Only show in sales mode */}
              {isSalesMode && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Sales Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sales Manager
                      </label>
                      <input
                        type="text"
                        value={formData.salesManager}
                        onChange={(e) => handleInputChange('salesManager', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          user?.role === 'sales_manager' ? 'bg-gray-50' : 'border-gray-300'
                        }`}
                        placeholder="Enter sales manager name"
                        readOnly={user?.role === 'sales_manager'}
                      />
                      {user?.role === 'sales_manager' && (
                        <p className="text-xs text-gray-500 mt-1">Auto-filled from your account</p>
                      )}
                    </div>

                    {/* Only show Sales Staff field for sub_sales users */}
                    {user?.salesRole === 'sub_sales' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sales Staff
                        </label>
                        <input
                          type="text"
                          value={formData.salesStaff}
                          onChange={(e) => handleInputChange('salesStaff', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                          placeholder="Enter sales staff name"
                          readOnly={true}
                        />
                        <p className="text-xs text-gray-500 mt-1">Auto-filled from your account</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{isEdit ? 'Update PG' : 'Create PG'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PgFormModal; 