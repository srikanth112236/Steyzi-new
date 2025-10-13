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
  MoreVertical
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

  const navigate = useNavigate();

  // Fetch residents with comprehensive handling
  const fetchResidents = async () => {
    if (!selectedBranch) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
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
        limit: 10,
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

  // Effects
  useEffect(() => {
    if (selectedBranch) {
      fetchResidents();
      fetchStats();
    }
  }, [selectedBranch, currentPage, statusFilter, genderFilter]);

  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(searchResidents, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm]);

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
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color} shadow-sm`}>
        <Icon className="w-3 h-3 mr-1.5" />
        {status.replace('_', ' ')}
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
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[gradientIndex]} flex items-center justify-center text-white font-semibold text-lg shadow-lg`}>
        {initials || <User className="w-6 h-6" />}
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
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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

        {/* Enhanced Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-4 border border-gray-100 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center shadow">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">All time</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-4 border border-gray-100 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-xs text-green-600">Currently staying</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-4 border border-gray-100 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-xs text-yellow-600">Awaiting check-in</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-4 border border-gray-100 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-500 rounded-lg flex items-center justify-center shadow">
                <LogOut className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Moved Out</p>
                <p className="text-xl font-bold text-gray-900">{stats.movedOut}</p>
                <p className="text-xs text-red-600">This month</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center lg:justify-between gap-4">
            <div className="w-full lg:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search residents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="moved_out">Moved Out</SelectItem>
                </SelectContent>
              </Select>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Gender</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Residents List */}
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
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {residents.map((resident, index) => (
                  <motion.div
                    key={resident._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:border-blue-200 relative overflow-hidden"
                  >
                    {/* Background gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Header */}
                    <div className="relative flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        {getResidentAvatar(resident)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 text-base truncate">
                              {resident.firstName} {resident.lastName}
                            </h4>
                            {getPriorityBadge(resident)}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span 
                              className="truncate max-w-[200px] block" 
                              title={resident.email}
                            >
                              {resident.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(resident.status)}
                        <div className="flex items-center gap-1">
                          <PermissionAction
                            module="resident_management"
                            submodule="residents"
                            action="read"
                            onClick={() => handleResidentView(resident)}
                          >
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </PermissionAction>
                          <PermissionAction
                            module="resident_management"
                            submodule="residents"
                            action="update"
                            onClick={() => handleResidentEdit(resident)}
                          >
                            <button
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Edit resident"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </PermissionAction>
                          <PermissionAction
                            module="resident_management"
                            submodule="residents"
                            action="delete"
                            onClick={() => handleDeleteClick(resident)}
                          >
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Delete resident"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </PermissionAction>
                        </div>
                      </div>
                    </div>

                    {/* Compact Details Grid */}
                    <div className="relative mt-4 grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs text-gray-500">Contact</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{resident.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Building2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs text-gray-500">Work/Study</p>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {resident.workDetails?.company || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Bed className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs text-gray-500">Room</p>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {resident.roomNumber ? `Room ${resident.roomNumber}` : 'Unassigned'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-orange-600 flex-shrink-0" />
                        <div className="min-w-0 overflow-hidden">
                          <p className="text-xs text-gray-500">Check-in</p>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {resident.checkInDate ? new Date(resident.checkInDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Compact Quick Actions */}
                    <div className="relative mt-4 flex items-center justify-between px-2 py-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-green-600 hover:bg-green-100 rounded-md transition-colors">
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <PermissionAction
                          module="resident_management"
                          submodule="residents"
                          action="read"
                          onClick={() => handleResidentView(resident)}
                        >
                          <button className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </PermissionAction>
                        <PermissionAction
                          module="resident_management"
                          submodule="residents"
                          action="update"
                          onClick={() => handleResidentEdit(resident)}
                        >
                          <button className="p-1.5 text-green-600 hover:bg-green-100 rounded-md transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        </PermissionAction>
                        <PermissionAction
                          module="resident_management"
                          submodule="residents"
                          action="delete"
                          onClick={() => handleDeleteClick(resident)}
                        >
                          <button className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </PermissionAction>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Enhanced Pagination */}
              {(totalPages > 1 || residents.length > 0) && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 font-medium">
                      {residents.length > 0 
                        ? `Page ${currentPage} of ${totalPages} • ${residents.length} residents shown`
                        : 'No residents found'}
                    </p>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages || residents.length === 0}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        Next
                      </button>
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