import React, { useEffect, useState } from 'react';
import { Building2, ChevronDown, Star } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBranches, selectBranches, selectSelectedBranch, setSelectedBranch } from '../../store/slices/branch.slice';

const BranchSelector = ({ selectedBranch, onBranchChange }) => {
  const { user } = useSelector((state) => state.auth);
  const branches = useSelector(selectBranches);
  const globalSelectedBranch = useSelector(selectSelectedBranch);
  const dispatch = useDispatch();

  const [isOpen, setIsOpen] = useState(false);

  // Load branches for admin
  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(fetchBranches());
    }
  }, [user, dispatch]);

  // Determine the branch shown in the control
  const effectiveSelectedBranch = selectedBranch || globalSelectedBranch;

  const handleBranchSelect = (branch) => {
    // Update global selection
    dispatch(setSelectedBranch(branch));
    // Notify parent if it was using local state
    if (onBranchChange) onBranchChange(branch);
    setIsOpen(false);
  };

  // Hide for non-admin
  if (user?.role !== 'admin') return null;

  if (!branches || branches.length === 0) {
    return (
      <div className="relative">
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Branch</label>
        </div>
        <div className="w-full flex items-center justify-center px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-500">No branches available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Branch</label>
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
      >
        <div className="flex items-center space-x-3">
          <Building2 className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium">
            {effectiveSelectedBranch ? effectiveSelectedBranch.name : 'Choose a branch...'}
          </span>
          {effectiveSelectedBranch?.isDefault && (
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          )}
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">Select Branch</div>
            {branches.map((branch) => (
              <button
                key={branch._id}
                onClick={() => handleBranchSelect(branch)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-md transition duration-200 ${
                  effectiveSelectedBranch?._id === branch._id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm font-medium">{branch.name}</span>
                  {branch.isDefault && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    branch.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : branch.status === 'inactive'
                      ? 'bg-gray-100 text-gray-800'
                      : branch.status === 'maintenance'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {branch.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchSelector; 