import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Save,
  X,
  AlertCircle,
  Users,
  Wifi,
  Snowflake,
  Utensils,
  Sparkles,
  Shield,
  Car,
  Dumbbell,
  Tv,
  Refrigerator,
  Droplets,
  Sofa,
  Check,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import branchService from '../../services/branch.service';
import maintainerService from '../../services/maintainer.service';
import { useDispatch, useSelector } from 'react-redux';
import { updateAuthState } from '../../store/slices/authSlice';
import { addBranch, setSelectedBranch, fetchBranches } from '../../store/slices/branch.slice';

const DefaultBranchModal = ({
  isOpen,
  onClose,
  onBranchCreated,
  pgId
}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [maintainers, setMaintainers] = useState([]);
  const [maintainersLoading, setMaintainersLoading] = useState(false);
  const [showMaintainerDropdown, setShowMaintainerDropdown] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
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
    maintainerId: '', // Changed from maintainer object to maintainerId
    capacity: {
      totalRooms: 0,
      totalBeds: 0,
      availableRooms: 0
    },
    amenities: [],
    status: 'active',
    isDefault: true
  });

  const amenitiesList = [
    { name: 'WiFi', icon: Wifi, color: 'blue' },
    { name: 'AC', icon: Snowflake, color: 'cyan' },
    { name: 'Food', icon: Utensils, color: 'orange' },
    { name: 'Cleaning', icon: Sparkles, color: 'green' },
    { name: 'Security', icon: Shield, color: 'red' },
    { name: 'Parking', icon: Car, color: 'gray' },
    { name: 'Gym', icon: Dumbbell, color: 'pink' },
    { name: 'TV', icon: Tv, color: 'indigo' },
    { name: 'Refrigerator', icon: Refrigerator, color: 'yellow' },
    { name: 'Geyser', icon: Droplets, color: 'blue' },
    { name: 'Furnished', icon: Sofa, color: 'brown' }
  ];

  // Fetch maintainers when modal opens and reset form
  useEffect(() => {
    if (isOpen && pgId) {
      fetchMaintainers();
      // Reset form when modal opens
      setFormData({
        name: '',
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
        maintainerId: '',
        capacity: {
          totalRooms: 0,
          totalBeds: 0,
          availableRooms: 0
        },
        amenities: [],
        status: 'active',
        isDefault: true
      });
      setShowMaintainerDropdown(false);
    }
  }, [isOpen, pgId]);

  // Fetch maintainers from API
  const fetchMaintainers = async () => {
    try {
      setMaintainersLoading(true);
      const response = await maintainerService.getAllMaintainers();
      if (response.success && response.data && Array.isArray(response.data.maintainers)) {
        setMaintainers(response.data.maintainers);
      } else {
        console.warn('Invalid maintainers response:', response);
        setMaintainers([]);
      }
    } catch (error) {
      console.error('Error fetching maintainers:', error);
      toast.error('Failed to load maintainers');
      setMaintainers([]);
    } finally {
      setMaintainersLoading(false);
    }
  };

  // Handle maintainer selection and auto-fill contact info
  const handleMaintainerSelect = (maintainer) => {
    const maintainerUser = maintainer.user || maintainer;
    const phone = maintainerUser.phone || maintainer.mobile || maintainer.phone || '';
    const email = maintainerUser.email || maintainer.email || '';
    
    setFormData(prev => ({
      ...prev,
      maintainerId: maintainer._id,
      contact: {
        ...prev.contact,
        phone: phone,
        email: email,
        // Keep alternate phone if already filled, otherwise leave empty
        alternatePhone: prev.contact.alternatePhone || ''
      }
    }));
    setShowMaintainerDropdown(false);
  };

  // Get selected maintainer details
  const getSelectedMaintainer = () => {
    if (!Array.isArray(maintainers)) {
      return null;
    }
    return maintainers.find(m => m._id === formData.maintainerId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMaintainerDropdown && !event.target.closest('.maintainer-dropdown')) {
        setShowMaintainerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMaintainerDropdown]);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleAmenityToggle = (amenityName) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityName)
        ? prev.amenities.filter(a => a !== amenityName)
        : [...prev.amenities, amenityName]
    }));
  };

  const validateForm = () => {
    const { name, address, contact, maintainerId } = formData;

    // Validate name
    if (!name || name.trim() === '') {
      toast.error('Branch name is required');
      return false;
    }

    // Validate address
    if (!address.street || !address.city || !address.state || !address.pincode) {
      toast.error('Please fill in all address fields (street, city, state, pincode)');
      return false;
    }

    // Validate contact
    if (!contact.phone || !contact.email) {
      toast.error('Contact phone and email are required');
      return false;
    }

    // Validate maintainer selection
    if (!maintainerId) {
      toast.error('Please select a maintainer for this branch');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Ensure pgId is provided
    if (!pgId) {
      toast.error('PG ID is required. Please contact support.');
      return;
    }
    
    // Validate form
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Validate maintainer selection
      if (!formData.maintainerId) {
        toast.error('Please select a maintainer for this branch');
        return;
      }

      console.log('DefaultBranchModal: Creating branch with maintainerId:', formData.maintainerId);
      console.log('DefaultBranchModal: Using pgId:', pgId);

      // Prepare branch data to match backend requirements
      const branchData = {
        pgId: pgId,
        name: formData.name.trim(),
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          pincode: formData.address.pincode.trim(),
          landmark: (formData.address.landmark || '').trim()
        },
        maintainerId: formData.maintainerId, // Use maintainerId instead of maintainer details
        contact: {
          phone: formData.contact.phone.trim(),
          email: formData.contact.email.trim(),
          alternatePhone: (formData.contact.alternatePhone || '').trim()
        },
        capacity: {
          totalRooms: formData.capacity.totalRooms || 0,
          totalBeds: formData.capacity.totalBeds || 0,
          availableRooms: formData.capacity.availableRooms || 0
        },
        amenities: formData.amenities || [],
        status: formData.status || 'active',
        isDefault: true  // Always set as default branch
      };
      
      // Log the prepared data for debugging
      console.log('Branch Creation Data:', branchData);
      
      const response = await branchService.createBranch(branchData);
      
      if (response.success) {
        toast.success('Default branch created successfully!');

        // Get the created branch from response
        const createdBranch = response.data.branch || response.data;
        
        // Update auth state to mark default branch as set and store branch ID
        dispatch(updateAuthState({
          default_branch: true,
          defaultBranchId: createdBranch._id,
          // Also update the user data if provided in response
          ...(response.data.user && {
            default_branch: response.data.user.defaultBranch,
            defaultBranchId: response.data.user.defaultBranchId
          })
        }));

        // Add the new branch to Redux and automatically select it
        dispatch(addBranch(createdBranch));
        dispatch(setSelectedBranch(createdBranch));
        
        // Refresh branches list to ensure consistency
        dispatch(fetchBranches());

        console.log('DefaultBranchModal: Branch created successfully:', response.data);
        console.log('DefaultBranchModal: Auto-selected branch:', createdBranch);

        // Call onBranchCreated callback if provided
        onBranchCreated && onBranchCreated(response.data);

        // Close the modal
        onClose();
      } else {
        toast.error(response.message || 'Failed to create branch');
        console.error('Branch creation error:', response);
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      toast.error('An error occurred while creating the branch');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Set Up Default Branch</h2>
              <p className="text-sm text-gray-600">Configure your first PG branch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Basic Information */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Building2 className="h-4 w-4 mr-2 text-blue-600" />
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter branch name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-green-600" />
              Address Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Street *</label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter street address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter city"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter state"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                <input
                  type="text"
                  value={formData.address.pincode}
                  onChange={(e) => handleInputChange('address', 'pincode', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter pincode"
                  pattern="[0-9]{6}"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Landmark</label>
                <input
                  type="text"
                  value={formData.address.landmark}
                  onChange={(e) => handleInputChange('address', 'landmark', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter landmark (optional)"
                />
              </div>
            </div>
          </div>

          {/* Maintainer Selection - Moved before Contact */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <UserCheck className="h-4 w-4 mr-2 text-orange-600" />
              Select Maintainer
            </h4>

            {/* Maintainer Dropdown */}
            <div className="relative maintainer-dropdown">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch Maintainer <span className="text-red-500">*</span>
              </label>
              <div className="relative maintainer-dropdown">
                <button
                  type="button"
                  onClick={() => setShowMaintainerDropdown(!showMaintainerDropdown)}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between transition-all ${
                    formData.maintainerId 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    {getSelectedMaintainer() ? (
                      <>
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-white font-semibold text-xs">
                            {((getSelectedMaintainer().user?.firstName || getSelectedMaintainer().firstName || 'U').charAt(0) + 
                              (getSelectedMaintainer().user?.lastName || getSelectedMaintainer().lastName || '').charAt(0)).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {(getSelectedMaintainer().user?.firstName || getSelectedMaintainer().firstName || 'Unknown')} {(getSelectedMaintainer().user?.lastName || getSelectedMaintainer().lastName || '')}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {getSelectedMaintainer().user?.email || getSelectedMaintainer().email} • {getSelectedMaintainer().user?.phone || getSelectedMaintainer().mobile || getSelectedMaintainer().phone}
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-500">Select a maintainer for this branch</span>
                    )}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${showMaintainerDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Options */}
                {showMaintainerDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {maintainersLoading ? (
                      <div className="px-4 py-3 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <span className="text-xs">Loading maintainers...</span>
                      </div>
                    ) : (Array.isArray(maintainers) && maintainers.length > 0) ? (
                      maintainers.map((maintainer) => {
                        const firstName = maintainer.user?.firstName || maintainer.firstName || 'Unknown';
                        const lastName = maintainer.user?.lastName || maintainer.lastName || '';
                        const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
                        const isSelected = formData.maintainerId === maintainer._id;
                        
                        return (
                          <button
                            key={maintainer._id}
                            type="button"
                            onClick={() => handleMaintainerSelect(maintainer)}
                            className={`w-full px-3 py-2.5 text-left transition-all flex items-center ${
                              isSelected 
                                ? 'bg-blue-50 border-l-2 border-blue-600' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                              <span className="text-white font-semibold text-xs">{initials}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {firstName} {lastName}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {maintainer.user?.email || maintainer.email} • {maintainer.user?.phone || maintainer.mobile || maintainer.phone}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="ml-auto flex-shrink-0">
                                <Check className="h-4 w-4 text-blue-600" />
                              </div>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-center text-gray-500 text-sm">
                        No maintainers found. Please add maintainers first.
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Contact Information - Moved after Maintainer */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Phone className="h-4 w-4 mr-2 text-purple-600" />
              Contact Information
            </h4>
            {getSelectedMaintainer() && (
              <div className="mb-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 flex items-center">
                  <Check className="h-3 w-3 mr-1.5" />
                  Contact info auto-filled from selected maintainer
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.contact.phone}
                  onChange={(e) => handleInputChange('contact', 'phone', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                  pattern="[0-9]{10}"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => handleInputChange('contact', 'email', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone</label>
                <input
                  type="tel"
                  value={formData.contact.alternatePhone}
                  onChange={(e) => handleInputChange('contact', 'alternatePhone', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter alternate phone"
                  pattern="[0-9]{10}"
                />
              </div>
            </div>
          </div>

          {/* Capacity Information */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2 text-indigo-600" />
              Capacity Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Rooms</label>
                <input
                  type="number"
                  value={formData.capacity.totalRooms}
                  onChange={(e) => handleInputChange('capacity', 'totalRooms', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter total rooms"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Beds</label>
                <input
                  type="number"
                  value={formData.capacity.totalBeds}
                  onChange={(e) => handleInputChange('capacity', 'totalBeds', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter total beds"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Rooms</label>
                <input
                  type="number"
                  value={formData.capacity.availableRooms}
                  onChange={(e) => handleInputChange('capacity', 'availableRooms', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter available rooms"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-pink-600" />
              Amenities (Optional)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {amenitiesList.map(amenity => {
                const Icon = amenity.icon;
                const isSelected = formData.amenities.includes(amenity.name);
                return (
                  <button
                    key={amenity.name}
                    type="button"
                    onClick={() => handleAmenityToggle(amenity.name)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-1.5 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium">{amenity.name}</span>
                    {isSelected && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {formData.amenities.length > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                Selected: {formData.amenities.join(', ')}
              </div>
            )}
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This branch will be set as your default branch.
                You can modify branch details later in settings.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              <span>Create Branch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DefaultBranchModal;
