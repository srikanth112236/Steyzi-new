import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  MapPin,
  Edit,
  Settings as SettingsIcon,
  CheckCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import pgService from '../../services/pg.service';
import branchService from '../../services/branch.service';
import DefaultBranchModal from './DefaultBranchModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const PGConfigurationComponent = ({ onConfigurationUpdate }) => {
  const user = useSelector(selectUser);

  // State for PG configuration and branches
  const [sharingTypes, setSharingTypes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);

  // Configuration editing state
  const [editingConfig, setEditingConfig] = useState([]);

  // Fetch PG and branch data when component mounts
  useEffect(() => {
    if (user?.pgId) {
      fetchPGAndBranches();
    } else {
      console.warn('No PG ID found for user');
      toast.error('No PG assigned. Please contact support to get a PG assigned.');
    }
  }, [user]);


  const fetchPGAndBranches = async () => {
    try {
      setLoading(true);

      if (!user || !user.pgId) {
        toast.error('PG ID not found. Please contact support.');
        return;
      }

      // Fetch branches separately since PG response doesn't include branches
      const branchesResponse = await branchService.getAllBranches();

      if (branchesResponse.success && branchesResponse.data) {
        const branchesData = Array.isArray(branchesResponse.data)
          ? branchesResponse.data
          : branchesResponse.data?.branches || [];

        setBranches(branchesData || []);

        if (branchesData.length === 0) {
          setSelectedBranch(null);
          setSharingTypes([]);
        } else {
          // Auto-select default branch if exists
          const defaultBranch = branchesData.find(branch => branch.isDefault === true);

          if (defaultBranch) {
            setSelectedBranch(defaultBranch);
            // Fetch configurations for the default branch
            await fetchBranchConfigurations(defaultBranch._id);
          } else if (branchesData.length > 0) {
            setSelectedBranch(branchesData[0]);
            // Fetch configurations for the first branch
            await fetchBranchConfigurations(branchesData[0]._id);
          }
        }
      } else {
        console.error('Branches fetch failed:', branchesResponse);
        // Don't show error toast here, just set empty branches
        setBranches([]);
        setSelectedBranch(null);
        setSharingTypes([]);
      }
    } catch (error) {
      console.error('Error fetching branch data:', error);
      // Don't show error toast here, just set empty state
      setBranches([]);
      setSelectedBranch(null);
      setSharingTypes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch branch-specific configurations
  const fetchBranchConfigurations = async (branchId) => {
    try {
      if (!branchId) {
        setSharingTypes([]);
        return;
      }

      const response = await pgService.getSharingTypesForBranch(branchId);

      if (response.success && response.data) {
        setSharingTypes(response.data);
      } else {
        // If no branch-specific configurations exist, set empty array
        setSharingTypes([]);
      }
    } catch (error) {
      console.error('Error fetching branch configurations:', error);
      toast.error('Failed to load branch configurations');
      setSharingTypes([]);
    }
  };

  // Handle branch creation callback
  const handleBranchCreated = async (branchData) => {
    setShowBranchModal(false);

    // Refresh branches and configurations
    await fetchPGAndBranches();

    toast.success('Branch created successfully! You can now configure sharing types for this branch.');
  };

  const handleEditConfiguration = () => {
    setEditingConfig(sharingTypes.length > 0 ? [...sharingTypes] : [
      {
        type: '1-sharing',
        name: 'Single Occupancy',
        description: 'Private room with single bed',
        cost: 8000,
        isCustom: false
      },
      {
        type: '2-sharing',
        name: 'Double Occupancy',
        description: 'Room shared between two residents',
        cost: 6000,
        isCustom: false
      },
      {
        type: '3-sharing',
        name: 'Triple Occupancy',
        description: 'Room shared between three residents',
        cost: 5000,
        isCustom: false
      },
      {
        type: '4-sharing',
        name: 'Quad Occupancy',
        description: 'Room shared between four residents',
        cost: 4000,
        isCustom: false
      }
    ]);
  };

  const handleAddCustomSharingType = () => {
    setEditingConfig([...editingConfig, {
      type: '',
      name: '',
      description: '',
      cost: 0,
      isCustom: true
    }]);
  };

  const handleRemoveSharingType = (index) => {
    if (!editingConfig[index].isCustom) return;

    const newConfig = [...editingConfig];
    newConfig.splice(index, 1);
    setEditingConfig(newConfig);
  };

  const handleInputChange = (index, field, value) => {
    const newConfig = [...editingConfig];
    newConfig[index][field] = value;

    // Auto-generate type for custom sharing types
    if (field === 'name' && newConfig[index].isCustom) {
      const words = value.toLowerCase().split(' ');
      newConfig[index].type = `${words[0]}-sharing`;
    }

    setEditingConfig(newConfig);
  };

  const validateSharingTypes = () => {
    for (const type of editingConfig) {
      if (!type.type || !type.name || type.cost === undefined || type.cost <= 0) {
        toast.error('Please fill in all required fields with valid data');
        return false;
      }
    }
    return true;
  };

  const handleSaveConfiguration = async () => {
    if (!validateSharingTypes()) return;
    if (!selectedBranch) {
      toast.error('Please select a branch first');
      return;
    }

    try {
      setSaving(true);

      const response = await pgService.configureSharingTypesForBranch(
        selectedBranch._id || selectedBranch.id,
        editingConfig
      );

      if (response.success) {
        toast.success('Configuration saved successfully');

        // Update local state
        setSharingTypes([...editingConfig]);

        // Call parent callback
        onConfigurationUpdate && onConfigurationUpdate();

        // Close editing mode
        setEditingConfig([]);
      } else {
        toast.error(response.message || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('An error occurred while saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingConfig([]);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading PG configurations...</span>
        </div>
      </div>
    );
  }

  if (!user?.pgId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h4 className="text-lg font-semibold text-gray-900 mb-2">No PG Assigned</h4>
        <p className="text-gray-600">Please contact support to get a PG assigned to your account.</p>
      </div>
    );
  }

  // If we have sharing types but no branches, this PG exists but needs branches
  if (sharingTypes.length > 0 && branches.length === 0) {
    return (
      <div className="space-y-6">
        {/* PG Configuration Section - Always show if we have sharing types */}
        {sharingTypes.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* PG Configuration Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <SettingsIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">PG Configuration</h4>
                  <p className="text-sm text-gray-600">
                    Manage sharing types and pricing (shared across all branches)
                  </p>
                </div>
              </div>
              <button
                onClick={handleEditConfiguration}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Configuration</span>
              </button>
            </div>

            {/* Configuration Display/Edit */}
            {editingConfig.length > 0 ? (
              /* Configuration Edit Form */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">Edit PG Configuration</h4>
                  <button
                    onClick={handleAddCustomSharingType}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 text-sm"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Custom</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {editingConfig.map((type, index) => (
                    <div
                      key={index}
                      className={`border rounded-xl p-4 transition-all duration-200 ${
                        type.isCustom
                          ? 'border-blue-200 bg-blue-50/50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      {/* Header with Remove button for custom types */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          type.isCustom ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {type.isCustom ? 'Custom' : 'Default'}
                        </span>
                        {type.isCustom && (
                          <button
                            onClick={() => handleRemoveSharingType(index)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {/* Form Fields */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Name *
                          </label>
                          <input
                            type="text"
                            value={type.name}
                            onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                            placeholder="e.g., Single Occupancy"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            disabled={!type.isCustom}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Type *
                          </label>
                          <input
                            type="text"
                            value={type.type}
                            onChange={(e) => handleInputChange(index, 'type', e.target.value)}
                            placeholder="e.g., 1-sharing"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            disabled={!type.isCustom}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={type.description}
                            onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                            placeholder="Optional description"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Cost per Bed (₹) *
                          </label>
                          <input
                            type="number"
                            value={type.cost}
                            onChange={(e) => handleInputChange(index, 'cost', parseFloat(e.target.value) || 0)}
                            placeholder="Enter cost"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-200 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveConfiguration}
                    disabled={saving}
                    className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    <span>Save Configuration</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Configuration Display */
              <div>
                {sharingTypes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sharingTypes.map((type, index) => (
                      <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-gray-900">{type.name}</h5>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {type.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">₹{type.cost}</span>
                          <span className="text-xs text-gray-500">per bed</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <SettingsIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Configuration Found</h4>
                    <p className="text-gray-600 mb-6">Configure sharing types to manage room allocations and pricing across all branches.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* No Branches Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-yellow-800">No Branches Found</h5>
              <p className="text-sm text-yellow-700 mt-1">
                This PG has sharing types configured but no branches. Please create branches first to properly manage configurations per location.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Main Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">PG Configuration Management</h2>
              <p className="text-blue-100">Manage sharing types and pricing for each branch</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-sm text-blue-100">
            <span>{branches.length} Branch{branches.length !== 1 ? 'es' : ''}</span>
            {selectedBranch && (
              <>
                <span>•</span>
                <span className="font-medium text-white">{selectedBranch.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Branch Selection & Configuration */}
      {user?.pgId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Branch Selection Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Branch Configuration</h3>
                  <p className="text-sm text-gray-600">Select a branch to manage its sharing types and pricing</p>
                </div>
              </div>
              {editingConfig.length > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-orange-700 font-medium">Editing Mode</span>
                </div>
              )}
            </div>
          </div>

          {/* Branch Selection Content */}
          <div className="p-6">
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Branch
                {editingConfig.length > 0 && (
                  <span className="text-orange-600 text-xs ml-2">(Save or cancel editing to change branch)</span>
                )}
              </label>
              <Select
                key={selectedBranch?._id || 'no-selection'}
                disabled={editingConfig.length > 0}
                value={selectedBranch?._id || selectedBranch?.id || ''}
                onValueChange={async (value) => {
                  const branch = branches.find(b => (b._id === value || b.id === value));
                  if (branch) {
                    setSelectedBranch(branch);
                    await fetchBranchConfigurations(branch._id || branch.id);
                  } else {
                    setSelectedBranch(null);
                    setSharingTypes([]);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a branch to configure" />
                </SelectTrigger>
                <SelectContent>
                  {branches.length > 0 ? (
                    branches.map((branch) => (
                      <SelectItem key={branch._id || branch.id} value={branch._id || branch.id}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{branch.name}</span>
                          {branch.isDefault && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                              Default
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      {loading ? 'Loading branches...' : 'No branches available'}
                    </div>
                  )}
                </SelectContent>
              </Select>

              {selectedBranch && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-700 font-medium">
                      {selectedBranch.name} • {sharingTypes.length} sharing type{sharingTypes.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Configuration Section - Show only when branch is selected */}
      {selectedBranch && (
        <div key={selectedBranch._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Configuration Header */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
                  <SettingsIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Configuration for {selectedBranch.name}</h3>
                  <p className="text-sm text-gray-600">Manage sharing types and pricing</p>
                </div>
              </div>
              <button
                onClick={handleEditConfiguration}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Edit className="h-4 w-4" />
                <span className="font-medium">Edit Configuration</span>
              </button>
            </div>
          </div>

          {/* Configuration Display/Edit */}
          {editingConfig.length > 0 ? (
            /* Configuration Edit Form */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">Edit PG Configuration</h4>
                <button
                  onClick={handleAddCustomSharingType}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 text-sm"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Custom</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {editingConfig.map((type, index) => (
                  <div
                    key={index}
                    className={`border rounded-xl p-4 transition-all duration-200 ${
                      type.isCustom
                        ? 'border-blue-200 bg-blue-50/50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {/* Header with Remove button for custom types */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        type.isCustom ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {type.isCustom ? 'Custom' : 'Default'}
                      </span>
                      {type.isCustom && (
                        <button
                          onClick={() => handleRemoveSharingType(index)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={type.name}
                          onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                          placeholder="e.g., Single Occupancy"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          disabled={!type.isCustom}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Type *
                        </label>
                        <input
                          type="text"
                          value={type.type}
                          onChange={(e) => handleInputChange(index, 'type', e.target.value)}
                          placeholder="e.g., 1-sharing"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          disabled={!type.isCustom}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={type.description}
                          onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                          placeholder="Optional description"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Cost per Bed (₹) *
                        </label>
                        <input
                          type="number"
                          value={type.cost}
                          onChange={(e) => handleInputChange(index, 'cost', parseFloat(e.target.value) || 0)}
                          placeholder="Enter cost"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfiguration}
                  disabled={saving}
                  className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  <span>Save Configuration</span>
                </button>
              </div>
            </div>
          ) : (
            /* Configuration Display */
            <div>
              {sharingTypes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sharingTypes.map((type, index) => (
                    <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-900">{type.name}</h5>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {type.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">₹{type.cost}</span>
                        <span className="text-xs text-gray-500">per bed</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SettingsIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Configuration Found</h4>
                  <p className="text-gray-600 mb-6">Configure sharing types to manage room allocations and pricing across all branches.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* No Branches Message - Only show if no sharing types either */}
      {branches.length === 0 && sharingTypes.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Branches Found</h4>
          <p className="text-gray-600 mb-6">You need to create at least one branch before you can configure sharing types and pricing.</p>
          <button
            onClick={() => setShowBranchModal(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            <span>Create Your First Branch</span>
          </button>
        </div>
      )}



      {/* Default Branch Modal */}
      <DefaultBranchModal
        isOpen={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        onBranchCreated={handleBranchCreated}
        pgId={user?.pgId}
      />
    </div>
  );
};

export default PGConfigurationComponent;
