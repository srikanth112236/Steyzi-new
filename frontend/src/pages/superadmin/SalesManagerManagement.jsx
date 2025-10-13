import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Users,
  Edit,
  Trash2,
  MoreHorizontal,
  X,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Mail,
  Key,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import salesManagerService from '../../services/salesManager.service';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const SalesManagerManagement = () => {
  const [salesManagers, setSalesManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [filters, setFilters] = useState({
    status: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [newManagerForm, setNewManagerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchSalesManagers();
  }, []);

  const fetchSalesManagers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await salesManagerService.getAllSalesManagers({ status: filters.status });
      setSalesManagers(response.data || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch Sales Managers');
      toast.error(error.response?.data?.message || 'Failed to fetch Sales Managers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSalesManager = async (e) => {
    e.preventDefault();
    try {
      const response = await salesManagerService.createSalesManager(newManagerForm);
      toast.success('Sales Manager added successfully');
      setSalesManagers([...salesManagers, response.data.data]);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add Sales Manager');
    }
  };

  const handleUpdateSalesManager = async (e) => {
    e.preventDefault();
    try {
      const response = await salesManagerService.updateSalesManager(
        selectedManager._id, 
        newManagerForm
      );
      toast.success('Sales Manager updated successfully');
      setSalesManagers(salesManagers.map(manager =>
        manager._id === selectedManager._id ? response.data.data : manager
      ));
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update Sales Manager');
    }
  };

  const handleDeleteSalesManager = async (salesManagerId) => {
    if (!window.confirm('Are you sure you want to delete this Sales Manager?')) return;

    try {
      await salesManagerService.deleteSalesManager(salesManagerId);
      toast.success('Sales Manager deleted successfully');
      setSalesManagers(salesManagers.filter(manager => manager._id !== salesManagerId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete Sales Manager');
    }
  };

  const resetForm = () => {
    setNewManagerForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      commissionRate: 10
    });
    setSelectedManager(null);
  };

  const handleViewManager = (manager) => {
    setSelectedManager(manager);
    setShowViewModal(true);
  };

  const handleDeleteManager = (manager) => {
    setManagerToDelete(manager);
    setShowDeleteModal(true);
  };

  const confirmDeleteManager = async () => {
    if (!managerToDelete) return;

    try {
      setLoading(true);
      await salesManagerService.deleteSalesManager(managerToDelete._id);
      toast.success('Sales Manager deleted successfully');
      setShowDeleteModal(false);
      setManagerToDelete(null);
      fetchSalesManagers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete Sales Manager');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (manager) => {
    setSelectedManager(manager);
    setShowResetPasswordModal(true);
  };

  const confirmResetPassword = async () => {
    if (!selectedManager) return;

    try {
      setResettingPassword(true);
      await salesManagerService.resetPassword(selectedManager._id);
      toast.success('Password reset initiated. New credentials will be sent via email.');
      setShowResetPasswordModal(false);
      setSelectedManager(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const renderAddEditModal = (isEdit = false) => {
    const manager = isEdit ? selectedManager : {};

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEdit ? 'Edit Sales Manager' : 'Add Sales Manager'}
            </h2>
            <button 
              onClick={() => {
                isEdit ? setShowEditModal(false) : setShowAddModal(false);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form 
            onSubmit={isEdit ? handleUpdateSalesManager : handleAddSalesManager} 
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <Input
                  type="text"
                  value={newManagerForm.firstName}
                  onChange={(e) => setNewManagerForm({...newManagerForm, firstName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <Input
                  type="text"
                  value={newManagerForm.lastName}
                  onChange={(e) => setNewManagerForm({...newManagerForm, lastName: e.target.value})}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                value={newManagerForm.email}
                onChange={(e) => setNewManagerForm({...newManagerForm, email: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input
                type="tel"
                value={newManagerForm.phone}
                onChange={(e) => setNewManagerForm({...newManagerForm, phone: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={newManagerForm.commissionRate}
                onChange={(e) => setNewManagerForm({...newManagerForm, commissionRate: parseFloat(e.target.value) || 0})}
                placeholder="Enter commission rate (0-100%)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Commission rate for PGs added by this sales manager and their sub-staff</p>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button"
                variant="outline"
                onClick={() => {
                  isEdit ? setShowEditModal(false) : setShowAddModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEdit ? 'Update' : 'Add'} Sales Manager
              </Button>
            </div>
        </form>
      </div>
    </div>
  );
}

  const renderViewModal = () => {
    if (!selectedManager) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Sales Manager Details</h2>
                  <p className="text-blue-100">{selectedManager?.salesUniqueId || 'N/A'}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowViewModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedManager?.firstName || 'N/A'} {selectedManager?.lastName || ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedManager?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedManager?.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Commission Rate</label>
                  <p className="text-lg font-semibold text-green-600">{selectedManager?.commissionRate || 10}%</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Unique ID</label>
                  <p className="text-lg font-semibold text-blue-600 font-mono">{selectedManager?.salesUniqueId || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    selectedManager?.status === 'active' ? 'bg-green-100 text-green-800' :
                    selectedManager?.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedManager?.status || 'N/A'}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created Date</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedManager?.createdAt ? new Date(selectedManager.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedManager(selectedManager);
                    setNewManagerForm({
                      firstName: selectedManager?.firstName || '',
                      lastName: selectedManager?.lastName || '',
                      email: selectedManager?.email || '',
                      phone: selectedManager?.phone || '',
                      commissionRate: selectedManager?.commissionRate || 10
                    });
                    setShowEditModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Manager
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false);
                    handleResetPassword(selectedManager);
                  }}
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteModal = () => {
    if (!managerToDelete) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Delete Sales Manager</h2>
                <p className="text-red-100">This action cannot be undone</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the sales manager <strong>{managerToDelete?.firstName || 'N/A'} {managerToDelete?.lastName || ''}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This will permanently remove the sales manager account and all associated data. This action cannot be reversed.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setManagerToDelete(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteManager}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Deleting...' : 'Delete Manager'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResetPasswordModal = () => {
    if (!selectedManager) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Key className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Reset Password</h2>
                <p className="text-orange-100">Send new credentials via email</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                This will reset the password for <strong>{selectedManager?.firstName || 'N/A'} {selectedManager?.lastName || ''}</strong> and send new login credentials via email.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> The sales manager will receive an email with new temporary password and will be required to change it on next login.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setSelectedManager(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmResetPassword}
                disabled={resettingPassword}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {resettingPassword ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredSalesManagers = salesManagers.filter(manager => {
    // Ensure manager object exists and has required properties
    if (!manager || !manager.firstName) return false;

    const matchesSearch =
      manager.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (manager.salesUniqueId && manager.salesUniqueId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = !filters.status || manager.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Button onClick={fetchSalesManagers}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 mr-3 text-blue-600" />
            Sales Manager Management
          </h1>
          <p className="text-gray-600 mt-2">Manage and track your sales team leaders</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2"
        >
          <UserPlus className="h-5 w-5" />
          <span>Add Sales Manager</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search Sales Managers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Sales Managers List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSalesManagers.map(manager => (
                <tr key={manager?._id || Math.random()} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {manager?.firstName || 'N/A'} {manager?.lastName || ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{manager?.email || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-blue-600 font-mono">
                    {manager?.salesUniqueId || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      manager?.status === 'active' ? 'bg-green-100 text-green-800' :
                      manager?.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {manager?.status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewManager(manager)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedManager(manager);
                          setNewManagerForm({
                            firstName: manager.firstName,
                            lastName: manager.lastName,
                            email: manager.email,
                            phone: manager.phone
                          });
                          setShowEditModal(true);
                        }}
                        className="text-green-600 hover:text-green-800 hover:bg-green-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetPassword(manager)}
                        className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                      >
                        <Key className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteManager(manager)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Sales Manager Modal */}
      {showAddModal && renderAddEditModal()}

      {/* Edit Sales Manager Modal */}
      {showEditModal && renderAddEditModal(true)}

      {/* View Sales Manager Modal */}
      {showViewModal && renderViewModal()}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && renderDeleteModal()}

      {/* Reset Password Modal */}
      {showResetPasswordModal && renderResetPasswordModal()}
    </div>
  );
};

export default SalesManagerManagement;
