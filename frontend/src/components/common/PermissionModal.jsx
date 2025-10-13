import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * PermissionModal Component
 * Shows when users try to perform actions they don't have permission for
 */
const PermissionModal = ({ isOpen, onClose, module, submodule, action }) => {
  const navigate = useNavigate();

  const getModuleDisplayName = (moduleName) => {
    const names = {
      resident_management: 'Resident Management',
      payment_tracking: 'Payment Tracking',
      room_allocation: 'Room Allocation',
      qr_code_payments: 'QR Code Payments',
      ticket_system: 'Ticket System',
      analytics_reports: 'Analytics & Reports',
      bulk_upload: 'Bulk Upload',
      email_notifications: 'Email Notifications',
      sms_notifications: 'SMS Notifications',
      multi_branch: 'Multi-Branch',
      custom_reports: 'Custom Reports',
      api_access: 'API Access',
      mobile_app: 'Mobile App',
      advanced_analytics: 'Advanced Analytics'
    };
    return names[moduleName] || moduleName;
  };

  const getSubmoduleDisplayName = (submoduleName) => {
    const names = {
      residents: 'Residents',
      onboarding: 'Onboarding',
      offboarding: 'Offboarding',
      room_switching: 'Room Switching',
      moved_out: 'Moved Out',
      payments: 'Payments',
      payment_history: 'Payment History',
      payment_reports: 'Payment Reports',
      rooms: 'Rooms',
      room_availability: 'Room Availability',
      room_assignments: 'Room Assignments',
      qr_generation: 'QR Generation',
      qr_scanning: 'QR Scanning',
      payment_processing: 'Payment Processing',
      tickets: 'Tickets',
      ticket_categories: 'Ticket Categories',
      ticket_priorities: 'Ticket Priorities',
      dashboard: 'Dashboard',
      reports: 'Reports',
      charts: 'Charts',
      exports: 'Exports',
      file_upload: 'File Upload',
      data_validation: 'Data Validation',
      bulk_import: 'Bulk Import',
      email_templates: 'Email Templates',
      email_sending: 'Email Sending',
      email_history: 'Email History',
      sms_templates: 'SMS Templates',
      sms_sending: 'SMS Sending',
      sms_history: 'SMS History',
      branch_management: 'Branch Management',
      branch_switching: 'Branch Switching',
      branch_reports: 'Branch Reports',
      report_builder: 'Report Builder',
      custom_queries: 'Custom Queries',
      report_scheduling: 'Report Scheduling',
      api_keys: 'API Keys',
      api_endpoints: 'API Endpoints',
      api_logs: 'API Logs',
      mobile_sync: 'Mobile Sync',
      push_notifications: 'Push Notifications',
      offline_mode: 'Offline Mode',
      advanced_charts: 'Advanced Charts',
      predictive_analytics: 'Predictive Analytics',
      data_insights: 'Data Insights'
    };
    return names[submoduleName] || submoduleName;
  };

  const getActionDisplayName = (actionName) => {
    const names = {
      create: 'Create',
      read: 'View',
      update: 'Edit',
      delete: 'Delete'
    };
    return names[actionName] || actionName;
  };

  const handleUpgrade = () => {
    onClose();
    navigate('/admin/subscription-plans');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <Lock className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Permission Required</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Crown className="h-8 w-8 text-orange-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  Action Not Allowed
                </h4>
                <p className="text-gray-600">
                  You don't have permission to <strong>{getActionDisplayName(action)}</strong> {getSubmoduleDisplayName(submodule)} in {getModuleDisplayName(module)}.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Upgrade your subscription plan to unlock this feature and get access to more advanced capabilities.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgrade}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <span>Upgrade Plan</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PermissionModal;
