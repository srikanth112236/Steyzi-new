import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Building2, 
  User, 
  Upload, 
  Calendar,
  CheckCircle2,
  X,
  Eye,
  Bed,
  MapPin,
  Phone,
  Mail,
  FileText,
  Receipt,
  DollarSign,
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  CalendarDays
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { api } from '../../services/auth.service';
import { Tooltip } from 'antd';
import { selectSelectedBranch } from '../../store/slices/branch.slice';

const Payments = () => {
  const { user } = useSelector((state) => state.auth);
  const selectedBranch = useSelector(selectSelectedBranch);
  
  // State for tabs
  const [activeTab, setActiveTab] = useState('rooms');
  
  // State for rooms workflow
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomResidents, setRoomResidents] = useState([]);
  const [selectedRoomResident, setSelectedRoomResident] = useState(null);
  
  // State for residents workflow
  const [residents, setResidents] = useState([]);
  const [selectedResident, setSelectedResident] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Enhanced filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  // Payment statistics
  const [paymentStats, setPaymentStats] = useState({
    totalResidents: 0,
    paidResidents: 0,
    pendingResidents: 0,
    totalAmount: 0
  });
  
  // State for payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(''); // 'cash' or 'upi'
  const [paymentImage, setPaymentImage] = useState(null);
  const [paymentImagePreview, setPaymentImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for resident details modal
  const [showResidentDetails, setShowResidentDetails] = useState(false);
  
  // Loading states
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [loadingRoomResidents, setLoadingRoomResidents] = useState(false);
  
  useEffect(() => {
    if (!selectedBranch) return;
    fetchRooms();
    fetchResidents();
  }, [selectedBranch]);

  // Calculate payment statistics
  useEffect(() => {
    if (residents.length > 0) {
      const paidCount = residents.filter(r => r.paymentStatus === 'paid' || r.hasCurrentMonthPayment).length;
      const pendingCount = residents.filter(r => r.paymentStatus !== 'paid' && !r.hasCurrentMonthPayment).length;
      const totalAmount = residents.reduce((sum, r) => sum + (r.rentAmount || 8000), 0);
      
      setPaymentStats({
        totalResidents: residents.length,
        paidResidents: paidCount,
        pendingResidents: pendingCount,
        totalAmount
      });
    }
  }, [residents]);

  const fetchRooms = async () => {
    if (!selectedBranch) return;
    try {
      setLoadingRooms(true);
      const response = await api.get(`/pg/rooms?branchId=${selectedBranch._id}`);
      if (response.data.success) {
        setRooms(response.data.data || []);
      } else {
        console.error('Failed to fetch rooms:', response.data.message);
        toast.error('Failed to fetch rooms');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to fetch rooms. Please check your connection.');
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchResidents = async () => {
    if (!selectedBranch) return;
    try {
      setLoadingResidents(true);
      
      // First update payment status for all residents in branch (if backend supports global update)
      try {
        await api.put('/residents/payment-status/update-all');
      } catch (error) {
        console.error('Error updating payment status:', error);
      }
      
      const response = await api.get(`/residents?branchId=${selectedBranch._id}`);
      if (response.data.success) {
        setResidents(response.data.data.residents || []);
      } else {
        console.error('Failed to fetch residents:', response.data.message);
        toast.error('Failed to fetch residents');
      }
    } catch (error) {
      console.error('Error fetching residents:', error);
      toast.error('Failed to fetch residents. Please check your connection.');
    } finally {
      setLoadingResidents(false);
    }
  };

  const fetchRoomResidents = async (roomId) => {
    try {
      setLoadingRoomResidents(true);
      const response = await api.get(`/payments/rooms/${roomId}/residents?branchId=${selectedBranch?._id || ''}`);
      if (response.data.success) {
        setRoomResidents(response.data.data || []);
      } else {
        console.error('Failed to fetch room residents:', response.data.message);
        toast.error('Failed to fetch room residents');
      }
    } catch (error) {
      console.error('Error fetching room residents:', error);
      toast.error('Failed to fetch room residents. Please check your connection.');
    } finally {
      setLoadingRoomResidents(false);
    }
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setSelectedRoomResident(null);
    fetchRoomResidents(room._id);
  };

  const handleRoomResidentSelect = (resident) => {
    if (resident.paymentStatus === 'paid' || resident.hasCurrentMonthPayment) {
      toast.error('Payment for this month has already been completed');
      return;
    }
    
    setSelectedRoomResident(resident);
    setShowPaymentModal(true);
  };

  const handleResidentSelect = (resident) => {
    setSelectedResident(resident);
    setShowResidentDetails(true);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPaymentImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPaymentImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentDate) {
      toast.error('Please select payment date');
      return;
    }
    
    if (!paymentMethod) {
      toast.error('Please select payment method');
      return;
    }
    
    if (paymentMethod === 'upi' && !paymentImage) {
      toast.error('Please upload UPI payment receipt');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('paymentDate', paymentDate);
      formData.append('paymentMethod', paymentMethod);
      if (paymentImage) {
        formData.append('paymentImage', paymentImage);
      }
      
      const residentId = selectedRoomResident?._id || selectedResident?._id;
      
      const response = await api.post(`/payments/resident/${residentId}/mark-paid`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        toast.success('Payment marked as completed successfully!');
        setShowPaymentModal(false);
        setPaymentDate('');
        setPaymentMethod('');
        setPaymentImage(null);
        setPaymentImagePreview(null);
        setSelectedRoomResident(null);
        setSelectedResident(null);
        await refreshDataAfterPayment();
      } else {
        toast.error(response.data.message || 'Failed to mark payment');
      }
    } catch (error) {
      console.error('Error marking payment:', error);
      if (error.response?.data?.message?.includes('already exists')) {
        toast.error('Payment for this month has already been marked as completed');
      } else {
        toast.error('Failed to mark payment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // New function to refresh data after payment completion
  const refreshDataAfterPayment = async () => {
    try {
      await api.put('/residents/payment-status/update-all');
      await fetchResidents();
      if (activeTab === 'rooms' && selectedRoom) {
        await fetchRoomResidents(selectedRoom._id);
      }
    } catch (error) {
      console.error('Error refreshing data after payment:', error);
    }
  };

  // Enhanced filtering and sorting
  const getFilteredAndSortedResidents = () => {
    let filtered = residents.filter(resident =>
      resident.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.phone?.includes(searchTerm) ||
      resident.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      if (statusFilter === 'paid') {
        filtered = filtered.filter(r => r.paymentStatus === 'paid' || r.hasCurrentMonthPayment);
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(r => r.paymentStatus !== 'paid' && !r.hasCurrentMonthPayment);
      }
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName);
        case 'room':
          return (a.roomNumber || '').localeCompare(b.roomNumber || '');
        case 'amount':
          return (b.rentAmount || 8000) - (a.rentAmount || 8000);
        case 'status':
          const aStatus = a.paymentStatus === 'paid' || a.hasCurrentMonthPayment ? 'paid' : 'pending';
          const bStatus = b.paymentStatus === 'paid' || b.hasCurrentMonthPayment ? 'paid' : 'pending';
          return aStatus.localeCompare(bStatus);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredResidents = getFilteredAndSortedResidents();

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Loading component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
      <span className="ml-2 text-gray-600 text-sm">Loading...</span>
    </div>
  );

  // Error component
  const ErrorMessage = ({ message, onRetry }) => (
    <div className="flex items-center justify-center py-4">
      <div className="text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-gray-600 text-sm mb-2">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 bg-sky-500 text-white rounded text-sm hover:bg-sky-600 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );

  if (!selectedBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Select a Branch</h2>
            <p className="text-sm text-gray-600">Please use the branch selector in the header to manage payments.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header with Stats */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
            </div>
            <button
              onClick={refreshDataAfterPayment}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
          
          {/* Payment Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Total Residents</p>
                  <p className="text-lg font-bold text-gray-900">{paymentStats.totalResidents}</p>
                </div>
                <User className="h-5 w-5 text-sky-500" />
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Paid</p>
                  <p className="text-lg font-bold text-green-600">{paymentStats.paidResidents}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Pending</p>
                  <p className="text-lg font-bold text-yellow-600">{paymentStats.pendingResidents}</p>
                </div>
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Total Amount</p>
                  <p className="text-lg font-bold text-gray-900">₹{paymentStats.totalAmount.toLocaleString()}</p>
                </div>
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Compact Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'rooms'
                  ? 'text-sky-600 border-b-2 border-sky-600 bg-sky-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>By Room</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('residents')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'residents'
                  ? 'text-sky-600 border-b-2 border-sky-600 bg-sky-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <User className="h-4 w-4" />
                <span>By Resident</span>
              </div>
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'rooms' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Two Column Layout for Rooms and Residents */}
                <div className={`grid gap-4 ${selectedRoom ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} h-[calc(100vh-200px)]`}>
                  {/* Rooms Section - Fixed Height with Scroll */}
                  <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-4 rounded-lg border border-sky-200 flex flex-col h-screen">
                    <div className="flex items-center justify-between mb-3 flex-shrink-0">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building2 className="h-3 w-3 text-blue-600" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900">Select Room</h3>
                      </div>
                      <span className="text-xs text-gray-500">{rooms.length} rooms</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                      {loadingRooms ? (
                        <LoadingSpinner />
                      ) : rooms.length === 0 ? (
                        <ErrorMessage 
                          message="No rooms found. Please add some rooms first." 
                          onRetry={fetchRooms}
                        />
                      ) : (
                        <div className={`grid gap-3 ${selectedRoom ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
                          {rooms.map((room) => (
                            <motion.button
                              key={room._id}
                              onClick={() => handleRoomSelect(room)}
                              whileHover={{ scale: 1.02, y: -1 }}
                              whileTap={{ scale: 0.98 }}
                              className={`p-3 rounded-lg border transition-all text-left ${
                                selectedRoom?._id === room._id
                                  ? 'border-sky-500 bg-sky-50 shadow-md'
                                  : 'border-gray-200 bg-white hover:border-sky-300 hover:shadow-sm'
                              }`}
                            >
                              <div>
                                <h4 className="font-semibold text-gray-900 text-sm">Room {room.roomNumber}</h4>
                                <p className="text-xs text-gray-600">{room.sharingType} Sharing</p>
                                <p className="text-xs text-gray-600">₹{room.rentAmount || 8000}/month</p>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Residents Section - Only show when room is selected */}
                  {selectedRoom && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-3 flex-shrink-0">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <User className="h-3 w-3 text-green-600" />
                          </div>
                          <h3 className="text-base font-bold text-gray-900">
                            Residents in Room {selectedRoom.roomNumber}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{roomResidents.length} residents</span>
                          <button
                            onClick={() => fetchRoomResidents(selectedRoom._id)}
                            className="text-green-600 hover:text-green-700 text-xs font-medium"
                          >
                            Refresh
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto">
                        {loadingRoomResidents ? (
                          <LoadingSpinner />
                        ) : roomResidents.length === 0 ? (
                          <ErrorMessage 
                            message="No residents found in this room." 
                            onRetry={() => fetchRoomResidents(selectedRoom._id)}
                          />
                        ) : (
                          <div className="space-y-3">
                            {roomResidents.map((resident) => (
                              <motion.div
                                key={resident._id}
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-white p-3 rounded-lg border border-green-200"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-gray-900 text-sm">
                                      {resident.firstName} {resident.lastName}
                                    </h4>
                                    <p className="text-xs text-gray-500">{resident.phone}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-gray-600">₹{resident.rentAmount || 8000}</p>
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                      resident.paymentStatus === 'paid' || resident.hasCurrentMonthPayment
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {resident.paymentStatus === 'paid' || resident.hasCurrentMonthPayment ? 'Paid' : 'Pending'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="space-y-1 mb-2">
                                  <div className="flex items-center space-x-1 text-xs">
                                    <Bed className="h-3 w-3 text-gray-400" />
                                    <span className="text-gray-600">Bed {resident.bedNumber || 'Unassigned'}</span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-xs">
                                    <Mail className="h-3 w-3 text-gray-400" />
                                    <span className="text-gray-600">{resident.email || 'No email'}</span>
                                  </div>
                                </div>
                                
                                {resident.paymentStatus === 'paid' || resident.hasCurrentMonthPayment ? (
                                  <Tooltip title="Payment already completed for this month" placement="top">
                                    <button
                                      disabled
                                      className="w-full flex items-center justify-center space-x-1 px-2 py-1.5 bg-gray-300 text-gray-500 rounded text-xs cursor-not-allowed transition-all"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                      <span>Payment Done</span>
                                    </button>
                                  </Tooltip>
                                ) : (
                                  <button
                                    onClick={() => handleRoomResidentSelect(resident)}
                                    className="w-full flex items-center justify-center space-x-1 px-2 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded text-xs hover:from-green-600 hover:to-emerald-600 transition-all"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Mark Payment</span>
                                  </button>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'residents' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Enhanced Search and Filters */}
                <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-4 rounded-lg border border-sky-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <Search className="h-3 w-3 text-purple-600" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Search & Filter</h3>
                    </div>
                    <span className="text-xs text-gray-500">{filteredResidents.length} residents</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      />
                      <Search className="h-4 w-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                    </div>
                    
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                    </select>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="room">Sort by Room</option>
                      <option value="amount">Sort by Amount</option>
                      <option value="status">Sort by Status</option>
                    </select>
                  </div>
                </div>

                {/* Compact Residents List */}
                <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-4 rounded-lg border border-sky-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="h-3 w-3 text-green-600" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">All Residents</h3>
                    </div>
                    <button
                      onClick={fetchResidents}
                      className="text-sky-600 hover:text-sky-700 text-xs font-medium"
                    >
                      Refresh
                    </button>
                  </div>
                  
                  {loadingResidents ? (
                    <LoadingSpinner />
                  ) : filteredResidents.length === 0 ? (
                    <ErrorMessage 
                      message="No residents found. Please add some residents first." 
                      onRetry={fetchResidents}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {filteredResidents.map((resident) => (
                        <motion.div
                          key={resident._id}
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-white p-3 rounded-lg border border-sky-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {resident.firstName} {resident.lastName}
                              </h4>
                              <p className="text-xs text-gray-500">{resident.phone}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600">₹{resident.rentAmount || 8000}</p>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                resident.paymentStatus === 'paid' || resident.hasCurrentMonthPayment
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {resident.paymentStatus === 'paid' || resident.hasCurrentMonthPayment ? 'Paid' : 'Pending'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-1 mb-2">
                            <div className="flex items-center space-x-1 text-xs">
                              <Building2 className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">Room {resident.roomNumber || 'Unassigned'}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-xs">
                              <Bed className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">Bed {resident.bedNumber || 'Unassigned'}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleResidentSelect(resident)}
                            className="w-full flex items-center justify-center space-x-1 px-2 py-1.5 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded text-xs hover:from-sky-600 hover:to-blue-600 transition-all"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View Details</span>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">Mark Payment as Completed</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Resident Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  {selectedRoomResident?.firstName} {selectedRoomResident?.lastName}
                </h4>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p>Room: {selectedRoomResident?.roomNumber}</p>
                  <p>Bed: {selectedRoomResident?.bedNumber}</p>
                  <p>Amount: ₹{selectedRoomResident?.rentAmount || 8000}</p>
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="">Select Method</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Receipt {paymentMethod === 'upi' ? '(Required)' : '(Optional)'}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded p-3 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="payment-image"
                  />
                  <label htmlFor="payment-image" className="cursor-pointer">
                    {paymentImagePreview ? (
                      <div className="space-y-1">
                        <img 
                          src={paymentImagePreview} 
                          alt="Receipt preview" 
                          className="w-24 h-24 object-cover rounded mx-auto"
                        />
                        <p className="text-xs text-gray-600">Click to change image</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                        <p className="text-xs text-gray-600">
                          {paymentMethod === 'upi' ? 'Upload UPI receipt (Required)' : 'Upload receipt (Optional)'}
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 text-gray-700 bg-gray-100 rounded text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded text-sm hover:from-sky-600 hover:to-blue-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      Processing...
                    </div>
                  ) : (
                    'Mark Payment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Resident Details Modal */}
      {showResidentDetails && selectedResident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">Resident Details</h3>
              <button
                onClick={() => setShowResidentDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  {selectedResident.firstName} {selectedResident.lastName}
                </h4>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p>Phone: {selectedResident.phone}</p>
                  <p>Email: {selectedResident.email || 'Not provided'}</p>
                  <p>Room: {selectedResident.roomNumber || 'Unassigned'}</p>
                  <p>Bed: {selectedResident.bedNumber || 'Unassigned'}</p>
                  <p>Amount: ₹{selectedResident.rentAmount || 8000}</p>
                  <p>Status: <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedResident.paymentStatus === 'paid' || selectedResident.hasCurrentMonthPayment
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedResident.paymentStatus === 'paid' || selectedResident.hasCurrentMonthPayment ? 'Paid' : 'Pending'}
                  </span></p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowResidentDetails(false)}
                  className="flex-1 px-3 py-2 text-gray-700 bg-gray-100 rounded text-sm hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                {selectedResident.paymentStatus !== 'paid' && !selectedResident.hasCurrentMonthPayment && (
                  <button
                    onClick={() => {
                      setShowResidentDetails(false);
                      setSelectedRoomResident(selectedResident);
                      setShowPaymentModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded text-sm hover:from-sky-600 hover:to-blue-600 transition-colors"
                  >
                    Mark Payment
                  </button>
                )}
                {selectedResident.paymentStatus === 'paid' || selectedResident.hasCurrentMonthPayment ? (
                  <Tooltip title="Payment already completed for this month" placement="top">
                    <button
                      disabled
                      className="flex-1 px-3 py-2 bg-gray-300 text-gray-500 rounded text-sm cursor-not-allowed transition-colors"
                    >
                      Payment Done
                    </button>
                  </Tooltip>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments; 