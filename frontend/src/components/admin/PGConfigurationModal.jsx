import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  AlertCircle,
  MapPin
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
  onConfigured
}) => {
  const dispatch = useDispatch();

  // State for branches and selected branch
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sharing types state
  const [sharingTypes, setSharingTypes] = useState([
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

  // Get user from Redux state
  const user = useSelector(selectUser);

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
      
      if (response.success && response.data) {
        setBranches(response.data);
        
        // Automatically select the default branch if exists
        const defaultBranch = response.data.find(branch => branch.isDefault);
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

      // Configure sharing types
      const response = await pgService.configureSharingTypes(
        user.pgId,
        sharingTypes
      );

      if (response.success) {
        toast.success('PG Configuration completed successfully');

        // Update Redux state to mark PG as configured and associate PG if needed
        dispatch(updateAuthState({
          pgId: user.pgId || pgId,
          pg_configured: true,
          pgConfigured: true
        }));

        // Call onConfigured callback
        onConfigured && onConfigured(response.data);

        // Close the modal
        onClose();
      } else {
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">PG Configuration</h2>
              <p className="text-sm text-gray-600">Configure sharing types for your PG</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Branch Selection */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-green-600" />
            Select Branch
          </h3>
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : branches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((branch) => (
                <div 
                  key={branch._id}
                  onClick={() => setSelectedBranch(branch)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedBranch?._id === branch._id 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/20'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      branch.isDefault ? 'bg-yellow-500 text-white' : 'bg-gray-200'
                    }`}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{branch.name}</h4>
                      <p className="text-xs text-gray-500">{branch.address.city}, {branch.address.state}</p>
                    </div>
                  </div>
                  {branch.isDefault && (
                    <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded inline-block">
                      Default Branch
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              No branches found. Please create a branch first.
            </div>
          )}
        </div>

        {/* Sharing Types Section */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sharing Types</h3>
              <button
                onClick={handleAddCustomSharingType}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>Add Custom Type</span>
              </button>
            </div>

            {/* Sharing Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sharingTypes.map((type, index) => (
                <div 
                  key={index} 
                  className={`border rounded-lg p-4 ${
                    type.isCustom 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Remove button for custom types */}
                  {type.isCustom && (
                    <button
                      onClick={() => handleRemoveSharingType(index)}
                      className="float-right text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  {/* Sharing Type Inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={type.name}
                        onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                        placeholder="e.g., Single Occupancy"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={!type.isCustom}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type *
                      </label>
                      <input
                        type="text"
                        value={type.type}
                        onChange={(e) => handleInputChange(index, 'type', e.target.value)}
                        placeholder="e.g., 1-sharing"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={!type.isCustom}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={type.description}
                        onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                        placeholder="Optional description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost per Bed (₹) *
                      </label>
                      <input
                        type="number"
                        value={type.cost}
                        onChange={(e) => handleInputChange(index, 'cost', parseFloat(e.target.value) || 0)}
                        placeholder="Enter cost"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> These sharing types will be used for room allocation and pricing. 
                You can modify them later in PG settings.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedBranch}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all duration-200 ${
                !selectedBranch
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
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
