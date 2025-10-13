import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Play,
  MessageSquare,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import ticketService from '../../services/ticket.service';

const StatusUpdateModal = ({ isOpen, onClose, ticket, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    feedback: '',
    resolution: ''
  });

  const [errors, setErrors] = useState({});

  // Set initial status based on current ticket status
  React.useEffect(() => {
    if (ticket) {
      let nextStatus = '';
      switch (ticket.status) {
        case 'open':
          nextStatus = 'in_progress';
          break;
        case 'in_progress':
          nextStatus = 'resolved';
          break;
        case 'resolved':
          nextStatus = 'closed';
          break;
        default:
          nextStatus = ticket.status;
      }
      setFormData(prev => ({
        ...prev,
        status: nextStatus
      }));
    }
  }, [ticket]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'in_progress':
        return {
          icon: <Play className="h-6 w-6 text-blue-600" />,
          title: 'Start Working on Ticket',
          description: 'Mark this ticket as in progress and provide initial feedback',
          color: 'blue',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700'
        };
      case 'resolved':
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          title: 'Mark as Resolved',
          description: 'Provide details about the solution and what was fixed',
          color: 'green',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700'
        };
      case 'closed':
        return {
          icon: <FileText className="h-6 w-6 text-gray-600" />,
          title: 'Close Ticket',
          description: 'Finalize the ticket with closing remarks',
          color: 'gray',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700'
        };
      default:
        return {
          icon: <AlertCircle className="h-6 w-6 text-yellow-600" />,
          title: 'Update Status',
          description: 'Update ticket status with feedback',
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700'
        };
    }
  };

  const statusInfo = getStatusInfo(formData.status);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      const validationErrors = {};
      if (!formData.feedback.trim()) {
        validationErrors.feedback = 'Feedback is required';
      }
      if (formData.status === 'resolved' && !formData.resolution.trim()) {
        validationErrors.resolution = 'Resolution details are required when marking as resolved';
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        toast.error('Please fix the validation errors');
        return;
      }

      const response = await ticketService.updateTicketStatus(
        ticket._id, 
        formData.status, 
        formData.resolution || formData.feedback
      );

      if (response.success) {
        toast.success('Ticket status updated successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to update ticket status');
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error(error.message || 'An error occurred while updating the ticket');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 ${statusInfo.bgColor} ${statusInfo.borderColor} border-b`}>
              <div className="flex items-center space-x-3">
                <div className={`p-3 ${statusInfo.bgColor} rounded-xl`}>
                  {statusInfo.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {statusInfo.title}
                  </h2>
                  <p className={`text-sm ${statusInfo.textColor}`}>
                    {statusInfo.description}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Ticket Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Ticket Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Title:</span>
                    <span className="font-semibold text-gray-900">{ticket?.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Status:</span>
                    <span className="font-semibold text-gray-900 capitalize">{ticket?.status?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New Status:</span>
                    <span className={`font-semibold px-2 py-1 rounded-full text-xs ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                      {getStatusLabel(formData.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status To *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {ticket?.status === 'open' && (
                    <option value="in_progress">In Progress - Start working on the ticket</option>
                  )}
                  {ticket?.status === 'in_progress' && (
                    <option value="resolved">Resolved - Mark as completed</option>
                  )}
                  {ticket?.status === 'resolved' && (
                    <option value="closed">Closed - Finalize the ticket</option>
                  )}
                </select>
              </div>

              {/* Feedback Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback / Work Details *
                </label>
                <textarea
                  value={formData.feedback}
                  onChange={(e) => handleInputChange('feedback', e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.feedback ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={
                    formData.status === 'in_progress' 
                      ? "Describe what you're working on and any initial findings..."
                      : formData.status === 'resolved'
                      ? "Describe the solution implemented and what was fixed..."
                      : "Provide closing remarks and final notes..."
                  }
                />
                {errors.feedback && <p className="mt-1 text-sm text-red-600">{errors.feedback}</p>}
              </div>

              {/* Resolution Details (for resolved status) */}
              {formData.status === 'resolved' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Details *
                  </label>
                  <textarea
                    value={formData.resolution}
                    onChange={(e) => handleInputChange('resolution', e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.resolution ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Provide detailed information about the solution, what was fixed, and any follow-up actions needed..."
                  />
                  {errors.resolution && <p className="mt-1 text-sm text-red-600">{errors.resolution}</p>}
                  <p className="mt-1 text-xs text-gray-500">
                    This will be stored as the official resolution for the ticket
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                    formData.status === 'in_progress' 
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : formData.status === 'resolved'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>
                        {formData.status === 'in_progress' 
                          ? 'Start Work'
                          : formData.status === 'resolved'
                          ? 'Mark Resolved'
                          : 'Close Ticket'
                        }
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatusUpdateModal; 