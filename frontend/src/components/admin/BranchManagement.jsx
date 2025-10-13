import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Star, MapPin, Phone, Mail, Users, Settings, X, Check, Wifi, Snowflake, Utensils, Sparkles, Shield, Car, Dumbbell, Tv, Refrigerator, Droplets, Sofa } from 'lucide-react';
import toast from 'react-hot-toast';

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
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
    maintainer: {
      name: '',
      mobile: '',
      email: ''
    },
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
    status: 'active'
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

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/branches?t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('Fetched branches:', data.data);
        
        // Remove duplicates based on _id
        const uniqueBranches = data.data.filter((branch, index, self) => 
          index === self.findIndex(b => b._id === branch._id)
        );
        
        // Ensure only one default branch
        const defaultBranches = uniqueBranches.filter(b => b.isDefault);
        if (defaultBranches.length > 1) {
          console.warn('Multiple default branches found, keeping the first one');
          // Keep the first default branch, mark others as non-default
          const updatedBranches = uniqueBranches.map((branch, index) => {
            if (branch.isDefault && index !== uniqueBranches.findIndex(b => b.isDefault)) {
              return { ...branch, isDefault: false };
            }
            return branch;
          });
          setBranches(updatedBranches);
        } else {
          setBranches(uniqueBranches);
        }
      } else {
        toast.error(data.message || 'Failed to fetch branches');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingBranch 
        ? `/api/branches/${editingBranch._id}`
        : '/api/branches';
      
      const method = editingBranch ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(editingBranch ? 'Branch updated successfully' : 'Branch created successfully');
        setShowForm(false);
        setEditingBranch(null);
        resetForm();
        fetchBranches();
      } else {
        toast.error(data.message || 'Failed to save branch');
      }
    } catch (error) {
      console.error('Error saving branch:', error);
      toast.error('Failed to save branch');
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      maintainer: branch.maintainer,
      contact: branch.contact,
      capacity: branch.capacity,
      amenities: branch.amenities || [],
      status: branch.status
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
        fetchBranches();
      } else {
        toast.error(data.message || 'Failed to delete branch');
      }
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error('Failed to delete branch');
    }
  };

  const handleSetDefault = async (branchId) => {
    try {
      const loadingToast = toast.loading('Setting default branch...');
      
      const response = await fetch(`/api/branches/${branchId}/set-default`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache' // Prevent caching
        }
      });
      
      const data = await response.json();
      
      toast.dismiss(loadingToast);
      
      if (data.success) {
        console.log('Default branch set successfully:', data.data);
        
        // Wait a bit for database operations to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force refresh the branches list with cache busting
        setLoading(true);
        await fetchBranches();
        
        toast.success(`Default branch updated to "${data.data?.name || 'selected branch'}" successfully!`);
      } else {
        console.error('Failed to set default branch:', data);
        
        // If it's an index constraint error, show option to fix it
        if (data.error && data.error.includes('index constraint')) {
          toast.error('Database index issue detected', {
            duration: 5000,
            action: {
              label: 'Fix Now',
              onClick: () => handleFixIndex()
            }
          });
        } else {
          toast.error(data.message || 'Failed to set default branch');
        }
      }
    } catch (error) {
      console.error('Error setting default branch:', error);
      toast.error('Failed to set default branch');
    }
  };

  const handleFixIndex = async () => {
    try {
      const loadingToast = toast.loading('Fixing database index...');
      
      const response = await fetch('/api/branches/fix-index', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      toast.dismiss(loadingToast);
      
      if (data.success) {
        toast.success('Database index fixed successfully!');
      } else {
        toast.error(data.message || 'Failed to fix database index');
      }
    } catch (error) {
      console.error('Error fixing index:', error);
      toast.error('Failed to fix database index');
    }
  };

  const handleCleanupDuplicates = async () => {
    if (!window.confirm('Are you sure you want to clean up duplicate branches? This will mark duplicate branches as inactive.')) {
      return;
    }
    
    try {
      const loadingToast = toast.loading('Cleaning up duplicate branches...');
      
      const response = await fetch('/api/branches/cleanup-duplicates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      toast.dismiss(loadingToast);
      
      if (data.success) {
        toast.success(`Cleaned up ${data.duplicatesRemoved || 0} duplicate branches!`);
        // Refresh the branches list
        setLoading(true);
        await fetchBranches();
      } else {
        toast.error(data.message || 'Failed to cleanup duplicate branches');
      }
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      toast.error('Failed to cleanup duplicate branches');
    }
  };

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
      maintainer: {
        name: '',
        mobile: '',
        email: ''
      },
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
      status: 'active'
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
                       Maintainer Information
                     </h4>
                     <div className="space-y-3">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                         <input
                           type="text"
                           value={formData.maintainer.name}
                           onChange={(e) => handleInputChange('maintainer', 'name', e.target.value)}
                           className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                           placeholder="Enter maintainer name"
                           required
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Mobile *</label>
                         <input
                           type="tel"
                           value={formData.maintainer.mobile}
                           onChange={(e) => handleInputChange('maintainer', 'mobile', e.target.value)}
                           className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                           placeholder="Enter mobile number"
                           pattern="[0-9]{10}"
                           required
                         />
                       </div>
            <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                         <input
                           type="email"
                           value={formData.maintainer.email}
                           onChange={(e) => handleInputChange('maintainer', 'email', e.target.value)}
                           className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                           placeholder="Enter maintainer email"
                           required
                         />
                       </div>
                     </div>
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
          {branches.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setLoading(true);
                  fetchBranches();
                }}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                title="Refresh branches"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
              <button
                onClick={handleFixIndex}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                title="Fix database index issues"
              >
                <Settings className="h-4 w-4" />
                <span>Fix Index</span>
              </button>
              <button
                onClick={handleCleanupDuplicates}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors duration-200"
                title="Clean up duplicate branches"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clean Duplicates</span>
              </button>
            </div>
          )}
        </div>
          
          {branches.length === 0 ? (
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
                      {!branch.isDefault && (
                        <button
                          onClick={() => handleSetDefault(branch._id)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-md border border-yellow-200 hover:border-yellow-300 transition-colors"
                          title="Make Default"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      )}
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
                      {!branch.isDefault && (
                        <button
                          onClick={() => handleSetDefault(branch._id)}
                          className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded border border-yellow-200 transition-colors"
                        >
                          <Star className="h-3 w-3" />
                          <span>Make Default</span>
                        </button>
                      )}
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