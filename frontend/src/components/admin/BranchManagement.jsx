import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Star, MapPin, Phone, Mail, Users, X, Check, Wifi, Snowflake, Utensils, Sparkles, Shield, Car, Dumbbell, Tv, Refrigerator, Droplets, Sofa ,Trash2, CheckCircle, Settings} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import branchService from '../../services/branch.service';
import maintainerService from '../../services/maintainer.service';

const BranchManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [branches, setBranches] = useState([]);
  const [maintainers, setMaintainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark: ''
    },
    maintainerId: null, // Keep this for branch assignment
    contact: {
      phone: '',
      email: '',
      alternatePhone: ''
    },
    capacity: {
      totalRooms: 0,
      totalBeds: 0,
      availableRooms: 0
    },
    amenities: [],
    status: 'active',
    isDefault: false
  });

  const amenitiesList = [
    { name: 'WiFi', icon: Wifi, color: 'blue' },
    { name: 'AC', icon: Snowflake, color: 'cyan' },
    { name: 'Food', icon: Utensils, color: 'orange' },
    // { name: 'Laundry', icon: WashingMachine, color: 'purple' },
    { name: 'Cleaning', icon: Sparkles, color: 'green' },
    { name: 'Security', icon: Shield, color: 'red' },
    { name: 'Parking', icon: Car, color: 'gray' },
    { name: 'Gym', icon: Dumbbell, color: 'pink' },
    { name: 'TV', icon: Tv, color: 'indigo' },
    { name: 'Refrigerator', icon: Refrigerator, color: 'yellow' },
    { name: 'Geyser', icon: Droplets, color: 'blue' },
    { name: 'Furnished', icon: Sofa, color: 'brown' }
  ];

  // Fetch branches and maintainers on component mount
  useEffect(() => {
    fetchBranchesAndMaintainers();
  }, []);

  // Fetch branches and maintainers
  const fetchBranchesAndMaintainers = async () => {
    try {
      setLoading(true);

      // Fetch branches
      const branchesResponse = await branchService.getAllBranches();

      // Fetch maintainers (optional - don't fail if this fails)
      let maintainersResponse;
      try {
        maintainersResponse = await maintainerService.getAllMaintainers();
      } catch (maintainerError) {
        console.warn('Failed to fetch maintainers:', maintainerError);
        maintainersResponse = null;
      }

      if (branchesResponse.success) {
        // Handle different response formats for branches
        const branches = Array.isArray(branchesResponse.data) ? branchesResponse.data : branchesResponse.data?.branches || [];

        console.log('Branches API response:', branchesResponse);
        console.log('Branches loaded:', branches.length, branches);

        setBranches(branches);

        // Try to fetch maintainers, but don't fail if they don't load
        if (maintainersResponse && maintainersResponse.success) {
          try {
            const maintainers = Array.isArray(maintainersResponse.data) ? maintainersResponse.data : maintainersResponse.data?.maintainers || [];
            console.log('Maintainers loaded:', maintainers.length, maintainers);
            setMaintainers(maintainers);
          } catch (maintainerError) {
            console.warn('Failed to load maintainers, continuing with branches only:', maintainerError);
            setMaintainers([]);
          }
        } else {
          console.warn('Maintainers API failed or returned no data');
          setMaintainers([]);
        }
      } else {
        console.error('Branches API Response failed:', branchesResponse);
        toast.error('Failed to fetch branches');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const { name, address, contact } = formData;
    
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
    
    // Validate PG ID
    if (!user?.pgId) {
      toast.error('PG ID is required. Please contact support.');
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Prepare branch data to match backend requirements
      const selectedMaintainer = maintainers.find(m => m._id === formData.maintainerId);
      
      const branchData = {
        pgId: user.pgId,
        name: formData.name.trim(),
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          pincode: formData.address.pincode.trim(),
          landmark: (formData.address.landmark || '').trim()
        },
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
        isDefault: false,
        // Construct maintainer object exactly as backend expects
        maintainer: formData.maintainerId ? {
          name: selectedMaintainer?.name || 
                selectedMaintainer?.user?.firstName || 
                'Unnamed Maintainer',
          mobile: selectedMaintainer?.mobile || 
                  selectedMaintainer?.user?.phone || 
                  'N/A',
          email: selectedMaintainer?.email || 
                 selectedMaintainer?.user?.email || 
                 'N/A'
        } : null
      };
      
      // Determine API method and endpoint
      const method = editingBranch ? 'updateBranch' : 'createBranch';
      const apiCall = editingBranch 
        ? () => branchService.updateBranch(editingBranch._id, branchData)
        : () => branchService.createBranch(branchData);
      
      const response = await apiCall();
      
      if (response.success) {
        // Handle different response structures
        let branchDataResponse;
        let branchId;

        if (response.data) {
          // If response has data property
          if (response.data._id) {
            branchDataResponse = response.data;
            branchId = response.data._id;
          } else if (response.data.branch && response.data.branch._id) {
            branchDataResponse = response.data.branch;
            branchId = response.data.branch._id;
          } else if (response.data.id) {
            branchDataResponse = response.data;
            branchId = response.data.id;
          }
        } else if (response._id || response.id) {
          // If response is the branch object directly
          branchDataResponse = response;
          branchId = response._id || response.id;
        }

        // If a maintainer was assigned, update the maintainer's branches
        if (branchData.maintainerId && branchId) {
          try {
            await branchService.assignMaintainerToBranch({
              branchId: branchId,
              maintainerId: branchData.maintainerId
            });
          } catch (assignError) {
            console.warn('Failed to assign maintainer, but branch was saved:', assignError);
          }
        }

        toast.success(
          editingBranch
            ? 'Branch updated successfully!'
            : 'Branch created successfully!'
        );

        // Close form and reset
        setShowForm(false);
        setEditingBranch(null);
        resetForm();

        // Refresh branches and maintainers list
        fetchBranchesAndMaintainers();
      } else {
        toast.error(response.message || response.error || 'Failed to save branch');
      }
    } catch (error) {
      console.error('Error saving branch:', error);
      toast.error('An error occurred while saving the branch');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      maintainerId: branch.maintainerId, // Keep maintainer ID for assignment
      contact: branch.contact,
      capacity: branch.capacity,
      amenities: branch.amenities || [],
      status: branch.status,
      isDefault: branch.isDefault
    });

    setShowForm(true);
  };

  const handleDelete = async (branchId) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Branch deleted successfully');
        fetchBranchesAndMaintainers(); // Refresh both branches and maintainers
      } else {
        toast.error(data.message || 'Failed to delete branch');
      }
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error('Failed to delete branch');
    }
  };



  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      name: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        landmark: ''
      },
      maintainerId: null, // Reset maintainer selection
      contact: {
        phone: '',
        email: '',
        alternatePhone: ''
      },
      capacity: {
        totalRooms: 0,
        totalBeds: 0,
        availableRooms: 0
      },
      amenities: [],
      status: 'active',
      isDefault: false
    });
  };

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

  // Render maintainer selection dropdown
  const renderMaintainerDropdown = () => {
    // Show all maintainers, not just unassigned
    const availableMaintainers = maintainers;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assign Maintainer {maintainers.length === 0 ? '(Loading...)' : ''}
        </label>
        <select
          value={formData.maintainerId || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            maintainerId: e.target.value ? e.target.value : null
          }))}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={maintainers.length === 0}
        >
          <option value="">
            {maintainers.length === 0 ? 'Loading maintainers...' : 'Select a Maintainer'}
          </option>
          {availableMaintainers.map(maintainer => {
            // Extract name safely
            const name = maintainer.name || 
                         maintainer.user?.firstName || 
                         maintainer.firstName || 
                         'Unnamed Maintainer';
            const contact = maintainer.mobile || 
                            maintainer.user?.phone || 
                            maintainer.phone || 
                            'No Contact';

            return (
              <option
                key={maintainer._id}
                value={maintainer._id}
              >
                {name} ({contact})
              </option>
            );
          })}
        </select>
        {maintainers.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">Maintainers will be loaded automatically</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">PG Branches</h2>
          <p className="text-gray-600">Manage your PG branches and locations</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingBranch(null);
            resetForm();
          }}
          className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5" />
          <span className="font-semibold">Add Branch</span>
        </button>
      </div>

             {/* Branch Form Modal */}
      {showForm && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
             {/* Compact Modal Header */}
             <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                     <Building2 className="h-5 w-5 text-white" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-gray-900">
            {editingBranch ? 'Edit Branch' : 'Add New Branch'}
          </h3>
                     <p className="text-sm text-gray-600">
                       {editingBranch ? 'Update your branch information' : 'Create a new branch for your PG'}
                     </p>
                   </div>
                 </div>
                 <button
                   onClick={() => {
                     setShowForm(false);
                     setEditingBranch(null);
                     resetForm();
                   }}
                   className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                 >
                   <X className="h-5 w-5" />
                 </button>
               </div>
             </div>

             {/* Compact Modal Content */}
             <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
                 {/* Basic Information - Compact */}
                 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                   <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
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
                         className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                         className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="full">Full</option>
                </select>
                     </div>
              </div>
            </div>

                 {/* Address - Compact */}
                 <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                   <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
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
                         className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                         className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                         className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                         className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                         className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                         placeholder="Enter landmark (optional)"
                  />
                </div>
              </div>
            </div>

                 {/* Contact & Maintainer - Compact Combined */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                   {/* Contact Information - Compact */}
                   <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                     <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                       <Phone className="h-4 w-4 mr-2 text-purple-600" />
                       Contact Information
                     </h4>
                     <div className="space-y-3">
            <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={formData.contact.phone}
                    onChange={(e) => handleInputChange('contact', 'phone', e.target.value)}
                           className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                           className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                           className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                           placeholder="Enter alternate phone"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>
            </div>

                   {/* Maintainer Information - Compact */}
                   <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4">
                     <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                       <Users className="h-4 w-4 mr-2 text-orange-600" />
                       Assign Maintainer
                     </h4>
                     {renderMaintainerDropdown()}
                   </div>
                 </div>

                 {/* Capacity - Compact */}
                 <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4">
                   <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
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
                         className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                         className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
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
                         className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                         placeholder="Enter available rooms"
                    min="0"
                  />
                </div>
              </div>
            </div>

                 {/* Amenities - Compact */}
                 <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4">
                   <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                     <Settings className="h-4 w-4 mr-2 text-pink-600" />
                     Amenities
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
            </div>

                 {/* Compact Form Actions */}
                 <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingBranch(null);
                  resetForm();
                }}
                     className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                     className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {editingBranch ? 'Update Branch' : 'Create Branch'}
              </button>
            </div>
          </form>
             </div>
           </div>
        </div>
      )}

      {/* Branches List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Your Branches</h3>
            {branches.length > 0 && (
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {branches.length} branch{branches.length !== 1 ? 'es' : ''}
                </span>
                {(() => {
                  const defaultBranch = branches.find(b => b.isDefault);
                  return defaultBranch ? (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 rounded-full border border-yellow-200">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-sm font-medium">Default: {defaultBranch.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-orange-600 bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
                      No default branch set
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
          
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading branches...</p>
            </div>
          ) : branches.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-10 w-10 text-blue-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Branches Found</h4>
              <p className="text-gray-600 mb-6">Create your first branch to get started with managing your PG locations.</p>
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingBranch(null);
                  resetForm();
                }}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5" />
                <span>Create First Branch</span>
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {branches.map((branch) => (
              <div key={branch._id} className={`group bg-white rounded-lg shadow-sm border transition-all duration-200 overflow-hidden hover:shadow-md ${
                branch.isDefault 
                  ? 'border-blue-200 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                {/* Classic Header */}
                <div className={`p-6 border-b ${
                  branch.isDefault 
                    ? 'bg-blue-50 border-blue-100' 
                    : 'bg-gray-50 border-gray-100'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        branch.isDefault 
                          ? 'bg-blue-600' 
                          : 'bg-gray-600'
                      }`}>
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="font-semibold text-gray-900 text-lg truncate">{branch.name}</h4>
                          {branch.isDefault && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        {branch.isDefault && (
                          <p className="text-sm text-blue-700 mb-2">Primary Branch</p>
                        )}
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            branch.status === 'active' ? 'bg-green-100 text-green-700' :
                            branch.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                            branch.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {branch.status.charAt(0).toUpperCase() + branch.status.slice(1)}
                          </span>
                          {branch.isActive && (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEdit(branch)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 hover:border-blue-300 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {!branch.isDefault && (
                        <button
                          onClick={() => handleDelete(branch._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md border border-red-200 hover:border-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                  
                {/* Classic Content */}
                <div className="p-6 space-y-5">
                  {/* Contact Information */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{branch.address.street}</p>
                        <p className="text-xs text-gray-500">{branch.address.city}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                          <Phone className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{branch.contact.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                          <Mail className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{branch.contact.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Capacity Information */}
                  <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-6">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-semibold text-gray-900">{branch.capacity.totalRooms}</p>
                        <p className="text-xs text-gray-600">Rooms</p>
                      </div>
                      <div className="w-px h-8 bg-gray-300"></div>
                      <div className="text-center">
                        <p className="text-xl font-semibold text-gray-900">{branch.capacity.totalBeds}</p>
                        <p className="text-xs text-gray-600">Beds</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Amenities Section */}
                  {branch.amenities && branch.amenities.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-semibold text-gray-900">AMENITIES</h5>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {branch.amenities.length} available
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {branch.amenities.slice(0, 4).map(amenity => (
                          <span key={amenity} className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                            {amenity}
                          </span>
                        ))}
                        {branch.amenities.length > 4 && (
                          <span className="px-3 py-1 bg-gray-600 text-white text-xs font-medium rounded">
                            +{branch.amenities.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Classic Footer */}
                <div className={`px-6 py-4 border-t ${
                  branch.isDefault 
                    ? 'bg-blue-50 border-blue-100' 
                    : 'bg-gray-50 border-gray-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-gray-500">
                        Updated {new Date(branch.updatedAt || branch.createdAt).toLocaleDateString()}
                      </span>
                      {branch.isDefault && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          Primary Branch
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(branch)}
                        className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded border border-blue-200 transition-colors"
                      >
                        <span>Manage</span>
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};

export default BranchManagement; 