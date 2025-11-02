import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit,
  X,
  UserCheck,
  UserX,
  Clock,
  Info
} from 'lucide-react';

const SupportStaffDetailsModal = ({ isOpen, onClose, staff, onEdit }) => {
  if (!staff) return null;

  const getStatusColor = (isActive) => {
    return isActive
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusIcon = (isActive) => {
    return isActive ? UserCheck : UserX;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={onClose}
        >
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modern Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 id="modal-title" className="text-xl font-semibold text-white">
                        Support Staff Details
                      </h3>
                      <p className="text-blue-100 text-sm">
                        View complete information for {staff.firstName} {staff.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={onEdit}
                      className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                      title="Edit Staff Information"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={onClose}
                      className="text-white/80 hover:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-xl p-2 transition-colors"
                      aria-label="Close modal"
                      type="button"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white px-6 py-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Info className="h-5 w-5 mr-2 text-blue-500" />
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-lg font-medium text-white">
                              {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h5 className="text-lg font-semibold text-gray-900">
                              {staff.firstName} {staff.lastName}
                            </h5>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(staff.isActive)}`}
                              >
                                {React.createElement(getStatusIcon(staff.isActive), { className: "h-3 w-3 mr-1" })}
                                {staff.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className="text-xs text-gray-500">
                                ID: {staff._id.slice(-8)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <a href={`mailto:${staff.email}`} className="text-blue-600 hover:text-blue-800 font-medium">
                              {staff.email}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <a href={`tel:${staff.phone}`} className="text-blue-600 hover:text-blue-800 font-medium">
                              {staff.phone}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-green-500" />
                      Account Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Role</p>
                            <p className="font-medium capitalize">{staff.role || 'Support Staff'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Joined Date</p>
                            <p className="font-medium">{formatDate(staff.createdAt)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Last Login</p>
                            <p className="font-medium">{formatDate(staff.lastLogin)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Account Status</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(staff.isActive)}`}>
                              {staff.isActive ? 'Active Account' : 'Inactive Account'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-blue-500"
                    >
                      Close
                    </button>
                    <button
                      onClick={onEdit}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                    >
                      Edit Staff
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SupportStaffDetailsModal;
