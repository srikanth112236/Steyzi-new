import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Building2, 
  User, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  Bed,
  LogOut,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Home,
  CalendarDays,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { api } from '../../services/auth.service';
import { selectSelectedBranch } from '../../store/slices/branch.slice';

const ResidentOffboarding = () => {
  const { user } = useSelector((state) => state.auth);
  const selectedBranch = useSelector(selectSelectedBranch);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [allocatedResidents, setAllocatedResidents] = useState([]);
  const [selectedResident, setSelectedResident] = useState(null);
  const [residentDetails, setResidentDetails] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [vacationType, setVacationType] = useState('');
  const [noticeDays, setNoticeDays] = useState(30);
  const [vacationDate, setVacationDate] = useState('');
  const [overdueVacations, setOverdueVacations] = useState([]);
  const [processingVacations, setProcessingVacations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    if (!selectedBranch) return;
    fetchAllocatedResidents();
    fetchOverdueVacations();
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedResident) {
      fetchResidentDetails();
    }
  }, [selectedResident]);

  useEffect(() => {
    if (vacationType === 'notice' && noticeDays > 0) {
      const date = new Date();
      date.setDate(date.getDate() + noticeDays);
      setVacationDate(date.toISOString().split('T')[0]);
    }
  }, [vacationType, noticeDays]);

  const fetchAllocatedResidents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedBranch?._id) params.append('branchId', selectedBranch._id);
      const response = await api.get(`/residents?${params.toString()}`);
      
      if (response.data.success) {
        const allocatedResidents = (response.data.data.residents || []).filter(
          resident => resident.roomId && resident.bedNumber
        );
        setAllocatedResidents(allocatedResidents);
      } else {
        toast.error(response.data.message || 'Failed to fetch residents');
      }
    } catch (error) {
      console.error('Error fetching residents:', error);
      toast.error('Failed to fetch residents');
    } finally {
      setLoading(false);
    }
  };

  const fetchResidentDetails = async () => {
    if (!selectedResident) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/residents/${selectedResident._id}/details`);
      
      if (response.data.success) {
        const details = response.data.data;
        setResidentDetails(details);
        setPaymentDetails(details.paymentSummary || null);
        console.log('Payment details:', details.paymentSummary);
      } else {
        toast.error(response.data.message || 'Failed to fetch resident details');
      }
    } catch (error) {
      console.error('Error fetching resident details:', error);
      toast.error('Failed to fetch resident details');
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdueVacations = async () => {
    try {
      const response = await api.get('/residents/overdue-vacations');
      if (response.data.success) {
        setOverdueVacations(response.data.data.overdueResidents || []);
      }
    } catch (error) {
      console.error('Error fetching overdue vacations:', error);
    }
  };

  const handleProcessVacations = async () => {
    try {
      setProcessingVacations(true);
      const response = await api.post('/residents/process-vacations');
      
      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh the lists
        fetchAllocatedResidents();
        fetchOverdueVacations();
      } else {
        toast.error(response.data.message || 'Failed to process vacations');
      }
    } catch (error) {
      console.error('Error processing vacations:', error);
      toast.error('Failed to process vacations');
    } finally {
      setProcessingVacations(false);
    }
  };

  const filteredResidents = allocatedResidents.filter(resident => {
    const searchLower = searchTerm.toLowerCase();
    return (
      resident.firstName?.toLowerCase().includes(searchLower) ||
      resident.lastName?.toLowerCase().includes(searchLower) ||
      resident.phone?.includes(searchTerm) ||
      resident.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleResidentSelect = (resident) => {
    setSelectedResident(resident);
    setCurrentStep(2);
  };

  const handlePaymentReviewComplete = () => {
    setCurrentStep(3);
  };

  const handleVacationTypeSelect = (type) => {
    setVacationType(type);
    setCurrentStep(4);
  };

  const handleVacateResident = async () => {
    if (!selectedResident || !vacationType) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (vacationType === 'notice') {
      if (!noticeDays || noticeDays < 1 || noticeDays > 30) {
        toast.error('Please enter a valid notice period (1-30 days)');
        return;
      }
      if (!vacationDate) {
        toast.error('Please select vacation date');
        return;
      }
    }

    try {
      setLoading(true);
      
      const vacationData = {
        vacationType,
        ...(vacationType === 'notice' && {
          noticeDays,
          vacationDate
        })
      };

      const response = await api.post(`/residents/${selectedResident._id}/vacate`, vacationData);

      if (response.data.success) {
        const message = vacationType === 'immediate' 
          ? 'Resident vacated immediately! Room and bed are now available.' 
          : `Resident will be vacated on ${vacationDate} (${noticeDays} days notice). Room and bed will be available after that date.`;
        
        toast.success(message);
        
        // Reset form
        setSelectedResident(null);
        setResidentDetails(null);
        setPaymentDetails(null);
        setVacationType('');
        setNoticeDays(30);
        setVacationDate('');
        setCurrentStep(1);
        
        // Refresh the list
        fetchAllocatedResidents();
      } else {
        toast.error(response.data.message || 'Failed to vacate resident');
      }
    } catch (error) {
      console.error('Error vacating resident:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.message === 'Resident is not assigned to any room') {
          toast.error('This resident is not assigned to any room');
        } else if (errorData.message.includes('Notice days')) {
          toast.error('Invalid notice period. Please enter 1-30 days.');
        } else {
          toast.error(errorData.message || 'Failed to vacate resident');
        }
      } else {
        toast.error('Failed to vacate resident');
      }
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      
      if (currentStep === 4) {
        setVacationType('');
        setNoticeDays(30);
        setVacationDate('');
      } else if (currentStep === 3) {
        // Going back from vacation type to review details
      } else if (currentStep === 2) {
        setSelectedResident(null);
        setResidentDetails(null);
        setPaymentDetails(null);
      }
    }
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Compact Header Section */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center mr-3 shadow-md">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Select Resident</h2>
            <p className="text-gray-600 text-xs">
              Choose a resident to offboard from their room
            </p>
          </div>
        </div>
      </div>

      {/* Compact Search Bar */}
      <div className="relative max-w-sm mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-100 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
        />
      </div>

      {/* Compact Residents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
        {loading ? (
          <div className="col-span-full text-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading residents...</p>
          </div>
        ) : filteredResidents.length === 0 ? (
          <div className="col-span-full text-center py-6">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2 shadow-md">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No allocated residents found</h3>
            <p className="text-gray-600 text-xs">
              All residents are currently unassigned
            </p>
          </div>
        ) : (
          filteredResidents.map((resident) => (
            <motion.div
              key={resident._id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="p-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 hover:border-red-300 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => handleResidentSelect(resident)}
            >
              <div className="text-center">
                {/* Compact Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center mx-auto mb-2 shadow-md">
                  <User className="h-5 w-5 text-white" />
                </div>
                
                {/* Compact Name */}
                <h3 className="font-bold text-gray-900 mb-2 text-sm">
                  {resident.firstName} {resident.lastName}
                </h3>
                
                {/* Compact Status Badge */}
                <div className="mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    resident.status === 'active'
                      ? 'bg-green-100 text-green-600'
                      : resident.status === 'notice_period'
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {resident.status === 'active' && (
                      <>
                        <CheckCircle className="h-3 w-3 inline mr-1" />
                        Active
                      </>
                    )}
                    {resident.status === 'notice_period' && (
                      <>
                        <Clock className="h-3 w-3 inline mr-1" />
                        Notice Period
                      </>
                    )}
                    {resident.status === 'inactive' && (
                      <>
                        <XCircle className="h-3 w-3 inline mr-1" />
                        Vacated
                      </>
                    )}
                  </span>
                </div>
                
                {/* Compact Contact Info */}
                <div className="space-y-1 mb-2">
                  {resident.phone && (
                    <div className="flex items-center justify-center space-x-1 text-xs text-gray-600 bg-white/80 rounded-lg p-1.5">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="truncate font-medium">{resident.phone}</span>
                    </div>
                  )}
                  {resident.email && (
                    <div className="flex items-center justify-center space-x-1 text-xs text-gray-600 bg-white/80 rounded-lg p-1.5">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="truncate font-medium">{resident.email}</span>
                    </div>
                  )}
                </div>

                {/* Compact Room Assignment Info */}
                {resident.roomNumber && (
                  <div className="p-2 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-center space-x-1">
                      <Building2 className="h-3 w-3 text-red-600" />
                      <span className="text-xs font-medium text-red-800">
                        Room {resident.roomNumber} • Bed {resident.bedNumber || 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Compact Selection Indicator */}
                <div className="mt-2 flex items-center justify-center">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg text-xs font-semibold">
                    <span>Select</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Compact Header Section */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mr-3 shadow-md">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Payment Status</h2>
            <p className="text-gray-600 text-xs">
              Review payment and deposit information before proceeding
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading payment details...</p>
        </div>
      ) : paymentDetails ? (
        <div className="space-y-4">
          {/* Current Month Payment Status */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Current Month Payment</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Month/Year</p>
                    <p className="text-sm font-bold text-gray-900">
                      {paymentDetails.currentMonth.month} {paymentDetails.currentMonth.year}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      paymentDetails.currentMonth.isPaid
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {paymentDetails.currentMonth.isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-sm font-bold text-gray-900">₹{paymentDetails.currentMonth.amount}</p>
                  </div>
                  {paymentDetails.currentMonth.isPaid && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Paid on</p>
                      <p className="text-xs font-medium text-gray-700">
                        {new Date(paymentDetails.currentMonth.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Advance/Security Deposit Status */}
          <div className="bg-gradient-to-r from-blue-50 to-sky-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Advance & Security Deposit</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Advance Payment</p>
                    <p className="text-sm font-bold text-gray-900">₹{paymentDetails.advancePayment.amount}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      paymentDetails.advancePayment.status === 'paid'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {paymentDetails.advancePayment.status === 'paid' ? 'Collected' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Security Deposit</p>
                    <p className="text-sm font-bold text-gray-900">₹{paymentDetails.securityDeposit.amount}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      paymentDetails.securityDeposit.status === 'collected'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {paymentDetails.securityDeposit.status === 'collected' ? 'Collected' : 'Pending'}
                    </span>
                  </div>
                </div>
                {paymentDetails.securityDeposit.refundable && (
                  <p className="text-xs text-blue-600 mt-1">⚡ Refundable on checkout</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Payment Summary</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-white rounded-lg p-2 border border-purple-200 text-center">
                <p className="text-xs text-gray-500">Total Paid</p>
                <p className="text-sm font-bold text-gray-900">₹{paymentDetails.totalPaid}</p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-purple-200 text-center">
                <p className="text-xs text-gray-500">Months Paid</p>
                <p className="text-sm font-bold text-gray-900">{paymentDetails.totalMonths}</p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-purple-200 text-center">
                <p className="text-xs text-gray-500">Average Rent</p>
                <p className="text-sm font-bold text-gray-900">₹{paymentDetails.averageAmount}</p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-purple-200 text-center">
                <p className="text-xs text-gray-500">Pending Amount</p>
                <p className={`text-sm font-bold ${paymentDetails.pendingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{paymentDetails.pendingAmount}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Payment History */}
          {paymentDetails.recentPayments && paymentDetails.recentPayments.length > 0 && (
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-gray-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Recent Payments</h3>
              </div>
              
              <div className="space-y-2">
                {paymentDetails.recentPayments.map((payment, index) => (
                  <div key={index} className="bg-white rounded-lg p-2 border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-900">
                        {payment.month} {payment.year}
                      </p>
                      <p className="text-xs text-gray-500">
                        Paid on {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">₹{payment.amount}</p>
                      <p className="text-xs text-gray-500 capitalize">{payment.paymentMethod}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2">
            <DollarSign className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No payment information found</h3>
          <p className="text-gray-600 text-xs">Payment details are not available for this resident</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-3">
        <button
          onClick={goBack}
          className="flex items-center px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </button>
        
        <button
          onClick={handlePaymentReviewComplete}
          className="flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors text-sm"
        >
          Continue to Review Details
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Compact Header Section */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center mr-3 shadow-md">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Review Details</h2>
            <p className="text-gray-600 text-xs">
              Review the selected resident's information
            </p>
          </div>
        </div>
      </div>

      {/* Compact Resident Details Card */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 p-3 rounded-xl border border-red-200">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {selectedResident?.firstName} {selectedResident?.lastName}
            </h3>
            <p className="text-xs text-gray-600">
              ID: {selectedResident?._id?.slice(-8)}
            </p>
          </div>
          <div className="ml-auto">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              selectedResident?.status === 'active'
                ? 'bg-green-100 text-green-600'
                : selectedResident?.status === 'notice_period'
                ? 'bg-orange-100 text-orange-600'
                : 'bg-red-100 text-red-600'
            }`}>
              {selectedResident?.status === 'active' && (
                <>
                  <CheckCircle className="h-3 w-3 inline mr-1" />
                  Active
                </>
              )}
              {selectedResident?.status === 'notice_period' && (
                <>
                  <Clock className="h-3 w-3 inline mr-1" />
                  Notice Period
                </>
              )}
              {selectedResident?.status === 'inactive' && (
                <>
                  <XCircle className="h-3 w-3 inline mr-1" />
                  Vacated
                </>
              )}
            </span>
          </div>
        </div>

        {/* Compact Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          <div className="flex items-center space-x-1.5 p-1.5 bg-white rounded-lg">
            <Phone className="h-3 w-3 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-xs font-medium text-gray-900">{selectedResident?.phone}</p>
            </div>
          </div>
          {selectedResident?.email && (
            <div className="flex items-center space-x-1.5 p-1.5 bg-white rounded-lg">
              <Mail className="h-3 w-3 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-xs font-medium text-gray-900">{selectedResident.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Compact Room Assignment Details */}
        <div className="bg-white rounded-lg p-2 border border-red-200">
          <div className="flex items-center space-x-1.5 mb-2">
            <Building2 className="h-3 w-3 text-red-600" />
            <h4 className="font-semibold text-gray-900 text-xs">Current Assignment</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
            <div className="flex items-center space-x-1.5">
              <Home className="h-3 w-3 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Room</p>
                <p className="text-xs font-medium text-gray-900">Room {selectedResident?.roomNumber}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <Bed className="h-3 w-3 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Bed</p>
                <p className="text-xs font-medium text-gray-900">Bed {selectedResident?.bedNumber}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <CalendarDays className="h-3 w-3 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Check-in Date</p>
                <p className="text-xs font-medium text-gray-900">
                  {selectedResident?.checkInDate ? new Date(selectedResident.checkInDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Compact Status-specific information */}
          {selectedResident?.status === 'notice_period' && selectedResident?.vacationDate && (
            <div className="mt-2 p-1.5 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-1.5">
                <Clock className="h-3 w-3 text-orange-600" />
                <div>
                  <p className="text-xs text-orange-700 font-medium">Notice Period Active</p>
                  <p className="text-xs text-orange-600">
                    Vacating on {new Date(selectedResident.vacationDate).toLocaleDateString()} 
                    ({selectedResident.noticeDays} days notice)
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedResident?.status === 'inactive' && selectedResident?.checkOutDate && (
            <div className="mt-2 p-1.5 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-1.5">
                <LogOut className="h-3 w-3 text-red-600" />
                <div>
                  <p className="text-xs text-red-700 font-medium">Already Vacated</p>
                  <p className="text-xs text-red-600">
                    Vacated on {new Date(selectedResident.checkOutDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Summary in Review */}
        {paymentDetails && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-3 w-3 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 text-xs">Payment Summary</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-lg p-2 border border-green-200">
                <p className="text-xs text-gray-500">Current Month</p>
                <p className={`text-xs font-bold ${paymentDetails.currentMonth.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                  {paymentDetails.currentMonth.isPaid ? 'Paid' : 'Pending'} - ₹{paymentDetails.currentMonth.amount}
                </p>
              </div>
              <div className="bg-white rounded-lg p-2 border border-green-200">
                <p className="text-xs text-gray-500">Security Deposit</p>
                <p className={`text-xs font-bold ${paymentDetails.securityDeposit.status === 'collected' ? 'text-green-600' : 'text-red-600'}`}>
                  {paymentDetails.securityDeposit.status === 'collected' ? 'Collected' : 'Pending'} - ₹{paymentDetails.securityDeposit.amount}
                </p>
              </div>
            </div>
            
            {paymentDetails.pendingAmount > 0 && (
              <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-red-700 font-medium">⚠️ Outstanding Amount: ₹{paymentDetails.pendingAmount}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compact Action Buttons */}
      <div className="flex justify-between items-center pt-3">
        <button
          onClick={goBack}
          className="flex items-center px-3 py-1.5 text-gray-600 hover:text-gray-800 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </button>
        
        <button
          onClick={() => setCurrentStep(4)}
          className="flex items-center px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-colors text-sm"
        >
          Continue to Vacation Options
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </button>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Header Section */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center mr-3">
            <LogOut className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose Vacation Type</h2>
            <p className="text-gray-600">
              Select how to vacate {selectedResident?.firstName}
            </p>
          </div>
        </div>
      </div>

      {/* Vacation Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Immediate Vacation */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            vacationType === 'immediate'
              ? 'border-sky-500 bg-gradient-to-br from-sky-50 to-blue-50 shadow-lg'
              : 'border-gray-200 bg-gradient-to-r from-sky-50 to-blue-50 hover:border-sky-300 hover:shadow-md'
          }`}
          onClick={() => handleVacationTypeSelect('immediate')}
        >
          <div className="text-center">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              vacationType === 'immediate'
                ? 'bg-sky-500 text-white'
                : 'bg-sky-100 text-sky-600'
            }`}>
              <LogOut className="h-6 w-6" />
            </div>
            
            {/* Title */}
            <h3 className="font-bold text-gray-900 mb-2">
              Immediate Vacation
            </h3>
            
            {/* Description */}
            <p className="text-sm text-gray-600 mb-3">
              Vacate the resident immediately from their room and bed. Room and bed will be available immediately for new assignments.
            </p>
            
            {/* Features */}
            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-1 text-xs text-gray-600">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Instant availability</span>
              </div>
              <div className="flex items-center justify-center space-x-1 text-xs text-gray-600">
                <Clock className="h-3 w-3 text-sky-500" />
                <span>No waiting period</span>
              </div>
            </div>
            
            {/* Selection Indicator */}
            {vacationType === 'immediate' && (
              <div className="mt-3 p-2 bg-sky-100 rounded-lg border border-sky-200">
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="h-4 w-4 text-sky-600" />
                  <span className="text-xs font-medium text-sky-700">Selected</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Notice Period Vacation */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            vacationType === 'notice'
              ? 'border-sky-500 bg-gradient-to-br from-sky-50 to-blue-50 shadow-lg'
              : 'border-gray-200 bg-gradient-to-r from-sky-50 to-blue-50 hover:border-sky-300 hover:shadow-md'
          }`}
          onClick={() => handleVacationTypeSelect('notice')}
        >
          <div className="text-center">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              vacationType === 'notice'
                ? 'bg-sky-500 text-white'
                : 'bg-sky-100 text-sky-600'
            }`}>
              <Clock className="h-6 w-6" />
            </div>
            
            {/* Title */}
            <h3 className="font-bold text-gray-900 mb-2">
              Notice Period Vacation
            </h3>
            
            {/* Description */}
            <p className="text-sm text-gray-600 mb-3">
              Schedule the vacation for a future date. Resident stays until the specified date.
            </p>
            
            {/* Features */}
            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-1 text-xs text-gray-600">
                <CalendarDays className="h-3 w-3 text-orange-500" />
                <span>Flexible scheduling</span>
              </div>
              <div className="flex items-center justify-center space-x-1 text-xs text-gray-600">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                <span>Max 30 days notice</span>
              </div>
            </div>
            
            {/* Selection Indicator */}
            {vacationType === 'notice' && (
              <div className="mt-3 p-2 bg-sky-100 rounded-lg border border-sky-200">
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="h-4 w-4 text-sky-600" />
                  <span className="text-xs font-medium text-sky-700">Selected</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Notice Period Configuration */}
      {vacationType === 'notice' && (
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-4 rounded-xl border border-sky-200">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Notice Period Configuration</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notice Period (Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={noticeDays}
                onChange={(e) => setNoticeDays(Math.min(Math.max(e.target.value, 1), 30))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-100 focus:border-sky-500 transition-all"
                placeholder="Enter days (1-30)"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum 30 days notice period</p>
            </div>
            
            {noticeDays && (
              <div className="p-3 bg-white rounded-lg border border-sky-200">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4 text-sky-600" />
                  <div>
                    <p className="text-sm font-medium text-sky-700">Vacation Date (Auto-calculated)</p>
                    <p className="text-xs text-sky-600">
                      {vacationDate ? new Date(vacationDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Calculating...'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs text-orange-700 font-medium">Automatic Process</p>
                  <p className="text-xs text-orange-600">
                    The resident will be automatically vacated on the calculated date. Room and bed will become available for new assignments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={goBack}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        
        <button
          onClick={handleVacateResident}
          disabled={loading || (vacationType === 'notice' && (!noticeDays || noticeDays < 1))}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg hover:from-sky-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-2" />
              {vacationType === 'immediate' ? 'Vacate Immediately' : 'Schedule Vacation'}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-3">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        {/* Compact Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center mr-3 shadow-lg">
              <LogOut className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-0.5">Resident Offboarding</h1>
              <p className="text-sm text-gray-600">Manage resident vacations and room assignments</p>
            </div>
          </div>
        </div>

        {/* Compact Overdue Vacations Alert */}
        {overdueVacations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-800">
                    ⚠️ Overdue Vacations Detected
                  </h3>
                  <p className="text-red-700 text-xs">
                    {overdueVacations.length} resident{overdueVacations.length !== 1 ? 's' : ''} should have been vacated
                  </p>
                </div>
              </div>
              <button
                onClick={handleProcessVacations}
                disabled={processingVacations}
                className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs"
              >
                {processingVacations ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1.5"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1.5" />
                    Process Overdue
                  </>
                )}
              </button>
            </div>
            
            {/* Compact Overdue Residents List */}
            <div className="mt-3 space-y-1.5">
              {overdueVacations.slice(0, 2).map((resident) => (
                <div key={resident._id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="font-semibold text-gray-900 text-xs">
                        {resident.firstName} {resident.lastName}
                      </p>
                      <p className="text-xs text-gray-600">
                        Room {resident.roomNumber} • Bed {resident.bedNumber} • Due: {new Date(resident.vacationDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                    {Math.ceil((new Date() - new Date(resident.vacationDate)) / (1000 * 60 * 60 * 24))} days overdue
                  </span>
                </div>
              ))}
              {overdueVacations.length > 2 && (
                <p className="text-xs text-red-600 text-center">
                  ... and {overdueVacations.length - 2} more resident{overdueVacations.length - 2 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Compact Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Step {currentStep} of 5
            </span>
            <span className="text-sm text-gray-500">
              {currentStep === 1 && 'Select Resident'}
              {currentStep === 2 && 'Payment Status'}
              {currentStep === 3 && 'Review Details'}
              {currentStep === 4 && 'Choose Vacation Type'}
              {currentStep === 5 && 'Confirm Offboarding'}
            </span>
          </div>
          
          {/* Compact Progress Steps */}
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step < currentStep
                    ? 'bg-green-500 text-white shadow-md'
                    : step === currentStep
                    ? 'bg-red-500 text-white shadow-lg scale-110'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step < currentStep ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 5 && (
                  <div className={`w-8 h-0.5 mx-1 transition-all ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          
          {/* Compact Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-red-500 to-pink-600 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Compact Main Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <AnimatePresence mode="wait">
            {renderCurrentStep()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ResidentOffboarding; 