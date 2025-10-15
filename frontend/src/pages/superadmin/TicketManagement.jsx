import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter as FilterIcon,
  Download,
  Eye,
  User,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Users,
  MessageSquare,
  Star,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  Phone,
  MapPin,
  AlertTriangle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

// Shadcn UI Components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator
} from "../../components/ui/select";

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "../../components/ui/popover";

import { Calendar as CalendarComponent } from "../../components/ui/calendar";

import ticketService from '../../services/ticket.service';

const TicketManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [pgs, setPGs] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    pg: 'all',
    search: '',
    startDate: null,
    endDate: null
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const navigate = useNavigate();
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' or 'reopen-requests'
  const [reopenRequests, setReopenRequests] = useState([]);

  // Utility functions
  const getStatusIcon = (status) => {
    const map = {
      open: <AlertCircle className="h-4 w-4 text-blue-600" />,
      in_progress: <Clock className="h-4 w-4 text-yellow-600" />,
      resolved: <CheckCircle className="h-4 w-4 text-green-600" />,
      closed: <CheckCircle className="h-4 w-4 text-gray-600" />,
      cancelled: <XCircle className="h-4 w-4 text-red-600" />
    };
    return map[status] || <AlertCircle className="h-4 w-4 text-gray-600" />;
  };

  // Load PGs for dropdown
  useEffect(() => {
    const loadPGs = async () => {
      try {
        // For superadmin, we can show all PGs or just leave it empty for now
        // In a full implementation, you'd call an API to get all PGs
        setPGs([]);
      } catch (error) {
        console.error('Error loading PGs:', error);
      }
    };
    loadPGs();
  }, []);

  // Load tickets and stats
  useEffect(() => {
    if (activeTab === 'tickets') {
      loadTickets();
      loadStats();
    } else if (activeTab === 'reopen-requests') {
      loadReopenRequests();
    }
  }, [filters, activeTab]);

  // Auto-refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (activeTab === 'tickets') {
        loadTickets();
        loadStats();
      } else if (activeTab === 'reopen-requests') {
        loadReopenRequests();
      }
    }, 15000); // refresh every 15s
    return () => clearInterval(intervalId);
  }, [activeTab]);

  const loadTickets = async () => {
    try {
      setLoading(true);

      // Create a copy of filters and remove 'all', empty, or null values
      const filteredParams = { ...filters };

      // Remove 'all', empty strings, null, and undefined values from filters
      Object.keys(filteredParams).forEach(key => {
        if (filteredParams[key] === 'all' || filteredParams[key] === '' || filteredParams[key] === null || filteredParams[key] === undefined) {
          delete filteredParams[key];
        }
      });

      const response = await ticketService.getSuperadminTickets(filteredParams);
      console.log("responsetickets",response);
      if (response.success) {
        const formattedTickets = response.data.map(ticket =>
          ticketService.formatTicketData(ticket)
        );
        setTickets(formattedTickets);
      }
    } catch (error) {
      toast.error('Failed to load tickets');
      console.error('Error loading tickets:', error);
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

  // Load reopen requests
  const loadReopenRequests = async () => {
    try {
      setLoading(true);
      const response = await ticketService.getReopenRequests();
      if (response.success) {
        setReopenRequests(response.data || []);
      } else {
        setError('Failed to load reopen requests');
      }
    } catch (error) {
      setError('Failed to load reopen requests');
      console.error('Error loading reopen requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    navigate(`/superadmin/tickets/${ticket._id}?section=overview`);
  };

  const handleApproveReopen = async (request) => {
    if (!window.confirm(`Are you sure you want to reopen ticket "${request.title}"? This will create a new ticket with the same details.`)) {
      return;
    }

    try {
      setActionLoading(true);
      const result = await ticketService.reopenTicket(request._id, 'Approved reopen request from superadmin');
      if (result.success) {
        toast.success('Ticket reopened successfully');
        loadReopenRequests(); // Refresh the list
      } else {
        toast.error(result.message || 'Failed to reopen ticket');
      }
    } catch (error) {
      toast.error('Failed to reopen ticket');
      console.error('Error reopening ticket:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReopen = async (request) => {
    if (!window.confirm(`Are you sure you want to reject the reopen request for ticket "${request.title}"?`)) {
      return;
    }

    try {
      setActionLoading(true);
      // For now, we'll just remove the reopen request. In a real app, you might want to log this rejection.
      await ticketService.updateTicket(request._id, {
        reopenRequestBy: null,
        reopenRequestAt: null,
        reopenRequestReason: null
      });
      toast.success('Reopen request rejected');
      loadReopenRequests(); // Refresh the list
    } catch (error) {
      toast.error('Failed to reject reopen request');
      console.error('Error rejecting reopen request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignTicket = (ticket) => {
    setSelectedTicket(ticket);
    navigate(`/superadmin/tickets/${ticket._id}?section=assign`);
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      category: 'all',
      pg: 'all',
      search: '',
      startDate: null,
      endDate: null
    });
  };

  const renderFilterSection = () => (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-6 overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <Select value={filters.status} onValueChange={(value) => updateFilters({ status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <Select value={filters.priority} onValueChange={(value) => updateFilters({ priority: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <Select value={filters.category} onValueChange={(value) => updateFilters({ category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PG</label>
              <Select value={filters.pg} onValueChange={(value) => updateFilters({ pg: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All PGs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All PGs</SelectItem>
                  {pgs.map(pg => (
                    <SelectItem key={pg._id} value={pg._id}>{pg.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

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
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ticket Management</h1>
          <p className="text-gray-600 mt-1">Manage all support tickets from different PGs</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 mt-4 sm:mt-0">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'tickets'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Tickets
          </button>
          <button
            onClick={() => setActiveTab('reopen-requests')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors relative ${
              activeTab === 'reopen-requests'
                ? 'bg-orange-100 text-orange-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Reopen Requests
            {reopenRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {reopenRequests.length}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'tickets' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200"
            >
              <div className="flex items-center">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700">Total Tickets</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total || 0}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200"
            >
              <div className="flex items-center">
                <div className="p-3 bg-yellow-500 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-700">Open</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.open || 0}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200"
            >
              <div className="flex items-center">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700">In Progress</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.inProgress || 0}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200"
            >
              <div className="flex items-center">
                <div className="p-3 bg-green-500 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-700">Resolved</p>
                  <p className="text-2xl font-bold text-green-900">{stats.resolved || 0}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center">
                <div className="p-3 bg-gray-500 rounded-xl">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-700">Closed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.closed || 0}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Tickets</h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <FilterIcon className="h-5 w-5 mr-2" />
                  Filters
                  {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
                <button className="flex items-center px-4 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                  <Download className="h-5 w-5 mr-2" />
                  Export
                </button>
              </div>
            </div>

            {/* Filter Section with Shadcn UI Components */}
            {renderFilterSection()}
          </div>

          {/* Tickets List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tickets found</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {tickets.map((ticket) => (
                  <motion.div
                    key={ticket._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => handleViewTicket(ticket)}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 ${getStatusColor(ticket.status).replace('border', 'bg').replace('text', 'bg').replace('bg-gray', 'bg-blue').replace('bg-red', 'bg-red').replace('bg-green', 'bg-green').replace('bg-yellow', 'bg-yellow').replace('bg-orange', 'bg-orange')}`} />

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 pr-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            {ticket.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                            {ticket.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <div className="flex flex-col items-end space-y-1">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(ticket.status)}`}>
                              {getStatusIcon(ticket.status)}
                              <span className="ml-1.5 capitalize">{ticket.status.replace('_', ' ')}</span>
                            </span>
                            {ticket.isReopened && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                                🔄 Reopened
                              </span>
                            )}
                          </div>
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getPriorityColor(ticket.priority)}`}>
                            <span className="w-2 h-2 rounded-full bg-current mr-2" />
                            {ticket.priority}
                          </span>
                        </div>
                      </div>

                      {/* Enhanced Details Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{ticket.user?.firstName} {ticket.user?.lastName}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{ticket.pg?.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{ticket.priority}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewTicket(ticket);
                          }}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </button>
                        {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignTicket(ticket);
                            }}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Assign
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ticket
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PG
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tickets.map((ticket) => (
                      <motion.tr
                        key={ticket._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewTicket(ticket)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">#{ticket._id.slice(-6)}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{ticket.title}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center">
                              {getStatusIcon(ticket.status)}
                              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ticket.statusColor}`}>
                                {ticket.status.replace('_', ' ')}
                              </span>
                            </div>
                            {ticket.isReopened && (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full w-fit">
                                🔄 Reopened
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ticket.priorityColor}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{ticket.user?.firstName} {ticket.user?.lastName}</div>
                          <div className="text-xs text-gray-500">{ticket.user?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{ticket.pg?.name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTicket(ticket);
                              }}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium"
                            >
                              View
                            </button>
                            {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAssignTicket(ticket);
                                }}
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-sm font-medium"
                              >
                                Assign
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Reopen Requests Section */}
      {activeTab === 'reopen-requests' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading reopen requests...</p>
            </div>
          ) : reopenRequests.length === 0 ? (
            <div className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No reopen requests found</p>
              <p className="text-sm text-gray-500 mt-1">Admins can request to reopen closed tickets</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reopenRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{request._id.slice(-6)}
                          </div>
                          <div className="text-sm text-gray-500">{request.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.reopenRequestBy?.firstName} {request.reopenRequestBy?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{request.reopenRequestBy?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {request.reopenRequestReason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.reopenRequestAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveReopen(request)}
                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-sm font-medium"
                          >
                            Approve & Reopen
                          </button>
                          <button
                            onClick={() => handleRejectReopen(request)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketManagement;