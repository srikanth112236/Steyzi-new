import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  User,
  Building2,
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
  Award,
  Shield,
  Activity
} from 'lucide-react';

const TicketDetailsModal = ({ isOpen, onClose, ticket, onStatusUpdate, onReopenRequest }) => {
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0.5 }}
            className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-100 bg-white/95 shadow-2xl shadow-black/20 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex flex-col gap-6 p-6">
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 p-6 text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-white/60">Ticket overview</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      Ticket #{ticket._id.slice(-8)}
                    </h2>
                    <p className="mt-1 text-sm text-white/70">Complete context, history, and actions in one compact sheet.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getPriorityColor(ticket.priority)}`}>
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {ticket.priority}
                    </span>
                    <button
                      onClick={onClose}
                      className="rounded-full border border-white/20 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-white/70">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(ticket.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                    <Clock className="h-3.5 w-3.5" />
                    Age {ticket.age || 0} days
                  </span>
                  {ticket.user?.firstName && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                      <User className="h-3.5 w-3.5" />
                      {ticket.user?.firstName} {ticket.user?.lastName}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-b border-slate-200">
                <nav className="flex gap-4 text-sm font-semibold">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 transition ${
                        activeTab === tab.id
                          ? 'bg-slate-900 text-white shadow'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="max-h-[55vh] overflow-y-auto pr-2">
                <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-5"
                  >
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                      <h3 className="text-lg font-semibold text-slate-900">{ticket.title}</h3>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{ticket.description}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      {[
                        { label: 'Created', value: formatDate(ticket.createdAt), icon: Calendar, tone: 'from-blue-500/15 to-blue-600/15 text-blue-900' },
                        { label: 'Category', value: ticket.category, icon: Tag, tone: 'from-emerald-500/15 to-emerald-600/15 text-emerald-900' },
                        { label: 'Age', value: `${ticket.age || 0} days`, icon: Clock, tone: 'from-purple-500/15 to-purple-600/15 text-purple-900' }
                      ].map((card) => (
                        <div key={card.label} className={`rounded-2xl border border-slate-100 bg-gradient-to-br ${card.tone} p-4`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-widest text-slate-500">{card.label}</p>
                              <p className="mt-2 text-lg font-semibold capitalize">{card.value}</p>
                            </div>
                            <card.icon className="h-5 w-5 opacity-70" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <FileText className="h-4 w-4 text-slate-500" />
                          Ticket Information
                        </h4>
                        <dl className="mt-4 space-y-3 text-sm">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <dt className="text-slate-500">Status</dt>
                            <dd className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                              {getStatusIcon(ticket.status)}
                              {ticket.status.replace('_', ' ')}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <dt className="text-slate-500">Priority</dt>
                            <dd className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                              <span className="h-2 w-2 rounded-full bg-current" />
                              {ticket.priority}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <dt className="text-slate-500">Category</dt>
                            <dd className="font-semibold text-slate-900 capitalize">{ticket.category}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-slate-500">Created</dt>
                            <dd className="font-medium text-slate-900">{formatDate(ticket.createdAt)}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <MapPin className="h-4 w-4 text-green-500" />
                          Location & Contact
                        </h4>
                        <dl className="mt-4 space-y-3 text-sm">
                          {ticket.location?.room && (
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <dt className="text-slate-500">Room</dt>
                              <dd className="font-semibold text-slate-900">{ticket.location.room}</dd>
                            </div>
                          )}
                          {ticket.location?.floor && (
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <dt className="text-slate-500">Floor</dt>
                              <dd className="font-semibold text-slate-900">{ticket.location.floor}</dd>
                            </div>
                          )}
                          {ticket.location?.building && (
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <dt className="text-slate-500">Building</dt>
                              <dd className="font-semibold text-slate-900">{ticket.location.building}</dd>
                            </div>
                          )}
                          {ticket.contactPhone && (
                            <div className="flex items-center justify-between">
                              <dt className="text-slate-500">Contact</dt>
                              <dd className="font-semibold text-slate-900">{ticket.contactPhone}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>

                    {ticket.assignedTo && (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                          <Users className="h-4 w-4 text-blue-600" />
                          Assigned To
                        </h4>
                        <div className="mt-4 flex items-center gap-3">
                          <div className="rounded-2xl bg-white/70 p-3">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-blue-900">
                              {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                            </p>
                            <p className="text-blue-700">{ticket.assignedTo.email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {ticket.resolution && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                          <Award className="h-4 w-4 text-emerald-600" />
                          Resolution
                        </h4>
                        <div className="mt-4 space-y-3">
                          <div className="rounded-xl border border-emerald-200 bg-white p-3">
                            <p className="text-sm font-medium text-slate-900">Solution</p>
                            <p className="text-sm text-slate-600">{ticket.resolution.solution}</p>
                          </div>
                          {ticket.resolution.rating && (
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-emerald-800">Rating</span>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-5 w-5 ${
                                      i < ticket.resolution.rating
                                        ? 'text-amber-400 fill-current'
                                        : 'text-slate-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {ticket.resolution.feedback && (
                            <div className="rounded-xl border border-emerald-200 bg-white p-3">
                              <p className="text-sm font-medium text-emerald-800">Feedback</p>
                              <p className="text-sm text-slate-600">{ticket.resolution.feedback}</p>
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
                    <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-4">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-purple-900 mb-4">
                        <Activity className="h-4 w-4 text-purple-600" />
                        Ticket Timeline
                      </h4>
                      
                      <div className="space-y-4">
                        {ticket.timeline && ticket.timeline.length > 0 ? (
                          ticket.timeline.map((entry, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-purple-200 bg-white">
                                  {getTimelineIcon(entry.action)}
                                </div>
                                {index < ticket.timeline.length - 1 && (
                                  <div className="ml-4 h-8 w-0.5 bg-purple-200"></div>
                                )}
                              </div>
                              <div className="flex-1 rounded-2xl border border-purple-200 bg-white p-4">
                                <div className="mb-1 flex items-center justify-between">
                                  <h5 className="text-sm font-semibold text-slate-900 capitalize">
                                    {entry.action.replace('_', ' ')}
                                  </h5>
                                  <span className="text-xs text-slate-500">
                                    {formatDate(entry.timestamp)}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600">{entry.description}</p>
                                {entry.performedBy && (
                                  <p className="mt-2 text-xs text-purple-600">
                                    by {entry.performedBy.firstName} {entry.performedBy.lastName}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Activity className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                            <p className="text-sm text-slate-500">No timeline entries yet</p>
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
                  {ticket.status === 'closed' && onReopenRequest && (
                    <button
                      onClick={() => onReopenRequest(ticket)}
                      className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      🔄 Request Reopen
                    </button>
                  )}
                  {onStatusUpdate && ticket.status !== 'closed' && ticket.status !== 'resolved' && (
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
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TicketDetailsModal; 