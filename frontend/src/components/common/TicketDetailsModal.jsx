import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock, 
  User, 
  Building2, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Play, 
  Users,
  Calendar,
  FileText,
  Tag,
  MessageCircle,
  TrendingUp,
  Award,
  Shield,
  Activity
} from 'lucide-react';

const TicketDetailsModal = ({ isOpen, onClose, ticket, onStatusUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!ticket) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Play className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimelineIcon = (action) => {
    switch (action) {
      case 'created': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'assigned': return <Users className="h-4 w-4 text-green-500" />;
      case 'status_updated': return <Activity className="h-4 w-4 text-purple-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <MessageCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FileText className="h-4 w-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Activity className="h-4 w-4" /> },
    { id: 'details', label: 'Details', icon: <MessageCircle className="h-4 w-4" /> }
  ];

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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Ticket #{ticket._id.slice(-8)}</h2>
                    <p className="text-blue-100">Complete ticket overview and timeline</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex space-x-1 p-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Ticket Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{ticket.title}</h3>
                          <p className="text-gray-600 leading-relaxed">{ticket.description}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1.5 capitalize">{ticket.status.replace('_', ' ')}</span>
                          </span>
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getPriorityColor(ticket.priority)}`}>
                            <span className="w-2 h-2 rounded-full bg-current mr-2" />
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm font-medium">Created</p>
                            <p className="text-xl font-bold">{formatDate(ticket.createdAt)}</p>
                          </div>
                          <Calendar className="h-8 w-8 text-blue-200" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-sm font-medium">Category</p>
                            <p className="text-xl font-bold capitalize">{ticket.category}</p>
                          </div>
                          <Tag className="h-8 w-8 text-green-200" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100 text-sm font-medium">Age</p>
                            <p className="text-xl font-bold">{ticket.age || 0} days</p>
                          </div>
                          <Clock className="h-8 w-8 text-purple-200" />
                        </div>
                      </div>
                    </div>

                    {/* Key Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Ticket Information */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-blue-500" />
                          Ticket Information
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600 font-medium">Status</span>
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                              {getStatusIcon(ticket.status)}
                              <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600 font-medium">Priority</span>
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                              <span className="w-2 h-2 rounded-full bg-current mr-1" />
                              {ticket.priority}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600 font-medium">Category</span>
                            <span className="text-gray-900 font-semibold capitalize">{ticket.category}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 font-medium">Created</span>
                            <span className="text-gray-900">{formatDate(ticket.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Location & Contact */}
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <MapPin className="h-5 w-5 mr-2 text-green-500" />
                          Location & Contact
                        </h4>
                        <div className="space-y-3">
                          {ticket.location?.room && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600 font-medium">Room</span>
                              <span className="text-gray-900 font-semibold">{ticket.location.room}</span>
                            </div>
                          )}
                          {ticket.location?.floor && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600 font-medium">Floor</span>
                              <span className="text-gray-900 font-semibold">{ticket.location.floor}</span>
                            </div>
                          )}
                          {ticket.location?.building && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="text-gray-600 font-medium">Building</span>
                              <span className="text-gray-900 font-semibold">{ticket.location.building}</span>
                            </div>
                          )}
                          {ticket.contactPhone && (
                            <div className="flex justify-between items-center py-2">
                              <span className="text-gray-600 font-medium">Contact</span>
                              <span className="text-gray-900 font-semibold">{ticket.contactPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Assigned To Section */}
                    {ticket.assignedTo && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                        <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                          <Users className="h-5 w-5 mr-2 text-blue-600" />
                          Assigned To
                        </h4>
                        <div className="flex items-center">
                          <div className="p-3 bg-blue-100 rounded-xl mr-4">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-blue-900">
                              {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                            </p>
                            <p className="text-blue-700">{ticket.assignedTo.email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Resolution Section */}
                    {ticket.resolution && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
                        <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                          <Award className="h-5 w-5 mr-2 text-green-600" />
                          Resolution
                        </h4>
                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4 border border-green-200">
                            <p className="text-gray-900 font-medium mb-2">Solution:</p>
                            <p className="text-gray-700">{ticket.resolution.solution}</p>
                          </div>
                          {ticket.resolution.rating && (
                            <div className="flex items-center">
                              <span className="text-green-700 font-medium mr-3">Rating:</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-5 w-5 ${
                                      i < ticket.resolution.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {ticket.resolution.feedback && (
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                              <p className="text-green-700 font-medium mb-2">Feedback:</p>
                              <p className="text-gray-700">{ticket.resolution.feedback}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'timeline' && (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
                      <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-purple-600" />
                        Ticket Timeline
                      </h4>
                      
                      <div className="space-y-4">
                        {ticket.timeline && ticket.timeline.length > 0 ? (
                          ticket.timeline.map((entry, index) => (
                            <div key={index} className="flex items-start space-x-4">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-white rounded-full border-2 border-purple-200 flex items-center justify-center">
                                  {getTimelineIcon(entry.action)}
                                </div>
                                {index < ticket.timeline.length - 1 && (
                                  <div className="w-0.5 h-8 bg-purple-200 ml-4"></div>
                                )}
                              </div>
                              <div className="flex-1 bg-white rounded-lg p-4 border border-purple-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-gray-900 capitalize">
                                    {entry.action.replace('_', ' ')}
                                  </h5>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(entry.timestamp)}
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm">{entry.description}</p>
                                {entry.performedBy && (
                                  <p className="text-xs text-purple-600 mt-2">
                                    by {entry.performedBy.firstName} {entry.performedBy.lastName}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No timeline entries yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'details' && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* PG Information */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Building2 className="h-5 w-5 mr-2 text-blue-500" />
                        PG Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">PG Name</span>
                          <span className="text-gray-900 font-semibold">{ticket.pg?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 font-medium">PG ID</span>
                          <span className="text-gray-900 font-mono text-sm">{ticket.pg?._id || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* User Information */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <User className="h-5 w-5 mr-2 text-green-500" />
                        Created By
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Name</span>
                          <span className="text-gray-900 font-semibold">
                            {ticket.user?.firstName} {ticket.user?.lastName}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Email</span>
                          <span className="text-gray-900 font-semibold">{ticket.user?.email}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 font-medium">User ID</span>
                          <span className="text-gray-900 font-mono text-sm">{ticket.user?._id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Technical Details */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-gray-500" />
                        Technical Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Ticket ID</span>
                          <span className="text-gray-900 font-mono text-sm">{ticket._id}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Created At</span>
                          <span className="text-gray-900">{formatDate(ticket.createdAt)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Last Updated</span>
                          <span className="text-gray-900">{formatDate(ticket.updatedAt)}</span>
                        </div>
                        {ticket.dueDate && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600 font-medium">Due Date</span>
                            <span className="text-gray-900">{formatDate(ticket.dueDate)}</span>
                          </div>
                        )}
                        {ticket.closedAt && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 font-medium">Closed At</span>
                            <span className="text-gray-900">{formatDate(ticket.closedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Attachments */}
                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-orange-500" />
                          Attachments
                        </h4>
                        <div className="space-y-2">
                          {ticket.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-gray-500" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                                  <p className="text-xs text-gray-500">{attachment.fileType}</p>
                                </div>
                              </div>
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                View
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 bg-gray-50 p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Ticket #{ticket._id.slice(-8)} • Last updated {formatDate(ticket.updatedAt)}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  {onStatusUpdate && (
                    <button
                      onClick={() => onStatusUpdate(ticket)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Update Status
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TicketDetailsModal; 