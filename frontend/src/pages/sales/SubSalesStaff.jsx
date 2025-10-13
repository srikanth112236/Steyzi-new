import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Users, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  X
} from 'lucide-react';
import salesService from '../../services/sales.service';
import toast from 'react-hot-toast';

const SubSalesStaff = () => {
  const [subSalesStaff, setSubSalesStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [newStaffForm, setNewStaffForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    commissionRate: 10
  });
  const [editStaffForm, setEditStaffForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    commissionRate: 10
  });

  useEffect(() => {
    fetchSubSalesStaff();
  }, []);

  const fetchSubSalesStaff = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await salesService.getAllSalesStaff();
      setSubSalesStaff(response.data || []);
      if (showLoading) {
        setLoading(false);
      }
    } catch (error) {
      if (showLoading) {
        toast.error('Failed to fetch sub-sales staff');
        setLoading(false);
      } else {
        console.error('Failed to refresh sub-sales staff data:', error);
      }
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await salesService.createSalesStaff(newStaffForm);
      toast.success('Sub-sales staff added successfully');

      // Re-fetch all staff to ensure we have complete, consistent data
      await fetchSubSalesStaff(false);

      setShowAddModal(false);
      resetNewStaffForm();
    } catch (error) {
      toast.error(error.message || 'Failed to add sub-sales staff');
    }
  };

  const handleEditStaff = async (e) => {
    e.preventDefault();
    try {
      await salesService.updateSalesStaff(editingStaff._id, editStaffForm);
      toast.success('Sub-sales staff updated successfully');

      // Re-fetch all staff to ensure we have complete, consistent data
      await fetchSubSalesStaff(false);

      setShowEditModal(false);
      setEditingStaff(null);
    } catch (error) {
      toast.error(error.message || 'Failed to update sub-sales staff');
    }
  };

  const handleDeleteStaff = async () => {
    try {
      console.log('🗑️ Frontend: Attempting to delete staff:', {
        staffToDelete,
        staffId: staffToDelete?._id || staffToDelete?.id,
        staffIdType: typeof (staffToDelete?._id || staffToDelete?.id)
      });

      const staffId = staffToDelete?._id || staffToDelete?.id;
      if (!staffId) {
        throw new Error('Staff ID not found');
      }

      await salesService.deleteSalesStaff(staffId);
      toast.success('Sub-sales staff deleted successfully');

      // Re-fetch all staff to ensure we have complete, consistent data
      await fetchSubSalesStaff(false);

      setShowDeleteModal(false);
      setStaffToDelete(null);
    } catch (error) {
      console.error('❌ Frontend: Delete failed:', error);
      toast.error(error.message || 'Failed to delete sub-sales staff');
    }
  };

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setEditStaffForm({
      firstName: staff?.firstName || '',
      lastName: staff?.lastName || '',
      email: staff?.email || '',
      phone: staff?.phone || '',
      address: {
        street: staff?.address?.street || '',
        city: staff?.address?.city || '',
        state: staff?.address?.state || '',
        pincode: staff?.address?.pincode || '',
        country: staff?.address?.country || 'India'
      },
      commissionRate: staff?.salesCommissionRate || 10
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (staff) => {
    setStaffToDelete(staff);
    setShowDeleteModal(true);
  };

  const resetNewStaffForm = () => {
    setNewStaffForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      commissionRate: 10
    });
  };

  const renderAddStaffModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add Sub-Sales Staff</h2>
          <button 
            onClick={() => setShowAddModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={newStaffForm.firstName}
                onChange={(e) => setNewStaffForm({...newStaffForm, firstName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={newStaffForm.lastName}
                onChange={(e) => setNewStaffForm({...newStaffForm, lastName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={newStaffForm.email}
              onChange={(e) => setNewStaffForm({...newStaffForm, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={newStaffForm.phone}
              onChange={(e) => setNewStaffForm({...newStaffForm, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          {/* Address Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Street Address"
                value={newStaffForm.address.street}
                onChange={(e) => setNewStaffForm({
                  ...newStaffForm,
                  address: {...newStaffForm.address, street: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={newStaffForm.address.city}
                  onChange={(e) => setNewStaffForm({
                    ...newStaffForm,
                    address: {...newStaffForm.address, city: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={newStaffForm.address.state}
                  onChange={(e) => setNewStaffForm({
                    ...newStaffForm,
                    address: {...newStaffForm.address, state: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Pincode"
                  value={newStaffForm.address.pincode}
                  onChange={(e) => setNewStaffForm({
                    ...newStaffForm,
                    address: {...newStaffForm.address, pincode: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={newStaffForm.address.country}
                  onChange={(e) => setNewStaffForm({
                    ...newStaffForm,
                    address: {...newStaffForm.address, country: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  defaultValue="India"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={newStaffForm.commissionRate}
              onChange={(e) => setNewStaffForm({...newStaffForm, commissionRate: parseFloat(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button 
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Staff
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="h-8 w-8 mr-3 text-blue-600" />
            Sub-Sales Staff
          </h1>
          <p className="text-gray-600 mt-2">Manage and track your sub-sales team</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="h-5 w-5" />
          <span>Add Staff</span>
        </button>
      </div>

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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PGs Added</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subSalesStaff.map(staff => (
                <tr key={staff?._id || Math.random()} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {staff?.firstName || ''} {staff?.lastName || ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{staff?.email || ''}</td>
                  <td className="px-4 py-3 text-sm text-blue-600">{staff?.salesUniqueId || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {staff?.salesPerformanceMetrics?.totalPGsAdded || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(staff)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit Staff"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(staff)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove Staff"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && renderAddStaffModal()}

      {/* Edit Staff Modal */}
      {showEditModal && renderEditStaffModal()}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && renderDeleteConfirmationModal()}
    </div>
  );

  function renderEditStaffModal() {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Edit Sub-Sales Staff</h2>
            <button
              onClick={() => setShowEditModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleEditStaff} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={editStaffForm.firstName}
                  onChange={(e) => setEditStaffForm({...editStaffForm, firstName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editStaffForm.lastName}
                  onChange={(e) => setEditStaffForm({...editStaffForm, lastName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={editStaffForm.email}
                onChange={(e) => setEditStaffForm({...editStaffForm, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={editStaffForm.phone}
                onChange={(e) => setEditStaffForm({...editStaffForm, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            {/* Address Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Street Address"
                  value={editStaffForm.address.street}
                  onChange={(e) => setEditStaffForm({
                    ...editStaffForm,
                    address: {...editStaffForm.address, street: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="City"
                    value={editStaffForm.address.city}
                    onChange={(e) => setEditStaffForm({
                      ...editStaffForm,
                      address: {...editStaffForm.address, city: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={editStaffForm.address.state}
                    onChange={(e) => setEditStaffForm({
                      ...editStaffForm,
                      address: {...editStaffForm.address, state: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={editStaffForm.address.pincode}
                    onChange={(e) => setEditStaffForm({
                      ...editStaffForm,
                      address: {...editStaffForm.address, pincode: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={editStaffForm.address.country}
                    onChange={(e) => setEditStaffForm({
                      ...editStaffForm,
                      address: {...editStaffForm.address, country: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    defaultValue="India"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={editStaffForm.commissionRate}
                onChange={(e) => setEditStaffForm({...editStaffForm, commissionRate: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Staff
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderDeleteConfirmationModal() {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Delete Sub-Sales Staff</h2>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{staffToDelete?.firstName || ''} {staffToDelete?.lastName || ''}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                <strong>Warning:</strong> This action cannot be undone. The staff member will be permanently removed from your team.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteStaff}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete Staff
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default SubSalesStaff;
