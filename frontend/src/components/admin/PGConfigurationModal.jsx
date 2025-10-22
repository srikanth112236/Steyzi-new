import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  Save,
  X,
  AlertCircle,
  MapPin,
  Edit,
  Settings as SettingsIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { selectSelectedBranch } from '../../store/slices/branch.slice';
import { selectUser, updateAuthState } from '../../store/slices/authSlice';
import pgService from '../../services/pg.service';
import branchService from '../../services/branch.service';

const PGConfigurationModal = ({
  isOpen,
  onClose,
  onConfigured,
  initialSharingTypes = []
}) => {
  const dispatch = useDispatch();

  // State for branches and selected branch
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sharing types state
  const [sharingTypes, setSharingTypes] = useState([]);

  // Get user from Redux state
  const user = useSelector(selectUser);

  // Initialize sharing types when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialSharingTypes.length > 0) {
        // Use provided initial data for editing
        setSharingTypes(initialSharingTypes.map(type => ({ ...type })));
      } else {
        // Use default sharing types for new configuration
        setSharingTypes([
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
      }
    }
  }, [isOpen, initialSharingTypes]);

  // Fetch branches when modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      fetchBranches();
    }
  }, [isOpen, user]);

  // Fetch branches for the PG
  const fetchBranches = async () => {
    try {
      setLoading(true);

      if (!user || !user.pgId) {
        toast.error('PG ID not found. Please contact support.');
        return;
      }

      const response = await branchService.getBranchesByPG(user.pgId);

      if (response.success && response.branches) {
        setBranches(response.branches);

        // Automatically select the default branch if exists
        const defaultBranch = response.branches.find(branch => branch.isDefault);
        if (defaultBranch) {
          setSelectedBranch(defaultBranch);
        }
      } else {
        toast.error('Failed to fetch branches');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('An error occurred while fetching branches');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomSharingType = () => {
    setSharingTypes([...sharingTypes, {
      type: '',
      name: '',
      description: '',
      cost: 0,
      isCustom: true
    }]);
  };

  const handleRemoveSharingType = (index) => {
    // Prevent removing predefined sharing types
    if (!sharingTypes[index].isCustom) return;

    const newSharingTypes = [...sharingTypes];
    newSharingTypes.splice(index, 1);
    setSharingTypes(newSharingTypes);
  };

  const handleInputChange = (index, field, value) => {
    const newSharingTypes = [...sharingTypes];
    newSharingTypes[index][field] = value;

    // Auto-generate type for custom sharing types
    if (field === 'name' && newSharingTypes[index].isCustom) {
      const words = value.toLowerCase().split(' ');
      newSharingTypes[index].type = `${words[0]}-sharing`;
    }

    setSharingTypes(newSharingTypes);
  };

  const validateSharingTypes = () => {
    for (const type of sharingTypes) {
      if (!type.type || !type.name || type.cost === undefined || type.cost <= 0) {
        toast.error('Please fill in all required fields with valid data');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    console.log('PGConfigurationModal: Starting configuration...');
    // Validate branch selection
    if (!selectedBranch) {
      toast.error('Please select a branch first');
      return;
    }

    // Validate sharing types
    if (!validateSharingTypes()) return;

    try {
      setLoading(true);

      if (!user || !user.pgId) {
        toast.error('No PG associated with your account. Please contact support to get a PG assigned.');
        return;
      }

      console.log('PGConfigurationModal: Calling configureSharingTypes with:', {
        pgId: user.pgId,
        sharingTypesCount: sharingTypes.length,
        sharingTypes: sharingTypes
      });

      // Configure sharing types
      const response = await pgService.configureSharingTypes(
        user.pgId,
        sharingTypes
      );

      console.log('PGConfigurationModal: Response received:', response);

      if (response.success) {
        console.log('PGConfigurationModal: Configuration successful');
        toast.success('PG Configuration completed successfully');

        // Call onConfigured callback to handle state updates and modal closing
        onConfigured && onConfigured(response.data);

        // Close the modal
        onClose();
      } else {
        console.log('PGConfigurationModal: Configuration failed:', response.message);
        if (response.message && response.message.includes('PG not found')) {
          toast.error('The PG associated with your account was not found. Please contact support.');
        } else {
          toast.error(response.message || 'Failed to configure PG');
        }
      }
    } catch (error) {
      console.error('PG Configuration error:', error);
      if (error.message && error.message.includes('PG not found')) {
        toast.error('The PG associated with your account was not found. Please contact support.');
      } else {
        toast.error('An error occurred while configuring PG');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">PG Configuration</h2>
              <p className="text-xs text-gray-600">Configure sharing types and pricing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Branch Selection */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <MapPin className="h-3 w-3 mr-2 text-green-600" />
            Select Branch
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          ) : branches.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {branches.map((branch) => (
                <div
                  key={branch._id}
                  onClick={() => setSelectedBranch(branch)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedBranch?._id === branch._id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      branch.isDefault ? 'bg-yellow-500 text-white' : 'bg-gray-200'
                    }`}>
                      <Building2 className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{branch.name}</h4>
                      <p className="text-xs text-gray-500 truncate">{branch.address.city}, {branch.address.state}</p>
                    </div>
                  </div>
                  {branch.isDefault && (
                    <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded inline-block">
                      Default
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No branches found. Please create a branch first.
            </div>
          )}
        </div>

        {/* Sharing Types Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Sharing Types</h3>
              <button
                onClick={handleAddCustomSharingType}
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 text-sm"
              >
                <Plus className="h-3 w-3" />
                <span>Add Custom</span>
              </button>
            </div>

            {/* Sharing Types Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sharingTypes.map((type, index) => (
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

                  {/* Sharing Type Inputs */}
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
                        required
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
                        required
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
                        required
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> These sharing types will be used for room allocation and pricing.
                You can modify them later in PG settings.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-200 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedBranch}
              className={`flex items-center space-x-2 px-5 py-2 rounded-lg transition-all duration-200 text-sm ${
                !selectedBranch
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <Save className="h-3 w-3" />
              )}
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PGConfigurationModal;
