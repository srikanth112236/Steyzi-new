import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  FileText,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import ticketService from '../../services/ticket.service';
import TicketForm from '../../components/admin/TicketForm';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import TicketDetailsModal from '../../components/common/TicketDetailsModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenModal, setShowReopenModal] = useState(false);

  // Load tickets and stats
  useEffect(() => {
    loadTickets();
    loadStats();
  }, [filters]);

  // Auto-refresh to reflect status changes across clients
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadTickets();
      loadStats();
    }, 15000); // refresh every 15s
    return () => clearInterval(intervalId);
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketService.getTickets(filters);
      if (response.success) {
        const formattedTickets = response.data.map(ticket => {
          try {
            return ticketService.formatTicketData(ticket);
          } catch (error) {
            console.error('Error formatting ticket:', error, ticket);
            // Return a safe fallback for malformed tickets
            return {
              ...ticket,
              createdAt: ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '',
              updatedAt: ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : '',
              status: ticket.status || 'Unknown',
              priority: ticket.priority || 'Unknown'
            };
          }
        });
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

  const handleAddTicket = () => {
    setSelectedTicket(null);
    setShowFormModal(true);
  };

  const handleEditTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowFormModal(true);
  };

  const handleDeleteTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowDeleteModal(true);
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketDetails(true);
  };

  const confirmDelete = async () => {
    if (!selectedTicket) return;

    try {
      setActionLoading(true);
      const response = await ticketService.deleteTicket(selectedTicket._id);
      if (response.success) {
        toast.success('Ticket deleted successfully');
        loadTickets();
        loadStats();
        setShowDeleteModal(false);
        setSelectedTicket(null);
      } else {
        toast.error(response.message || 'Failed to delete ticket');
      }
    } catch (error) {
      toast.error('Failed to delete ticket');
      console.error('Error deleting ticket:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenRequest = async (ticket) => {
    setSelectedTicket(ticket);
    setShowReopenModal(true);
  };

  const submitReopenRequest = async () => {
    if (!selectedTicket || !reopenReason.trim()) {
      toast.error('Please provide a reason for reopening');
      return;
    }

    try {
      setActionLoading(true);
      const response = await ticketService.requestReopenTicket(selectedTicket._id, reopenReason.trim());
      if (response.success) {
        toast.success('Reopen request submitted successfully');
        loadTickets();
        loadStats();
        setShowReopenModal(false);
        setShowTicketDetails(false);
        setSelectedTicket(null);
        setReopenReason('');
      } else {
        toast.error(response.message || 'Failed to submit reopen request');
      }
    } catch (error) {
      toast.error('Failed to submit reopen request');
      console.error('Error submitting reopen request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormSuccess = () => {
    loadTickets();
    loadStats();
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      search: ''
    });
  };

  const getStatusIcon = (status) => {
    const icons = {
      open: <AlertCircle className="h-4 w-4 text-blue-600" />,
      in_progress: <Clock className="h-4 w-4 text-yellow-600" />,
      resolved: <CheckCircle className="h-4 w-4 text-green-600" />,
      closed: <CheckCircle className="h-4 w-4 text-gray-600" />,
      cancelled: <XCircle className="h-4 w-4 text-red-600" />
    };
    return icons[status] || <AlertCircle className="h-4 w-4 text-gray-600" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-50 text-blue-700 border-blue-200',
      in_progress: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      resolved: 'bg-green-50 text-green-700 border-green-200',
      closed: 'bg-gray-50 text-gray-700 border-gray-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      medium: 'bg-amber-50 text-amber-700 border-amber-200',
      high: 'bg-orange-50 text-orange-700 border-orange-200',
      urgent: 'bg-rose-50 text-rose-700 border-rose-200'
    };
    return colors[priority] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const statCards = [
    {
      key: 'total',
      label: 'Total Tickets',
      value: stats.total || 0,
      accent: 'from-blue-500/20 to-blue-600/20',
      icon: FileText,
      chip: '+12% vs last month',
      chipColor: 'text-blue-300'
    },
    {
      key: 'open',
      label: 'Open',
      value: stats.open || 0,
      accent: 'from-sky-500/20 to-sky-600/20',
      icon: AlertCircle,
      chip: 'Need attention',
      chipColor: 'text-sky-200'
    },
    {
      key: 'inProgress',
      label: 'In Progress',
      value: stats.inProgress || 0,
      accent: 'from-amber-500/20 to-orange-600/20',
      icon: Clock,
      chip: 'On team queue',
      chipColor: 'text-amber-200'
    },
    {
      key: 'resolved',
      label: 'Resolved',
      value: stats.resolved || 0,
      accent: 'from-emerald-500/20 to-emerald-600/20',
      icon: CheckCircle,
      chip: '72h avg resolve',
      chipColor: 'text-emerald-200'
    },
    {
      key: 'closed',
      label: 'Closed',
      value: stats.closed || 0,
      accent: 'from-slate-500/20 to-slate-700/20',
      icon: XCircle,
      chip: 'Archived cases',
      chipColor: 'text-slate-200'
    }
  ];

  const quickStatusFilters = [
    { value: '', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const TicketCard = ({ ticket }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              <span>#{ticket._id.slice(-6)}</span>
              {ticket.isReopened && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-purple-700">
                  🔄 Reopened
                </span>
              )}
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-900 line-clamp-1">{ticket.title}</h3>
            <p className="text-sm text-slate-600 line-clamp-2">{ticket.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusColor(ticket.status)}`}>
              {getStatusIcon(ticket.status)}
              {ticket.status.replace('_', ' ')}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getPriorityColor(ticket.priority)}`}>
              <span className="h-2 w-2 rounded-full bg-current" />
              {ticket.priority}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
            <Building2 className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-[11px] uppercase text-slate-400">Category</p>
              <p className="font-medium capitalize text-slate-900">{ticket.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-[11px] uppercase text-slate-400">Created</p>
              <p className="font-medium text-slate-900">{ticket.formattedCreatedAt}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
            <MapPin className="h-4 w-4 text-purple-500" />
            <div className="min-w-0">
              <p className="text-[11px] uppercase text-slate-400">Location</p>
              <p className="font-medium text-slate-900 truncate">
                {[ticket.location?.room && `Room ${ticket.location.room}`, ticket.location?.floor && `Floor ${ticket.location.floor}`, ticket.location?.building && ticket.location.building]
                  .filter(Boolean)
                  .join(' • ') || '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
            <User className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-[11px] uppercase text-slate-400">Created By</p>
              <p className="font-medium text-slate-900">
                {ticket.user?.firstName} {ticket.user?.lastName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Updated {ticket.formattedUpdatedAt || ticket.formattedCreatedAt}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewTicket(ticket)}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:border-blue-500 hover:text-blue-600"
            >
              <Eye className="h-4 w-4" />
            </button>
            {ticket.isEditable && (
              <button
                onClick={() => handleEditTicket(ticket)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:border-blue-500 hover:text-blue-600"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {ticket.isDeletable && (
              <button
                onClick={() => handleDeleteTicket(ticket)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:border-rose-500 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Operations / Support</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tickets Command Center</h1>
            <p className="mt-2 max-w-2xl text-base text-slate-300">
              Monitor ticket health, triage incoming issues and keep every resident update in one compact workspace.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                <Clock className="h-3.5 w-3.5" />
                Auto refresh 15s
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
                <AlertCircle className="h-3.5 w-3.5" />
                SLA tracker enabled
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center rounded-full border border-white/20 bg-white/5 p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-200'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-200'
                }`}
              >
                Table
              </button>
            </div>
            <button
              onClick={handleAddTicket}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-xl shadow-black/20 transition hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Create Ticket
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map((card, index) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.accent} p-4 shadow-inner`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-300">{card.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{card.value}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-2">
                  <card.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className={`mt-4 text-[11px] font-medium ${card.chipColor}`}>{card.chip}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full flex-1">
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search title, ticket id or resident..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full rounded-2xl border-0 bg-transparent py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              onClick={clearFilters}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:border-slate-300"
            >
              Clear
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {quickStatusFilters.map((item) => (
            <button
              key={item.value || 'all'}
              onClick={() => setFilters({ ...filters, status: item.value })}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition ${
                filters.status === item.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 md:grid-cols-3"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="w-full rounded-2xl border-slate-200">
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Priority</label>
                <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                  <SelectTrigger className="w-full rounded-2xl border-slate-200">
                    <SelectValue placeholder="All priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                  <SelectTrigger className="w-full rounded-2xl border-slate-200">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                    <SelectItem value="suggestion">Suggestion</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tickets Found</h3>
            <p className="text-gray-600 mb-4">No tickets match your current filters.</p>
            <button
              onClick={handleAddTicket}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Ticket
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((ticket) => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
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
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{ticket.description}</div>
                        <div className="text-xs text-gray-400">
                          {ticket.location?.room && `Room: ${ticket.location.room}`}
                          {ticket.location?.floor && ` | Floor: ${ticket.location.floor}`}
                          {ticket.location?.building && ` | Building: ${ticket.location.building}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(ticket.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ticket.statusColor}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ticket.priorityColor}`}>
                          {ticket.priority}
                        </span>
                        {ticket.isReopened && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                            🔄
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{ticket.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ticket.formattedCreatedAt}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewTicket(ticket)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                          title="View Ticket Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {ticket.isEditable && (
                          <button 
                            onClick={() => handleEditTicket(ticket)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Edit Ticket"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {ticket.isDeletable && (
                          <button 
                            onClick={() => handleDeleteTicket(ticket)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Delete Ticket"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Modals */}
      <TicketForm
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        onSuccess={handleFormSuccess}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTicket(null);
        }}
        onConfirm={confirmDelete}
        itemName={selectedTicket?.title || ''}
        itemType="Ticket"
        loading={actionLoading}
      />

      {/* Comprehensive Ticket Details Modal */}
      <TicketDetailsModal
        isOpen={showTicketDetails}
        onClose={() => setShowTicketDetails(false)}
        ticket={selectedTicket}
        onStatusUpdate={(ticket) => {
          setShowTicketDetails(false);
          // Handle status update if needed
          console.log('Status update requested for ticket:', ticket._id);
        }}
        onReopenRequest={handleReopenRequest}
      />

      {/* Reopen Request Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Request Ticket Reopen</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will submit a request to superadmin to reopen the ticket: <strong>{selectedTicket?.title}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for reopening <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                rows={4}
                placeholder="Please provide a detailed reason for reopening this ticket..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReopenModal(false);
                  setReopenReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={submitReopenRequest}
                disabled={actionLoading || !reopenReason.trim()}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {actionLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets; 