import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBranches, selectBranchState, initializeBranches, selectSelectedBranch } from '../../store/slices/branch.slice';
import { setSelectedBranch } from '../../store/slices/branch.slice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const BranchSelector = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { branches, loading, error } = useSelector(selectBranchState);
  const selectedBranch = useSelector(selectSelectedBranch);
  const [availableBranches, setAvailableBranches] = useState([]);

  useEffect(() => {
    // Initialize branches state and fetch branches for admin and maintainer roles
    if (user?.role === 'admin' || user?.role === 'maintainer') {
      dispatch(initializeBranches());
      dispatch(fetchBranches());
    }
  }, [user, dispatch]);

  useEffect(() => {
    // Safely handle different branch data types
    const safeBranches = Array.isArray(branches) 
      ? branches 
      : branches?.data?.branches || 
        (branches?.branches ? Object.values(branches.branches) : []);

    // Filter branches based on user role
    if (user?.role === 'maintainer') {
      // For maintainers, the API already returns only assigned branches
      // So we can use all branches returned from the API
      setAvailableBranches(safeBranches);

      // Automatically select the first branch if only one is available
      if (safeBranches.length === 1) {
        dispatch(setSelectedBranch(safeBranches[0]));
      } else if (safeBranches.length > 1 && !selectedBranch) {
        // If multiple branches and none selected, select the first one
        dispatch(setSelectedBranch(safeBranches[0]));
      }
    } else if (user?.role === 'admin') {
      // Admins can see all branches
      setAvailableBranches(safeBranches);
    }
  }, [branches, user, dispatch]);


  // Don't render for roles other than admin and maintainer
  if (user?.role !== 'admin' && user?.role !== 'maintainer') return null;

  return (
    <div className="branch-selector p-2">
      {/* <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
        Select Branch {user?.role === 'maintainer' ? '(Assigned)' : ''}
      </div> */}
      {loading ? (
        <div>Loading branches...</div>
      ) : error ? (
        <div className="text-red-500">Error loading branches: {error}</div>
      ) : availableBranches.length === 0 ? (
        <div className="text-yellow-500">
          {user?.role === 'maintainer' 
            ? 'No branches assigned to you' 
            : 'No branches available'}
        </div>
      ) : (
        <Select
          onValueChange={(value) => {
            const branch = availableBranches.find(b => b._id === value);
            console.log('BranchSelector: Selecting branch:', branch);
            dispatch(setSelectedBranch(branch));
          }}
          value={selectedBranch?._id || ''}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a branch" />
          </SelectTrigger>
          <SelectContent>
            {availableBranches.map((branch) => (
              <SelectItem key={branch._id} value={branch._id}>
                {branch.name} - {branch.address ? `${branch.address.city}, ${branch.address.state}` : 'Address not available'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default BranchSelector; 