import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Building,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Play,
  Check,
  X
} from 'lucide-react';
import ticketService from '../../services/ticket.service';
import TicketDetailsModal from '../../components/common/TicketDetailsModal';
import StatusUpdateModal from '../../components/common/StatusUpdateModal';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';

const SupportTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [assignedView, setAssignedView] = useState('me'); // default to 'me'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0
  });

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [assignedView]);

  const currentUser = useSelector(selectUser);

  // Filter tickets when filters change
  useEffect(() => {
    filterTickets();
  }, [tickets, statusFilter, priorityFilter, categoryFilter, searchTerm]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = assignedView === 'me' 
        ? await ticketService.getMyTickets() 
        : await ticketService.getTickets();
      if (response.success) {
        const myId = currentUser?._id?.toString();
        const data = Array.isArray(response.data) ? response.data : [];
        const onlyAssignedToMe = myId
          ? data.filter(t => {
              const at = t.assignedTo;
              const atId = typeof at === 'string' ? at : at?._id;
              return atId && atId.toString() === myId;
            })
          : data;
        setTickets(onlyAssignedToMe);
      } else {
        setError('Failed to load tickets');
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await ticketService.getTicketStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower) ||
        (ticket.user?.firstName + ' ' + ticket.user?.lastName).toLowerCase().includes(searchLower) ||
        ticket.category.toLowerCase().includes(searchLower)
      );
    }

    setFilteredTickets(filtered);
  };

  const handleStatusCardClick = (status) => {
    if (statusFilter === status) {
      // If clicking the same status, clear the filter
      setStatusFilter('all');
    } else {
      // Set the new status filter
      setStatusFilter(status);
    }
  };

  const handleUpdateStatus = (ticket) => {
    setSelectedTicket(ticket);
    setShowStatusUpdate(true);
  };

  const handleStatusUpdateSuccess = () => {
    loadTickets();
    loadStats();
    setShowStatusUpdate(false);
    setSelectedTicket(null);
  };

  const handleViewTicket = (ticket) => {
    navigate(`/support/tickets/${ticket._id}`);
  };

  const clearAllFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setSearchTerm('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in_progress': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'resolved': return 'bg-green-50 text-green-700 border-green-200';
      case 'closed': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const TicketCard = ({ ticket }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
    >
      {/* Status Indicator Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${getStatusColor(ticket.status).replace('border', 'bg').replace('text', 'bg').replace('bg-gray', 'bg-blue').replace('bg-red', 'bg-red').replace('bg-green', 'bg-green').replace('bg-yellow', 'bg-yellow').replace('bg-orange', 'bg-orange')}`} />
      
      <div className="p-6">
        {/* Header with Gradient Background */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl opacity-50" />
          <div className="relative flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                {ticket.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                {ticket.description}
              </p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(ticket.status)}`}>
                {getStatusIcon(ticket.status)}
                <span className="ml-1.5 capitalize">{ticket.status.replace('_', ' ')}</span>
              </span>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getPriorityColor(ticket.priority)}`}>
                <span className="w-2 h-2 rounded-full bg-current mr-2" />
                {ticket.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Building className="h-4 w-4 mr-3 text-emerald-500" />
            <div>
              <p className="text-xs text-gray-500 font-medium">PG Property</p>
              <p className="text-sm font-semibold text-gray-900">{ticket.pg?.name || ticket.pgName || 'Unknown PG'}</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <User className="h-4 w-4 mr-3 text-teal-500" />
            <div>
              <p className="text-xs text-gray-500 font-medium">Created By</p>
              <p className="text-sm font-semibold text-gray-900">{ticket.user?.firstName} {ticket.user?.lastName}</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-4 w-4 mr-3 text-green-500" />
            <div>
              <p className="text-xs text-gray-500 font-medium">Created</p>
              <p className="text-sm font-semibold text-gray-900">{new Date(ticket.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <MapPin className="h-4 w-4 mr-3 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500 font-medium">Category</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{ticket.category}</p>
            </div>
          </div>
        </div>

        {/* Enhanced Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleViewTicket(ticket)}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </button>
            {ticket.status === 'open' && (
              <button
                onClick={() => handleUpdateStatus(ticket)}
                className="flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Work
              </button>
            )}
            {ticket.status === 'in_progress' && (
              <button
                onClick={() => handleUpdateStatus(ticket)}
                className="flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Check className="h-4 w-4 mr-2" />
                Mark Resolved
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600">Manage and resolve support tickets from all PG properties</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Table
            </button>
          </div>
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setAssignedView('me')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                assignedView === 'me' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Assigned to me
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards with Click Handlers */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => handleStatusCardClick('all')}
          className={`bg-white p-6 rounded-xl shadow-sm border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
            statusFilter === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => handleStatusCardClick('open')}
          className={`bg-white p-6 rounded-xl shadow-sm border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
            statusFilter === 'open' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open</p>
              <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => handleStatusCardClick('in_progress')}
          className={`bg-white p-6 rounded-xl shadow-sm border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
            statusFilter === 'in_progress' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => handleStatusCardClick('resolved')}
          className={`bg-white p-6 rounded-xl shadow-sm border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
            statusFilter === 'resolved' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => handleStatusCardClick('closed')}
          className={`bg-white p-6 rounded-xl shadow-sm border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
            statusFilter === 'closed' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <XCircle className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
        </button>
        {(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || searchTerm) && (
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || searchTerm) && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Status: {statusFilter.replace('_', ' ')}
              <button
                onClick={() => setStatusFilter('all')}
                className="ml-1 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {priorityFilter !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Priority: {priorityFilter}
              <button
                onClick={() => setPriorityFilter('all')}
                className="ml-1 hover:text-green-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {categoryFilter !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Category: {categoryFilter}
              <button
                onClick={() => setCategoryFilter('all')}
                className="ml-1 hover:text-purple-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {searchTerm && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Search: "{searchTerm}"
              <button
                onClick={() => setSearchTerm('')}
                className="ml-1 hover:text-yellow-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="billing">Billing</option>
                  <option value="complaint">Complaint</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="emergency">Emergency</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredTickets.length} of {tickets.length} tickets
          {statusFilter !== 'all' && ` (filtered by ${statusFilter.replace('_', ' ')} status)`}
        </p>
      </div>

      {/* Tickets Display */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No tickets found</p>
          {(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || searchTerm) && (
            <button
              onClick={clearAllFilters}
              className="mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredTickets.map((ticket) => (
              <TicketCard key={ticket._id} ticket={ticket} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <TicketDetailsModal
        isOpen={showTicketDetails}
        ticket={selectedTicket}
        onClose={() => {
          setShowTicketDetails(false);
          setSelectedTicket(null);
        }}
      />

      <StatusUpdateModal
        isOpen={showStatusUpdate}
        ticket={selectedTicket}
        onClose={() => {
          setShowStatusUpdate(false);
          setSelectedTicket(null);
        }}
        onSuccess={handleStatusUpdateSuccess}
      />
    </div>
  );
};

export default SupportTickets; 