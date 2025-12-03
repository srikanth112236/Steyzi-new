import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Download, 
  Eye, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Calendar,
  LogOut,
  UserPlus,
  ArrowLeft,
  RefreshCw,
  Edit,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import ResidentDetails from '../../components/admin/ResidentDetails';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import { selectSelectedBranch } from '../../store/slices/branch.slice';
import { getApiBaseUrl } from '../../utils/apiUrl';

const MovedOut = () => {
  const { user } = useSelector((state) => state.auth);
  const selectedBranch = useSelector(selectSelectedBranch);
  const [movedOutResidents, setMovedOutResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [residentToDelete, setResidentToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [stats, setStats] = useState({
    total: 0,
    inactive: 0,
    movedOut: 0,
    thisMonth: 0
  });

  const navigate = useNavigate();

  // Fetch moved out residents
  const fetchMovedOutResidents = async () => {
    if (!selectedBranch) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        branchId: selectedBranch._id,
        status: 'inactive,moved_out'
      });
      
      if (genderFilter !== 'all') params.append('gender', genderFilter);

      console.log('🔍 Fetching moved out residents with params:', params.toString());

      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/residents?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Response is not JSON:', text.substring(0, 100));
        throw new Error('Response is not JSON');
      }
      
      const data = await response.json();
      
      console.log('📊 Moved out residents response:', data);
      
      if (data.success) {
        console.log(`✅ Found ${data.data.residents.length} moved out residents`);
        setMovedOutResidents(data.data.residents || []);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        console.error('❌ Failed to fetch moved out residents:', data.message);
        toast.error(data.message || 'Failed to fetch moved out residents');
      }
    } catch (error) {
      console.error('❌ Error fetching moved out residents:', error);
      toast.error('Failed to fetch moved out residents');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    if (!selectedBranch) return;
    try {
      const params = new URLSearchParams({
        branchId: selectedBranch._id
      });
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/residents/stats/overview?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error fetching stats:', response.status, errorText);
        return; // Silently fail for stats
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Stats response is not JSON:', text.substring(0, 100));
        return; // Silently fail for stats
      }
      
      const data = await response.json();
      if (data.success) {
        const statsData = data.data;
        setStats({
          total: statsData.total || 0,
          inactive: statsData.inactive || 0,
          movedOut: statsData.movedOut || 0,
          thisMonth: statsData.thisMonth || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (selectedBranch) {
      fetchMovedOutResidents();
      fetchStats();
    }
  }, [selectedBranch, currentPage, genderFilter]);

  const handleResidentView = (resident) => {
    setSelectedResident(resident);
    setShowDetails(true);
  };

  const handleResidentEdit = (resident) => {
    navigate(`/admin/residents/edit/${resident._id}`);
  };

  const handleResidentDelete = (resident) => {
    setResidentToDelete(resident);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!residentToDelete) return;
    
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/residents/${residentToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error deleting resident:', response.status, errorText);
        toast.error(`Failed to delete resident: ${response.status}`);
        return;
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Delete response is not JSON:', text.substring(0, 100));
        toast.error('Unexpected response from server');
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Resident deleted successfully');
        fetchMovedOutResidents();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to delete resident');
      }
    } catch (error) {
      console.error('Error deleting resident:', error);
      toast.error('Failed to delete resident');
    } finally {
      setShowDeleteModal(false);
      setResidentToDelete(null);
    }
  };

  const handleReOnboard = (resident) => {
    navigate('/admin/onboarding', { 
      state: { 
        preSelectedResident: resident,
        mode: 're-onboard'
      }
    });
  };

  const filteredResidents = movedOutResidents.filter(resident => {
    const searchLower = searchTerm.toLowerCase();
    const genderMatch = genderFilter === 'all' || resident.gender === genderFilter;
    return genderMatch && (
      resident.firstName?.toLowerCase().includes(searchLower) ||
      resident.lastName?.toLowerCase().includes(searchLower) ||
      resident.phone?.includes(searchTerm) ||
      resident.email?.toLowerCase().includes(searchLower)
    );
  });

  console.log('🔍 Debug - movedOutResidents:', movedOutResidents.length);
  console.log('🔍 Debug - filteredResidents:', filteredResidents.length);
  console.log('🔍 Debug - searchTerm:', searchTerm);

  // Gender Select Component
  const GenderSelect = () => (
    <Select 
      value={genderFilter} 
      onValueChange={(value) => setGenderFilter(value)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="All Genders" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Genders</SelectItem>
        <SelectItem value="male">Male</SelectItem>
        <SelectItem value="female">Female</SelectItem>
        <SelectItem value="other">Other</SelectItem>
      </SelectContent>
    </Select>
  );

  // Compact Resident Card
  const ResidentCard = ({ resident }) => {
    const getInitials = (firstName, lastName) => 
      `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

    const getAvatarColor = () => {
      const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-green-500'];
      return colors[(resident.firstName?.length || 0) % colors.length];
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${getAvatarColor()}`}>
            {getInitials(resident.firstName, resident.lastName)}
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="font-bold text-gray-900 text-lg truncate">
              {resident.firstName} {resident.lastName}
            </h3>
            <p className="text-sm text-gray-600 truncate">{resident.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
            <Phone className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-gray-700 truncate">{resident.phone}</span>
          </div>
          <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
            <Building2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-700">
              {resident.roomNumber ? `Room ${resident.roomNumber}` : 'Not assigned'}
            </span>
          </div>
          <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-gray-700">
              {resident.checkOutDate 
                ? new Date(resident.checkOutDate).toLocaleDateString() 
                : 'No checkout date'}
            </span>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center border-t border-gray-200 pt-3">
          <button 
            onClick={() => handleResidentView(resident)}
            className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </button>
          <button 
            onClick={() => handleReOnboard(resident)}
            className="flex items-center text-green-600 hover:text-green-800 text-sm"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Re-onboard
          </button>
        </div>
      </motion.div>
    );
  };

  // Get user from Redux or localStorage as fallback
  const currentUser = user || (() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  })();

  if (!currentUser || !currentUser?.role || !['admin', 'maintainer'].includes(currentUser.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Admin privileges required to access moved out residents.</p>
        </div>
      </div>
    );
  }

  if (!selectedBranch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Moved Out Residents</h1>
          <p className="text-gray-600">Please select a branch from the header to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto py-2 px-4 sm:px-2 lg:px-2">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/residents')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Moved Out Residents</h1>
                <p className="text-gray-600">
                  Manage residents who have vacated from {selectedBranch?.name || 'your PG'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  fetchMovedOutResidents();
                  fetchStats();
                }}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Moved Out</p>
                <p className="text-3xl font-bold text-gray-900">{stats.movedOut}</p>
                <p className="text-sm text-gray-500">All time</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl">
                <LogOut className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Month Moved Out</p>
                <p className="text-3xl font-bold text-gray-900">{stats.thisMonth}</p>
                <p className="text-sm text-gray-500">Recent departures</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search residents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="md:col-span-1">
              <GenderSelect />
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Table
                </button>
              </div>
              
              <button className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Residents Display */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredResidents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <LogOut className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No moved out residents found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'No residents match your search criteria.' : 'All residents are currently active.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResidents.map((resident) => (
              <ResidentCard key={resident._id} resident={resident} />
            ))}
          </div>
        ) : (
          // Table View
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resident
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-out Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResidents.map((resident, index) => (
                    <motion.tr
                      key={resident._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {/* Avatar is now handled by ResidentCard */}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {resident.firstName} {resident.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {resident.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{resident.phone}</div>
                        <div className="text-sm text-gray-500">{resident.gender}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {resident.roomNumber ? `Room ${resident.roomNumber}` : 'Not assigned'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {resident.bedNumber ? `Bed ${resident.bedNumber}` : 'No bed'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {resident.checkOutDate ? new Date(resident.checkOutDate).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {resident.checkOutDate ? new Date(resident.checkOutDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Status badge is now handled by ResidentCard */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleResidentView(resident)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleResidentEdit(resident)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Edit resident"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleResidentDelete(resident)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete resident"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReOnboard(resident)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                            title="Re-onboard"
                          >
                            <UserPlus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resident Details Modal */}
      <AnimatePresence>
        {showDetails && selectedResident && (
          <ResidentDetails
            resident={selectedResident}
            onClose={() => {
              setShowDetails(false);
              setSelectedResident(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && residentToDelete && (
          <DeleteConfirmModal
            isOpen={showDeleteModal}
            title="Delete Resident"
            message={`Are you sure you want to permanently delete ${residentToDelete.firstName} ${residentToDelete.lastName}? This action cannot be undone.`}
            onConfirm={confirmDelete}
            onCancel={() => {
              setShowDeleteModal(false);
              setResidentToDelete(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MovedOut; 