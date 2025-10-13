import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, AlertCircle, Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import ticketService from '../../services/ticket.service';

const TicketForm = ({ isOpen, onClose, ticket = null, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    status: 'open'
  });

  const [errors, setErrors] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const isEdit = !!ticket;

  // Load form data and options
  useEffect(() => {
    loadFormOptions();
    if (isEdit && ticket) {
      setFormData({
        title: ticket.title || '',
        description: ticket.description || '',
        category: ticket.category || '',
        status: ticket.status || 'open'
      });
    }
  }, [ticket, isEdit]);

  const loadFormOptions = async () => {
    try {
      // Load categories
      const categoriesRes = await ticketService.getTicketCategories();

      if (categoriesRes && categoriesRes.success) {
        setCategories(categoriesRes.data);
      } else {
        console.error('Failed to load categories:', categoriesRes?.message || 'No response');
        // Use fallback categories
        setCategories([
          { value: 'maintenance', label: 'Maintenance' },
          { value: 'billing', label: 'Billing' },
          { value: 'complaint', label: 'Complaint' },
          { value: 'suggestion', label: 'Suggestion' },
          { value: 'emergency', label: 'Emergency' },
          { value: 'other', label: 'Other' }
        ]);
      }

      // Load statuses
      const statusesRes = await ticketService.getStatusOptions();
      if (statusesRes && statusesRes.success) {
        setStatuses(statusesRes.data);
      } else {
        // Use fallback statuses
        setStatuses([
          { value: 'open', label: 'Open', color: 'blue' },
          { value: 'in_progress', label: 'In Progress', color: 'yellow' },
          { value: 'resolved', label: 'Resolved', color: 'green' },
          { value: 'closed', label: 'Closed', color: 'gray' },
          { value: 'cancelled', label: 'Cancelled', color: 'red' }
        ]);
      }
    } catch (error) {
      console.error('Error loading form options:', error);
      toast.error('Failed to load form options');
      
      // Set fallback options
      setCategories([
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'billing', label: 'Billing' },
        { value: 'complaint', label: 'Complaint' },
        { value: 'suggestion', label: 'Suggestion' },
        { value: 'emergency', label: 'Emergency' },
        { value: 'other', label: 'Other' }
      ]);
      setStatuses([
        { value: 'open', label: 'Open', color: 'blue' },
        { value: 'in_progress', label: 'In Progress', color: 'yellow' },
        { value: 'resolved', label: 'Resolved', color: 'green' },
        { value: 'closed', label: 'Closed', color: 'gray' },
        { value: 'cancelled', label: 'Cancelled', color: 'red' }
      ]);
    }
  };

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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Form data being submitted:', formData);
      
      // Validate form data
      const validation = ticketService.validateTicketData(formData);
      console.log('Validation result:', validation);
      
      if (!validation.isValid) {
        const errorObj = {};
        validation.errors.forEach(error => {
          errorObj[error.field] = error.message;
        });
        console.log('Validation errors:', errorObj);
        setErrors(errorObj);
        toast.error('Please fix the validation errors');
        return;
      }

      let response;
      if (isEdit) {
        response = await ticketService.updateTicket(ticket._id, formData);
      } else {
        response = await ticketService.createTicket(formData);
      }

      console.log('API response:', response);

      if (response.success) {
        toast.success(isEdit ? 'Ticket updated successfully!' : 'Ticket created successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = !isEdit || (ticket && ticketService.isTicketEditable(ticket));

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
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isEdit ? 'Edit Ticket' : 'Create New Ticket'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {isEdit ? 'Update ticket information' : 'Submit a new support ticket'}
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
              {/* Warning for edit restrictions */}
              {isEdit && !canEdit && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                >
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-800">
                      This ticket can no longer be edited. Tickets can only be edited within 1 hour of creation and when status is open.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Ticket Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      disabled={!canEdit}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.title ? 'border-red-500' : 'border-gray-300'
                      } ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="Enter ticket title"
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      disabled={!canEdit}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      } ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      disabled={!canEdit}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.status ? 'border-red-500' : 'border-gray-300'
                      } ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      {statuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={!canEdit}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    } ${!canEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Describe the issue in detail"
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>
              </div>

              {/* Attachments */}
              {canEdit && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Attachments
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Files
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Supported formats: Images, PDF, DOC, DOCX (Max 5MB each)
                    </p>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                {canEdit && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>{isEdit ? 'Update Ticket' : 'Create Ticket'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TicketForm; 