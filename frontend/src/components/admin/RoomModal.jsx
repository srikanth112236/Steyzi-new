import React, { useState, useEffect } from 'react';
import { Bed, X, Save, Home, DollarSign, Users, Hash, AlertCircle, Info } from 'lucide-react';

const RoomModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  isEdit, 
  floors, 
  sharingTypes, 
  handleSharingTypeChange, 
  handleRoomNumberChange, 
  handleNumberOfBedsChange, 
  handleBedNumberChange 
}) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset errors and touched when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    } else if (isEdit && formData.roomNumber && formData.sharingType && formData.floorId) {
      // Pre-validate if we have initial data in edit mode
      const initialErrors = {};
      if (!formData.roomNumber) initialErrors.roomNumber = 'Room number is required';
      if (!formData.sharingType) initialErrors.sharingType = 'Sharing type is required';
      if (!formData.floorId) initialErrors.floorId = 'Floor is required';
      if (!formData.cost || formData.cost <= 0) initialErrors.cost = 'Cost must be greater than 0';
      setErrors(initialErrors);
    }
  }, [isOpen, isEdit, formData]);

  // Validation functions
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'floorId':
        if (!value || value === '') {
          error = 'Please select a floor';
        }
        break;
      case 'roomNumber':
        if (!value || value.trim() === '') {
          error = 'Room number is required';
        } else if (value.trim().length < 1) {
          error = 'Room number must be at least 1 character';
        } else if (value.trim().length > 20) {
          error = 'Room number cannot exceed 20 characters';
        }
        break;
      case 'sharingType':
        if (!value || value === '') {
          error = 'Please select a sharing type';
        }
        break;
      case 'numberOfBeds':
        if (!value || value === '') {
          error = 'Number of beds is required';
        } else {
          const numValue = parseInt(value);
          if (isNaN(numValue) || numValue < 1) {
            error = 'Number of beds must be at least 1';
          } else if (numValue > 10) {
            error = 'Number of beds cannot exceed 10';
          }
        }
        break;
      case 'cost':
        if (!value || value === '') {
          error = 'Cost per bed is required';
        } else {
          const numValue = parseFloat(value);
          if (isNaN(numValue) || numValue < 0) {
            error = 'Cost must be a positive number';
          } else if (numValue > 100000) {
            error = 'Cost cannot exceed ₹1,00,000';
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
    
    if (!isEdit) {
      const floorError = validateField('floorId', formData.floorId);
      if (floorError) newErrors.floorId = floorError;

      const roomNumberError = validateField('roomNumber', formData.roomNumber);
      if (roomNumberError) newErrors.roomNumber = roomNumberError;
    }

    const sharingTypeError = validateField('sharingType', formData.sharingType);
    if (sharingTypeError) newErrors.sharingType = sharingTypeError;

    const numberOfBedsError = validateField('numberOfBeds', formData.numberOfBeds);
    if (numberOfBedsError) newErrors.numberOfBeds = numberOfBedsError;

    const costError = validateField('cost', formData.cost);
    if (costError) newErrors.cost = costError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid
  const isFormValid = () => {
    if (isEdit) {
      // In edit mode, only validate sharing type, number of beds, and cost
      const sharingTypeError = validateField('sharingType', formData.sharingType);
      const numberOfBedsError = validateField('numberOfBeds', formData.numberOfBeds);
      const costError = validateField('cost', formData.cost);
      return !sharingTypeError && !numberOfBedsError && !costError;
    } else {
      // In add mode, validate all fields
      const floorError = validateField('floorId', formData.floorId);
      const roomNumberError = validateField('roomNumber', formData.roomNumber);
      const sharingTypeError = validateField('sharingType', formData.sharingType);
      const numberOfBedsError = validateField('numberOfBeds', formData.numberOfBeds);
      const costError = validateField('cost', formData.cost);
      return !floorError && !roomNumberError && !sharingTypeError && !numberOfBedsError && !costError;
    }
  };

  // Handle input change with validation
  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });

    if (touched[name] && errors[name]) {
      const error = validateField(name, value);
      if (error) {
        setErrors({ ...errors, [name]: error });
      } else {
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
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const fieldsToTouch = isEdit 
      ? ['sharingType', 'numberOfBeds', 'cost']
      : ['floorId', 'roomNumber', 'sharingType', 'numberOfBeds', 'cost'];
    
    fieldsToTouch.forEach(field => {
      setTouched(prev => ({ ...prev, [field]: true }));
    });
    
    // Validate form
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(e);
    } catch (error) {
      console.error('Error in room submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] flex flex-col overflow-hidden">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <Bed className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isEdit ? 'Edit Room' : 'Add New Room'}
              </h3>
              <p className="text-xs text-gray-600 flex items-center mt-0.5">
                <Home className="h-3 w-3 mr-1" />
                {isEdit ? 'Update room details' : 'Create a new room for your PG'}
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

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Floor Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Floor <span className="text-red-500">*</span>
                </label>
                {isEdit && (
                  <div className="group relative inline-block">
                    <Info className="h-3.5 w-3.5 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
                        Floor cannot be changed after creation
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <select
                  value={formData.floorId}
                  onChange={(e) => !isEdit && handleInputChange('floorId', e.target.value)}
                  onBlur={() => !isEdit && handleBlur('floorId')}
                  disabled={isEdit}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 transition-all duration-200 appearance-none text-sm ${
                    isEdit
                      ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                      : errors.floorId
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : touched.floorId && !errors.floorId
                      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent hover:border-gray-400'
                  }`}
                >
                  <option value="">Select a floor</option>
                  {floors.map((floor) => (
                    <option key={floor._id} value={floor._id}>
                      {floor.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.floorId && touched.floorId && (
                <div className="flex items-center space-x-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>{errors.floorId}</span>
                </div>
              )}
              {!errors.floorId && touched.floorId && !isEdit && (
                <p className="text-xs text-gray-500">Choose which floor this room belongs to</p>
              )}
              {isEdit && (
                <p className="text-xs text-gray-500 flex items-center">
                  <Info className="h-3 w-3 mr-1" />
                  Floor is locked and cannot be edited
                </p>
              )}
            </div>

            {/* Room Number */}
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Room Number <span className="text-red-500">*</span>
                </label>
                {isEdit && (
                  <div className="group relative inline-block">
                    <Info className="h-3.5 w-3.5 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
                        Room number cannot be changed after creation
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <Hash className={`absolute left-3 top-2.5 h-4 w-4 transition-colors ${
                  isEdit ? 'text-gray-300' : errors.roomNumber ? 'text-red-400' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => !isEdit && handleRoomNumberChange(e.target.value)}
                  onBlur={() => !isEdit && handleBlur('roomNumber')}
                  disabled={isEdit}
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 transition-all duration-200 text-sm ${
                    isEdit
                      ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                      : errors.roomNumber
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : touched.roomNumber && !errors.roomNumber
                      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent hover:border-gray-400'
                  }`}
                  placeholder="e.g., 101, 202"
                />
              </div>
              {errors.roomNumber && touched.roomNumber && (
                <div className="flex items-center space-x-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>{errors.roomNumber}</span>
                </div>
              )}
              {!errors.roomNumber && touched.roomNumber && !isEdit && (
                <p className="text-xs text-gray-500">Enter a unique room number</p>
              )}
              {isEdit && (
                <p className="text-xs text-gray-500 flex items-center">
                  <Info className="h-3 w-3 mr-1" />
                  Room number is locked and cannot be edited
                </p>
              )}
            </div>

            {/* Sharing Type - Moved before Number of Beds */}
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Sharing Type <span className="text-red-500">*</span>
                </label>
                {isEdit && (
                  <div className="group relative inline-block">
                    <Info className="h-3.5 w-3.5 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
                        Sharing type cannot be changed after creation
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <Users className={`absolute left-3 top-2.5 h-4 w-4 transition-colors ${
                  isEdit ? 'text-gray-300' : errors.sharingType ? 'text-red-400' : 'text-gray-400'
                }`} />
                <select
                  value={formData.sharingType}
                  onChange={(e) => !isEdit && handleSharingTypeChange(e.target.value)}
                  onBlur={() => !isEdit && handleBlur('sharingType')}
                  disabled={isEdit}
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 transition-all duration-200 appearance-none text-sm ${
                    isEdit
                      ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                      : errors.sharingType
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : touched.sharingType && !errors.sharingType
                      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent hover:border-gray-400'
                  }`}
                >
                  <option value="">Select sharing type</option>
                  {sharingTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} - ₹{type.cost}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.sharingType && touched.sharingType && (
                <div className="flex items-center space-x-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>{errors.sharingType}</span>
                </div>
              )}
              {!errors.sharingType && touched.sharingType && !isEdit && (
                <p className="text-xs text-gray-500">Choose the sharing configuration for this room</p>
              )}
              {isEdit && (
                <p className="text-xs text-gray-500 flex items-center">
                  <Info className="h-3 w-3 mr-1" />
                  Sharing type is locked and cannot be edited
                </p>
              )}
            </div>

            {/* Number of Beds - Moved after Sharing Type */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Number of Beds <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Bed className={`absolute left-3 top-2.5 h-4 w-4 transition-colors ${
                  errors.numberOfBeds ? 'text-red-400' : 'text-gray-400'
                }`} />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.numberOfBeds}
                  onChange={(e) => handleNumberOfBedsChange(e.target.value)}
                  onBlur={() => handleBlur('numberOfBeds')}
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 transition-all duration-200 text-sm ${
                    errors.numberOfBeds
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : touched.numberOfBeds && !errors.numberOfBeds
                      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent hover:border-gray-400'
                  }`}
                  placeholder="Number of beds"
                />
              </div>
              {errors.numberOfBeds && touched.numberOfBeds && (
                <div className="flex items-center space-x-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>{errors.numberOfBeds}</span>
                </div>
              )}
              {!errors.numberOfBeds && touched.numberOfBeds && (
                <p className="text-xs text-gray-500">Specify the number of beds in this room</p>
              )}
              {!touched.numberOfBeds && (
                <p className="text-xs text-gray-500">Specify the number of beds in this room</p>
              )}
            </div>

            {/* Cost */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">
                Cost per Bed <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className={`absolute left-3 top-2.5 h-4 w-4 transition-colors ${
                  errors.cost ? 'text-red-400' : 'text-gray-400'
                }`} />
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  onBlur={() => handleBlur('cost')}
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 transition-all duration-200 text-sm ${
                    errors.cost
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : touched.cost && !errors.cost
                      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent hover:border-gray-400'
                  }`}
                  placeholder="Cost per bed"
                />
              </div>
              {errors.cost && touched.cost && (
                <div className="flex items-center space-x-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>{errors.cost}</span>
                </div>
              )}
              {!errors.cost && touched.cost && (
                <p className="text-xs text-gray-500">Enter the cost per bed in this room</p>
              )}
              {!touched.cost && (
                <p className="text-xs text-gray-500">Enter the cost per bed in this room</p>
              )}
            </div>
          </div>

          {/* Bed Numbers Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Bed Numbers <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: formData.numberOfBeds }, (_, index) => (
                <div key={index} className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-600">
                    Bed {index + 1}
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-2.5 top-2 h-3 w-3 text-gray-400" />
                    <input
                      type="text"
                      value={formData.bedNumbers[index] || ''}
                      onChange={(e) => handleBedNumberChange(index, e.target.value)}
                      className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 text-xs"
                      placeholder={`e.g., ${formData.roomNumber}-${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Customize bed numbers or leave empty for auto-generation
            </p>
          </div>

          {/* Preview Card */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Bed className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">Room {formData.roomNumber || '---'}</h4>
              </div>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                {formData.numberOfBeds} Beds
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <span className="block text-gray-500">Floor</span>
                <span className="font-semibold text-gray-900">{floors.find(f=>f._id===formData.floorId)?.name || 'Select'}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <span className="block text-gray-500">Sharing</span>
                <span className="font-semibold text-gray-900">{sharingTypes.find(t=>t.id===formData.sharingType)?.name || '—'}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <span className="block text-gray-500">Cost</span>
                <span className="font-bold text-emerald-700">₹{formData.cost || 0}</span>
              </div>
              {formData.bedNumbers?.length > 0 && formData.bedNumbers.filter(Boolean).length > 0 && (
                <div className="col-span-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="block text-blue-600 text-xs">Bed Numbers</span>
                  <span className="text-blue-800 text-xs">{formData.bedNumbers.filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
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
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid()}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            ) : (
              <Save className="h-3 w-3" />
            )}
            <span>{isEdit ? 'Update Room' : 'Create Room'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomModal;
