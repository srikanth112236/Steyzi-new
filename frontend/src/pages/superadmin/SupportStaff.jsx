import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  RefreshCw
} from 'lucide-react';
import SupportStaffForm from '../../components/superadmin/SupportStaffForm';
import DeleteConfirmModal from '../../components/superadmin/DeleteConfirmModal';
import authService from '../../services/auth.service';
import toast from 'react-hot-toast';

const SupportStaff = () => {
  const [supportStaff, setSupportStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSupportStaff();
  }, []);

  const loadSupportStaff = async () => {
    try {
      setLoading(true);
      const response = await authService.getSupportStaff();
      if (response.success) {
        setSupportStaff(response.data);
      } else {
        toast.error(response.message || 'Failed to load support staff');
      }
    } catch (error) {
      console.error('Error loading support staff:', error);
      toast.error('Failed to load support staff');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSupportStaff();
    setRefreshing(false);
    toast.success('Support staff list refreshed');
  };

  const handleAddSuccess = () => {
    loadSupportStaff();
    toast.success('Support staff added successfully!');
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    try {
      const response = await authService.deleteUser(selectedStaff._id);
      if (response.success) {
        setSupportStaff(prev => prev.filter(staff => staff._id !== selectedStaff._id));
        toast.success('Support staff deleted successfully!');
        setShowDeleteModal(false);
        setSelectedStaff(null);
      } else {
        toast.error(response.message || 'Failed to delete support staff');
      }
    } catch (error) {
      console.error('Error deleting support staff:', error);
      toast.error('Failed to delete support staff');
    }
  };

  const handleToggleStatus = async (staffId, currentStatus) => {
    try {
      const response = await authService.updateUserStatus(staffId, !currentStatus);
      if (response.success) {
        setSupportStaff(prev => prev.map(staff => 
          staff._id === staffId 
            ? { ...staff, isActive: !currentStatus }
            : staff
        ));
        toast.success(`Support staff ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating staff status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  const filteredStaff = supportStaff.filter(staff => {
    const matchesSearch = staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && staff.isActive) ||
                         (filterStatus === 'inactive' && !staff.isActive);
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusIcon = (isActive) => {
    return isActive ? UserCheck : UserX;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading support staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" role="main" aria-label="Support Staff Management">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Staff</h1>
          <p className="text-gray-600 mt-2">Manage support staff accounts and permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            aria-label="Refresh support staff list"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Add new support staff member"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Support Staff
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6" role="region" aria-label="Support staff statistics">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900" aria-live="polite">{supportStaff.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" aria-hidden="true" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Staff</p>
              <p className="text-2xl font-bold text-gray-900" aria-live="polite">
                {supportStaff.filter(staff => staff.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <UserX className="h-6 w-6 text-yellow-600" aria-hidden="true" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive Staff</p>
              <p className="text-2xl font-bold text-gray-900" aria-live="polite">
                {supportStaff.filter(staff => !staff.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" aria-hidden="true" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900" aria-live="polite">
                {supportStaff.filter(staff => {
                  const createdAt = new Date(staff.createdAt);
                  const now = new Date();
                  return createdAt.getMonth() === now.getMonth() && 
                         createdAt.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search-staff" className="sr-only">Search support staff</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <input
                id="search-staff"
                type="text"
                placeholder="Search support staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Search support staff by name or email"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <label htmlFor="status-filter" className="sr-only">Filter by status</label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Filter support staff by status"
              >
                <option value="all">All Staff</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Support Staff List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Support Staff List</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {filteredStaff.length} of {supportStaff.length} staff members
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label="Support staff list">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStaff.map((staff) => {
                const StatusIcon = getStatusIcon(staff.isActive);
                return (
                  <motion.tr
                    key={staff._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                    role="row"
                  >
                    <td className="px-6 py-4 whitespace-nowrap" role="cell">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600" aria-label={`${staff.firstName} ${staff.lastName} initials`}>
                            {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {staff.firstName} {staff.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {staff._id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" role="cell">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" aria-hidden="true" />
                          <a href={`mailto:${staff.email}`} className="hover:text-blue-600">
                            {staff.email}
                          </a>
                        </div>
                        <div className="flex items-center mt-1">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" aria-hidden="true" />
                          <a href={`tel:${staff.phone}`} className="hover:text-blue-600">
                            {staff.phone}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" role="cell">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(staff.isActive)}`}
                        aria-label={`Status: ${staff.isActive ? 'Active' : 'Inactive'}`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                        {staff.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" role="cell">
                      {new Date(staff.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" role="cell">
                      {staff.lastLogin 
                        ? new Date(staff.lastLogin).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" role="cell">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleStatus(staff._id, staff.isActive)}
                          onKeyPress={(e) => handleKeyPress(e, () => handleToggleStatus(staff._id, staff.isActive))}
                          className={`px-3 py-1 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 ${
                            staff.isActive
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                          tabIndex={0}
                          role="button"
                          aria-label={`${staff.isActive ? 'Deactivate' : 'Activate'} ${staff.firstName} ${staff.lastName}`}
                        >
                          {staff.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStaff(staff);
                            setShowDeleteModal(true);
                          }}
                          onKeyPress={(e) => handleKeyPress(e, () => {
                            setSelectedStaff(staff);
                            setShowDeleteModal(true);
                          })}
                          className="text-red-600 hover:text-red-900 focus:ring-2 focus:ring-red-500 rounded"
                          tabIndex={0}
                          role="button"
                          aria-label={`Delete ${staff.firstName} ${staff.lastName}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No support staff found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first support staff member.'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                  aria-label="Add your first support staff member"
                >
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  Add Support Staff
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Support Staff Modal */}
      <SupportStaffForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedStaff(null);
        }}
        onConfirm={handleDeleteStaff}
        title="Delete Support Staff"
        message={`Are you sure you want to delete ${selectedStaff?.firstName} ${selectedStaff?.lastName}? This action cannot be undone.`}
        confirmText="Delete Staff"
        loading={false}
      />
    </div>
  );
};

export default SupportStaff; 