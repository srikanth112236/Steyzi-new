import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Bed,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  LogOut,
  Upload,
  Star,
  Crown,
  MessageCircle,
  CreditCard,
  MoreVertical,
  Grid3X3,
  Table,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import toast from 'react-hot-toast';
import ResidentForm from '../../components/admin/ResidentForm';
import ResidentDetails from '../../components/admin/ResidentDetails';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import ResidentBulkUploadModal from '../../components/admin/ResidentBulkUploadModal';
import { selectSelectedBranch } from '../../store/slices/branch.slice';
import PermissionButton from '../../components/common/PermissionButton';
import PermissionAction from '../../components/common/PermissionAction';

const Residents = () => {
  const { user } = useSelector((state) => state.auth);
  const selectedBranch = useSelector(selectSelectedBranch);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [selectedResident, setSelectedResident] = useState(null);
  const [residentToDelete, setResidentToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    movedOut: 0
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [sortBy, setSortBy] = useState('firstName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [itemsPerPage, setItemsPerPage] = useState(12); // 12 for grid, 10 for table

  const navigate = useNavigate();

  // Fetch residents with comprehensive handling
  const fetchResidents = async () => {
    if (!selectedBranch) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        branchId: selectedBranch._id
      });
      
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (genderFilter !== 'all') params.append('gender', genderFilter);

      const response = await fetch(`/api/residents?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('📊 Residents fetched:', data.data.residents.length, 'total residents');
        
        // Update to show all residents based on filter
        let filteredResidents = data.data.residents;
        
        if (statusFilter !== 'all') {
          filteredResidents = filteredResidents.filter(resident => 
            resident.status === statusFilter
          );
        }
        
        setResidents(filteredResidents);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        toast.error(data.message || 'Failed to fetch residents');
      }
    } catch (error) {
      console.error('❌ Residents: Error fetching residents:', error);
      toast.error('Failed to fetch residents');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics with comprehensive data
  const fetchStats = async () => {
    if (!selectedBranch) return;
    
    try {
      const params = new URLSearchParams({
        branchId: selectedBranch._id
      });
      
      const response = await fetch(`/api/residents/stats/overview?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const stats = data.data;
        setStats({
          total: stats.total || 0,
          active: stats.active || 0,
          pending: stats.pending || 0,
          movedOut: (stats.movedOut || 0) + (stats.inactive || 0)
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Search residents
  const searchResidents = async () => {
    if (!searchTerm.trim()) {
      fetchResidents();
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchTerm,
        page: currentPage,
        limit: itemsPerPage,
        branchId: selectedBranch._id
      });
      
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (genderFilter !== 'all') params.append('gender', genderFilter);

      const response = await fetch(`/api/residents/search/query?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResidents(data.data);
      } else {
        toast.error(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Error searching residents:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle resident creation/update
  const handleResidentSubmit = async (residentData) => {
    try {
      const url = editingResident 
        ? `/api/residents/${editingResident._id}`
        : '/api/residents';
      
      const method = editingResident ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...residentData,
          branchId: selectedBranch._id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchResidents();
        fetchStats();
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Operation failed' };
      }
    } catch (error) {
      console.error('Error submitting resident:', error);
      return { success: false, message: 'Operation failed' };
    }
  };

  // Handle resident deletion
  const handleResidentDelete = async () => {
    if (!residentToDelete) return;
    
    try {
      const response = await fetch(`/api/residents/${residentToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Resident deleted successfully');
        setShowDeleteModal(false);
        setResidentToDelete(null);
        fetchResidents();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to delete resident');
      }
    } catch (error) {
      console.error('Error deleting resident:', error);
      toast.error('Failed to delete resident');
    }
  };

  // Handle resident edit
  const handleResidentEdit = (resident) => {
    setEditingResident(resident);
    setShowForm(true);
  };

  // Handle resident view
  const handleResidentView = (resident) => {
    console.log('🔍 Residents: Navigating to resident profile:', resident._id);
    setSelectedResident(resident);
    navigate(`/admin/residents/${resident._id}`);
  };

  // Handle resident delete confirmation
  const handleDeleteClick = (resident) => {
    setResidentToDelete(resident);
    setShowDeleteModal(true);
  };

  // Handle bulk upload success
  const handleBulkUploadSuccess = () => {
    console.log('🔄 Bulk upload success - refreshing residents and stats');
    
    // Add a small delay to ensure database is updated
    setTimeout(() => {
      console.log('🔄 Delayed refresh - fetching residents and stats');
      fetchResidents();
      fetchStats();
    }, 1000); // 1 second delay
  };

  // Export residents
  const handleExport = async () => {
    try {
      const response = await fetch('/api/residents/export/data?format=csv', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const csvContent = data.data.residents.map(resident => 
          Object.values(resident).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'residents.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast.success('Residents exported successfully');
      } else {
        toast.error(data.message || 'Export failed');
      }
    } catch (error) {
      console.error('Error exporting residents:', error);
      toast.error('Export failed');
    }
  };

  // Update items per page when view mode changes
  useEffect(() => {
    const newItemsPerPage = viewMode === 'grid' ? 12 : 10;
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when switching views
  }, [viewMode]);

  // Effects
  useEffect(() => {
    if (selectedBranch) {
      fetchResidents();
      fetchStats();
    }
  }, [selectedBranch, currentPage, statusFilter, genderFilter, itemsPerPage]);

  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(searchResidents, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, genderFilter]);

  // Get status badge with enhanced design
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { 
        color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200', 
        icon: CheckCircle,
        gradient: 'from-green-400 to-emerald-500'
      },
      pending: { 
        color: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200', 
        icon: Clock,
        gradient: 'from-yellow-400 to-orange-500'
      },
      inactive: { 
        color: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200', 
        icon: AlertCircle,
        gradient: 'from-gray-400 to-slate-500'
      },
      moved_out: { 
        color: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200', 
        icon: LogOut,
        gradient: 'from-red-400 to-pink-500'
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${config.color} shadow-sm`}>
        <Icon className="w-3 h-3 mr-1" />
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </span>
    );
  };

  // Get resident avatar with gradient
  const getResidentAvatar = (resident) => {
    const initials = `${resident.firstName?.charAt(0) || ''}${resident.lastName?.charAt(0) || ''}`.toUpperCase();
    const gradients = [
      'from-blue-400 to-indigo-500',
      'from-purple-400 to-pink-500',
      'from-green-400 to-emerald-500',
      'from-orange-400 to-red-500',
      'from-teal-400 to-cyan-500',
      'from-violet-400 to-purple-500'
    ];
    const gradientIndex = (resident.firstName?.length || 0) % gradients.length;
    
    return (
      <div className={`w-full h-full rounded-lg bg-gradient-to-br ${gradients[gradientIndex]} flex items-center justify-center text-white font-semibold text-sm shadow-md`}>
        {initials || <User className="w-4 h-4" />}
      </div>
    );
  };

  // Get priority badge
  const getPriorityBadge = (resident) => {
    if (resident.isVIP) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-200">
          <Crown className="w-3 h-3" />
          VIP
        </div>
      );
    }
    if (resident.isLongTerm) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-xs font-medium border border-blue-200">
          <Star className="w-3 h-3" />
          Long-term
        </div>
      );
    }
    return null;
  };

  // Handle sorting for table view
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Render table view
  const renderTableView = () => {
    const sortedResidents = [...residents].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'firstName':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'phone':
          aValue = a.phone;
          bValue = b.phone;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'checkInDate':
          aValue = new Date(a.checkInDate || 0);
          bValue = new Date(b.checkInDate || 0);
          break;
        case 'roomNumber':
          aValue = a.roomNumber || '';
          bValue = b.roomNumber || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left align-middle">
                  <button
                    onClick={() => handleSort('firstName')}
                    className="flex items-center space-x-1 text-xs font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <span>Resident</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left align-middle">
                  <button
                    onClick={() => handleSort('email')}
                    className="flex items-center space-x-1 text-xs font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <span>Contact</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left align-middle">
                  <button
                    onClick={() => handleSort('roomNumber')}
                    className="flex items-center space-x-1 text-xs font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <span>Room</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left align-middle">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center space-x-1 text-xs font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <span>Status</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left align-middle">
                  <button
                    onClick={() => handleSort('checkInDate')}
                    className="flex items-center space-x-1 text-xs font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <span>Check-in</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left align-middle text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedResidents.map((resident, index) => (
                <motion.tr
                  key={resident._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleResidentView(resident)}
                >
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center">
                        {getResidentAvatar(resident)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm text-gray-900 truncate leading-tight">{resident.firstName} {resident.lastName}</div>
                        <div className="text-xs text-gray-500 truncate leading-tight mt-0.5">{resident.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="text-xs font-medium text-gray-900 truncate max-w-[200px]" title={resident.email}>{resident.email}</div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                      {resident.roomNumber ? `Room ${resident.roomNumber}` : 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="inline-flex items-center">
                      {getStatusBadge(resident.status)}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="text-xs font-medium text-gray-900 whitespace-nowrap">
                      {resident.checkInDate ? new Date(resident.checkInDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center space-x-1.5">
                      <PermissionAction
                        module="resident_management"
                        submodule="residents"
                        action="read"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResidentView(resident);
                        }}
                      >
                        <button
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </button>
                      </PermissionAction>
                      <PermissionAction
                        module="resident_management"
                        submodule="residents"
                        action="update"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResidentEdit(resident);
                        }}
                      >
                        <button
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </button>
                      </PermissionAction>
                      <PermissionAction
                        module="resident_management"
                        submodule="residents"
                        action="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(resident);
                        }}
                      >
                        <button
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </button>
                      </PermissionAction>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedResidents.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No residents found</h4>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || genderFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No residents have been added yet.'}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!selectedBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Users className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Select a Branch</h2>
          <p className="text-gray-600 mb-1 max-w-md">Please use the branch selector in the header.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-full mx-auto py-8 px-4 sm:px-6 lg:px-2">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Resident Management</h1>
              </div>
              <p className="text-sm text-gray-600">Manage residents for {selectedBranch.name}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm scale-105'
                      : 'text-gray-600 hover:text-blue-500'
                  }`}
                  title="Grid View (4 per row)"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-600 shadow-sm scale-105'
                      : 'text-gray-600 hover:text-blue-500'
                  }`}
                  title="Table View (10 per page)"
                >
                  <Table className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => setShowBulkUploadModal(true)}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Upload className="h-4 w-4 mr-1.5" />
                Import
              </button>
              <PermissionButton
                module="resident_management"
                submodule="residents"
                action="create"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Resident
              </PermissionButton>
            </div>
          </div>
        </div>

        {/* Premium Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.46, 0.45, 0.94],
              type: "spring",
              stiffness: 100
            }}
            whileHover={{
              scale: 1.05,
              y: -5,
              transition: { duration: 0.2 }
            }}
            className="relative group bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-2xl p-6 border border-blue-200/50 hover:border-blue-300/70 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-200/20 to-transparent rounded-bl-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-indigo-200/15 to-transparent rounded-tr-2xl" />

            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Users className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-blue-900/80 uppercase tracking-wide">Total Residents</p>
                    <p className="text-3xl font-black text-blue-900 group-hover:text-indigo-900 transition-colors duration-300">
                      {stats.total}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-blue-700/70 font-medium">All registered residents</p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="absolute bottom-4 right-4">
              <div className="w-16 h-2 bg-blue-200/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              ease: [0.25, 0.46, 0.45, 0.94],
              type: "spring",
              stiffness: 100
            }}
            whileHover={{
              scale: 1.05,
              y: -5,
              transition: { duration: 0.2 }
            }}
            className="relative group bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200/50 hover:border-emerald-300/70 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-200/20 to-transparent rounded-bl-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-green-200/15 to-transparent rounded-tr-2xl" />

            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CheckCircle className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900/80 uppercase tracking-wide">Active Residents</p>
                    <p className="text-3xl font-black text-emerald-900 group-hover:text-green-900 transition-colors duration-300">
                      {stats.active}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-emerald-700/70 font-medium">Currently staying</p>
              </div>
            </div>

            <div className="absolute bottom-4 right-4">
              <div className="w-16 h-2 bg-emerald-200/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: stats.total > 0 ? `${(stats.active / stats.total) * 100}%` : '0%' }}
                  transition={{ duration: 1, delay: 0.6 }}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.2,
              ease: [0.25, 0.46, 0.45, 0.94],
              type: "spring",
              stiffness: 100
            }}
            whileHover={{
              scale: 1.05,
              y: -5,
              transition: { duration: 0.2 }
            }}
            className="relative group bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 rounded-2xl p-6 border border-amber-200/50 hover:border-amber-300/70 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-200/20 to-transparent rounded-bl-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-orange-200/15 to-transparent rounded-tr-2xl" />

            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Clock className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-amber-900/80 uppercase tracking-wide">Pending Check-in</p>
                    <p className="text-3xl font-black text-amber-900 group-hover:text-orange-900 transition-colors duration-300">
                      {stats.pending}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-amber-700/70 font-medium">Awaiting arrival</p>
              </div>
            </div>

            <div className="absolute bottom-4 right-4">
              <div className="w-16 h-2 bg-amber-200/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: stats.total > 0 ? `${(stats.pending / stats.total) * 100}%` : '0%' }}
                  transition={{ duration: 1, delay: 0.7 }}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
              type: "spring",
              stiffness: 100
            }}
            whileHover={{
              scale: 1.05,
              y: -5,
              transition: { duration: 0.2 }
            }}
            className="relative group bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100 rounded-2xl p-6 border border-rose-200/50 hover:border-rose-300/70 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-200/20 to-transparent rounded-bl-3xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-pink-200/15 to-transparent rounded-tr-2xl" />

            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LogOut className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-rose-900/80 uppercase tracking-wide">Moved Out</p>
                    <p className="text-3xl font-black text-rose-900 group-hover:text-pink-900 transition-colors duration-300">
                      {stats.movedOut}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-rose-700/70 font-medium">This month</p>
              </div>
            </div>

            <div className="absolute bottom-4 right-4">
              <div className="w-16 h-2 bg-rose-200/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: stats.total > 0 ? `${(stats.movedOut / stats.total) * 100}%` : '0%' }}
                  transition={{ duration: 1, delay: 0.8 }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Premium Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-200/60 backdrop-blur-sm"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Enhanced Search */}
            <div className="flex-1 max-w-2xl">
              <motion.div
                className="relative group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <motion.div
                    animate={{
                      scale: searchTerm ? [1, 1.1, 1] : 1,
                      rotate: searchTerm ? [0, 10, -10, 0] : 0
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <Search className="h-5 w-5 text-blue-500 group-hover:text-blue-600 transition-colors duration-300" />
                  </motion.div>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-base border-2 border-gray-200/60 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300 bg-gradient-to-r from-gray-50/50 to-white shadow-sm hover:shadow-md focus:shadow-lg backdrop-blur-sm"
                />
                {searchTerm && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                  </motion.button>
                )}
              </motion.div>
            </div>

            {/* Enhanced Filters */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Status Filter */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-44 h-12 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 focus:ring-4 focus:ring-blue-500/20">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        statusFilter === 'active' ? 'bg-emerald-500' :
                        statusFilter === 'pending' ? 'bg-amber-500' :
                        statusFilter === 'inactive' ? 'bg-gray-500' :
                        statusFilter === 'moved_out' ? 'bg-rose-500' : 'bg-blue-500'
                      }`} />
                      <SelectValue placeholder="All Status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-gray-200/60 shadow-xl">
                    <SelectItem value="all" className="rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>All Status</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="active" className="rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span>Active</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pending" className="rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span>Pending</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive" className="rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-gray-500" />
                        <span>Inactive</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="moved_out" className="rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <span>Moved Out</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Gender Filter */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-44 h-12 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 focus:ring-4 focus:ring-purple-500/20">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      <SelectValue placeholder="All Gender" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-gray-200/60 shadow-xl">
                    <SelectItem value="all" className="rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>All Gender</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="male" className="rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>Male</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="female" className="rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-pink-500" />
                        <span>Female</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="other" className="rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span>Other</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Export Button */}
              <motion.button
                onClick={handleExport}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Download className="h-5 w-5 mr-2" />
                </motion.div>
                <span>Export Data</span>
              </motion.button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || statusFilter !== 'all' || genderFilter !== 'all') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200/60"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Active filters:</span>
                {searchTerm && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                  >
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-2 hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.span>
                )}
                {statusFilter !== 'all' && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium"
                  >
                    Status: {statusFilter.replace('_', ' ')}
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="ml-2 hover:bg-emerald-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.span>
                )}
                {genderFilter !== 'all' && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
                  >
                    Gender: {genderFilter}
                    <button
                      onClick={() => setGenderFilter('all')}
                      className="ml-2 hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.span>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Enhanced Residents Display */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading residents...</p>
            </div>
          ) : residents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No residents found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm ? 'Try adjusting your search criteria or filters.' : 'Get started by adding your first resident to this branch.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Resident
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {residents.map((resident, index) => (
                  <motion.div
                    key={resident._id}
                    initial={{ opacity: 0, y: 30, scale: 0.9, rotateY: -15 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.08,
                      ease: [0.25, 0.46, 0.45, 0.94],
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    }}
                    whileHover={{
                      scale: 1.03,
                      y: -5,
                      rotateY: 2,
                      transition: {
                        duration: 0.3,
                        ease: "easeOut",
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      }
                    }}
                    whileTap={{
                      scale: 0.98,
                      transition: { duration: 0.15 }
                    }}
                    className="group bg-white border border-gray-200 rounded-xl p-3 hover:shadow-lg transition-all duration-300 hover:border-blue-300 relative overflow-hidden cursor-pointer"
                    onClick={() => handleResidentView(resident)}
                  >
                    {/* Compact Glow Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-indigo-400/3 to-purple-400/2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500"
                      initial={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                    />

                    {/* Compact Header */}
                    <div className="relative flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center">
                          {getResidentAvatar(resident)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 truncate group-hover:text-blue-900 transition-colors leading-tight">
                            {resident.firstName} {resident.lastName}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {getPriorityBadge(resident)}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2 flex items-center">
                        {getStatusBadge(resident.status)}
                      </div>
                    </div>

                    {/* Compact Info Cards */}
                    <div className="relative space-y-2 mb-3">
                      <div className="flex items-center p-1.5 bg-gray-50 rounded-lg border border-gray-200/60 group-hover:border-blue-200 transition-colors">
                        <Mail className="w-3.5 h-3.5 mr-2 text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700 truncate font-medium flex-1" title={resident.email}>
                          {resident.email}
                        </span>
                      </div>

                      <div className="flex items-center p-1.5 bg-gray-50 rounded-lg border border-gray-200/60 group-hover:border-green-200 transition-colors">
                        <Phone className="w-3.5 h-3.5 mr-2 text-green-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700 font-medium">{resident.phone}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="flex items-center p-1.5 bg-blue-50 rounded-md border border-blue-200/50">
                          <Bed className="w-3 h-3 mr-1.5 text-blue-600 flex-shrink-0" />
                          <span className="text-xs text-blue-700 font-semibold truncate">
                            {resident.roomNumber ? `Room ${resident.roomNumber}` : 'Unassigned'}
                          </span>
                        </div>

                        <div className="flex items-center p-1.5 bg-orange-50 rounded-md border border-orange-200/50">
                          <Calendar className="w-3 h-3 mr-1.5 text-orange-600 flex-shrink-0" />
                          <span className="text-xs text-orange-700 font-semibold truncate">
                            {resident.checkInDate ? new Date(resident.checkInDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Compact Action Buttons */}
                    <div className="relative flex items-center justify-center space-x-1.5 pt-2.5 border-t border-gray-200">
                      <PermissionAction
                        module="resident_management"
                        submodule="residents"
                        action="read"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResidentView(resident);
                        }}
                      >
                        <motion.button
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </motion.button>
                      </PermissionAction>

                      <PermissionAction
                        module="resident_management"
                        submodule="residents"
                        action="update"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResidentEdit(resident);
                        }}
                      >
                        <motion.button
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-all duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </motion.button>
                      </PermissionAction>

                      <PermissionAction
                        module="resident_management"
                        submodule="residents"
                        action="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(resident);
                        }}
                      >
                        <motion.button
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </motion.button>
                      </PermissionAction>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Premium Modern Pagination for Grid */}
              {residents.length === 0 ? null : totalPages > 1 && (
                <div className="mt-6 pt-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 py-4 rounded-b-2xl">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        Showing <span className="font-bold text-gray-900">{residents.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}</span> to{' '}
                        <span className="font-bold text-gray-900">
                          {residents.length > 0 ? ((currentPage - 1) * itemsPerPage) + residents.length : 0}
                        </span> of{' '}
                        <span className="font-bold text-gray-900">{stats.total}</span> residents
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Previous</span>
                      </motion.button>

                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }

                          return (
                            <motion.button
                              key={pageNumber}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
                                currentPage === pageNumber
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                  : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md'
                              }`}
                            >
                              {pageNumber}
                            </motion.button>
                          );
                        })}
                        
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <>
                            <span className="px-1 sm:px-2 text-gray-500 text-xs sm:text-sm">...</span>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setCurrentPage(totalPages)}
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg font-semibold text-xs sm:text-sm bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              {totalPages}
                            </motion.button>
                          </>
                        )}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Table View */
            <div className="p-4">
              {renderTableView()}

              {/* Premium Modern Pagination for Table */}
              {residents.length === 0 ? null : totalPages > 1 && (
                <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        Showing <span className="font-bold text-gray-900">{residents.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}</span> to{' '}
                        <span className="font-bold text-gray-900">
                          {residents.length > 0 ? ((currentPage - 1) * itemsPerPage) + residents.length : 0}
                        </span> of{' '}
                        <span className="font-bold text-gray-900">{stats.total}</span> residents
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Previous</span>
                      </motion.button>

                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }

                          return (
                            <motion.button
                              key={pageNumber}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
                                currentPage === pageNumber
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                  : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md'
                              }`}
                            >
                              {pageNumber}
                            </motion.button>
                          );
                        })}
                        
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <>
                            <span className="px-1 sm:px-2 text-gray-500 text-xs sm:text-sm">...</span>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setCurrentPage(totalPages)}
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg font-semibold text-xs sm:text-sm bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              {totalPages}
                            </motion.button>
                          </>
                        )}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>


      </div>

      {/* Resident Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ResidentForm
            isOpen={showForm}
            onClose={() => {
              setShowForm(false);
              setEditingResident(null);
            }}
            onSubmit={handleResidentSubmit}
            editingResident={editingResident}
            selectedBranch={selectedBranch}
          />
        )}
      </AnimatePresence>

      {/* Resident Details Modal */}
      <AnimatePresence>
        {showDetails && selectedResident && (
          <ResidentDetails
            isOpen={showDetails}
            onClose={() => {
              setShowDetails(false);
              setSelectedResident(null);
            }}
            resident={selectedResident}
            onEdit={() => {
              setShowDetails(false);
              setEditingResident(selectedResident);
              setShowForm(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && residentToDelete && (
          <DeleteConfirmModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setResidentToDelete(null);
            }}
            onConfirm={handleResidentDelete}
            title="Delete Resident"
            message={`Are you sure you want to delete ${residentToDelete.firstName} ${residentToDelete.lastName}? This action cannot be undone.`}
            confirmText="Delete Resident"
            cancelText="Cancel"
          />
        )}
      </AnimatePresence>

      {/* Resident Bulk Upload Modal */}
      <ResidentBulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        selectedBranch={selectedBranch}
        onSuccess={handleBulkUploadSuccess}
      />
    </div>
  );
};

export default Residents; 