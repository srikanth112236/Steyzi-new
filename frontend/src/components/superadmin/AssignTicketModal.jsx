import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  UserCheck, 
  Users, 
  Loader2, 
  AlertCircle,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import ticketService from '../../services/ticket.service';
import toast from 'react-hot-toast';

const AssignTicketModal = ({ isOpen, onClose, ticket, onSuccess }) => {
  const [supportStaff, setSupportStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSupportStaff();
    }
  }, [isOpen]);

  const loadSupportStaff = async () => {
    try {
      setLoadingStaff(true);
      const response = await ticketService.getSupportStaff();
      if (response.success) {
        // Filter only active support staff
        const activeStaff = response.data.filter(staff => staff.isActive);
        setSupportStaff(activeStaff);
      } else {
        toast.error(response.message || 'Failed to load support staff');
      }
    } catch (error) {
      console.error('Error loading support staff:', error);
      toast.error('Failed to load support staff');
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedStaffId) {
      setError('Please select a support staff member');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await ticketService.assignTicket(ticket._id, selectedStaffId);
      
      if (response.success) {
        toast.success('Ticket assigned successfully!');
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        setError(response.message || 'Failed to assign ticket');
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
      setError(error.message || 'Failed to assign ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedStaffId('');
      setError('');
      onClose();
    }
  };

  const selectedStaff = supportStaff.find(staff => staff._id === selectedStaffId);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Assign Ticket</h2>
                  <p className="text-sm text-gray-600">
                    Assign ticket "{ticket?.title}" to support staff:
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Ticket Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Ticket Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Title:</span> {ticket?.title}
                  </div>
                  <div>
                    <span className="font-medium">Category:</span> {ticket?.category}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      ticket?.status === 'open' ? 'bg-blue-100 text-blue-800' :
                      ticket?.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket?.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {
                      ticket?.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'
                    }
                  </div>
                </div>
              </div>

              {/* Support Staff Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Support Staff
                </label>
                {loadingStaff ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading support staff...</span>
                  </div>
                ) : supportStaff.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No Active Support Staff</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      There are no active support staff members available for assignment.
                    </p>
                    <button
                      onClick={() => window.open('/superadmin/support-staff', '_blank')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Support Staff
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select support staff...</option>
                    {supportStaff.map(staff => (
                      <option key={staff._id} value={staff._id}>
                        {staff.firstName} {staff.lastName} - {staff.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selected Staff Info */}
              {selectedStaff && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <h4 className="font-medium text-blue-900 mb-3">Selected Staff Member</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="font-medium">{selectedStaff.firstName} {selectedStaff.lastName}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-blue-600" />
                      <span>{selectedStaff.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-blue-600" />
                      <span>{selectedStaff.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                      <span>Joined: {new Date(selectedStaff.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm text-red-800">{error}</span>
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={loading || !selectedStaffId || supportStaff.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      <span>Assign Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AssignTicketModal; 