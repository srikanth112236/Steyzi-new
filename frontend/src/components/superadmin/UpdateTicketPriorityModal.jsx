import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  AlertTriangle, 
  Loader2, 
  Star,
  Clock,
  Zap,
  Flame
} from 'lucide-react';
import ticketService from '../../services/ticket.service';
import toast from 'react-hot-toast';

const UpdateTicketPriorityModal = ({ isOpen, onClose, ticket, onSuccess }) => {
  const [priority, setPriority] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && ticket) {
      setPriority(ticket.priority || 'medium');
    }
  }, [isOpen, ticket]);

  const handleUpdate = async () => {
    if (!priority) {
      setError('Please select a priority level');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await ticketService.updateTicket(ticket._id, { priority });
      
      if (response.success) {
        toast.success('Ticket priority updated successfully!');
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        setError(response.message || 'Failed to update priority');
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      setError(error.message || 'Failed to update priority');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPriority('');
      setError('');
      onClose();
    }
  };

  const getPriorityIcon = (priorityLevel) => {
    switch (priorityLevel) {
      case 'low':
        return <Clock className="h-4 w-4 text-green-600" />;
      case 'medium':
        return <Star className="h-4 w-4 text-yellow-600" />;
      case 'high':
        return <Zap className="h-4 w-4 text-orange-600" />;
      case 'urgent':
        return <Flame className="h-4 w-4 text-red-600" />;
      default:
        return <Star className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priorityLevel) => {
    switch (priorityLevel) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Update Ticket Priority
                  </h2>
                  <p className="text-sm text-gray-600">
                    Set the priority level for this ticket
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Ticket Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Ticket Details</h3>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Title:</span> {ticket?.title}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Category:</span> {ticket?.category}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Current Priority:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket?.priority)}`}>
                    {ticket?.priority?.charAt(0).toUpperCase() + ticket?.priority?.slice(1) || 'Medium'}
                  </span>
                </p>
              </div>

              {/* Priority Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  New Priority Level *
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'low', label: 'Low', description: 'Non-urgent issues' },
                    { value: 'medium', label: 'Medium', description: 'Standard priority' },
                    { value: 'high', label: 'High', description: 'Important issues' },
                    { value: 'urgent', label: 'Urgent', description: 'Critical issues' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        priority === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={option.value}
                        checked={priority === option.value}
                        onChange={(e) => setPriority(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        {getPriorityIcon(option.value)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading || !priority}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span>Update Priority</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateTicketPriorityModal; 