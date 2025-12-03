import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Mail, MapPin, Calendar, Save, Briefcase, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/apiUrl';
import { useSelector } from 'react-redux';

// Helper to get nested values
const getNestedValue = (obj, path) => {
  if (!obj || !path) return '';
  try {
    return path.split('.').reduce((current, prop) => {
      if (current === null || current === undefined) return '';
      return current[prop];
    }, obj) || '';
  } catch (error) {
    return '';
  }
};

// Input field component - defined outside to prevent recreation on each render
const InputField = React.memo(({ 
  label, 
  name, 
  type = 'text', 
  icon: Icon, 
  placeholder, 
  required = false, 
  disabled = false, 
  className = '',
  value,
  error,
  touched,
  onChange,
  onBlur
}) => {
  const fieldError = error;
  const fieldTouched = touched;
  const isError = fieldError && fieldTouched;
  const isValid = fieldTouched && !fieldError;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className={`absolute left-3 top-2.5 h-4 w-4 transition-colors ${
            disabled ? 'text-gray-300' : isError ? 'text-red-400' : 'text-gray-400'
          }`} />
        )}
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange && onChange(name, e.target.value)}
          onBlur={() => onBlur && onBlur(name)}
          disabled={disabled}
          className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 border rounded-lg focus:ring-2 transition-all duration-200 text-sm ${
            disabled
              ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
              : isError
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
              : isValid
              ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-transparent hover:border-gray-400'
          }`}
          placeholder={placeholder}
        />
      </div>
      {isError && (
        <div className="flex items-center space-x-1 text-xs text-red-600 mt-1 min-h-[1.25rem]">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span>{fieldError}</span>
        </div>
      )}
      {!isError && (
        <div className="min-h-[1.25rem]">
          <p className="text-xs text-gray-500">{placeholder}</p>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if props actually change
  return (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.touched === nextProps.touched &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.name === nextProps.name
  );
});

InputField.displayName = 'InputField';

const ResidentForm = ({ isOpen, onClose, onSubmit, editingResident, selectedBranch }) => {
  const { user } = useSelector((state) => state.auth);
  
  // Initialize form data with default structure
  const getInitialFormData = () => ({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    permanentAddress: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    workDetails: {
      company: '',
      designation: '',
      workAddress: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      }
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      }
    },
    checkInDate: '',
    contractStartDate: '',
    status: 'pending'
  });

  const [formData, setFormData] = useState(getInitialFormData());

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState({ email: false, phone: false });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
      setCheckingDuplicate({ email: false, phone: false });
    } else if (editingResident) {
      // Pre-populate form for editing
      setFormData({
        firstName: editingResident.firstName || '',
        lastName: editingResident.lastName || '',
        email: editingResident.email || '',
        phone: editingResident.phone || '',
        dateOfBirth: editingResident.dateOfBirth ? new Date(editingResident.dateOfBirth).toISOString().split('T')[0] : '',
        gender: editingResident.gender || '',
        permanentAddress: {
          street: editingResident.permanentAddress?.street || '',
          city: editingResident.permanentAddress?.city || '',
          state: editingResident.permanentAddress?.state || '',
          pincode: editingResident.permanentAddress?.pincode || ''
        },
        workDetails: {
          company: editingResident.workDetails?.company || '',
          designation: editingResident.workDetails?.designation || '',
          workAddress: (() => {
            const workAddr = editingResident.workDetails?.workAddress;
            if (typeof workAddr === 'string') {
              return { street: workAddr, city: '', state: '', pincode: '', country: 'India' };
            }
            return workAddr || { street: '', city: '', state: '', pincode: '', country: 'India' };
          })()
        },
        emergencyContact: {
          name: editingResident.emergencyContact?.name || '',
          relationship: editingResident.emergencyContact?.relationship || '',
          phone: editingResident.emergencyContact?.phone || '',
          address: (() => {
            const emergencyAddr = editingResident.emergencyContact?.address;
            if (typeof emergencyAddr === 'string') {
              return { street: emergencyAddr, city: '', state: '', pincode: '', country: 'India' };
            }
            return emergencyAddr || { street: '', city: '', state: '', pincode: '', country: 'India' };
          })()
        },
        checkInDate: editingResident.checkInDate ? new Date(editingResident.checkInDate).toISOString().split('T')[0] : '',
        contractStartDate: editingResident.contractStartDate ? new Date(editingResident.contractStartDate).toISOString().split('T')[0] : '',
        status: editingResident.status || 'pending'
      });
    } else {
      // Reset form for new resident
      setFormData(getInitialFormData());
    }
  }, [isOpen, editingResident]);

  // Check for duplicate email
  const checkDuplicateEmail = useCallback(async (email) => {
    if (!email || !email.trim() || !selectedBranch) return null;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return null; // Don't check if invalid format

    // In edit mode, skip duplicate check if email hasn't changed
    if (editingResident && editingResident.email && email.toLowerCase().trim() === editingResident.email.toLowerCase().trim()) {
      return null;
    }

    setCheckingDuplicate(prev => ({ ...prev, email: true }));
    try {
      const apiBase = getApiBaseUrl();
      const cleanEmail = email.toLowerCase().trim();
      const response = await fetch(`${apiBase}/residents?email=${encodeURIComponent(cleanEmail)}&limit=1`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to check duplicate email:', response.statusText);
        return null;
      }
      
      const data = await response.json();
      
      // Handle different response formats
      const residents = data.data?.residents || data.data?.data || data.residents || (Array.isArray(data.data) ? data.data : []);
      
      console.log('🔍 Duplicate email check result:', { email: cleanEmail, found: residents.length, residents });
      
      if (Array.isArray(residents) && residents.length > 0) {
        const existingResident = residents[0];
        // In edit mode, allow if it's the same resident
        if (editingResident && existingResident._id === editingResident._id) {
          console.log('✅ Same resident in edit mode, allowing');
          return null;
        }
        // In add mode or different resident, it's a duplicate
        console.log('❌ Duplicate email found:', existingResident);
        return 'This email is already registered to another resident';
      }
      console.log('✅ No duplicate email found');
      return null;
    } catch (error) {
      console.error('Error checking duplicate email:', error);
      return null;
    } finally {
      setCheckingDuplicate(prev => ({ ...prev, email: false }));
    }
  }, [selectedBranch, editingResident]);

  // Check for duplicate phone
  const checkDuplicatePhone = useCallback(async (phone) => {
    if (!phone || !phone.trim() || !selectedBranch) return null;
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) return null; // Don't check if invalid format

    // In edit mode, skip duplicate check if phone hasn't changed
    if (editingResident && editingResident.phone && cleanPhone === editingResident.phone.replace(/\D/g, '')) {
      return null;
    }

    setCheckingDuplicate(prev => ({ ...prev, phone: true }));
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/residents?phone=${cleanPhone}&limit=1`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to check duplicate phone:', response.statusText);
        return null;
      }
      
      const data = await response.json();
      
      // Handle different response formats
      const residents = data.data?.residents || data.data?.data || data.residents || (Array.isArray(data.data) ? data.data : []);
      
      console.log('🔍 Duplicate phone check result:', { phone: cleanPhone, found: residents.length, residents });
      
      if (Array.isArray(residents) && residents.length > 0) {
        const existingResident = residents[0];
        // In edit mode, allow if it's the same resident
        if (editingResident && existingResident._id === editingResident._id) {
          console.log('✅ Same resident in edit mode, allowing');
          return null;
        }
        // In add mode or different resident, it's a duplicate
        console.log('❌ Duplicate phone found:', existingResident);
        return 'This phone number is already registered to another resident';
      }
      console.log('✅ No duplicate phone found');
      return null;
    } catch (error) {
      console.error('Error checking duplicate phone:', error);
      return null;
    } finally {
      setCheckingDuplicate(prev => ({ ...prev, phone: false }));
    }
  }, [selectedBranch, editingResident]);

  // Validation functions
  const validateField = (name, value, formDataContext = formData) => {
    let error = '';

    switch (name) {
      case 'firstName':
        if (!value || value.trim() === '') {
          error = 'First name is required';
        } else if (value.trim().length < 2) {
          error = 'First name must be at least 2 characters';
        } else if (value.trim().length > 50) {
          error = 'First name cannot exceed 50 characters';
        }
        break;
      case 'lastName':
        if (!value || value.trim() === '') {
          error = 'Last name is required';
        } else if (value.trim().length < 2) {
          error = 'Last name must be at least 2 characters';
        } else if (value.trim().length > 50) {
          error = 'Last name cannot exceed 50 characters';
        }
        break;
      case 'email':
        if (value && value.trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            error = 'Please enter a valid email address';
          }
        }
        break;
      case 'phone':
        if (!value || value.trim() === '') {
          error = 'Phone number is required';
        } else {
          const cleanPhone = value.replace(/\D/g, '');
          if (cleanPhone.length !== 10) {
            error = 'Phone number must be 10 digits';
          }
        }
        break;
      case 'dateOfBirth':
        if (!value) {
          error = 'Date of birth is required';
        } else {
          const dob = new Date(value);
          const today = new Date();
          if (dob > today) {
            error = 'Date of birth cannot be in the future';
          }
          const age = today.getFullYear() - dob.getFullYear();
          if (age < 18 || age > 100) {
            error = 'Age must be between 18 and 100 years';
          }
        }
        break;
      case 'gender':
        if (!value || value === '') {
          error = 'Gender is required';
        }
        break;
      case 'permanentAddress.street':
        if (!value || value.trim() === '') {
          error = 'Street address is required';
        }
        break;
      case 'permanentAddress.city':
        if (!value || value.trim() === '') {
          error = 'City is required';
        }
        break;
      case 'permanentAddress.state':
        if (!value || value.trim() === '') {
          error = 'State is required';
        }
        break;
      case 'permanentAddress.pincode':
        if (!value || value.trim() === '') {
          error = 'Pincode is required';
        } else if (!/^\d{6}$/.test(value.trim())) {
          error = 'Pincode must be 6 digits';
        }
        break;
      case 'emergencyContact.name':
        if (!value || value.trim() === '') {
          error = 'Emergency contact name is required';
        }
        break;
      case 'emergencyContact.relationship':
        if (!value || value.trim() === '') {
          error = 'Relationship is required';
        }
        break;
      case 'emergencyContact.phone':
        if (!value || value.trim() === '') {
          error = 'Emergency contact phone is required';
        } else {
          const cleanPhone = value.replace(/\D/g, '');
          if (cleanPhone.length !== 10) {
            error = 'Phone number must be 10 digits';
          }
        }
        break;
      case 'emergencyContact.address.street':
        if (!value || value.trim() === '') {
          error = 'Emergency contact street address is required';
        }
        break;
      case 'emergencyContact.address.city':
        if (!value || value.trim() === '') {
          error = 'Emergency contact city is required';
        }
        break;
      case 'emergencyContact.address.state':
        if (!value || value.trim() === '') {
          error = 'Emergency contact state is required';
        }
        break;
      case 'emergencyContact.address.pincode':
        if (!value || value.trim() === '') {
          error = 'Emergency contact pincode is required';
        } else if (!/^\d{6}$/.test(value.trim())) {
          error = 'Pincode must be 6 digits';
        }
        break;
      case 'checkInDate':
        if (!value) {
          error = 'Check-in date is required';
        }
        break;
      case 'contractStartDate':
        if (!value) {
          error = 'Contract start date is required';
        }
        break;
      default:
        break;
    }

    return error;
  };

  // Validate all fields
  const validateForm = async () => {
    const newErrors = {};
    const currentFormData = formData || getInitialFormData();
    
    // Basic info
    const firstNameError = validateField('firstName', currentFormData.firstName);
    if (firstNameError) newErrors['firstName'] = firstNameError;

    const lastNameError = validateField('lastName', currentFormData.lastName);
    if (lastNameError) newErrors['lastName'] = lastNameError;

    const emailError = validateField('email', currentFormData.email);
    if (emailError) newErrors['email'] = emailError;

    const phoneError = validateField('phone', currentFormData.phone);
    if (phoneError) newErrors['phone'] = phoneError;

    const dateOfBirthError = validateField('dateOfBirth', currentFormData.dateOfBirth);
    if (dateOfBirthError) newErrors['dateOfBirth'] = dateOfBirthError;

    const genderError = validateField('gender', currentFormData.gender);
    if (genderError) newErrors['gender'] = genderError;

    // Permanent address
    const streetError = validateField('permanentAddress.street', currentFormData.permanentAddress?.street);
    if (streetError) newErrors['permanentAddress.street'] = streetError;

    const cityError = validateField('permanentAddress.city', currentFormData.permanentAddress?.city);
    if (cityError) newErrors['permanentAddress.city'] = cityError;

    const stateError = validateField('permanentAddress.state', currentFormData.permanentAddress?.state);
    if (stateError) newErrors['permanentAddress.state'] = stateError;

    const pincodeError = validateField('permanentAddress.pincode', currentFormData.permanentAddress?.pincode);
    if (pincodeError) newErrors['permanentAddress.pincode'] = pincodeError;

    // Emergency contact
    const emergencyNameError = validateField('emergencyContact.name', currentFormData.emergencyContact?.name);
    if (emergencyNameError) newErrors['emergencyContact.name'] = emergencyNameError;

    const relationshipError = validateField('emergencyContact.relationship', currentFormData.emergencyContact?.relationship);
    if (relationshipError) newErrors['emergencyContact.relationship'] = relationshipError;

    const emergencyPhoneError = validateField('emergencyContact.phone', currentFormData.emergencyContact?.phone);
    if (emergencyPhoneError) newErrors['emergencyContact.phone'] = emergencyPhoneError;

    const emergencyStreetError = validateField('emergencyContact.address.street', currentFormData.emergencyContact?.address?.street);
    if (emergencyStreetError) newErrors['emergencyContact.address.street'] = emergencyStreetError;

    const emergencyCityError = validateField('emergencyContact.address.city', currentFormData.emergencyContact?.address?.city);
    if (emergencyCityError) newErrors['emergencyContact.address.city'] = emergencyCityError;

    const emergencyStateError = validateField('emergencyContact.address.state', currentFormData.emergencyContact?.address?.state);
    if (emergencyStateError) newErrors['emergencyContact.address.state'] = emergencyStateError;

    const emergencyPincodeError = validateField('emergencyContact.address.pincode', currentFormData.emergencyContact?.address?.pincode);
    if (emergencyPincodeError) newErrors['emergencyContact.address.pincode'] = emergencyPincodeError;

    // Dates
    const checkInDateError = validateField('checkInDate', currentFormData.checkInDate);
    if (checkInDateError) newErrors['checkInDate'] = checkInDateError;

    const contractStartDateError = validateField('contractStartDate', currentFormData.contractStartDate);
    if (contractStartDateError) newErrors['contractStartDate'] = contractStartDateError;

    // Check for duplicates (always check, but allow same resident in edit mode)
    if (currentFormData.email && currentFormData.email.trim()) {
      console.log('🔍 Validating duplicate email:', currentFormData.email);
      const duplicateEmail = await checkDuplicateEmail(currentFormData.email);
      if (duplicateEmail) {
        console.log('❌ Duplicate email error:', duplicateEmail);
        newErrors['email'] = duplicateEmail;
      }
    }

    if (currentFormData.phone && currentFormData.phone.trim()) {
      const cleanPhone = currentFormData.phone.replace(/\D/g, '');
      console.log('🔍 Validating duplicate phone:', cleanPhone);
      const duplicatePhone = await checkDuplicatePhone(currentFormData.phone);
      if (duplicatePhone) {
        console.log('❌ Duplicate phone error:', duplicatePhone);
        newErrors['phone'] = duplicatePhone;
      }
    }

    console.log('📊 Validation errors:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('✅ Form is valid:', isValid);
    return isValid;
  };

  // Check if form is valid
  const isFormValid = () => {
    const currentFormData = formData || getInitialFormData();
    // Basic required fields
    if (!currentFormData.firstName || !currentFormData.lastName || !currentFormData.phone || !currentFormData.dateOfBirth || !currentFormData.gender) {
      return false;
    }
    // Address required
    if (!currentFormData.permanentAddress?.street || !currentFormData.permanentAddress?.city || !currentFormData.permanentAddress?.state || !currentFormData.permanentAddress?.pincode) {
      return false;
    }
    // Emergency contact required
    if (!currentFormData.emergencyContact?.name || !currentFormData.emergencyContact?.relationship || !currentFormData.emergencyContact?.phone) {
      return false;
    }
    // Emergency address required
    if (!currentFormData.emergencyContact?.address?.street || !currentFormData.emergencyContact?.address?.city || !currentFormData.emergencyContact?.address?.state || !currentFormData.emergencyContact?.address?.pincode) {
      return false;
    }
    // Dates required
    if (!currentFormData.checkInDate || !currentFormData.contractStartDate) {
      return false;
    }
    // Phone validation - must be 10 digits
    if (currentFormData.phone) {
      const cleanPhone = currentFormData.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return false;
      }
    }
    // No errors (including duplicate errors)
    if (Object.keys(errors).length > 0) {
      return false;
    }
    return true;
  };

  // Handle input change with validation - memoized to prevent re-creation
  const handleChange = useCallback((field, value) => {
    // Update form data
    if (field.includes('.')) {
      const parts = field.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData(prev => {
          const current = prev || getInitialFormData();
          return {
            ...current,
        [parent]: {
              ...(current[parent] || {}),
          [child]: value
        }
          };
        });
      } else if (parts.length === 3) {
        const [parent, child, grandchild] = parts;
        setFormData(prev => {
          const current = prev || getInitialFormData();
          return {
            ...current,
            [parent]: {
              ...(current[parent] || {}),
              [child]: {
                ...(current[parent]?.[child] || {}),
                [grandchild]: value
              }
            }
          };
        });
      } else if (parts.length === 4) {
        const [parent, child, grandchild, greatGrandchild] = parts;
        setFormData(prev => {
          const current = prev || getInitialFormData();
          return {
            ...current,
            [parent]: {
              ...(current[parent] || {}),
              [child]: {
                ...(current[parent]?.[child] || {}),
                [grandchild]: {
                  ...(current[parent]?.[child]?.[grandchild] || {}),
                  [greatGrandchild]: value
                }
              }
            }
          };
        });
      }
    } else {
      setFormData(prev => {
        const current = prev || getInitialFormData();
        return {
          ...current,
        [field]: value
        };
      });
    }

    // Clear error for this field if it was touched
    if (touched[field] && errors[field]) {
      // Get the current value for validation
      const currentValue = field.includes('.') ? getNestedValue({ ...formData, [field.split('.')[0]]: { ...formData[field.split('.')[0]], [field.split('.')[1]]: value } }, field) : value;
      const error = validateField(field, currentValue);
      if (error) {
        setErrors({ ...errors, [field]: error });
      } else {
        const newErrors = { ...errors };
        delete newErrors[field];
        setErrors(newErrors);
      }
    }
  }, [touched, errors]);

  // Handle blur event with duplicate checking - memoized to prevent re-creation
  const handleBlur = useCallback(async (name) => {
    setTouched({ ...touched, [name]: true });
    const currentFormData = formData || getInitialFormData();
    const fieldValue = name.includes('.') ? getNestedValue(currentFormData, name) : currentFormData[name];
    const error = validateField(name, fieldValue);
    if (error) {
      setErrors({ ...errors, [name]: error });
    } else {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);

      // Check for duplicates on blur (always check, but allow same resident in edit mode)
      if (name === 'email' && currentFormData.email && currentFormData.email.trim()) {
        const duplicateError = await checkDuplicateEmail(currentFormData.email);
        if (duplicateError) {
          setErrors({ ...newErrors, email: duplicateError });
        }
      } else if (name === 'phone' && currentFormData.phone && currentFormData.phone.trim()) {
        const duplicateError = await checkDuplicatePhone(currentFormData.phone);
        if (duplicateError) {
          setErrors({ ...newErrors, phone: duplicateError });
        }
      }
    }
  }, [formData, errors, touched, editingResident, checkDuplicateEmail, checkDuplicatePhone]);


  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender',
      'permanentAddress.street', 'permanentAddress.city', 'permanentAddress.state', 'permanentAddress.pincode',
      'emergencyContact.name', 'emergencyContact.relationship', 'emergencyContact.phone',
      'emergencyContact.address.street', 'emergencyContact.address.city', 'emergencyContact.address.state', 'emergencyContact.address.pincode',
      'checkInDate', 'contractStartDate'
    ];
    
    allFields.forEach(field => {
      setTouched(prev => ({ ...prev, [field]: true }));
    });
    
    // Validate form (this includes duplicate checking)
    const isValid = await validateForm();
    if (!isValid) {
      setIsSubmitting(false);
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus();
        }
      }
      return;
    }

    // Double-check for duplicates before submission (safety check)
    const currentFormData = formData || getInitialFormData();
    if (currentFormData.email && currentFormData.email.trim()) {
      const duplicateEmail = await checkDuplicateEmail(currentFormData.email);
      if (duplicateEmail) {
        setErrors(prev => ({ ...prev, email: duplicateEmail }));
        setTouched(prev => ({ ...prev, email: true }));
        setIsSubmitting(false);
        toast.error('Please fix the errors before submitting');
        return;
      }
    }

    if (currentFormData.phone && currentFormData.phone.trim()) {
      const duplicatePhone = await checkDuplicatePhone(currentFormData.phone);
      if (duplicatePhone) {
        setErrors(prev => ({ ...prev, phone: duplicatePhone }));
        setTouched(prev => ({ ...prev, phone: true }));
        setIsSubmitting(false);
        toast.error('Please fix the errors before submitting');
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      // Transform data to match backend expectations (currentFormData already defined above)
      const submitData = { ...currentFormData };
      
      // Convert workAddress object to string if it's an object
      if (submitData.workDetails?.workAddress && typeof submitData.workDetails.workAddress === 'object') {
        const addr = submitData.workDetails.workAddress;
        const addressParts = [];
        if (addr.street) addressParts.push(addr.street);
        if (addr.city) addressParts.push(addr.city);
        if (addr.state) addressParts.push(addr.state);
        if (addr.pincode) addressParts.push(addr.pincode);
        submitData.workDetails.workAddress = addressParts.join(', ') || '';
      }
      
      // Convert emergencyContact.address object to string if it's an object
      if (submitData.emergencyContact?.address && typeof submitData.emergencyContact.address === 'object') {
        const addr = submitData.emergencyContact.address;
        const addressParts = [];
        if (addr.street) addressParts.push(addr.street);
        if (addr.city) addressParts.push(addr.city);
        if (addr.state) addressParts.push(addr.state);
        if (addr.pincode) addressParts.push(addr.pincode);
        submitData.emergencyContact.address = addressParts.join(', ') || '';
      }
      
      // Clean phone number (remove non-digits)
      if (submitData.phone) {
        submitData.phone = submitData.phone.replace(/\D/g, '');
      }
      if (submitData.emergencyContact?.phone) {
        submitData.emergencyContact.phone = submitData.emergencyContact.phone.replace(/\D/g, '');
      }
      
      // Lowercase email if provided
      if (submitData.email) {
        submitData.email = submitData.email.toLowerCase().trim();
      }

      const result = await onSubmit(submitData);
      
      if (result && result.success !== false) {
        onClose();
        toast.success(editingResident ? 'Resident updated successfully' : 'Resident created successfully');
      } else {
        if (result && result.message) {
          // Check if it's a duplicate error (status code 409 or message contains "already")
          const isDuplicateError = result.statusCode === 409 || 
            (result.message.toLowerCase().includes('email') && result.message.toLowerCase().includes('already')) ||
            (result.message.toLowerCase().includes('phone') && result.message.toLowerCase().includes('already'));
          
          if (isDuplicateError) {
            if (result.message.toLowerCase().includes('email')) {
              setErrors(prev => ({ ...prev, email: 'This email is already registered to another resident' }));
              setTouched(prev => ({ ...prev, email: true }));
            } else if (result.message.toLowerCase().includes('phone')) {
              setErrors(prev => ({ ...prev, phone: 'This phone number is already registered to another resident' }));
              setTouched(prev => ({ ...prev, phone: true }));
            } else {
          toast.error(result.message);
            }
          } else {
            toast.error(result.message);
          }
        } else {
          toast.error('Failed to save resident. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error submitting resident:', error);
      toast.error('Failed to save resident. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Memoize handlers to prevent InputField re-renders
  // Use refs to access latest state without causing re-renders
  const formDataRef = React.useRef(formData);
  const errorsRef = React.useRef(errors);
  const touchedRef = React.useRef(touched);
  
  React.useEffect(() => {
    formDataRef.current = formData;
    errorsRef.current = errors;
    touchedRef.current = touched;
  }, [formData, errors, touched]);

  const memoizedHandleChange = useCallback((name, value) => {
    handleChange(name, value);
  }, [handleChange]);

  const memoizedHandleBlur = useCallback((name) => {
    handleBlur(name);
  }, [handleBlur]);

  if (!isOpen) return null;

  // Ensure formData is always defined
  const safeFormData = formData || getInitialFormData();

  // Helper function to get field value for InputField
  const getFieldValue = useCallback((name) => {
    if (name.includes('.')) {
      const nestedValue = getNestedValue(safeFormData, name);
      return nestedValue !== undefined && nestedValue !== null ? nestedValue : '';
    } else {
      return (safeFormData[name] !== undefined && safeFormData[name] !== null) ? safeFormData[name] : '';
    }
  }, [safeFormData]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-auto max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Compact Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingResident ? 'Edit Resident' : 'Add New Resident'}
                </h2>
                <p className="text-xs text-gray-600">
                  {editingResident ? 'Update resident information' : 'Create a new resident profile'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Basic Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center space-x-2 mb-3">
                <User className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
                  </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InputField
                  label="First Name"
                  name="firstName"
                  icon={User}
                      placeholder="Enter first name"
                      required
                  value={getFieldValue('firstName')}
                  error={errors?.firstName}
                  touched={touched?.firstName}
                  onChange={memoizedHandleChange}
                  onBlur={memoizedHandleBlur}
                />
                <InputField
                  label="Last Name"
                  name="lastName"
                  icon={User}
                      placeholder="Enter last name"
                      required
                  value={getFieldValue('lastName')}
                  error={errors?.lastName}
                  touched={touched?.lastName}
                  onChange={memoizedHandleChange}
                  onBlur={memoizedHandleBlur}
                />
                <InputField
                  label="Email"
                  name="email"
                        type="email"
                  icon={Mail}
                  placeholder="Enter email address (optional)"
                  value={getFieldValue('email')}
                  error={errors?.email}
                  touched={touched?.email}
                  onChange={memoizedHandleChange}
                  onBlur={memoizedHandleBlur}
                />
                <InputField
                  label="Phone"
                  name="phone"
                        type="tel"
                  icon={Phone}
                  placeholder="Enter 10-digit phone number"
                        required
                  value={getFieldValue('phone')}
                  error={errors?.phone}
                  touched={touched?.phone}
                  onChange={memoizedHandleChange}
                  onBlur={memoizedHandleBlur}
                />
                <InputField
                  label="Date of Birth"
                  name="dateOfBirth"
                        type="date"
                  icon={Calendar}
                  placeholder="Select date of birth"
                        required
                  value={getFieldValue('dateOfBirth')}
                  error={errors?.dateOfBirth}
                  touched={touched?.dateOfBirth}
                  onChange={memoizedHandleChange}
                  onBlur={memoizedHandleBlur}
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Gender <span className="text-red-500">*</span>
                  </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                    onBlur={() => handleBlur('gender')}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 transition-all duration-200 text-sm ${
                      errors.gender && touched.gender
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : touched.gender && !errors.gender
                        ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-transparent hover:border-gray-400'
                    }`}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  {errors.gender && touched.gender && (
                    <div className="flex items-center space-x-1 text-xs text-red-600 mt-1">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      <span>{errors.gender}</span>
                    </div>
                  )}
                  </div>
                </div>
              </div>

              {/* Permanent Address */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-900">Permanent Address</h3>
                  </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="md:col-span-2 lg:col-span-4">
                  <InputField
                    label="Street Address"
                    name="permanentAddress.street"
                    icon={MapPin}
                      placeholder="Enter street address"
                      required
                    value={getFieldValue('permanentAddress.street')}
                    error={errors?.['permanentAddress.street']}
                    touched={touched?.['permanentAddress.street']}
                    onChange={memoizedHandleChange}
                    onBlur={memoizedHandleBlur}
                    />
                  </div>
                <InputField
                  label="City"
                  name="permanentAddress.city"
                      placeholder="Enter city"
                      required
                  value={getFieldValue('permanentAddress.city')}
                  error={errors?.['permanentAddress.city']}
                  touched={touched?.['permanentAddress.city']}
                  onChange={memoizedHandleChange}
                  onBlur={memoizedHandleBlur}
                />
                <InputField
                  label="State"
                  name="permanentAddress.state"
                      placeholder="Enter state"
                      required
                  value={getFieldValue('permanentAddress.state')}
                  error={errors?.['permanentAddress.state']}
                  touched={touched?.['permanentAddress.state']}
                  onChange={memoizedHandleChange}
                  onBlur={memoizedHandleBlur}
                />
                <InputField
                  label="Pincode"
                  name="permanentAddress.pincode"
                  placeholder="Enter 6-digit pincode"
                      required
                  value={getFieldValue('permanentAddress.pincode')}
                  error={errors?.['permanentAddress.pincode']}
                  touched={touched?.['permanentAddress.pincode']}
                  onChange={memoizedHandleChange}
                  onBlur={memoizedHandleBlur}
                    />
                </div>
              </div>

            {/* Work Details (Optional) */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
              <div className="flex items-center space-x-2 mb-3">
                <Briefcase className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-900">Work Details <span className="text-xs font-normal text-gray-500">(Optional)</span></h3>
                  </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Company"
                  name="workDetails.company"
                      placeholder="Enter company name"
                  value={getFieldValue('workDetails.company')}
                  error={errors?.['workDetails.company']}
                  touched={touched?.['workDetails.company']}
                  onChange={memoizedHandleChange}
                  onBlur={memoizedHandleBlur}
                />
                <InputField
                  label="Designation"
                  name="workDetails.designation"
                      placeholder="Enter job title"
                  value={getFieldValue('workDetails.designation')}
                  error={errors?.['workDetails.designation']}
                  touched={touched?.['workDetails.designation']}
                  onChange={memoizedHandleChange}
                  onBlur={memoizedHandleBlur}
                    />
                <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Work Address</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="md:col-span-2 lg:col-span-4">
                      <InputField
                        label="Street"
                        name="workDetails.workAddress.street"
                        placeholder="Enter street address"
                        value={getFieldValue('workDetails.workAddress.street')}
                        error={errors?.['workDetails.workAddress.street']}
                        touched={touched?.['workDetails.workAddress.street']}
                        onChange={memoizedHandleChange}
                        onBlur={memoizedHandleBlur}
                      />
                    </div>
                    <InputField
                      label="City"
                      name="workDetails.workAddress.city"
                      placeholder="Enter city"
                      value={getFieldValue('workDetails.workAddress.city')}
                      error={errors?.['workDetails.workAddress.city']}
                      touched={touched?.['workDetails.workAddress.city']}
                      onChange={memoizedHandleChange}
                      onBlur={memoizedHandleBlur}
                    />
                    <InputField
                      label="State"
                      name="workDetails.workAddress.state"
                      placeholder="Enter state"
                      value={getFieldValue('workDetails.workAddress.state')}
                      error={errors?.['workDetails.workAddress.state']}
                      touched={touched?.['workDetails.workAddress.state']}
                      onChange={memoizedHandleChange}
                      onBlur={memoizedHandleBlur}
                    />
                    <InputField
                      label="Pincode"
                      name="workDetails.workAddress.pincode"
                      placeholder="Enter pincode"
                      value={getFieldValue('workDetails.workAddress.pincode')}
                      error={errors?.['workDetails.workAddress.pincode']}
                      touched={touched?.['workDetails.workAddress.pincode']}
                      onChange={memoizedHandleChange}
                      onBlur={memoizedHandleBlur}
                    />
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h3 className="text-sm font-semibold text-gray-900">Emergency Contact</h3>
                  </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <InputField
                  label="Contact Name"
                  name="emergencyContact.name"
                  icon={User}
                      placeholder="Enter contact name"
                      required
                  value={getFieldValue('emergencyContact.name')}
                  error={errors?.['emergencyContact.name']}
                  touched={touched?.['emergencyContact.name']}
                  onChange={memoizedHandleChange}
                  onBlur={memoizedHandleBlur}
                />
                <InputField
                  label="Relationship"
                  name="emergencyContact.relationship"
                      placeholder="e.g., Father, Mother, Sibling"
                      required
                  value={getFieldValue('emergencyContact.relationship')}
                  error={errors?.['emergencyContact.relationship']}
                  touched={touched?.['emergencyContact.relationship']}
                  onChange={memoizedHandleChange}
                  onBlur={memoizedHandleBlur}
                />
                <InputField
                  label="Contact Phone"
                  name="emergencyContact.phone"
                        type="tel"
                  icon={Phone}
                  placeholder="Enter 10-digit phone number"
                        required
                  value={getFieldValue('emergencyContact.phone')}
                  error={errors?.['emergencyContact.phone']}
                  touched={touched?.['emergencyContact.phone']}
                  onChange={memoizedHandleChange}
                  onBlur={memoizedHandleBlur}
                />
                <div className="md:col-span-2 lg:col-span-4 space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Contact Address <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="md:col-span-2 lg:col-span-4">
                      <InputField
                        label="Street"
                        name="emergencyContact.address.street"
                        placeholder="Enter street address"
                        required
                        value={getFieldValue('emergencyContact.address.street')}
                        error={errors?.['emergencyContact.address.street']}
                        touched={touched?.['emergencyContact.address.street']}
                        onChange={memoizedHandleChange}
                        onBlur={memoizedHandleBlur}
                      />
                    </div>
                    <InputField
                      label="City"
                      name="emergencyContact.address.city"
                      placeholder="Enter city"
                          required
                      value={getFieldValue('emergencyContact.address.city')}
                      error={errors?.['emergencyContact.address.city']}
                      touched={touched?.['emergencyContact.address.city']}
                      onChange={memoizedHandleChange}
                      onBlur={memoizedHandleBlur}
                    />
                    <InputField
                      label="State"
                      name="emergencyContact.address.state"
                      placeholder="Enter state"
                          required
                      value={getFieldValue('emergencyContact.address.state')}
                      error={errors?.['emergencyContact.address.state']}
                      touched={touched?.['emergencyContact.address.state']}
                      onChange={memoizedHandleChange}
                      onBlur={memoizedHandleBlur}
                    />
                    <InputField
                      label="Pincode"
                      name="emergencyContact.address.pincode"
                      placeholder="Enter 6-digit pincode"
                      required
                      value={getFieldValue('emergencyContact.address.pincode')}
                      error={errors?.['emergencyContact.address.pincode']}
                      touched={touched?.['emergencyContact.address.pincode']}
                      onChange={memoizedHandleChange}
                      onBlur={memoizedHandleBlur}
                    />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates and Status */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-100">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-4 w-4 text-orange-600" />
                <h3 className="text-sm font-semibold text-gray-900">Dates and Status</h3>
                  </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InputField
                  label="Check-in Date"
                  name="checkInDate"
                        type="date"
                  icon={Calendar}
                  placeholder="Select check-in date"
                        required
                  value={getFieldValue('checkInDate')}
                  error={errors?.checkInDate}
                  touched={touched?.checkInDate}
                  onChange={memoizedHandleChange}
                  onBlur={memoizedHandleBlur}
                />
                <InputField
                  label="Contract Start Date"
                  name="contractStartDate"
                        type="date"
                  icon={Calendar}
                  placeholder="Select contract start date"
                        required
                  value={getFieldValue('contractStartDate')}
                  error={errors?.contractStartDate}
                  touched={touched?.contractStartDate}
                  onChange={memoizedHandleChange}
                  onBlur={memoizedHandleBlur}
                      />
                <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm hover:border-gray-400 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="moved_out">Moved Out</option>
                    </select>
                  </div>
                </div>
              </div>
          </form>

          {/* Sticky Footer */}
          <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all duration-200 text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormValid()}
              className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <Save className="h-3 w-3" />
              )}
              <span>{editingResident ? 'Update Resident' : 'Add Resident'}</span>
              </button>
            </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ResidentForm; 
