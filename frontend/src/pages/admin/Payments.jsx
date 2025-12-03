import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Building2, 
  User, 
  Upload, 
  Calendar as CalendarIcon,
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
  CalendarDays,
  History,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { api } from '../../services/auth.service';
import { Tooltip } from 'antd';
import { selectSelectedBranch } from '../../store/slices/branch.slice';
import { Calendar } from '../../components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover';

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
  
  // State for payment history
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
  const [selectedPaymentForView, setSelectedPaymentForView] = useState(null);
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  
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
      // Check actual payment status - only count as paid if status is 'paid' AND hasCurrentMonthPayment is true
      const paidCount = residents.filter(r => 
        r.paymentStatus === 'paid' || 
        (r.hasCurrentMonthPayment && (r.currentMonthPaymentStatus === 'paid' || r.paymentStatus === 'paid'))
      ).length;
      const pendingCount = residents.filter(r => 
        r.paymentStatus !== 'paid' && 
        (!r.hasCurrentMonthPayment || r.currentMonthPaymentStatus === 'pending' || r.paymentStatus === 'pending')
      ).length;
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
    // Check actual payment status - only block if status is 'paid'
    const isPaid = resident.paymentStatus === 'paid' || 
                   (resident.hasCurrentMonthPayment && resident.currentMonthPaymentStatus === 'paid');
    if (isPaid) {
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
      const errorMessage = error.response?.data?.message || error.message || 'Failed to mark payment';
      
      if (error.response?.status === 409 || errorMessage.includes('already exists')) {
        toast.error(errorMessage || 'Payment for this month has already been marked as completed');
      } else {
        toast.error(errorMessage || 'Failed to mark payment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch payment history for a resident
  const fetchPaymentHistory = async (residentId) => {
    try {
      setLoadingPaymentHistory(true);
      const response = await api.get(`/payments/resident/${residentId}`);
      if (response.data.success) {
        const payments = response.data.data || [];
        // Format and sort payments by date (newest first)
        const formattedPayments = payments.map(payment => ({
          ...payment,
          // Ensure amount is a number
          amount: typeof payment.amount === 'number' ? payment.amount : parseFloat(payment.amount) || 0,
          // Ensure status is properly set (default to 'pending' if not set)
          status: payment.status || 'pending',
          // Ensure dates are properly formatted
          paymentDate: payment.paymentDate || payment.createdAt,
          // Ensure receiptImage is properly structured
          receiptImage: payment.receiptImage || null,
          // Ensure month and year are present
          month: payment.month || new Date(payment.paymentDate || payment.createdAt).toLocaleString('en-US', { month: 'long' }),
          year: payment.year || new Date(payment.paymentDate || payment.createdAt).getFullYear()
        }));
        
        const sortedPayments = formattedPayments.sort((a, b) => {
          const dateA = new Date(a.paymentDate || a.createdAt);
          const dateB = new Date(b.paymentDate || b.createdAt);
          return dateB - dateA;
        });
        setPaymentHistory(sortedPayments);
      } else {
        toast.error('Failed to fetch payment history');
        setPaymentHistory([]);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to fetch payment history');
      setPaymentHistory([]);
    } finally {
      setLoadingPaymentHistory(false);
    }
  };

  // Handle history icon click - directly show history component
  const handleHistoryClick = async () => {
    const residentId = selectedRoomResident?._id || selectedResident?._id;
    if (residentId) {
      // Close payment modal and show history
      setShowPaymentModal(false);
      await fetchPaymentHistory(residentId);
      setShowPaymentHistory(true);
    }
  };

  // Component to load and display payment image with authentication
  const PaymentReceiptImage = ({ payment }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    useEffect(() => {
      if (!payment?.receiptImage?.filePath || !payment?._id) {
        setError(true);
        setLoading(false);
        return;
      }
      
      // Fetch image as blob with authentication
      const fetchImage = async () => {
        try {
          const response = await api.get(`/payments/${payment._id}/receipt`, {
            responseType: 'blob'
          });
          
          // Create blob URL
          const blob = new Blob([response.data], { 
            type: response.headers['content-type'] || 'image/jpeg' 
          });
          const blobUrl = URL.createObjectURL(blob);
          
          setImageUrl(blobUrl);
          setError(false);
        } catch (err) {
          console.error('Error loading payment receipt image:', err);
          setError(true);
        } finally {
          setLoading(false);
        }
      };
      
      fetchImage();
      
      // Cleanup blob URL on unmount or when payment changes
      return () => {
        if (imageUrl && imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(imageUrl);
        }
      };
    }, [payment?._id, payment?.receiptImage?.filePath]);
    
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      );
    }
    
    if (error || !imageUrl) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">Receipt image not available</p>
          {payment?.receiptImage?.originalName && (
            <p className="text-xs text-gray-500 mt-1">
              Expected: {payment.receiptImage.originalName}
            </p>
          )}
        </div>
      );
    }
    
    return (
      <img
        src={imageUrl}
        alt="Payment Receipt"
        className="max-w-full max-h-96 rounded-lg shadow-md object-contain bg-white"
        onError={() => {
          setError(true);
          setImageUrl(null);
        }}
      />
    );
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
        // Only show as paid if status is actually 'paid'
        filtered = filtered.filter(r => 
          r.paymentStatus === 'paid' || 
          (r.hasCurrentMonthPayment && r.currentMonthPaymentStatus === 'paid')
        );
      } else if (statusFilter === 'pending') {
        // Show as pending if status is 'pending' or no payment exists or payment status is 'pending'
        filtered = filtered.filter(r => 
          r.paymentStatus === 'pending' || 
          !r.hasCurrentMonthPayment || 
          r.currentMonthPaymentStatus === 'pending'
        );
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
          const aStatus = (a.paymentStatus === 'paid' || (a.hasCurrentMonthPayment && a.currentMonthPaymentStatus === 'paid')) ? 'paid' : 'pending';
          const bStatus = (b.paymentStatus === 'paid' || (b.hasCurrentMonthPayment && b.currentMonthPaymentStatus === 'paid')) ? 'paid' : 'pending';
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
                                      resident.paymentStatus === 'paid' || 
                                      (resident.hasCurrentMonthPayment && resident.currentMonthPaymentStatus === 'paid')
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {resident.paymentStatus === 'paid' || 
                                       (resident.hasCurrentMonthPayment && resident.currentMonthPaymentStatus === 'paid') 
                                        ? 'Paid' : 'Pending'}
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
                                
                                <div className="flex space-x-2">
                                  <button
                                    onClick={async () => {
                                      setSelectedRoomResident(resident);
                                      await fetchPaymentHistory(resident._id);
                                      setShowPaymentHistory(true);
                                    }}
                                    className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-all"
                                    title="View Payment History"
                                  >
                                    <History className="h-3 w-3" />
                                    <span>History</span>
                                  </button>
                                  {(resident.paymentStatus === 'paid' || 
                                     (resident.hasCurrentMonthPayment && resident.currentMonthPaymentStatus === 'paid')) ? (
                                    <Tooltip title="Payment already completed for this month" placement="top">
                                      <button
                                        disabled
                                        className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-gray-300 text-gray-500 rounded text-xs cursor-not-allowed transition-all"
                                      >
                                        <CheckCircle className="h-3 w-3" />
                                        <span>Paid</span>
                                      </button>
                                    </Tooltip>
                                  ) : (
                                    <button
                                      onClick={() => handleRoomResidentSelect(resident)}
                                      className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded text-xs hover:from-green-600 hover:to-emerald-600 transition-all"
                                    >
                                      <Plus className="h-3 w-3" />
                                      <span>Mark Payment</span>
                                    </button>
                                  )}
                                </div>
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
                                resident.paymentStatus === 'paid' || 
                                (resident.hasCurrentMonthPayment && resident.currentMonthPaymentStatus === 'paid')
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {resident.paymentStatus === 'paid' || 
                                 (resident.hasCurrentMonthPayment && resident.currentMonthPaymentStatus === 'paid') 
                                  ? 'Paid' : 'Pending'}
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
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={async () => {
                                setSelectedResident(resident);
                                await fetchPaymentHistory(resident._id);
                                setShowPaymentHistory(true);
                              }}
                              className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-all"
                              title="View Payment History"
                            >
                              <History className="h-3 w-3" />
                              <span>History</span>
                            </button>
                            <button
                              onClick={() => handleResidentSelect(resident)}
                              className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded text-xs hover:from-sky-600 hover:to-blue-600 transition-all"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Details</span>
                            </button>
                          </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-md mx-auto my-4 flex flex-col max-h-[95vh] overflow-hidden">
            {/* Header - Sticky */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-base font-bold text-gray-900">Mark Payment as Completed</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleHistoryClick}
                  className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                  title="View Payment History"
                >
                  <History className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Resident Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  {selectedRoomResident?.firstName} {selectedRoomResident?.lastName}
                </h4>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p>Room: {selectedRoomResident?.roomNumber || 'N/A'}</p>
                  <p>Bed: {selectedRoomResident?.bedNumber || 'Unassigned'}</p>
                  <p>Amount: ₹{selectedRoomResident?.rentAmount || 8000}</p>
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Payment Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left border border-gray-300 rounded-lg flex items-center justify-between text-sm hover:bg-gray-50 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                    >
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                        {paymentDate 
                          ? format(new Date(paymentDate), 'dd-MMM-yyyy')
                          : 'Select payment date'}
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={paymentDate ? new Date(paymentDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setPaymentDate(format(date, 'yyyy-MM-dd'));
                        } else {
                          setPaymentDate('');
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                >
                  <option value="">Select Method</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Payment Receipt {paymentMethod === 'upi' ? '(Required)' : '(Optional)'}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-sky-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="payment-image"
                  />
                  <label htmlFor="payment-image" className="cursor-pointer block">
                    {paymentImagePreview ? (
                      <div className="space-y-2">
                        <img 
                          src={paymentImagePreview} 
                          alt="Receipt preview" 
                          className="w-32 h-32 object-cover rounded-lg mx-auto border border-gray-200"
                        />
                        <p className="text-xs text-gray-600">Click to change image</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-10 w-10 text-gray-400 mx-auto" />
                        <p className="text-xs text-gray-600">
                          {paymentMethod === 'upi' ? 'Upload UPI receipt (Required)' : 'Upload receipt (Optional)'}
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Footer - Sticky */}
            <div className="flex space-x-2 p-4 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-sky-600 hover:to-blue-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Mark Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Component */}
      {showPaymentHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setShowPaymentHistory(false);
                    setSelectedPaymentForView(null);
                  }}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Payment History</h3>
                  <p className="text-xs text-gray-600">
                    {selectedRoomResident 
                      ? `${selectedRoomResident.firstName} ${selectedRoomResident.lastName}`
                      : selectedResident
                      ? `${selectedResident.firstName} ${selectedResident.lastName}`
                      : 'Resident'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPaymentHistory(false);
                  setSelectedPaymentForView(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {loadingPaymentHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                </div>
              ) : selectedPaymentForView ? (
                /* Payment Detail View */
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-4 rounded-lg border border-sky-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-base font-bold text-gray-900">Payment Details</h4>
                      <button
                        onClick={() => setSelectedPaymentForView(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          ₹{typeof selectedPaymentForView.amount === 'number' 
                            ? selectedPaymentForView.amount.toLocaleString('en-IN')
                            : parseFloat(selectedPaymentForView.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                          selectedPaymentForView.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : selectedPaymentForView.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedPaymentForView.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {(selectedPaymentForView.status || 'pending').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Payment Date:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {selectedPaymentForView.paymentDate 
                            ? new Date(selectedPaymentForView.paymentDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                            : selectedPaymentForView.createdAt
                            ? new Date(selectedPaymentForView.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="ml-2 font-medium text-gray-900 capitalize">
                          {selectedPaymentForView.paymentMethod?.replace('_', ' ') || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Month:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {selectedPaymentForView.month || 'N/A'} {selectedPaymentForView.year || ''}
                        </span>
                      </div>
                      {selectedPaymentForView.markedBy && (
                        <div>
                          <span className="text-gray-600">Marked By:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {typeof selectedPaymentForView.markedBy === 'object' 
                              ? `${selectedPaymentForView.markedBy?.firstName || ''} ${selectedPaymentForView.markedBy?.lastName || ''}`.trim() || 'N/A'
                              : selectedPaymentForView.markedBy || 'N/A'}
                          </span>
                        </div>
                      )}
                    </div>
                    {selectedPaymentForView.notes && (
                      <div className="mt-3 pt-3 border-t border-sky-200">
                        <span className="text-gray-600 text-sm">Notes:</span>
                        <p className="text-sm text-gray-900 mt-1">{selectedPaymentForView.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Receipt Image Preview */}
                  {selectedPaymentForView.receiptImage && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Payment Receipt
                      </h5>
                      <div className="flex justify-center">
                        <PaymentReceiptImage payment={selectedPaymentForView} />
                      </div>
                      {selectedPaymentForView.receiptImage.originalName && (
                        <p className="text-xs text-gray-600 mt-2 text-center">
                          {selectedPaymentForView.receiptImage.originalName}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Payment List View */
                <div className="space-y-3">
                  {/* Status Filter */}
                  <div className="flex items-center space-x-2 mb-4">
                    <button
                      onClick={() => setHistoryStatusFilter('all')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        historyStatusFilter === 'all'
                          ? 'bg-sky-100 text-sky-700 border border-sky-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setHistoryStatusFilter('paid')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        historyStatusFilter === 'paid'
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Paid
                    </button>
                    <button
                      onClick={() => setHistoryStatusFilter('pending')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        historyStatusFilter === 'pending'
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setHistoryStatusFilter('overdue')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        historyStatusFilter === 'overdue'
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Overdue
                    </button>
                  </div>

                  {/* Payment Cards */}
                  {paymentHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No payment records found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {paymentHistory
                        .filter(payment => historyStatusFilter === 'all' || payment.status === historyStatusFilter)
                        .map((payment) => {
                          const isUpcoming = payment.status === 'pending' && 
                            new Date(payment.paymentDate || payment.createdAt) > new Date();
                          
                          return (
                            <div
                              key={payment._id}
                              className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      payment.status === 'paid' 
                                        ? 'bg-green-100 text-green-800' 
                                        : payment.status === 'pending'
                                        ? isUpcoming 
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                        : payment.status === 'overdue'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {isUpcoming ? 'UPCOMING' : payment.status?.toUpperCase()}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">
                                      ₹{payment.amount?.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-600 space-y-0.5">
                                    <p>
                                      {payment.month} {payment.year}
                                    </p>
                                    <p>
                                      {payment.paymentDate 
                                        ? new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                          })
                                        : 'Date not available'}
                                    </p>
                                    <p className="capitalize">
                                      {payment.paymentMethod?.replace('_', ' ') || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                {payment.status === 'paid' && (
                                  <button
                                    onClick={() => setSelectedPaymentForView(payment)}
                                    className="ml-3 px-3 py-1.5 bg-sky-50 text-sky-700 rounded text-xs font-medium hover:bg-sky-100 transition-colors flex items-center space-x-1"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>View</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
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
                    selectedResident.paymentStatus === 'paid' || 
                    (selectedResident.hasCurrentMonthPayment && selectedResident.currentMonthPaymentStatus === 'paid')
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedResident.paymentStatus === 'paid' || 
                     (selectedResident.hasCurrentMonthPayment && selectedResident.currentMonthPaymentStatus === 'paid') 
                      ? 'Paid' : 'Pending'}
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
                {(selectedResident.paymentStatus !== 'paid' && 
                  (!selectedResident.hasCurrentMonthPayment || selectedResident.currentMonthPaymentStatus === 'pending')) && (
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
                {(selectedResident.paymentStatus === 'paid' || 
                   (selectedResident.hasCurrentMonthPayment && selectedResident.currentMonthPaymentStatus === 'paid')) ? (
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