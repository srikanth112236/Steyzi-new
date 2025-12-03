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
  Star,
  Clock,
  Home,
  CreditCard,
  CalendarDays,
  CheckCircle2,
  Sparkles,
  X,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import pgService from '../../services/pg.service';
import { api } from '../../services/auth.service';
import jsPDF from 'jspdf';
import { selectSelectedBranch } from '../../store/slices/branch.slice';

const ResidentOnboarding = () => {
  const { user } = useSelector((state) => state.auth);
  const selectedBranch = useSelector(selectSelectedBranch);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Resident Selection
  const [residents, setResidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResident, setSelectedResident] = useState(null);
  const [showAllResidents, setShowAllResidents] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 8 cards per page
  
  // Step 2: Room Type Selection
  const [sharingTypes, setSharingTypes] = useState([]);
  const [selectedSharingType, setSelectedSharingType] = useState(null);
  
  // Step 3: Room Selection
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  
  // Step 4: Payment Information
  const [advancePayment, setAdvancePayment] = useState({
    amount: '',
    date: '',
    receiptNumber: ''
  });
  const [rentPayment, setRentPayment] = useState({
    amount: '',
    date: '',
    receiptNumber: ''
  });
  
  // Payment status tracking
  const [paymentStatus, setPaymentStatus] = useState({
    advance: 'pending', // 'paid', 'pending', 'not_required'
    rent: 'pending'     // 'paid', 'pending', 'not_required'
  });
  
  // Custom rent calculation modal
  const [showRentCalculationModal, setShowRentCalculationModal] = useState(false);
  const [perDayCost, setPerDayCost] = useState(0);
  const [numberOfDays, setNumberOfDays] = useState(30);
  const [calculatedRent, setCalculatedRent] = useState(0);
  
  // Fetch per day cost from payment settings (if not already loaded)
  const fetchPerDayCost = async () => {
    try {
      if (!selectedBranch) return;
      
      // If per day cost is already loaded, use it
      if (perDayCost > 0) {
        setCalculatedRent(perDayCost * numberOfDays);
        return;
      }
      
      const response = await api.get(`/payment-info/admin/${selectedBranch._id}`);
      
      if (response.data.success && response.data.data.perDayCost) {
        setPerDayCost(response.data.data.perDayCost);
        setCalculatedRent(response.data.data.perDayCost * numberOfDays);
      }
    } catch (error) {
      console.error('Error fetching per day cost:', error);
    }
  };
  
  // Handle rent calculation modal
  const handleOpenRentCalculation = () => {
    fetchPerDayCost();
    setShowRentCalculationModal(true);
  };
  
  const handleCloseRentCalculation = () => {
    setShowRentCalculationModal(false);
  };
  
  const handleDaysChange = (days) => {
    setNumberOfDays(days);
    setCalculatedRent(perDayCost * days);
  };
  
  const handleSaveCalculatedRent = () => {
    setRentPayment(prev => ({ ...prev, amount: calculatedRent.toString() }));
    setShowRentCalculationModal(false);
    toast.success(`Rent amount calculated and set to ₹${calculatedRent.toLocaleString()}`);
  };
  
  // Step 5: Summary
  const [onboardingDate, setOnboardingDate] = useState(() => {
    const today = new Date();
    if (!isNaN(today.getTime())) {
      return today.toISOString().split('T')[0];
    } else {
      console.warn('❌ Invalid current date, using fallback');
      return '2024-01-01';
    }
  });
  const [onboardingSuccess, setOnboardingSuccess] = useState(false);
  const [allocationData, setAllocationData] = useState(null);

  const setOnboardingDateSafe = (dateValue) => {
    if (dateValue) {
      const parsedDate = new Date(dateValue);
      if (!isNaN(parsedDate.getTime())) {
        setOnboardingDate(dateValue);
      } else {
        console.warn('❌ Invalid date value provided:', dateValue, 'Using current date');
        const today = new Date();
        setOnboardingDate(today.toISOString().split('T')[0]);
      }
    } else {
      const today = new Date();
      setOnboardingDate(today.toISOString().split('T')[0]);
    }
  };

  useEffect(() => {
    if (!selectedBranch) return;
    fetchResidents();
    fetchSharingTypes();
    loadPaymentSettings();
    loadPGConfiguration();
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedSharingType) {
      fetchAvailableRooms();
    }
  }, [selectedSharingType]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showAllResidents]);

  // Update calculated rent when per day cost changes
  useEffect(() => {
    if (perDayCost > 0) {
      setCalculatedRent(perDayCost * numberOfDays);
    }
  }, [perDayCost, numberOfDays]);

  // Load payment data when reaching payment step
  useEffect(() => {
    if (currentStep === 5) { // Payment Information step
      loadPaymentSettings();
      loadPGConfiguration();
    }
  }, [currentStep]);

  // Pre-fill rent amount when sharing type is selected
  useEffect(() => {
    if (selectedSharingType && currentStep === 5) {
      setRentPayment(prev => ({
        ...prev,
        amount: selectedSharingType.cost.toString()
      }));
      
      // Set payment status based on whether amount is provided
      if (selectedSharingType.cost > 0) {
        setPaymentStatus(prev => ({
          ...prev,
          rent: 'pending' // Will be updated to 'paid' when user enters payment details
        }));
      }
    }
  }, [selectedSharingType, currentStep]);

  useEffect(() => {
  }, [currentStep, onboardingSuccess, allocationData, selectedResident, selectedSharingType, selectedRoom, selectedBed]);

  // Load payment settings for advance amount and per day cost
  const loadPaymentSettings = async () => {
    try {
      if (!selectedBranch) return;
      
      const response = await api.get(`/payment-info/admin/${selectedBranch._id}`);
      
      if (response.data.success && response.data.data) {
        // Set advance amount if available
        if (response.data.data.advanceAmount && response.data.data.advanceAmount > 0) {
          setAdvancePayment(prev => ({ 
            ...prev, 
            amount: response.data.data.advanceAmount.toString() 
          }));
        }
        
        // Set per day cost for custom calculation
        if (response.data.data.perDayCost && response.data.data.perDayCost > 0) {
          setPerDayCost(response.data.data.perDayCost);
        }
      } else {
        // Try fallback: load from onboarding status
        await loadFromOnboardingStatus();
      }
    } catch (error) {
      // Try fallback: load from onboarding status
      await loadFromOnboardingStatus();
    }
  };

  // Load PG configuration data for room sharing costs
  const loadPGConfiguration = async () => {
    try {
      if (!user?.pgId) return;
      
      const response = await api.get(`/pg/${user.pgId}`);
      
      if (response.data.success && response.data.data && response.data.data.sharingTypes) {
        // The sharing types with costs will be loaded by fetchSharingTypes
      }
    } catch (error) {
      // Error handled by fetchSharingTypes
    }
  };

  // Fallback: Load payment data from onboarding status
  const loadFromOnboardingStatus = async () => {
    try {
      const response = await api.get('/onboarding/status');
      
      if (response.data.success && response.data.data) {
        // Check if payment settings were completed during onboarding
        const paymentStep = response.data.data.steps?.find(step => step.stepId === 'payment_settings');
        if (paymentStep && paymentStep.completed && paymentStep.data) {
          // Set advance amount if available
          if (paymentStep.data.advanceAmount && paymentStep.data.advanceAmount > 0) {
            setAdvancePayment(prev => ({ 
              ...prev, 
              amount: paymentStep.data.advanceAmount.toString() 
            }));
          }
          
          // Set per day cost for custom calculation
          if (paymentStep.data.perDayCost && paymentStep.data.perDayCost > 0) {
            setPerDayCost(paymentStep.data.perDayCost);
          }
        }
      }
    } catch (error) {
      // Error handled by UI feedback
    }
  };

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedBranch?._id) params.append('branchId', selectedBranch._id);
      if (searchTerm) params.append('search', searchTerm);
      const response = await api.get(`/residents?${params.toString()}`);
      if (response.data.success) {
        setResidents(response.data.data.residents || []);
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

  const fetchSharingTypes = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBranch?._id) params.append('branchId', selectedBranch._id);
      const response = await api.get(`/pg/sharing-types?${params.toString()}`);
      if (response.data.success) {
        setSharingTypes(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching sharing types:', error);
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSharingType?.id) params.append('sharingType', selectedSharingType.id);
      if (selectedBranch?._id) params.append('branchId', selectedBranch._id);
      const response = await api.get(`/pg/rooms/available?${params.toString()}`);
      if (response.data.success) {
        setAvailableRooms(response.data.data?.availableRooms || []);
      }
    } catch (error) {
      console.error('Error fetching available rooms:', error);
    }
  };

  if (!selectedBranch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Resident Onboarding</h1>
          <p className="text-gray-600">Please select a branch from the header to continue.</p>
        </div>
      </div>
    );
  }

  const filteredResidents = residents.filter(resident => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      resident.firstName?.toLowerCase().includes(searchLower) ||
      resident.lastName?.toLowerCase().includes(searchLower) ||
      resident.phone?.includes(searchTerm) ||
      resident.email?.toLowerCase().includes(searchLower)
    );
    
    const isAssigned = resident.roomId && resident.bedNumber;
    const isInactive = resident.status === 'inactive' || resident.status === 'notice_period' || resident.status === 'moved_out';
    
    if (!showAllResidents && isAssigned) {
      return false;
    }
    
    // Don't show inactive residents or those in notice period
    if (isInactive) {
      return false;
    }
    
    return matchesSearch;
  });

  const handleResidentSelect = (resident) => {
    setSelectedResident(resident);
    
    // Auto-populate onboarding date with resident's check-in date if available
    if (resident.checkInDate) {
      const checkInDate = new Date(resident.checkInDate);
      // Validate the date before using it
      if (!isNaN(checkInDate.getTime())) {
        setOnboardingDateSafe(checkInDate.toISOString().split('T')[0]);
      } else {
        // If checkInDate is invalid, use today's date
        console.warn('Invalid checkInDate for resident:', resident._id, 'Using current date');
        setOnboardingDateSafe(new Date().toISOString().split('T')[0]);
      }
    } else {
      // Default to today's date if no check-in date is set
      setOnboardingDateSafe(new Date().toISOString().split('T')[0]);
    }
    
    setCurrentStep(2);
  };

  const handleSharingTypeSelect = (sharingType) => {
    setSelectedSharingType(sharingType);
    setCurrentStep(3);
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setSelectedBed(null); // Reset bed selection
    setCurrentStep(4);
  };

  const handleNoticePeriodRoomSelect = (room) => {
    // Show notification about notice period room
    toast.success(
      `You'll be notified when beds in Room ${room.roomNumber} become available after notice period expires!`,
      { duration: 5000 }
    );
    
    // Store the notice period room preference (you can implement this as needed)
  };

  const handleBedSelect = (bedNumber) => {
    console.log('🛏️ Bed selected:', bedNumber);
    setSelectedBed(bedNumber);
    
    // Since we're only showing available beds, no need for notice period logic
    toast.success(`Bed ${bedNumber} selected successfully!`);
    
    setCurrentStep(5);
  };

  const handlePaymentSubmit = () => {
    // Validate that bed is selected before proceeding to confirmation
    if (!selectedBed) {
      toast.error('Please select a bed before proceeding');
      return;
    }
    setCurrentStep(6);
  };

  // Handle payment status changes
  const handlePaymentStatusChange = (paymentType, status) => {
    setPaymentStatus(prev => ({
      ...prev,
      [paymentType]: status
    }));

    // If status is 'paid', ensure payment details are filled
    if (status === 'paid') {
      if (paymentType === 'advance' && !advancePayment.amount) {
        setAdvancePayment(prev => ({
          ...prev,
          amount: advanceAmount.toString(),
          date: new Date().toISOString().split('T')[0],
          receiptNumber: `ADV-${Date.now()}`
        }));
      } else if (paymentType === 'rent' && !rentPayment.amount) {
        setRentPayment(prev => ({
          ...prev,
          amount: selectedSharingType?.cost?.toString() || '0',
          date: new Date().toISOString().split('T')[0],
          receiptNumber: `RENT-${Date.now()}`
        }));
      }
    } else if (status === 'not_required') {
      // Clear payment details if not required
      if (paymentType === 'advance') {
        setAdvancePayment(prev => ({
          ...prev,
          amount: '',
          date: '',
          receiptNumber: ''
        }));
      } else if (paymentType === 'rent') {
        setRentPayment(prev => ({
          ...prev,
          amount: '',
          date: '',
          receiptNumber: ''
        }));
      }
    }
  };

  // Handle rent amount changes
  const handleRentAmountChange = (amount) => {
    setRentPayment(prev => ({
      ...prev,
      amount: amount
    }));

    // Only update status if amount is cleared (set to pending)
    // Don't auto-set to 'paid' - let user manually select the status
    if (!amount || parseFloat(amount) <= 0) {
      setPaymentStatus(prev => ({
        ...prev,
        rent: 'pending'
      }));
    }
    // If amount exists but status is 'not_required', keep it as 'not_required'
    // Otherwise, don't change the status - user must manually select 'paid' or 'pending'
  };

  // Handle advance amount changes
  const handleAdvanceAmountChange = (amount) => {
    setAdvancePayment(prev => ({
      ...prev,
      amount: amount
    }));

    // Only update status if amount is cleared (set to pending)
    // Don't auto-set to 'paid' - let user manually select the status
    if (!amount || parseFloat(amount) <= 0) {
      setPaymentStatus(prev => ({
        ...prev,
        advance: 'pending'
      }));
    }
    // If amount exists but status is 'not_required', keep it as 'not_required'
    // Otherwise, don't change the status - user must manually select 'paid' or 'pending'
  };

  const handleOnboardingSubmit = async () => {
    console.log('🔍 Validation check:', {
      selectedResident: !!selectedResident,
      selectedSharingType: !!selectedSharingType,
      selectedRoom: !!selectedRoom,
      selectedBed: !!selectedBed,
      selectedResidentData: selectedResident,
      selectedSharingTypeData: selectedSharingType,
      selectedRoomData: selectedRoom,
      selectedBedValue: selectedBed
    });

    // Check for missing required selections
    const missingSelections = [];
    if (!selectedResident) missingSelections.push('Resident');
    if (!selectedSharingType) missingSelections.push('Room Type');
    if (!selectedRoom) missingSelections.push('Room');
    if (!selectedBed) missingSelections.push('Bed');

    if (missingSelections.length > 0) {
      toast.error(`Please select: ${missingSelections.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      
      // Since we're only showing available beds, isNoticePeriodBed is always false
      const isNoticePeriodBed = false;

      console.log('🔍 Starting onboarding process for bed:', selectedBed);
      
      const onboardingData = {
        residentId: selectedResident._id,
        roomId: selectedRoom.roomId || selectedRoom._id,
        bedNumber: selectedBed,
        sharingTypeId: selectedSharingType.id,
        sharingTypeCost: parseFloat(selectedSharingType.cost) || 0,
        isNoticePeriodBed: isNoticePeriodBed,
        advancePayment: advancePayment.amount ? {
          amount: parseFloat(advancePayment.amount),
          date: advancePayment.date,
          receiptNumber: advancePayment.receiptNumber,
          status: paymentStatus.advance
        } : null,
        rentPayment: rentPayment.amount ? {
          amount: parseFloat(rentPayment.amount),
          date: rentPayment.date,
          receiptNumber: rentPayment.receiptNumber,
          status: paymentStatus.rent
        } : null,
        paymentStatus: paymentStatus
      };

      console.log('📋 Onboarding data prepared:', onboardingData);
      console.log('🔍 Selected values:', {
        selectedResident: selectedResident,
        selectedRoom: selectedRoom,
        selectedBed: selectedBed,
        selectedSharingType: selectedSharingType,
        residentId: selectedResident?._id,
        roomId: selectedRoom?.roomId || selectedRoom?._id,
        bedNumber: selectedBed,
        sharingTypeId: selectedSharingType?.id
      });

      // Only include onboardingDate if it's different from the resident's existing check-in date
      if (onboardingDate) {
        const existingCheckInDate = selectedResident.checkInDate ? new Date(selectedResident.checkInDate).toISOString().split('T')[0] : null;
        if (onboardingDate !== existingCheckInDate) {
          // Validate the date before adding it
          const parsedDate = new Date(onboardingDate);
          if (!isNaN(parsedDate.getTime())) {
            // Map onboardingDate to the fields the backend expects
            onboardingData.checkInDate = onboardingDate;
            onboardingData.contractStartDate = onboardingDate;
          } else {
            console.warn('Invalid onboarding date format:', onboardingDate);
            // Use current date as fallback
            const currentDate = new Date().toISOString().split('T')[0];
            onboardingData.checkInDate = currentDate;
            onboardingData.contractStartDate = currentDate;
          }
        } else {
          // Use existing dates if no change
          if (selectedResident.checkInDate) {
            onboardingData.checkInDate = new Date(selectedResident.checkInDate).toISOString().split('T')[0];
          }
          if (selectedResident.contractStartDate) {
            onboardingData.contractStartDate = new Date(selectedResident.contractStartDate).toISOString().split('T')[0];
          }
        }
      } else {
        // If no onboarding date specified, use current date
        const currentDate = new Date().toISOString().split('T')[0];
        onboardingData.checkInDate = currentDate;
        onboardingData.contractStartDate = currentDate;
      }

      // Validate all dates before sending to backend
      if (onboardingData.checkInDate) {
        const parsedCheckInDate = new Date(onboardingData.checkInDate);
        if (isNaN(parsedCheckInDate.getTime())) {
          toast.error('Invalid check-in date format');
          return;
        }
        // Ensure the date is in ISO string format for the backend
        onboardingData.checkInDate = parsedCheckInDate.toISOString();
        console.log('✅ Valid checkInDate:', onboardingData.checkInDate, 'Parsed:', parsedCheckInDate);
      }
      
      if (onboardingData.contractStartDate) {
        const parsedContractStartDate = new Date(onboardingData.contractStartDate);
        if (isNaN(parsedContractStartDate.getTime())) {
          toast.error('Invalid contract start date format');
          return;
        }
        // Ensure the date is in ISO string format for the backend
        onboardingData.contractStartDate = parsedContractStartDate.toISOString();
        console.log('✅ Valid contractStartDate:', onboardingData.contractStartDate, 'Parsed:', parsedContractStartDate);
      }

      // Validate payment dates if provided
      if (onboardingData.advancePayment?.date) {
        const parsedAdvanceDate = new Date(onboardingData.advancePayment.date);
        if (isNaN(parsedAdvanceDate.getTime())) {
          toast.error('Invalid advance payment date format');
          return;
        }
        onboardingData.advancePayment.date = parsedAdvanceDate.toISOString();
        console.log('✅ Valid advance payment date:', onboardingData.advancePayment.date);
      }
      
      if (onboardingData.rentPayment?.date) {
        const parsedRentDate = new Date(onboardingData.rentPayment.date);
        if (isNaN(parsedRentDate.getTime())) {
          toast.error('Invalid rent payment date format');
          return;
        }
        onboardingData.rentPayment.date = parsedRentDate.toISOString();
        console.log('✅ Valid rent payment date:', onboardingData.rentPayment.date);
      }

      console.log('🚀 Sending onboarding data:', JSON.stringify(onboardingData, null, 2));

      // Final validation before sending to backend
      console.log('🔍 Final validation check:', {
        residentId: !!onboardingData.residentId,
        roomId: !!onboardingData.roomId,
        bedNumber: !!onboardingData.bedNumber,
        sharingTypeId: !!onboardingData.sharingTypeId,
        onboardingData
      });

      const missingFields = [];
      if (!onboardingData.residentId) missingFields.push('Resident ID');
      if (!onboardingData.roomId) missingFields.push('Room ID');
      if (!onboardingData.bedNumber) missingFields.push('Bed Number');
      if (!onboardingData.sharingTypeId) missingFields.push('Sharing Type ID');

      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        console.error('❌ Onboarding data values:', {
          residentId: onboardingData.residentId,
          roomId: onboardingData.roomId,
          bedNumber: onboardingData.bedNumber,
          sharingTypeId: onboardingData.sharingTypeId
        });
        toast.error(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

        // For available beds, proceed with normal onboarding
      console.log('🔄 Making API call to /residents/onboard');
      let response;

      try {
        response = await api.post('/residents/onboard', onboardingData);
        console.log('✅ API response received:', response.data);
      } catch (apiError) {
        console.error('❌ API call failed:', apiError);
        console.error('❌ API error response:', apiError.response?.data);
        toast.error(apiError.response?.data?.message || 'Network error occurred');
        return;
      }
      
      if (response.data.success) {
        // Store allocation data for the success screen
        let currentDate = new Date();
        if (isNaN(currentDate.getTime())) {
          console.error('❌ Invalid current date, using fallback');
          currentDate = new Date('2024-01-01'); // Fallback date
        }
        
        // Ensure all dates in allocationData are valid
        const validatedAllocationData = {
          ...onboardingData,
          resident: selectedResident,
          sharingType: selectedSharingType,
          room: selectedRoom,
          allocationDate: currentDate.toISOString(),
          isNoticePeriodBed: isNoticePeriodBed,
          advancePayment: advancePayment.amount ? {
            ...advancePayment,
            date: advancePayment.date ? new Date(advancePayment.date).toISOString() : null
          } : null,
          rentPayment: rentPayment.amount ? {
            ...rentPayment,
            date: rentPayment.date ? new Date(rentPayment.date).toISOString() : null
          } : null
        };
        
        console.log('✅ Setting allocation data:', validatedAllocationData);
        setAllocationData(validatedAllocationData);
        
        setOnboardingSuccess(true);
        console.log('🎯 Setting current step to 7 (success step)');
        setCurrentStep(7); // Set to step 7 (success step) instead of step 6
        console.log('✅ Step set to 7, onboardingSuccess:', true);
        
        // Attempt to persist allocation letter automatically (non-blocking)
        try {
          const autoFileName = `Allocation Letter - ${selectedResident.firstName} ${selectedResident.lastName}.pdf`;
          await api.post('/residents/allocation-letter', {
            residentId: selectedResident._id,
            fileName: autoFileName,
            allocationData: validatedAllocationData,
          });
          console.log('✅ Allocation letter auto-stored after onboarding');
        } catch (autoErr) {
          console.warn('⚠️ Failed to auto-store allocation letter (continuing):', autoErr);
        }

        if (isNoticePeriodBed) {
          toast.success('Notice period bed reserved successfully! You will be notified when it becomes available.');
        } else {
        toast.success('Resident onboarded successfully!');
        }
      } else {
        toast.error(response.data.message || 'Failed to process request');
      }
    } catch (error) {
      console.error('Error onboarding resident:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        onboardingData: onboardingData,
        selectedResident: selectedResident,
        selectedRoom: selectedRoom,
        selectedBed: selectedBed
      });
      
      // Check if it's a date-related error
      if (error.message.includes('Invalid time value') || error.message.includes('Invalid Date')) {
        console.error('❌ Date validation error detected');
        toast.error('Invalid date format detected. Please check the onboarding date and try again.');
        return;
      }
      
      if (error.response?.data?.message) {
        const message = error.response.data.message;
        
        if (message.includes('already assigned')) {
          toast.error('This resident is already assigned to a room');
          setCurrentStep(1);
        } else if (message.includes('already occupied')) {
          toast.error('This room is already occupied');
          setCurrentStep(3);
        } else if (message.includes('already occupied')) {
          toast.error('This bed is already occupied');
          setCurrentStep(4);
        } else {
          toast.error(message);
        }
      } else {
        toast.error('Failed to onboard resident. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateAllocationLetter = () => {
    console.log('📄 generateAllocationLetter function called');
    console.log('📊 allocationData:', allocationData);
    
    if (!allocationData) {
      console.error('❌ No allocation data available');
      toast.error('No allocation data available. Please try again.');
      return;
    }

    try {
      const { resident, sharingType, room, bedNumber, checkInDate, contractStartDate } = allocationData;
      
      const doc = new jsPDF();
      
      // Set page dimensions and margins
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Header Section with Logo and Title
      doc.setFillColor(52, 152, 219);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // PG Management System Title
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('PG MANAGEMENT SYSTEM', pageWidth / 2, 25, { align: 'center' });
      
      // Main Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 62, 80);
      doc.text('RESIDENT ALLOCATION LETTER', pageWidth / 2, 60, { align: 'center' });
      
      // Document Info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(149, 165, 166);
      doc.text(`Document ID: ALL-${Date.now()}`, margin, 75);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin - 60, 75);
      
      // Line separator
      doc.setDrawColor(52, 152, 219);
      doc.setLineWidth(0.5);
      doc.line(margin, 85, pageWidth - margin, 85);
      
      // Resident Information Section
      let yPosition = 100;
      
      // Section Header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 152, 219);
      doc.text('RESIDENT INFORMATION', margin, yPosition);
      
      yPosition += 15;
      
      // Resident Details Table
      const residentDetails = [
        { label: 'Full Name', value: `${resident.firstName} ${resident.lastName}` },
        { label: 'Phone Number', value: resident.phone },
        { label: 'Email Address', value: resident.email || 'Not provided' },
        { label: 'Resident ID', value: resident._id || 'N/A' }
      ];
      
      residentDetails.forEach((detail, index) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text(`${detail.label}:`, margin, yPosition);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(52, 73, 94);
        doc.text(detail.value, margin + 50, yPosition);
        
        yPosition += 8;
      });
      
      yPosition += 10;
      
      // Assignment Information Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 152, 219);
      doc.text('ASSIGNMENT DETAILS', margin, yPosition);
      
      yPosition += 15;
      
      // Assignment Details Table
      const assignmentDetails = [
        { label: 'Room Type', value: sharingType.name },
        { label: 'Room Number', value: room.roomNumber },
        { label: 'Bed Number', value: bedNumber },
        { label: 'Floor', value: room.floor?.name || 'Ground Floor' },
        { label: 'Monthly Rent', value: `₹${sharingType.cost?.toLocaleString()}` },
        { label: 'Security Deposit', value: `₹${(sharingType.cost * 2)?.toLocaleString()}` },
        { label: 'Check-in Date', value: checkInDate ? new Date(checkInDate).toLocaleDateString() : 'N/A' },
        { label: 'Contract Start', value: contractStartDate ? new Date(contractStartDate).toLocaleDateString() : 'N/A' }
      ];

       // Add payment details if available
       if (allocationData.advancePayment?.amount || allocationData.rentPayment?.amount) {
         assignmentDetails.push(
           { label: 'Advance Payment', value: allocationData.advancePayment?.amount ? `₹${parseFloat(allocationData.advancePayment.amount).toLocaleString()}` : '₹0.00' },
           { label: 'Rent Payment', value: allocationData.rentPayment?.amount ? `₹${parseFloat(allocationData.rentPayment.amount).toLocaleString()}` : '₹0.00' },
           { label: 'Total Amount Paid', value: `₹${((allocationData.advancePayment?.amount ? parseFloat(allocationData.advancePayment.amount) : 0) + (allocationData.rentPayment?.amount ? parseFloat(allocationData.rentPayment.amount) : 0)).toLocaleString()}` }
         );
       }
      
      assignmentDetails.forEach((detail, index) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text(`${detail.label}:`, margin, yPosition);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(52, 73, 94);
        doc.text(detail.value, margin + 50, yPosition);
        
        yPosition += 8;
      });
      
      yPosition += 15;
      
       // Payment Details Section (if payments exist)
       if (allocationData.advancePayment?.amount || allocationData.rentPayment?.amount) {
         doc.setFontSize(14);
         doc.setFont('helvetica', 'bold');
         doc.setTextColor(52, 152, 219);
         doc.text('PAYMENT DETAILS', margin, yPosition);
         
         yPosition += 15;
         
         const paymentDetails = [];
         if (allocationData.advancePayment?.amount) {
           paymentDetails.push(
             { label: 'Advance Payment', amount: `₹${parseFloat(allocationData.advancePayment.amount).toLocaleString()}`, date: allocationData.advancePayment.date ? new Date(allocationData.advancePayment.date).toLocaleDateString() : 'N/A', receipt: allocationData.advancePayment.receiptNumber || 'N/A' }
           );
         }
         
         if (allocationData.rentPayment?.amount) {
           paymentDetails.push(
             { label: 'Rent Payment', amount: `₹${parseFloat(allocationData.rentPayment.amount).toLocaleString()}`, date: allocationData.rentPayment.date ? new Date(allocationData.rentPayment.date).toLocaleDateString() : 'N/A', receipt: allocationData.rentPayment.receiptNumber || 'N/A' }
           );
         }
         
         paymentDetails.forEach((payment, index) => {
           doc.setFontSize(11);
           doc.setFont('helvetica', 'bold');
           doc.setTextColor(44, 62, 80);
           doc.text(`${payment.label}:`, margin, yPosition);
           
           doc.setFont('helvetica', 'normal');
           doc.setTextColor(52, 73, 94);
           doc.text(`Amount: ${payment.amount}`, margin + 50, yPosition);
           doc.text(`Date: ${payment.date}`, margin + 50, yPosition + 8);
           doc.text(`Receipt: ${payment.receipt}`, margin + 50, yPosition + 16);
           
           yPosition += 24;
         });
         
         // Total amount
         const totalAmount = ((allocationData.advancePayment?.amount ? parseFloat(allocationData.advancePayment.amount) : 0) + (allocationData.rentPayment?.amount ? parseFloat(allocationData.rentPayment.amount) : 0));
         doc.setFontSize(12);
         doc.setFont('helvetica', 'bold');
         doc.setTextColor(52, 152, 219);
         doc.text(`Total Amount Paid: ₹${totalAmount.toLocaleString()}`, margin, yPosition);
         
         yPosition += 20;
       }
       
      // Terms and Conditions Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 152, 219);
      doc.text('TERMS AND CONDITIONS', margin, yPosition);
      
      yPosition += 15;
      
      const terms = [
        '1. The resident is officially allocated to the specified room and bed.',
        '2. Monthly rent of ₹' + sharingType.cost?.toLocaleString() + ' is due on the 1st of each month.',
        '3. A security deposit of ₹' + (sharingType.cost * 2)?.toLocaleString() + ' is required.',
        '4. The resident must follow all PG rules and regulations strictly.',
        '5. A notice period of 30 days is required for vacation.',
        '6. No pets or unauthorized guests are allowed without prior permission.',
        '7. Maintain cleanliness and report any maintenance issues immediately.',
        '8. Follow quiet hours from 10:00 PM to 6:00 AM.',
        '9. Cooking is not allowed in rooms; use designated kitchen areas.',
        '10. This allocation is valid until the resident vacates or is terminated.'
      ];
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(44, 62, 80);
      
      terms.forEach((term, index) => {
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 30;
        }
        doc.text(term, margin, yPosition);
        yPosition += 7;
      });
      
      yPosition += 15;
      
      // Payment Schedule
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 152, 219);
      doc.text('PAYMENT SCHEDULE', margin, yPosition);
      
      yPosition += 15;
      
      const paymentSchedule = [
        { item: 'Monthly Rent', amount: `₹${sharingType.cost?.toLocaleString()}`, due: '1st of every month' },
        { item: 'Security Deposit', amount: `₹${(sharingType.cost * 2)?.toLocaleString()}`, due: 'On check-in' },
        { item: 'Late Payment Fee', amount: '₹500', due: 'After 5th of month' }
      ];
      
      paymentSchedule.forEach((payment, index) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(44, 62, 80);
        doc.text(`${payment.item}:`, margin, yPosition);
        doc.text(payment.amount, margin + 80, yPosition);
        doc.text(payment.due, margin + 120, yPosition);
        yPosition += 8;
      });
      
      // Footer Section
      yPosition = pageHeight - 60;
      
      // Line separator
      doc.setDrawColor(52, 152, 219);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      
      yPosition += 10;
      
      // Disclaimer
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(149, 165, 166);
      doc.text('This letter serves as an official allocation document and should be kept for records.', margin, yPosition);
      doc.text('For any queries, please contact the PG management.', margin, yPosition + 5);
      
      // Contact Information
      yPosition += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 152, 219);
      doc.text('Contact Information:', margin, yPosition);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(44, 62, 80);
      doc.text('Phone: +91-XXXXXXXXXX', margin, yPosition + 8);
      doc.text('Email: management@pgmanagement.com', margin, yPosition + 13);
      doc.text('Address: [PG Address]', margin, yPosition + 18);
      
      // Save the PDF
      const fileName = `allocation_letter_${resident.firstName}_${resident.lastName}_${Date.now()}.pdf`;
      doc.save(fileName);
      
      // Store the allocation letter in backend
      storeAllocationLetter(fileName, resident._id);
      
      toast.success('Allocation letter downloaded as PDF!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const storeAllocationLetter = async (fileName, residentId) => {
    try {
      const response = await api.post('/residents/allocation-letter', {
        residentId,
        fileName,
        allocationData
      });
      
      if (response.data.success) {
        console.log('Allocation letter stored successfully');
      }
    } catch (error) {
      console.error('Error storing allocation letter:', error);
    }
  };

  const resetToStep1 = () => {
    console.log('🔄 Resetting to step 1');
    setCurrentStep(1);
    setSelectedResident(null);
    setSelectedSharingType(null);
    setSelectedRoom(null);
    setSelectedBed(null);
    setOnboardingDateSafe(''); // Use safe date setter
    setOnboardingSuccess(false);
    setAllocationData(null);
    setSearchTerm('');
    setShowAllResidents(false);
    setAdvancePayment({ amount: '', date: '', receiptNumber: '' });
    setRentPayment({ amount: '', date: '', receiptNumber: '' });
    console.log('✅ Reset completed');
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      
      if (currentStep === 7) {
        // Going back from success to payment
        // Keep payment data
      } else if (currentStep === 6) {
        // Going back from confirmation to payment
        // Keep payment data
      } else if (currentStep === 5) {
        setSelectedBed(null);
      } else if (currentStep === 4) {
        setSelectedRoom(null);
      } else if (currentStep === 3) {
        setSelectedSharingType(null);
      } else if (currentStep === 2) {
        setSelectedResident(null);
        setOnboardingDateSafe(''); // Reset onboarding date when going back to resident selection
      }
    }
  };

  const renderStep1 = () => {
    // Pagination Logic
    const totalPages = Math.ceil(filteredResidents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResidents = filteredResidents.slice(startIndex, endIndex);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-3"
      >
        {/* All-in-One Row Header */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {/* Title with Icon */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <User className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 whitespace-nowrap">Select Resident</h2>
          </div>

          {/* Toggle Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAllResidents(false)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                !showAllResidents
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Unassigned
            </button>
            <button
              onClick={() => setShowAllResidents(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                showAllResidents
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              All
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-1.5 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-xs"
            />
          </div>
        </div>

        {/* Modern Grid Layout - 8 Cards (4 columns x 2 rows) */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {loading ? (
            <div className="col-span-full text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
              <p className="text-gray-600 text-xs">Loading residents...</p>
            </div>
          ) : filteredResidents.length === 0 ? (
            <div className="col-span-full text-center py-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-2 shadow-sm">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">No residents found</h3>
              <p className="text-gray-600 text-xs">
                {showAllResidents ? 'No residents available' : 'All residents are already assigned'}
              </p>
            </div>
          ) : (
            paginatedResidents.map((resident) => {
            const isAssigned = resident.roomId && resident.bedNumber;
            
            return (
              <motion.div
                key={resident._id}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer bg-white ${
                  isAssigned
                    ? 'border-gray-200 bg-gray-50 opacity-60'
                    : 'border-gray-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100/50 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-indigo-50/50'
                } ${isAssigned ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => !isAssigned && handleResidentSelect(resident)}
              >
                {/* Premium Avatar with Gradient */}
                <div className="flex items-center justify-center mb-3">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg transition-all relative ${
                    isAssigned 
                      ? 'bg-gray-200' 
                      : 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 group-hover:scale-110 group-hover:shadow-xl'
                  }`}>
                    <div className={`absolute inset-0 rounded-xl ${
                      isAssigned ? '' : 'bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity'
                    }`}></div>
                    <User className={`h-7 w-7 relative z-10 ${isAssigned ? 'text-gray-400' : 'text-white'}`} />
                  </div>
                </div>
                
                {/* Resident Name - Centered */}
                <div className="text-center mb-3">
                  <h3 className="font-bold text-base text-gray-900 mb-2 truncate">
                    {resident.firstName} {resident.lastName}
                  </h3>
                  
                  {/* Status Badge */}
                  {isAssigned ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 shadow-sm">
                      <CheckCircle className="h-3 w-3 inline mr-1.5" />
                      Assigned
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700 border border-green-200 shadow-sm">
                      <Sparkles className="h-3 w-3 inline mr-1.5" />
                      Available
                    </span>
                  )}
                </div>
                
                {/* Contact Details - Card Layout */}
                <div className="space-y-2 mb-3">
                  {resident.phone && (
                    <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <Phone className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      <span className="font-medium text-gray-700 truncate">{resident.phone}</span>
                    </div>
                  )}
                  {resident.email && (
                    <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5">
                      <Mail className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      <span className="font-medium text-gray-700 truncate">{resident.email}</span>
                    </div>
                  )}
                </div>
                
                {/* Premium Selection Button - Centered */}
                {!isAssigned && (
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-xs font-bold shadow-md group-hover:shadow-lg group-hover:from-blue-600 group-hover:to-indigo-700 transition-all w-full justify-center">
                      <span>Select</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
          )}
        </div>

        {/* Pagination Controls */}
        {filteredResidents.length > itemsPerPage && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredResidents.length)} of {filteredResidents.length} residents
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 text-xs font-medium rounded-lg transition-all ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
    );
  };

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-3"
    >
      {/* Compact Header */}
      <div className="text-center mb-2">
        <div className="flex items-center justify-center mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2 shadow-sm">
            <Home className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Choose Room Type</h2>
          </div>
        </div>
      </div>

      {/* Modern Grid Layout - 4 Cards Per Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sharingTypes.map((sharingType) => (
          <motion.div
            key={sharingType.id}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer bg-white ${
              selectedSharingType?.id === sharingType.id
                ? 'border-blue-500 bg-blue-50 shadow-xl'
                : 'border-gray-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100/50 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-indigo-50/50'
            }`}
            onClick={() => handleSharingTypeSelect(sharingType)}
          >
            {/* Premium Icon - Centered */}
            <div className="flex items-center justify-center mb-3">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg transition-all relative ${
                selectedSharingType?.id === sharingType.id
                  ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white scale-110 shadow-xl'
                  : 'bg-blue-100 text-blue-600 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-xl'
              }`}>
                <div className={`absolute inset-0 rounded-xl ${
                  selectedSharingType?.id === sharingType.id 
                    ? 'bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-md opacity-100'
                    : 'bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity'
                }`}></div>
                <Users className="h-7 w-7 relative z-10" />
              </div>
            </div>
          
            {/* Type Info - Centered */}
            <div className="text-center mb-3">
              <h3 className="font-bold text-base text-gray-900 mb-2 truncate">
                {sharingType.name}
              </h3>
              
              {/* Price */}
              <div className="flex items-center justify-center space-x-1 mb-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-lg font-bold text-blue-600">
                  ₹{sharingType.cost?.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">/month</span>
              </div>
              
              {/* Description */}
              {sharingType.description && (
                <p className="text-xs text-gray-600 mb-2 truncate">
                  {sharingType.description}
                </p>
              )}
              
              {/* Selection Indicator */}
              {selectedSharingType?.id === sharingType.id && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">
                  <CheckCircle2 className="h-3 w-3 inline mr-1.5" />
                  Selected
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Compact Action Buttons */}
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={goBack}
          className="flex items-center px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back
        </button>
        
        <div className="text-[10px] text-gray-500 font-medium">
          {sharingTypes.length} option{sharingTypes.length !== 1 ? 's' : ''}
        </div>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-3"
    >
      {/* Compact Header */}
      <div className="text-center mb-2">
        <div className="flex items-center justify-center mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2 shadow-sm">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Select Room</h2>
          </div>
        </div>
      </div>

      {/* Compact Selected Options Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shadow-sm">
              <User className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-600 font-medium">Resident</p>
              <p className="text-xs font-semibold text-gray-900 truncate">
                {selectedResident?.firstName} {selectedResident?.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shadow-sm">
              <Home className="h-3.5 w-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-600 font-medium">Room Type</p>
              <p className="text-xs font-semibold text-gray-900">{selectedSharingType?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center shadow-sm">
              <Building2 className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-600 font-medium">Available</p>
              <p className="text-xs font-semibold text-gray-900">
                {(availableRooms || []).filter(room => room.availableBedsCount > 0).length} rooms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Rooms Grid */}
      <div className="grid gap-2">
        {loading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-600 text-xs font-medium">Loading rooms...</p>
          </div>
        ) : (availableRooms || []).length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-2 shadow-sm">
              <Building2 className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No rooms available</h3>
            <p className="text-gray-600 text-xs">
              No rooms available for {selectedSharingType?.name}
            </p>
          </div>
        ) : (
          <>
            {/* Available Rooms */}
            {(availableRooms || []).filter(room => room.availableBedsCount > 0).map((room) => {
            const hasAvailableBeds = room.availableBedsCount > 0;
            
            return (
              <motion.div
                key={room._id}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                className={`group relative p-3 rounded-lg border transition-all duration-300 cursor-pointer ${
                  hasAvailableBeds
                    ? 'border-blue-200 bg-blue-50 hover:border-blue-300 hover:shadow-sm'
                    : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                }`}
                onClick={() => hasAvailableBeds && handleRoomSelect(room)}
              >
                <div className="relative flex items-center justify-between">
                  {/* Compact Room Info */}
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                      hasAvailableBeds
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      <Building2 className={`h-5 w-5`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          Room {room.roomNumber}
                        </h3>
                        {hasAvailableBeds ? (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-green-100 text-green-700 border border-green-200">
                            <CheckCircle className="h-2 w-2 inline mr-0.5" />
                            Available
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            <Clock className="h-2 w-2 inline mr-0.5" />
                            Full
                          </span>
                        )}
                      </div>
                      
                      {/* Compact Room Details */}
                      <div className="grid grid-cols-3 gap-1.5 text-[10px] text-gray-600 mb-2">
                        <div className="flex items-center space-x-1 bg-white/80 rounded-md px-1.5 py-1">
                          <Bed className="h-2.5 w-2.5" />
                          <span className="font-medium truncate">{room.totalBeds || room.numberOfBeds} beds</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-white/80 rounded-md px-1.5 py-1">
                          <CheckCircle className="h-2.5 w-2.5" />
                          <span className="font-medium">{room.availableBedsCount} available</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-white/80 rounded-md px-1.5 py-1">
                          <MapPin className="h-2.5 w-2.5" />
                          <span className="font-medium truncate">Floor {room.floorNumber || 'N/A'}</span>
                        </div>
                      </div>
                      
                      {/* Compact Bed Status */}
                      {room.availableBedNumbers && room.availableBedNumbers.length > 0 && (
                        <div className="flex items-center space-x-1 text-[10px]">
                          <span className="text-gray-600 font-medium">Available beds: </span>
                          <span className="text-blue-600 font-semibold">
                            {room.availableBedNumbers.slice(0, 4).join(', ')}
                            {room.availableBedNumbers.length > 4 && ` +${room.availableBedNumbers.length - 4}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Compact Action Button */}
                  {hasAvailableBeds && (
                  <div className="flex items-center ml-2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded-md text-xs font-semibold">
                        <span>Select</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          
          {/* Compact Notice Period Rooms Section */}
          {(availableRooms || []).filter(room => room.hasNoticePeriodBeds && room.availableBedsCount === 0).length > 0 && (
            <div className="mt-4">
              <div className="text-center mb-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Notice Period Rooms</h3>
                <p className="text-xs text-gray-600">
                  Available after notice period expires
                </p>
              </div>
              
              <div className="grid gap-2">
                {(availableRooms || [])
                  .filter(room => room.hasNoticePeriodBeds && room.availableBedsCount === 0)
                  .map((room) => (
                    <motion.div
                      key={room._id}
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.99 }}
                      className="group relative p-3 rounded-lg border border-yellow-200 bg-yellow-50 hover:border-yellow-300 hover:shadow-sm transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1">
                          <div className="w-9 h-9 rounded-lg bg-yellow-500 flex items-center justify-center shadow-sm">
                            <Clock className="h-4 w-4 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 text-sm">
                                Room {room.roomNumber}
                              </h3>
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                <Clock className="h-2 w-2 inline mr-0.5" />
                                Notice Period
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-1.5 text-[10px] text-gray-600">
                              <div className="flex items-center space-x-1 bg-white/80 rounded-md px-1.5 py-1">
                                <Bed className="h-2.5 w-2.5" />
                                <span className="font-medium truncate">{room.totalBeds || room.numberOfBeds} beds</span>
                              </div>
                              <div className="flex items-center space-x-1 bg-white/80 rounded-md px-1.5 py-1">
                                <Clock className="h-2.5 w-2.5" />
                                <span className="font-medium truncate">{room.noticePeriodBedsCount} notice</span>
                              </div>
                              <div className="flex items-center space-x-1 bg-white/80 rounded-md px-1.5 py-1">
                                <MapPin className="h-2.5 w-2.5" />
                                <span className="font-medium truncate">Floor {room.floorNumber || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Compact Action Button */}
                        <div className="flex items-center ml-2">
                          <button
                            onClick={() => handleNoticePeriodRoomSelect(room)}
                            className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white rounded-md text-xs font-semibold hover:bg-yellow-600 transition-all"
                          >
                            <Clock className="h-3 w-3" />
                            <span>Notify</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}
        </>
        )}
      </div>

      {/* Compact Action Buttons */}
      <div className="flex justify-between items-center pt-3">
        <button
          onClick={goBack}
          className="flex items-center px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back
        </button>
        
        <div className="text-[10px] text-gray-500 font-medium">
          {(availableRooms || []).filter(room => room.availableBedsCount > 0).length} available
        </div>
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
            <Bed className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Select Bed</h2>
            <p className="text-gray-600">
              Choose a bed in Room {selectedRoom?.roomNumber} for {selectedResident?.firstName}
            </p>
          </div>
        </div>
      </div>

      {/* Selected Room Info */}
      <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-4 rounded-xl border border-sky-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Resident</p>
              <p className="text-sm font-semibold text-gray-900">
                {selectedResident?.firstName} {selectedResident?.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Home className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Room Type</p>
              <p className="text-sm font-semibold text-gray-900">{selectedSharingType?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Selected Room</p>
              <p className="text-sm font-semibold text-gray-900">Room {selectedRoom?.roomNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bed Selection Grid */}
      <div className="space-y-3">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Available Beds</h3>
          <p className="text-sm text-gray-600">
            {selectedRoom?.availableBedsCount || 0} of {selectedRoom?.totalBeds || selectedRoom?.numberOfBeds || 0} beds available
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {selectedRoom?.availableBedNumbers?.map((bedNumber, index) => {
            // Determine bed status and styling (simplified for available beds only)
            let bedStatusClass = '';
            let bedIconClass = '';
            let bedStatusText = '';
            let bedDescription = '';
            let isSelectable = false;
            let isSelected = false;
            
            // All beds from availableBedNumbers are available
              bedStatusClass = 'border-green-200 bg-green-50 hover:border-green-300';
              bedIconClass = 'bg-green-100 text-green-600';
              bedStatusText = 'Available';
              bedDescription = 'Ready for assignment';
              isSelectable = true;
            isSelected = selectedBed === bedNumber;
            
            // Apply selection styling
            if (isSelected) {
              bedStatusClass = 'border-sky-500 bg-gradient-to-br from-sky-50 to-blue-50 shadow-lg';
              bedIconClass = 'bg-sky-500 text-white';
            }
            
            return (
            <motion.div
              key={index}
                whileHover={isSelectable ? { scale: 1.03, y: -2 } : {}}
                whileTap={isSelectable ? { scale: 0.97 } : {}}
                className={`p-4 rounded-xl border transition-all ${
                  isSelectable ? 'cursor-pointer' : 'cursor-not-allowed'
                } ${bedStatusClass}`}
                onClick={() => isSelectable && handleBedSelect(bedNumber)}
            >
              <div className="text-center">
                {/* Bed Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${bedIconClass}`}>
                  <Bed className="h-6 w-6" />
                </div>
                
                {/* Bed Number */}
                <h3 className="font-bold text-gray-900 mb-2">
                  Bed {bedNumber}
                </h3>
                
                {/* Status */}
                  <div className="space-y-1">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                          <CheckCircle className="h-3 w-3 inline mr-1" />
                          Available
                    </span>
                    <p className="text-xs text-gray-500">
                      {bedDescription}
                    </p>
                  </div>
                
                {/* Selection Indicator */}
                  {isSelected && (
                  <div className="mt-3 p-2 bg-sky-100 rounded-lg border border-sky-200">
                    <div className="flex items-center space-x-1">
                      <CheckCircle2 className="h-4 w-4 text-sky-600" />
                      <span className="text-xs font-medium text-sky-700">Selected</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={goBack}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        
        <div className="text-sm text-gray-500">
          {selectedRoom?.beds?.filter(bed => !bed.isOccupied || bed.residentStatus === 'notice_period').length || 0} bed{selectedRoom?.beds?.filter(bed => !bed.isOccupied || bed.residentStatus === 'notice_period').length !== 1 ? 's' : ''} selectable
        </div>
      </div>
    </motion.div>
  );

  const renderStep5 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Header Section */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mr-3">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment Information</h2>
            <p className="text-gray-600">
              Record advance and rent payments for {selectedResident?.firstName}
            </p>
          </div>
        </div>
        
        {/* Removed debug controls/info for a cleaner, production-ready UI */}
      </div>

      {/* Payment Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Advance Payment */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Advance Payment</h3>
            </div>
            
            {/* Payment Status Selector */}
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handlePaymentStatusChange('advance', 'paid')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  paymentStatus.advance === 'paid' 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => handlePaymentStatusChange('advance', 'pending')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  paymentStatus.advance === 'pending' 
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-yellow-50'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => handlePaymentStatusChange('advance', 'not_required')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  paymentStatus.advance === 'not_required' 
                    ? 'bg-gray-100 text-gray-700 border border-gray-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Not Required
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advance Amount (₹)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={advancePayment.amount}
                onChange={(e) => handleAdvanceAmountChange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all"
                min="0"
                step="0.01"
                disabled={paymentStatus.advance === 'not_required'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date
              </label>
              <input
                type="date"
                value={advancePayment.date}
                onChange={(e) => setAdvancePayment(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Number (Optional)
              </label>
              <input
                type="text"
                placeholder="ADV-001"
                value={advancePayment.receiptNumber}
                onChange={(e) => setAdvancePayment(prev => ({ ...prev, receiptNumber: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Rent Payment */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Home className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Rent Payment</h3>
            </div>
            
            {/* Payment Status Selector */}
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handlePaymentStatusChange('rent', 'paid')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  paymentStatus.rent === 'paid' 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => handlePaymentStatusChange('rent', 'pending')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  paymentStatus.rent === 'pending' 
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-yellow-50'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => handlePaymentStatusChange('rent', 'not_required')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  paymentStatus.rent === 'not_required' 
                    ? 'bg-gray-100 text-gray-700 border border-gray-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Not Required
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rent Amount (₹)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="0.00"
                  value={rentPayment.amount}
                  onChange={(e) => handleRentAmountChange(e.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  min="0"
                  step="0.01"
                  disabled={paymentStatus.rent === 'not_required'}
                />
                <button
                  type="button"
                  onClick={handleOpenRentCalculation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  disabled={paymentStatus.rent === 'not_required'}
                >
                  <DollarSign className="h-4 w-4" />
                  Custom
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date
              </label>
              <input
                type="date"
                value={rentPayment.date}
                onChange={(e) => setRentPayment(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Number (Optional)
              </label>
                             <input
                 type="text"
                 placeholder="RENT-001"
                 value={rentPayment.receiptNumber}
                 onChange={(e) => setRentPayment(prev => ({ ...prev, receiptNumber: e.target.value }))}
                 className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
               />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Payment Summary</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <p className="text-sm text-gray-600 font-medium">Advance Payment</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                paymentStatus.advance === 'paid' ? 'bg-green-100 text-green-700' :
                paymentStatus.advance === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {paymentStatus.advance === 'paid' ? 'Paid' :
                 paymentStatus.advance === 'pending' ? 'Pending' : 'Not Required'}
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              ₹{advancePayment.amount ? parseFloat(advancePayment.amount).toLocaleString() : '0.00'}
            </p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <p className="text-sm text-gray-600 font-medium">Rent Payment</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                paymentStatus.rent === 'paid' ? 'bg-green-100 text-green-700' :
                paymentStatus.rent === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {paymentStatus.rent === 'paid' ? 'Paid' :
                 paymentStatus.rent === 'pending' ? 'Pending' : 'Not Required'}
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              ₹{rentPayment.amount ? parseFloat(rentPayment.amount).toLocaleString() : '0.00'}
            </p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600 font-medium">Total Amount</p>
            <p className="text-2xl font-bold text-purple-600">
              ₹{((advancePayment.amount ? parseFloat(advancePayment.amount) : 0) + (rentPayment.amount ? parseFloat(rentPayment.amount) : 0)).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {paymentStatus.advance === 'paid' && paymentStatus.rent === 'paid' ? 'All Payments Complete' :
               paymentStatus.advance === 'pending' || paymentStatus.rent === 'pending' ? 'Some Payments Pending' :
               'No Payments Required'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6">
        <button
          onClick={goBack}
          className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-all duration-200 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        
        <button
          onClick={handlePaymentSubmit}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Continue to Confirmation
        </button>
      </div>
    </motion.div>
  );

  const renderStep6 = () => (
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
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Confirm Onboarding</h2>
            <p className="text-gray-600">
              Review and confirm the onboarding details
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resident Information */}
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-4 rounded-xl border border-sky-200">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Resident Details</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-white rounded-lg">
              <span className="text-sm text-gray-600 font-medium">Name:</span>
              <span className="font-semibold text-gray-900">
                {selectedResident?.firstName} {selectedResident?.lastName}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded-lg">
              <span className="text-sm text-gray-600 font-medium">Phone:</span>
              <span className="font-semibold text-gray-900">{selectedResident?.phone}</span>
            </div>
            {selectedResident?.email && (
              <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                <span className="text-sm text-gray-600 font-medium">Email:</span>
                <span className="font-semibold text-gray-900">{selectedResident.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Assignment Information */}
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-4 rounded-xl border border-sky-200">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Home className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Assignment Details</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-white rounded-lg">
              <span className="text-sm text-gray-600 font-medium">Room Type:</span>
              <span className="font-semibold text-gray-900">{selectedSharingType?.name}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded-lg">
              <span className="text-sm text-gray-600 font-medium">Room Number:</span>
              <span className="font-semibold text-gray-900">{selectedRoom?.roomNumber}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded-lg">
              <span className="text-sm text-gray-600 font-medium">Bed Number:</span>
              <span className="font-semibold text-gray-900">Bed {selectedBed}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded-lg">
              <span className="text-sm text-gray-600 font-medium">Monthly Rent:</span>
              <span className="font-semibold text-green-600">
                ₹{selectedSharingType?.cost?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Payment Details</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Advance Payment */}
          <div className="p-3 bg-white rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <CreditCard className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Advance Payment</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  paymentStatus.advance === 'paid' ? 'bg-green-100 text-green-600' :
                  paymentStatus.advance === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {paymentStatus.advance === 'paid' ? 'Paid' :
                   paymentStatus.advance === 'pending' ? 'Pending' : 'Not Required'}
                </span>
              </div>
              {advancePayment.amount && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="font-semibold text-green-600">₹{parseFloat(advancePayment.amount).toLocaleString()}</span>
                </div>
              )}
              {advancePayment.date && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="font-semibold text-gray-900">{new Date(advancePayment.date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Rent Payment */}
          <div className="p-3 bg-white rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <Home className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Rent Payment</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  paymentStatus.rent === 'paid' ? 'bg-green-100 text-green-600' :
                  paymentStatus.rent === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {paymentStatus.rent === 'paid' ? 'Paid' :
                   paymentStatus.rent === 'pending' ? 'Pending' : 'Not Required'}
                </span>
              </div>
              {rentPayment.amount && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="font-semibold text-blue-600">₹{parseFloat(rentPayment.amount).toLocaleString()}</span>
                </div>
              )}
              {rentPayment.date && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="font-semibold text-gray-900">{new Date(rentPayment.date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Total Payment Summary */}
        {((advancePayment.amount && parseFloat(advancePayment.amount) > 0) || (rentPayment.amount && parseFloat(rentPayment.amount) > 0)) && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-purple-600">
                ₹{((advancePayment.amount ? parseFloat(advancePayment.amount) : 0) + (rentPayment.amount ? parseFloat(rentPayment.amount) : 0)).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Onboarding Date Selection */}
      <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-4 rounded-xl border border-sky-200">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <CalendarDays className="h-4 w-4 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Onboarding Date</h3>
        </div>
        
        <div className="space-y-3">
          {/* Show existing dates from resident */}
          {selectedResident?.checkInDate && (
            <div className="p-3 bg-white rounded-lg border border-sky-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4 text-sky-600" />
                  <div>
                    <span className="text-xs text-gray-600 font-medium">Original Check-in Date:</span>
                    <p className="text-sm font-semibold text-sky-700">
                      {(() => {
                        if (selectedResident.checkInDate) {
                          const parsedDate = new Date(selectedResident.checkInDate);
                          if (!isNaN(parsedDate.getTime())) {
                            return parsedDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                          }
                        }
                        return 'Not specified';
                      })()}
                    </p>
                  </div>
                </div>
                {selectedResident?.contractStartDate && (
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="h-4 w-4 text-sky-600" />
                    <div>
                      <span className="text-xs text-gray-600 font-medium">Original Contract Start:</span>
                      <p className="text-sm font-semibold text-sky-700">
                        {(() => {
                          if (selectedResident.contractStartDate) {
                            const parsedDate = new Date(selectedResident.contractStartDate);
                            if (!isNaN(parsedDate.getTime())) {
                              return parsedDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              });
                            }
                          }
                          return 'Not specified';
                        })()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {selectedResident?.checkInDate ? 'Update onboarding date (optional)' : 'Select the date when the resident will move in'}
            </label>
            <input
              type="date"
              value={onboardingDate}
              onChange={(e) => setOnboardingDateSafe(e.target.value)}
              min={(() => {
                const today = new Date();
                if (!isNaN(today.getTime())) {
                  return today.toISOString().split('T')[0];
                }
                return '2024-01-01'; // Fallback date
              })()}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-100 focus:border-sky-500 transition-all"
            />
            {selectedResident?.checkInDate && (
              <p className="text-xs text-gray-500 mt-1">
                Leave unchanged to use the original check-in date: {(() => {
                  if (selectedResident.checkInDate) {
                    const parsedDate = new Date(selectedResident.checkInDate);
                    if (!isNaN(parsedDate.getTime())) {
                      return parsedDate.toLocaleDateString();
                    }
                  }
                  return 'Invalid date';
                })()}
              </p>
            )}
          </div>
          
          {onboardingDate && (
            <div className="p-3 bg-white rounded-lg border border-sky-200">
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-medium text-sky-700">
                  Onboarding scheduled for {(() => {
                    if (onboardingDate) {
                      const parsedDate = new Date(onboardingDate);
                      if (!isNaN(parsedDate.getTime())) {
                        return parsedDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                      }
                    }
                    return 'Invalid date';
                  })()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

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
          onClick={handleOnboardingSubmit}
          disabled={loading || !selectedBed}
          className={`flex items-center px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl ${
            selectedBed
              ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Onboarding
            </>
          )}
        </button>
      </div>
    </motion.div>
  );

  const renderStep7 = () => {
    console.log('🚀 renderStep7 function called');
    console.log('📊 Current state in renderStep7:', {
      onboardingSuccess,
      allocationData,
      selectedResident,
      selectedSharingType,
      selectedRoom,
      selectedBed,
      advancePayment,
      rentPayment
    });
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-4"
      >
        {/* Header Section */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center mr-3">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Onboarding Successful!</h2>
              <p className="text-gray-600">
                Resident {selectedResident?.firstName} {selectedResident?.lastName} has been onboarded.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Resident Information */}
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-4 rounded-xl border border-sky-200">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Resident Details</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                <span className="text-sm text-gray-600 font-medium">Name:</span>
                <span className="font-semibold text-gray-900">
                  {selectedResident?.firstName} {selectedResident?.lastName}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                <span className="text-sm text-gray-600 font-medium">Phone:</span>
                <span className="font-semibold text-gray-900">{selectedResident?.phone}</span>
              </div>
              {selectedResident?.email && (
                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                  <span className="text-sm text-gray-600 font-medium">Email:</span>
                  <span className="font-semibold text-gray-900">{selectedResident.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Information */}
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-4 rounded-xl border border-sky-200">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Home className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Assignment Details</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                <span className="text-sm text-gray-600 font-medium">Room Type:</span>
                <span className="font-semibold text-gray-900">{selectedSharingType?.name}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                <span className="text-sm text-gray-600 font-medium">Room Number:</span>
                <span className="font-semibold text-gray-900">{selectedRoom?.roomNumber}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                <span className="text-sm text-gray-600 font-medium">Bed Number:</span>
                <span className="font-semibold text-gray-900">Bed {selectedBed}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                <span className="text-sm text-gray-600 font-medium">Monthly Rent:</span>
                <span className="font-semibold text-green-600">
                  ₹{selectedSharingType?.cost?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Date */}
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-4 rounded-xl border border-sky-200">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Onboarding Date</h3>
          </div>
          
          <div className="p-3 bg-white rounded-lg border border-sky-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-4 w-4 text-sky-600" />
                <div>
                  <span className="text-xs text-gray-600 font-medium">Check-in Date:</span>
                  <p className="text-sm font-semibold text-sky-700">
                    {(() => {
                      const date = selectedResident?.checkInDate || onboardingDate;
                      if (date) {
                        const parsedDate = new Date(date);
                        if (!isNaN(parsedDate.getTime())) {
                          return parsedDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                        }
                      }
                      return 'Not specified';
                    })()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-4 w-4 text-sky-600" />
                <div>
                  <span className="text-xs text-gray-600 font-medium">Contract Start Date:</span>
                  <p className="text-sm font-semibold text-sky-700">
                    {(() => {
                      const date = selectedResident?.contractStartDate || onboardingDate;
                      if (date) {
                        const parsedDate = new Date(date);
                        if (!isNaN(parsedDate.getTime())) {
                          return parsedDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                        }
                      }
                      return 'Not specified';
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        {((advancePayment.amount && parseFloat(advancePayment.amount) > 0) || (rentPayment.amount && parseFloat(rentPayment.amount) > 0)) && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Payment Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Advance Payment */}
              {advancePayment.amount && parseFloat(advancePayment.amount) > 0 && (
                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Advance Payment</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="font-semibold text-green-600">₹{parseFloat(advancePayment.amount).toLocaleString()}</span>
                    </div>
                    {advancePayment.date && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="font-semibold text-gray-900">{new Date(advancePayment.date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {advancePayment.receiptNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Receipt:</span>
                        <span className="font-semibold text-gray-900">{advancePayment.receiptNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rent Payment */}
              {rentPayment.amount && parseFloat(rentPayment.amount) > 0 && (
                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Home className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Rent Payment</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="font-semibold text-blue-600">₹{parseFloat(rentPayment.amount).toLocaleString()}</span>
                    </div>
                    {rentPayment.date && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="font-semibold text-gray-900">{new Date(rentPayment.date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {rentPayment.receiptNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Receipt:</span>
                        <span className="font-semibold text-gray-900">{rentPayment.receiptNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Total Payment Summary */}
            {((advancePayment.amount && parseFloat(advancePayment.amount) > 0) || (rentPayment.amount && parseFloat(rentPayment.amount) > 0)) && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Amount Paid:</span>
                  <span className="text-2xl font-bold text-purple-600">
                    ₹{((advancePayment.amount ? parseFloat(advancePayment.amount) : 0) + (rentPayment.amount ? parseFloat(rentPayment.amount) : 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notice Period Information */}
        {allocationData?.isNoticePeriodBed && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Notice Period Bed Reserved</h3>
            </div>
            <p className="text-sm text-yellow-700">
              This bed has been reserved and will be automatically assigned once the notice period expires.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center items-center pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={resetToStep1}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg hover:from-sky-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Onboarding
            </button>
            
            <button
              onClick={generateAllocationLetter}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Download PDF Letter
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderCurrentStep = () => {
    console.log('🔍 Rendering step:', currentStep);
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      case 7:
        console.log('🎉 Rendering success step (Step 7)');
        console.log('🔍 State values:', {
          onboardingSuccess,
          allocationData,
          selectedResident,
          selectedSharingType,
          selectedRoom,
          selectedBed,
          advancePayment,
          rentPayment
        });
        return renderStep7();
      default:
        return renderStep1();
    }
  };

  // Compact Enhanced Step Progress Component - Modern Design
  const StepProgress = () => {
    const steps = [
      { step: 1, label: 'Resident' },
      { step: 2, label: 'Room Type' },
      { step: 3, label: 'Room' },
      { step: 4, label: 'Bed' },
      { step: 5, label: 'Payment' },
      { step: 6, label: 'Confirm' },
      { step: 7, label: 'Complete' }
    ];

    return (
      <div className="relative w-full mb-4">
        {/* Compact Back Button Section */}
        <div className="flex justify-between items-center mb-3">
          {currentStep > 1 ? (
            <button
              onClick={goBack}
              className="flex items-center text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white px-2 py-1 rounded-md transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back
            </button>
          ) : (
            <div></div>
          )}
          <div className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
            {Math.round((currentStep / 7) * 100)}% Complete
          </div>
        </div>

        {/* Modern Step Indicator */}
        <div className="relative">
          {/* Progress Line Background */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 rounded-full"></div>
          
          {/* Progress Line Fill */}
          <div 
            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>

          {/* Steps */}
          <div className="relative flex items-center justify-between">
            {steps.map((item) => {
              const isCompleted = item.step < currentStep;
              const isActive = item.step === currentStep;

              return (
                <div 
                  key={item.step} 
                  className="flex flex-col items-center relative z-10 flex-1"
                >
                  {/* Step Circle */}
                  <div 
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold
                      transition-all duration-300 ease-in-out
                      ${
                        isCompleted
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md shadow-green-200' 
                          : isActive
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200 scale-110 ring-4 ring-blue-100' 
                          : 'bg-white border-2 border-gray-300 text-gray-400'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span>{item.step}</span>
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <span 
                    className={`
                      text-[10px] mt-1.5 text-center font-medium
                      ${
                        isCompleted || isActive
                          ? 'text-gray-900 font-semibold' 
                          : 'text-gray-500'
                      }
                    `}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Modify the return statement to include the new StepProgress
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4">
      <div className="max-w-full mx-auto px-3 sm:px-2">
        {/* Compact Modern Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2 shadow-md">
              <UserCheck className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-0.5">Resident Onboarding</h1>
              <p className="text-xs text-gray-600">Streamlined onboarding process</p>
            </div>
          </div>
        </div>

        {/* Compact Enhanced Step Progress */}
        <StepProgress />

        {/* Main Content with Compact Design */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {renderCurrentStep()}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Rent Calculation Modal */}
      <AnimatePresence>
        {showRentCalculationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Calculate Rent</h3>
                    <p className="text-sm text-gray-600">Calculate rent based on per day cost</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseRentCalculation}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Per Day Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={perDayCost}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      setPerDayCost(cost);
                      setCalculatedRent(cost * numberOfDays);
                    }}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    min="0"
                    step="0.01"
                    placeholder="Enter per day cost"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Days
                  </label>
                  <input
                    type="number"
                    value={numberOfDays}
                    onChange={(e) => handleDaysChange(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    min="1"
                    placeholder="Enter number of days"
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Calculated Rent:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{calculatedRent.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {perDayCost} × {numberOfDays} days
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCloseRentCalculation}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCalculatedRent}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Save Amount
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResidentOnboarding; 