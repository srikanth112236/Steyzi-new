import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Phone, Mail, MapPin, Building2, Calendar, Edit, 
  CreditCard, DollarSign, ArrowUpDown, FileText, Clock, 
  CheckCircle, AlertTriangle, TrendingUp, Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';

const ResidentDetails = ({ isOpen, onClose, resident, onEdit }) => {
  const [residentData, setResidentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (resident && isOpen) {
      fetchResidentDetails(resident._id);
    }
  }, [resident, isOpen]);

  const fetchResidentDetails = async (residentId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/residents/${residentId}/details`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setResidentData(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch resident details');
      }
    } catch (error) {
      console.error('Error fetching resident details:', error);
      toast.error('Failed to fetch resident details');
    } finally {
      setLoading(false);
    }
  };

  if (!resident) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      inactive: { color: 'bg-gray-100 text-gray-800', text: 'Inactive' },
      moved_out: { color: 'bg-red-100 text-red-800', text: 'Moved Out' },
      notice_period: { color: 'bg-orange-100 text-orange-800', text: 'Notice Period' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', text: 'Paid' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      overdue: { color: 'bg-red-100 text-red-800', text: 'Overdue' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'room', label: 'Room & Allocation', icon: Building2 },
    { id: 'history', label: 'Room History', icon: ArrowUpDown },
    { id: 'documents', label: 'Documents', icon: FileText }
  ];

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Basic Information
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Full Name:</span>
            <span className="text-sm text-gray-900">{resident.firstName} {resident.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Email:</span>
            <span className="text-sm text-gray-900">{resident.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Phone:</span>
            <span className="text-sm text-gray-900">{resident.phone}</span>
          </div>
          {resident.alternatePhone && (
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Alternate Phone:</span>
              <span className="text-sm text-gray-900">{resident.alternatePhone}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Date of Birth:</span>
            <span className="text-sm text-gray-900">{formatDate(resident.dateOfBirth)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Gender:</span>
            <span className="text-sm text-gray-900 capitalize">{resident.gender}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            <span>{getStatusBadge(resident.status)}</span>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Permanent Address
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Street:</span>
            <span className="text-sm text-gray-900">{resident.permanentAddress?.street}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">City:</span>
            <span className="text-sm text-gray-900">{resident.permanentAddress?.city}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">State:</span>
            <span className="text-sm text-gray-900">{resident.permanentAddress?.state}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Pincode:</span>
            <span className="text-sm text-gray-900">{resident.permanentAddress?.pincode}</span>
          </div>
        </div>
      </div>

      {/* Work Details */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Work Details
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Company:</span>
            <span className="text-sm text-gray-900">{resident.workDetails?.company}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Designation:</span>
            <span className="text-sm text-gray-900">{resident.workDetails?.designation}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Work Address:</span>
            <span className="text-sm text-gray-900">{resident.workDetails?.workAddress}</span>
          </div>
          {resident.workDetails?.workPhone && (
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Work Phone:</span>
              <span className="text-sm text-gray-900">{resident.workDetails.workPhone}</span>
            </div>
          )}
          {resident.workDetails?.workEmail && (
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Work Email:</span>
              <span className="text-sm text-gray-900">{resident.workDetails.workEmail}</span>
            </div>
          )}
          {resident.workDetails?.salary && (
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Salary:</span>
              <span className="text-sm text-gray-900">₹{resident.workDetails.salary.toLocaleString()}</span>
            </div>
          )}
          {resident.workDetails?.joiningDate && (
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Joining Date:</span>
              <span className="text-sm text-gray-900">{formatDate(resident.workDetails.joiningDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Phone className="h-5 w-5 mr-2" />
          Emergency Contact
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Name:</span>
            <span className="text-sm text-gray-900">{resident.emergencyContact?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Relationship:</span>
            <span className="text-sm text-gray-900">{resident.emergencyContact?.relationship}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Phone:</span>
            <span className="text-sm text-gray-900">{resident.emergencyContact?.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">Address:</span>
            <span className="text-sm text-gray-900">{resident.emergencyContact?.address}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(resident.advancePayment?.amount || 0)}
          </div>
          <div className="text-sm text-blue-600">Advance Payment</div>
          {resident.advancePayment?.date && (
            <div className="text-xs text-blue-500 mt-1">
              {formatDate(resident.advancePayment.date)}
            </div>
          )}
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(resident.rentPayment?.amount || 0)}
          </div>
          <div className="text-sm text-green-600">Rent Payment</div>
          {resident.rentPayment?.date && (
            <div className="text-xs text-green-500 mt-1">
              {formatDate(resident.rentPayment.date)}
            </div>
          )}
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(resident.totalAmountPaid || 0)}
          </div>
          <div className="text-sm text-purple-600">Total Paid</div>
        </div>
      </div>

      {/* Current Room & Cost */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Current Room & Cost Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Room Number:</span>
              <span className="text-sm text-gray-900">{resident.roomNumber || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Bed Number:</span>
              <span className="text-sm text-gray-900">{resident.bedNumber || 'Not assigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Sharing Type:</span>
              <span className="text-sm text-gray-900">{resident.sharingType || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Monthly Cost:</span>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(resident.cost)}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Payment Status:</span>
              <span>{getPaymentStatusBadge(resident.paymentStatus)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Last Payment:</span>
              <span className="text-sm text-gray-900">{formatDate(resident.lastPaymentDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Check-in Date:</span>
              <span className="text-sm text-gray-900">{formatDate(resident.checkInDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Contract Start:</span>
              <span className="text-sm text-gray-900">{formatDate(resident.contractStartDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Receipts */}
      {(resident.advancePayment?.receiptNumber || resident.rentPayment?.receiptNumber) && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Receipt className="h-5 w-5 mr-2" />
            Payment Receipts
          </h4>
          <div className="space-y-3">
            {resident.advancePayment?.receiptNumber && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Advance Receipt:</span>
                <span className="text-sm text-gray-900">{resident.advancePayment.receiptNumber}</span>
              </div>
            )}
            {resident.rentPayment?.receiptNumber && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Rent Receipt:</span>
                <span className="text-sm text-gray-900">{resident.rentPayment.receiptNumber}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderRoomAllocation = () => (
    <div className="space-y-6">
      {/* Current Allocation */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Current Room Allocation
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Room Number:</span>
              <span className="text-sm text-gray-900">{resident.roomNumber || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Bed Number:</span>
              <span className="text-sm text-gray-900">{resident.bedNumber || 'Not assigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Floor:</span>
              <span className="text-sm text-gray-900">{resident.roomId?.floorId?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Sharing Type:</span>
              <span className="text-sm text-gray-900">{resident.sharingType || 'N/A'}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Monthly Cost:</span>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(resident.cost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Check-in Date:</span>
              <span className="text-sm text-gray-900">{formatDate(resident.checkInDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Contract Start:</span>
              <span className="text-sm text-gray-900">{formatDate(resident.contractStartDate)}</span>
            </div>
            {resident.contractEndDate && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Contract End:</span>
                <span className="text-sm text-gray-900">{formatDate(resident.contractEndDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Important Dates */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Important Dates
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Check-in Date:</span>
              <span className="text-sm text-gray-900">{formatDate(resident.checkInDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Contract Start:</span>
              <span className="text-sm text-gray-900">{formatDate(resident.contractStartDate)}</span>
            </div>
            {resident.contractEndDate && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Contract End:</span>
                <span className="text-sm text-gray-900">{formatDate(resident.contractEndDate)}</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {resident.checkOutDate && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Check-out Date:</span>
                <span className="text-sm text-gray-900">{formatDate(resident.checkOutDate)}</span>
              </div>
            )}
            {resident.vacationDate && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Vacation Date:</span>
                <span className="text-sm text-gray-900">{formatDate(resident.vacationDate)}</span>
              </div>
            )}
            {resident.noticeDays && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Notice Period:</span>
                <span className="text-sm text-gray-900">{resident.noticeDays} days</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRoomHistory = () => (
    <div className="space-y-6">
      {/* Room Switch History */}
      {resident.switchHistory && resident.switchHistory.length > 0 ? (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ArrowUpDown className="h-5 w-5 mr-2" />
            Room Switch History
          </h4>
          <div className="space-y-4">
            {resident.switchHistory.map((switchRecord, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <ArrowUpDown className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {switchRecord.fromRoom} → {switchRecord.toRoom}
                      </h5>
                      <p className="text-sm text-gray-500">
                        Bed {switchRecord.fromBed} → Bed {switchRecord.toBed}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {formatDate(switchRecord.switchDate)}
                    </p>
                    {switchRecord.reason && (
                      <p className="text-xs text-gray-400 mt-1">
                        Reason: {switchRecord.reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <ArrowUpDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No room switch history found</p>
        </div>
      )}
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      {/* Documents */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Documents
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">ID Proof:</span>
              <span className="text-sm text-gray-900">
                {resident.documents?.idProof ? 'Uploaded' : 'Not uploaded'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Address Proof:</span>
              <span className="text-sm text-gray-900">
                {resident.documents?.addressProof ? 'Uploaded' : 'Not uploaded'}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {resident.documents?.idProof && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">ID Proof File:</span>
                <a 
                  href={resident.documents.idProof} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View Document
                </a>
              </div>
            )}
            {resident.documents?.addressProof && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Address Proof File:</span>
                <a 
                  href={resident.documents.addressProof} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View Document
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {(resident.dietaryRestrictions || resident.medicalConditions || resident.specialRequirements || resident.notes) && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h4>
          <div className="space-y-3">
            {resident.dietaryRestrictions && (
              <div>
                <span className="text-sm font-medium text-gray-600">Dietary Restrictions:</span>
                <p className="text-sm text-gray-900 mt-1">{resident.dietaryRestrictions}</p>
              </div>
            )}
            {resident.medicalConditions && (
              <div>
                <span className="text-sm font-medium text-gray-600">Medical Conditions:</span>
                <p className="text-sm text-gray-900 mt-1">{resident.medicalConditions}</p>
              </div>
            )}
            {resident.specialRequirements && (
              <div>
                <span className="text-sm font-medium text-gray-600">Special Requirements:</span>
                <p className="text-sm text-gray-900 mt-1">{resident.specialRequirements}</p>
              </div>
            )}
            {resident.notes && (
              <div>
                <span className="text-sm font-medium text-gray-600">Notes:</span>
                <p className="text-sm text-gray-900 mt-1">{resident.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'payments':
        return renderPayments();
      case 'room':
        return renderRoomAllocation();
      case 'history':
        return renderRoomHistory();
      case 'documents':
        return renderDocuments();
      default:
        return renderOverview();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Resident Details</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {resident.firstName} {resident.lastName} • {resident.email}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onEdit}
                  className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                renderTabContent()
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ResidentDetails; 