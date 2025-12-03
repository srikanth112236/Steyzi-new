import React, { useState, useEffect } from 'react';
import { Building2, X, Save, Layers, AlertCircle, Home, Info } from 'lucide-react';

const FloorModal = ({ isOpen, onClose, onSubmit, formData, setFormData, isEdit }) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset errors and touched when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    } else {
      // When modal opens, validate initial form data (for edit mode)
      if (isEdit && formData.name && formData.totalRooms) {
        // Pre-validate if we have initial data
        const nameError = validateField('name', formData.name);
        const totalRoomsError = validateField('totalRooms', formData.totalRooms);
        const initialErrors = {};
        if (nameError) initialErrors.name = nameError;
        if (totalRoomsError) initialErrors.totalRooms = totalRoomsError;
        setErrors(initialErrors);
      }
    }
  }, [isOpen, isEdit]);

  // Validation functions
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'name':
        if (!value || value.trim() === '') {
          error = 'Floor name is required';
        } else if (value.trim().length < 2) {
          error = 'Floor name must be at least 2 characters';
        } else if (value.trim().length > 50) {
          error = 'Floor name cannot exceed 50 characters';
        }
        break;
      case 'totalRooms':
        if (!value || value === '') {
          error = 'Total rooms is required';
        } else {
          const numValue = parseInt(value);
          if (isNaN(numValue) || numValue < 1) {
            error = 'Total rooms must be at least 1';
          } else if (numValue > 100) {
            error = 'Total rooms cannot exceed 100';
          }
        }
        break;
      default:
        break;
    }

    return error;
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    
    const nameError = validateField('name', formData.name);
    if (nameError) newErrors.name = nameError;

    const totalRoomsError = validateField('totalRooms', formData.totalRooms);
    if (totalRoomsError) newErrors.totalRooms = totalRoomsError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid (no errors)
  const isFormValid = () => {
    // In edit mode, only validate totalRooms (name is disabled)
    if (isEdit) {
      const totalRoomsError = validateField('totalRooms', formData.totalRooms);
      return !totalRoomsError;
    }
    
    // In add mode, validate both fields
    const nameError = validateField('name', formData.name);
    const totalRoomsError = validateField('totalRooms', formData.totalRooms);
    
    // Form is valid if there are no errors
    return !nameError && !totalRoomsError;
  };

  // Handle input change with validation
  const handleInputChange = (name, value) => {
    // Update form data
    setFormData({ ...formData, [name]: value });

    // Validate and update error for this field if it was touched
    if (touched[name]) {
      const error = validateField(name, value);
      if (error) {
        setErrors({ ...errors, [name]: error });
      } else {
        // Clear error if field is now valid
        const newErrors = { ...errors };
        delete newErrors[name];
        setErrors(newErrors);
      }
    }
  };

  // Handle blur event
  const handleBlur = (name) => {
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, formData[name]);
    if (error) {
      setErrors({ ...errors, [name]: error });
    } else {
      // Clear error if field is valid
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ name: true, totalRooms: true });
    
    // Validate form
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(e);
    } catch (error) {
      console.error('Error in floor submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto transform transition-all duration-300 scale-100">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isEdit ? 'Edit Floor' : 'Add New Floor'}
              </h3>
              <p className="text-xs text-gray-600 flex items-center mt-0.5">
                <Layers className="h-3 w-3 mr-1" />
                {isEdit ? 'Update floor details' : 'Create a new floor for your PG'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200 hover:scale-110"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Compact Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Floor Name */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <label className="block text-sm font-semibold text-gray-700">
                Floor Name <span className="text-red-500">*</span>
              </label>
              {isEdit && (
                <div className="group relative inline-block">
                  <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20 pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
                      Floor name cannot be changed after creation
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <Building2 className={`absolute left-3 top-2.5 h-4 w-4 transition-colors ${
                isEdit 
                  ? 'text-gray-300' 
                  : errors.name 
                  ? 'text-red-400' 
                  : 'text-gray-400'
              }`} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => !isEdit && handleInputChange('name', e.target.value)}
                onBlur={() => !isEdit && handleBlur('name')}
                disabled={isEdit}
                className={`w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 transition-all duration-200 text-sm ${
                  isEdit
                    ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                    : errors.name
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                    : touched.name && !errors.name
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent hover:border-gray-400'
                }`}
                placeholder="e.g., Ground Floor, First Floor"
                title={isEdit ? "Floor name cannot be changed after creation" : ""}
              />
            </div>
            {isEdit ? (
              <p className="text-xs text-gray-500 flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Floor name is locked and cannot be edited
              </p>
            ) : errors.name && touched.name ? (
              <div className="flex items-center space-x-1 text-xs text-red-600 mt-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span>{errors.name}</span>
              </div>
            ) : touched.name ? (
              <p className="text-xs text-gray-500">Enter a descriptive name for the floor</p>
            ) : (
              <p className="text-xs text-gray-500">Enter a descriptive name for the floor</p>
            )}
          </div>

          {/* Total Rooms */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              Total Rooms <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Home className={`absolute left-3 top-2.5 h-4 w-4 transition-colors ${
                errors.totalRooms ? 'text-red-400' : 'text-gray-400'
              }`} />
              <input
                type="number"
                min="1"
                max="100"
                value={formData.totalRooms}
                onChange={(e) => handleInputChange('totalRooms', e.target.value)}
                onBlur={() => handleBlur('totalRooms')}
                className={`w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 transition-all duration-200 text-sm ${
                  errors.totalRooms
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                    : touched.totalRooms && !errors.totalRooms
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent hover:border-gray-400'
                }`}
                placeholder="Number of rooms on this floor"
              />
            </div>
            {errors.totalRooms && touched.totalRooms && (
              <div className="flex items-center space-x-1 text-xs text-red-600 mt-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span>{errors.totalRooms}</span>
              </div>
            )}
            {!errors.totalRooms && touched.totalRooms && (
              <p className="text-xs text-gray-500">Specify the total number of rooms available on this floor</p>
            )}
            {!touched.totalRooms && (
              <p className="text-xs text-gray-500">Specify the total number of rooms available on this floor</p>
            )}
          </div>

          {/* Compact Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid()}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <Save className="h-3 w-3" />
              )}
              <span>{isEdit ? 'Update Floor' : 'Create Floor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FloorModal;
