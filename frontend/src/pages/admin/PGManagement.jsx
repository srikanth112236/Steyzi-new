import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Building2, Plus, Edit, Trash2, Users, Bed, DollarSign, MapPin, Upload, Home, Calendar, Star, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import BulkUploadModal from '../../components/admin/BulkUploadModal';
import FloorModal from '../../components/admin/FloorModal';
import RoomModal from '../../components/admin/RoomModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { selectSelectedBranch } from '../../store/slices/branch.slice';
import { useSubscriptionManager } from '../../hooks/useSubscriptionManager';
import BedLimitExceededModal from '../../components/common/BedLimitExceededModal';
import FreeTrialModal from '../../components/common/FreeTrialModal';

const PGManagement = () => {
  const [activeTab, setActiveTab] = useState('floors');
  const selectedBranch = useSelector(selectSelectedBranch);

  // Subscription management
  const {
    subscription,
    canAddBed,
    getRemainingResources,
    getSubscriptionSummary
  } = useSubscriptionManager();

  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRoomPreview, setShowRoomPreview] = useState(false);
  const [previewRoom, setPreviewRoom] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editingFloor, setEditingFloor] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [sharingTypes, setSharingTypes] = useState([]);

  // Subscription modals
  const [showBedLimitModal, setShowBedLimitModal] = useState(false);
  const [showFreeTrialModal, setShowFreeTrialModal] = useState(false);
  const [requestedBeds, setRequestedBeds] = useState(0);
  const [subscriptionErrorDetails, setSubscriptionErrorDetails] = useState(null);

  const [floorFormData, setFloorFormData] = useState({
    name: '',
    totalRooms: 1
  });

  const [roomFormData, setRoomFormData] = useState({
    floorId: '',
    roomNumber: '',
    numberOfBeds: 1,
    sharingType: '1-sharing',
    cost: 0,
    bedNumbers: [] // Array to store custom bed numbers
  });

  useEffect(() => {
    fetchSharingTypes();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchFloors();
      fetchRooms();
    }
  }, [selectedBranch]);

  const fetchSharingTypes = async () => {
    try {
      const response = await fetch('/api/pg/sharing-types', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSharingTypes(data.data);
      }
    } catch (error) {
      console.error('Error fetching sharing types:', error);
    }
  };

  const fetchFloors = async () => {
    if (!selectedBranch) return;
    
    try {
      const url = `/api/pg/floors?branchId=${selectedBranch._id}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setFloors(data.data);
      } else {
        if (data.message?.includes('No PG associated with this user')) {
          toast.error('Please complete your PG setup first. Contact superadmin to assign a PG.');
        } else if (data.message?.includes('No default branch found')) {
          toast.error('Please set up a default branch for your PG first.');
        } else if (data.message?.includes('Invalid branch ID')) {
          toast.error('Selected branch is invalid. Please select a different branch.');
        } else {
          toast.error(data.message || 'Failed to fetch floors');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching floors:', error);
      toast.error('Failed to fetch floors');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    if (!selectedBranch) return;
    
    try {
      const url = `/api/pg/rooms?branchId=${selectedBranch._id}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setRooms(data.data);
      } else {
        if (data.message?.includes('No PG associated with this user')) {
          toast.error('Please complete your PG setup first. Contact superadmin to assign a PG.');
        } else if (data.message?.includes('No default branch found')) {
          toast.error('Please set up a default branch for your PG first.');
        } else if (data.message?.includes('Invalid branch ID')) {
          toast.error('Selected branch is invalid. Please select a different branch.');
        } else {
          toast.error(data.message || 'Failed to fetch rooms');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching rooms:', error);
      toast.error('Failed to fetch rooms');
    }
  };

  const handleFloorSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingFloor 
        ? `/api/pg/floors/${editingFloor._id}`
        : '/api/pg/floors';
      
      const method = editingFloor ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...floorFormData,
          branchId: selectedBranch._id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(editingFloor ? 'Floor updated successfully' : 'Floor created successfully');
        setShowFloorModal(false);
        setEditingFloor(null);
        setFloorFormData({ name: '', totalRooms: 1 });
        fetchFloors();
      } else {
        toast.error(data.message || 'Failed to save floor');
      }
    } catch (error) {
      console.error('Error saving floor:', error);
      toast.error('Failed to save floor');
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();

    // Check subscription limits before creating room
    const bedsToAdd = roomFormData.numberOfBeds;
    const subscriptionSummary = getSubscriptionSummary();

    console.log('🎯 Checking bed limits:', {
      bedsToAdd,
      subscription: subscriptionSummary,
      canAddBed: canAddBed(bedsToAdd)
    });

    // Check if this would exceed subscription limits
    if (!canAddBed(bedsToAdd)) {
      setRequestedBeds(bedsToAdd);

      // For free trial users, show free trial modal
      if (subscriptionSummary?.billingCycle === 'trial') {
        setShowFreeTrialModal(true);
      } else {
        // For paid users who exceeded limits, show upgrade modal
        setShowBedLimitModal(true);
      }
      return;
    }

    try {
      const url = editingRoom 
        ? `/api/pg/rooms/${editingRoom._id}`
        : '/api/pg/rooms';
      
      const method = editingRoom ? 'PUT' : 'POST';
      
      // Prepare room data with bed numbers
      const roomData = {
        ...roomFormData,
        branchId: selectedBranch._id,
        bedNumbers: roomFormData.bedNumbers.filter(bed => bed.trim() !== '') // Only send non-empty bed numbers
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roomData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(editingRoom ? 'Room updated successfully' : 'Room created successfully');
        setShowRoomModal(false);
        setEditingRoom(null);
        setRoomFormData({
          floorId: '',
          roomNumber: '',
          numberOfBeds: 1,
          sharingType: '1-sharing',
          cost: 0,
          bedNumbers: []
        });
        fetchRooms();
      } else {
        // Handle subscription errors
        if (data.subscriptionError) {
          setRequestedBeds(roomFormData.numberOfBeds);

          if (data.upgradeRequired) {
            if (subscriptionSummary?.billingCycle === 'trial') {
              setShowFreeTrialModal(true);
            } else {
              setShowBedLimitModal(true);
            }
          } else {
            toast.error(data.message || 'Failed to save room');
          }
        } else {
          toast.error(data.message || 'Failed to save room');
        }
      }
    } catch (error) {
      console.error('Error saving room:', error);
      toast.error('Failed to save room');
    }
  };

  const handleFloorEdit = (floor) => {
    setEditingFloor(floor);
    setFloorFormData({
      name: floor.name,
      totalRooms: floor.totalRooms
    });
    setShowFloorModal(true);
  };

  const handleRoomEdit = (room) => {
    setEditingRoom(room);
    setRoomFormData({
      floorId: typeof room.floorId === 'string' ? room.floorId : (room.floorId?._id || ''),
      roomNumber: room.roomNumber,
      numberOfBeds: room.numberOfBeds,
      sharingType: room.sharingType,
      cost: room.cost,
      bedNumbers: room.beds?.map(bed => bed.bedNumber) || []
    });
    setShowRoomModal(true);
  };

  // Handle bed number changes
  const handleBedNumberChange = (index, value) => {
    const newBedNumbers = [...roomFormData.bedNumbers];
    newBedNumbers[index] = value;
    setRoomFormData({ ...roomFormData, bedNumbers: newBedNumbers });
  };

  // Update bed numbers when numberOfBeds changes
  const handleNumberOfBedsChange = (value) => {
    const newNumberOfBeds = parseInt(value);
    setRoomFormData({
      ...roomFormData,
      numberOfBeds: newNumberOfBeds,
      bedNumbers: roomFormData.bedNumbers.slice(0, newNumberOfBeds)
    });
  };

  // Subscription modal handlers
  const handleBedLimitModalClose = () => {
    setShowBedLimitModal(false);
    setRequestedBeds(0);
  };

  const handleFreeTrialModalClose = () => {
    setShowFreeTrialModal(false);
    setRequestedBeds(0);
  };

  const handleTrialActivated = () => {
    setShowFreeTrialModal(false);
    setRequestedBeds(0);
    // Refresh subscription data
    window.location.reload();
  };

  const handleTopUpConfirm = async (topUpData) => {
    try {
      // Handle bed top-up logic here
      toast.success('Bed top-up request submitted successfully');
      setShowBedLimitModal(false);
      setRequestedBeds(0);
    } catch (error) {
      toast.error('Failed to process bed top-up request');
    }
  };

  const handleFloorDelete = async (floorId) => {
    setConfirmAction(() => async () => {
      try {
        const response = await fetch(`/api/pg/floors/${floorId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success('Floor deleted successfully');
          fetchFloors();
        } else {
          toast.error(data.message || 'Failed to delete floor');
        }
      } catch (error) {
        console.error('Error deleting floor:', error);
        toast.error('Failed to delete floor');
      }
    });
    setShowConfirmDialog(true);
  };

  const handleRoomDelete = async (roomId) => {
    setConfirmAction(() => async () => {
      try {
        const response = await fetch(`/api/pg/rooms/${roomId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success('Room deleted successfully');
          fetchRooms();
        } else {
          toast.error(data.message || 'Failed to delete room');
        }
      } catch (error) {
        console.error('Error deleting room:', error);
        toast.error('Failed to delete room');
      }
    });
    setShowConfirmDialog(true);
  };

  const handleBulkUploadSuccess = (result) => {
    // Handle subscription errors from bulk upload
    if (result && result.subscriptionError) {
      // Set detailed subscription error info for modals
      setSubscriptionErrorDetails({
        message: result.message,
        trialExpired: result.trialExpired,
        trialLimit: result.trialLimit,
        paidLimit: result.paidLimit,
        currentUsage: result.currentUsage,
        limit: result.limit,
        remaining: result.remaining,
        requested: result.requested,
        bulkUploadLimit: result.bulkUploadLimit
      });

      if (result.upgradeRequired) {
        if (result.freeLimit) {
          // Free users hitting their limit - show upgrade modal
          setShowBedLimitModal(true);
        } else if (result.trialExpired || result.trialLimit || subscriptionSummary?.billingCycle === 'trial') {
          setShowFreeTrialModal(true);
        } else {
          setShowBedLimitModal(true);
        }
      }
      return;
    }

    // Refresh data after successful upload
    if (activeTab === 'floors') {
      fetchFloors();
    } else {
      fetchRooms();
    }
  };

  const handleSharingTypeChange = (sharingType) => {
    const selectedType = sharingTypes.find(type => type.id === sharingType);
    
    // Automatically set number of beds based on sharing type
    let numberOfBeds = 1;
    if (sharingType === '1-sharing') numberOfBeds = 1;
    else if (sharingType === '2-sharing') numberOfBeds = 2;
    else if (sharingType === '3-sharing') numberOfBeds = 3;
    else if (sharingType === '4-sharing') numberOfBeds = 4;
    
    // Auto-generate bed numbers based on room number
    const autoBedNumbers = generateBedNumbers(roomFormData.roomNumber, numberOfBeds);
    
    setRoomFormData(prev => ({
      ...prev,
      sharingType,
      numberOfBeds,
      cost: selectedType ? selectedType.cost : 0,
      bedNumbers: autoBedNumbers
    }));
  };

  // Function to generate bed numbers based on room number
  const generateBedNumbers = (roomNumber, numberOfBeds) => {
    if (!roomNumber) return [];
    
    const bedNumbers = [];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    
    for (let i = 0; i < numberOfBeds; i++) {
      bedNumbers.push(`${roomNumber}-${letters[i]}`);
    }
    
    return bedNumbers;
  };

  // Auto-fill bed numbers when room number changes
  const handleRoomNumberChange = (roomNumber) => {
    const autoBedNumbers = generateBedNumbers(roomFormData.numberOfBeds ? roomFormData.roomNumber : roomNumber, roomFormData.numberOfBeds);
    
    setRoomFormData(prev => ({
      ...prev,
      roomNumber,
      bedNumbers: autoBedNumbers
    }));
  };

  if (!selectedBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto p-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Select a Branch</h2>
            <p className="text-gray-600 mb-1 text-sm">Please use the branch selector in the header.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-2">
        {/* Compact Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PG Management
                </h1>
                <p className="text-gray-600 text-sm flex items-center">
                  <Home className="h-3 w-3 mr-1" />
                  Managing {selectedBranch.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Branch Info Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -translate-y-12 translate-x-12 opacity-50"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">{selectedBranch.name}</h2>
                  <p className="text-gray-600 text-sm flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {selectedBranch.address.street}, {selectedBranch.address.city}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mb-1">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{selectedBranch.capacity.totalRooms}</p>
                  <p className="text-xs text-gray-500">Rooms</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mb-1">
                    <Bed className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{selectedBranch.capacity.totalBeds}</p>
                  <p className="text-xs text-gray-500">Beds</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mb-1">
                    <Star className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{selectedBranch.status}</p>
                  <p className="text-xs text-gray-500">Status</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Tabs */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <nav className="flex space-x-1 px-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('floors')}
                className={`flex items-center space-x-2 py-3 px-4 rounded-t-lg font-medium text-sm transition-all duration-300 ${
                  activeTab === 'floors'
                    ? 'bg-white text-blue-600 shadow-md border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>Floors ({floors.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('rooms')}
                className={`flex items-center space-x-2 py-3 px-4 rounded-t-lg font-medium text-sm transition-all duration-300 ${
                  activeTab === 'rooms'
                    ? 'bg-white text-blue-600 shadow-md border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Bed className="h-4 w-4" />
                <span>Rooms ({rooms.length})</span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'floors' ? (
              <div className="space-y-6">
                {/* Compact Floors Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Floors</h3>
                    <p className="text-gray-600 text-sm flex items-center">
                      <Building2 className="h-3 w-3 mr-1" />
                      Manage floors in {selectedBranch.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowBulkUploadModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Import</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowFloorModal(true);
                        setEditingFloor(null);
                        setFloorFormData({ name: '', totalRooms: 1 });
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Floor</span>
                    </button>
                  </div>
                </div>

                {/* Compact Floors List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {floors.map((floor) => (
                    <div key={floor._id} className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-white" />
                          </div>
                          <h4 className="font-bold text-gray-900">{floor.name}</h4>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() => handleFloorEdit(floor)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200 hover:scale-110"
                            title="Edit floor"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleFloorDelete(floor._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-all duration-200 hover:scale-110"
                            title="Delete floor"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-xs font-medium text-gray-600">Total Rooms</span>
                          <span className="text-sm font-bold text-blue-600">{floor.totalRooms}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Created
                          </span>
                          <span>{new Date(floor.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Compact Rooms Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Rooms</h3>
                    <p className="text-gray-600 text-sm flex items-center">
                      <Bed className="h-3 w-3 mr-1" />
                      Manage rooms in {selectedBranch.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a
                      href="/admin/room-availability"
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
                    >
                      <Eye className="h-3 w-3" />
                      <span>View Availability</span>
                    </a>
                    <button
                      onClick={() => setShowBulkUploadModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Import</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowRoomModal(true);
                        setEditingRoom(null);
                        setRoomFormData({
                          floorId: '',
                          roomNumber: '',
                          numberOfBeds: 1,
                          sharingType: '1-sharing',
                          cost: 0,
                          bedNumbers: []
                        });
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Room</span>
                    </button>
                  </div>
                </div>

                {/* Compact Rooms List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {rooms.map((room) => (
                    <div key={room._id} className="group bg-white border border-gray-200 rounded-xl p-3 hover:shadow-lg hover:border-cyan-300 transition-all duration-300 transform hover:-translate-y-1">
                      {/* Compact Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Bed className="h-3.5 w-3.5 text-white" />
                          </div>
                          <h4 className="font-bold text-gray-900 text-sm">Room {room.roomNumber}</h4>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() => {
                              setPreviewRoom(room);
                              setShowRoomPreview(true);
                            }}
                            className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-md transition-all duration-200 hover:scale-110"
                            title="Preview room"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleRoomEdit(room)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200 hover:scale-110"
                            title="Edit room"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleRoomDelete(room._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-all duration-200 hover:scale-110"
                            title="Delete room"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Pill Stats Row */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          {room.floorId?.name || 'N/A'}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-cyan-100 text-cyan-700 rounded-full">
                          {room.numberOfBeds} Beds
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                          {room.sharingType}
                        </span>
                        <span className="px-2 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full">
                          ₹{room.cost}
                        </span>
                      </div>
                      
                      {/* Bed Numbers */}
                      {room.beds && room.beds.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs text-gray-500 mb-1">Bed Numbers</div>
                          <div className="text-xs text-gray-700 bg-blue-50 px-2 py-1 rounded-md">
                            {room.beds.map(bed => bed.bedNumber).join(', ')}
                          </div>
                        </div>
                      )}
                      
                      {/* Status Row */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Status</span>
                        <div className="flex items-center space-x-1">
                          {room.availableBeds > 0 && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                              {room.availableBeds} Available
                            </span>
                          )}
                          {room.occupiedBeds > 0 && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                              {room.occupiedBeds} Occupied
                            </span>
                          )}
                          {room.noticePeriodBeds > 0 && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                              {room.noticePeriodBeds} Notice
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floor Modal */}
      <FloorModal
        isOpen={showFloorModal}
        onClose={() => {
          setShowFloorModal(false);
          setEditingFloor(null);
          setFloorFormData({ name: '', totalRooms: 1 });
        }}
        onSubmit={handleFloorSubmit}
        formData={floorFormData}
        setFormData={setFloorFormData}
        isEdit={!!editingFloor}
      />

      {/* Room Modal */}
      <RoomModal
        isOpen={showRoomModal}
        onClose={() => {
          setShowRoomModal(false);
          setEditingRoom(null);
          setRoomFormData({
            floorId: '',
            roomNumber: '',
            numberOfBeds: 1,
            sharingType: '1-sharing',
            cost: 0,
            bedNumbers: []
          });
        }}
        onSubmit={handleRoomSubmit}
        formData={roomFormData}
        setFormData={setRoomFormData}
        isEdit={!!editingRoom}
        floors={floors}
        sharingTypes={sharingTypes}
        handleSharingTypeChange={handleSharingTypeChange}
        handleRoomNumberChange={handleRoomNumberChange}
        handleNumberOfBedsChange={handleNumberOfBedsChange}
        handleBedNumberChange={handleBedNumberChange}
        generateBedNumbers={generateBedNumbers}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        selectedBranch={selectedBranch}
        onSuccess={handleBulkUploadSuccess}
      />

      {/* Room Preview Modal */}
      {showRoomPreview && previewRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto transform transition-all duration-300 scale-100">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Bed className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Room {previewRoom.roomNumber}</h3>
                  <p className="text-sm text-gray-600">Room Details Preview</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRoomPreview(false);
                  setPreviewRoom(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200 hover:scale-110"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="p-4 space-y-4">
              {/* Key Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">Floor</div>
                  <div className="text-sm font-semibold text-gray-900">{previewRoom.floorId?.name || 'N/A'}</div>
                </div>
                <div className="p-3 bg-cyan-50 rounded-xl">
                  <div className="text-xs text-cyan-600 mb-1">Beds</div>
                  <div className="text-sm font-semibold text-cyan-900">{previewRoom.numberOfBeds}</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <div className="text-xs text-purple-600 mb-1">Sharing</div>
                  <div className="text-sm font-semibold text-purple-900">{previewRoom.sharingType}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <div className="text-xs text-emerald-600 mb-1">Cost</div>
                  <div className="text-sm font-bold text-emerald-900">₹{previewRoom.cost}</div>
                </div>
              </div>

              {/* Bed Numbers */}
              {previewRoom.beds && previewRoom.beds.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-xl">
                  <div className="text-xs text-blue-600 mb-2">Bed Numbers</div>
                  <div className="text-sm text-blue-800">{previewRoom.beds.map(bed => bed.bedNumber).join(', ')}</div>
                </div>
              )}

              {/* Status */}
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-500 mb-2">Current Status</div>
                <div className="flex flex-wrap gap-2">
                  {previewRoom.availableBeds > 0 && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                      {previewRoom.availableBeds} Available
                    </span>
                  )}
                  {previewRoom.occupiedBeds > 0 && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {previewRoom.occupiedBeds} Occupied
                    </span>
                  )}
                  {previewRoom.noticePeriodBeds > 0 && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                      {previewRoom.noticePeriodBeds} Notice
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Actions */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowRoomPreview(false);
                  setPreviewRoom(null);
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowRoomPreview(false);
                  setPreviewRoom(null);
                  handleRoomEdit(previewRoom);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
              >
                <Edit className="h-3 w-3" />
                <span>Edit Room</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setConfirmAction(null);
        }}
        onConfirm={confirmAction}
        title="Confirm Delete"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Subscription Modals */}
      <BedLimitExceededModal
        isOpen={showBedLimitModal}
        onClose={handleBedLimitModalClose}
        requestedBeds={requestedBeds}
        currentBedsUsed={subscriptionErrorDetails?.currentUsage || subscription?.usage?.bedsUsed || 0}
        subscriptionErrorDetails={subscriptionErrorDetails}
        onTopUpConfirm={handleTopUpConfirm}
        onUpgrade={() => {
          // Navigate to subscription upgrade page
          toast.success('Navigate to subscription upgrade page');
          handleBedLimitModalClose();
        }}
      />

      <FreeTrialModal
        isOpen={showFreeTrialModal}
        onClose={handleFreeTrialModalClose}
        subscriptionErrorDetails={subscriptionErrorDetails}
        onTrialActivated={handleTrialActivated}
      />
    </div>
  );
};

export default PGManagement; 