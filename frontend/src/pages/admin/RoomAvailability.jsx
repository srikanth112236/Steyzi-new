import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Bed, Users, DollarSign, MapPin, Calendar, Clock,
  CheckCircle, Search, RefreshCw, User, BarChart3, Grid3X3, List,
  X, ChevronRight, ChevronLeft, Eye, AlertTriangle, ChevronDown, Table, MoreHorizontal,
  ArrowUpDown, Filter, Star, Wifi, Car, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import ResidentDetails from '../../components/admin/ResidentDetails';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { selectSelectedBranch } from '../../store/slices/branch.slice';

// Custom styles for enhanced scrollbar and animations
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 12px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
    box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
  }

  /* Enhanced card animations */
  @keyframes cardPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }

  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }

  .shimmer-effect {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 1000px 100%;
    animation: shimmer 3s infinite;
  }

  .card-hover-pulse:hover {
    animation: cardPulse 2s ease-in-out infinite;
  }

  /* Smooth gradient transitions */
  .gradient-transition {
    transition: background 0.5s ease;
  }

  /* Glass morphism effect */
  .glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  /* Backdrop blur support for older browsers */
  @supports not (backdrop-filter: blur(10px)) {
    .backdrop-blur-sm {
      background-color: rgba(255, 255, 255, 0.9);
    }
  }

  /* Modern card shadow */
  .modern-card-shadow {
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    transition: box-shadow 0.3s ease;
  }

  .modern-card-shadow:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`;

const RoomAvailability = () => {
  const selectedBranch = useSelector(selectSelectedBranch);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('roomNumber');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [floors, setFloors] = useState([]);
  const [showResidentDetails, setShowResidentDetails] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalBeds: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    noticePeriodBeds: 0,
    occupancyRate: 0
  });

  // Memoized filtered and sorted rooms
  const filteredRooms = useMemo(() => {
    let filtered = [...rooms];

    if (searchTerm) {
      filtered = filtered.filter(room =>
        room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.floorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.beds.some(bed =>
          bed.isOccupied && bed.resident &&
          (bed.resident.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           bed.resident.lastName?.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(room => {
        if (statusFilter === 'available') {
          return room.roomStatus === 'fully_available';
        } else if (statusFilter === 'occupied') {
          return room.roomStatus === 'fully_occupied';
        } else if (statusFilter === 'notice') {
          // Check if any bed in the room is in notice period
          return room.beds.some(bed =>
            bed.isOccupied && bed.residentStatus === 'notice_period'
          );
        } else if (statusFilter === 'partial') {
          return room.roomStatus === 'partially_occupied';
        }
        return true;
      });
    }

    if (floorFilter !== 'all') {
      filtered = filtered.filter(room => room.floorId._id === floorFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'roomNumber':
          aValue = parseInt(a.roomNumber);
          bValue = parseInt(b.roomNumber);
          break;
        case 'floor':
          aValue = a.floorId?.name || '';
          bValue = b.floorId?.name || '';
          break;
        case 'cost':
          aValue = a.cost;
          bValue = b.cost;
          break;
        case 'occupancy':
          aValue = (a.beds.filter(bed => bed.isOccupied).length / a.numberOfBeds) * 100;
          bValue = (b.beds.filter(bed => bed.isOccupied).length / b.numberOfBeds) * 100;
          break;
        case 'status':
          aValue = a.roomStatus;
          bValue = b.roomStatus;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [rooms, searchTerm, statusFilter, floorFilter, sortBy, sortOrder]);

  // Paginated data
  const paginatedRooms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRooms.slice(startIndex, endIndex);
  }, [filteredRooms, currentPage]);

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, floorFilter]);

  // Memoized stats calculation
  const calculatedStats = useMemo(() => {
    // If we have metadata from server, use it (more accurate)
    if (rooms.length > 0 && rooms[0].metadata) {
      return {
        totalRooms: rooms[0].metadata.totalRooms || rooms.length,
        totalBeds: rooms[0].metadata.totalBeds || 0,
        availableBeds: rooms[0].metadata.availableBeds || 0,
        occupiedBeds: rooms[0].metadata.occupiedBeds || 0,
        noticePeriodBeds: rooms[0].metadata.noticePeriodBeds || 0,
        noticePeriodRooms: rooms.filter(room => 
          room.beds.some(bed => bed.isOccupied && bed.residentStatus === 'notice_period')
        ).length,
        occupancyRate: rooms[0].metadata.occupancyRate || 0
      };
    }

    // Fallback to client-side calculation
    let totalBeds = 0;
    let availableBeds = 0;
    let occupiedBeds = 0;
    let noticePeriodBeds = 0;
    let noticePeriodRooms = 0;

    rooms.forEach(room => {
      totalBeds += room.numberOfBeds;
      
      // Check if any bed in the room is in notice period
      const hasNoticePeriodBed = room.beds.some(bed => 
        bed.isOccupied && bed.residentStatus === 'notice_period'
      );
      
      if (hasNoticePeriodBed) {
        noticePeriodRooms++;
      }
      
      room.beds.forEach(bed => {
        if (bed.isOccupied) {
          if (bed.residentStatus === 'notice_period') {
            noticePeriodBeds++;
          } else if (bed.residentStatus === 'active') {
            occupiedBeds++;
          }
        } else {
          availableBeds++;
        }
      });
    });

    const occupancyRate = totalBeds > 0 ? ((occupiedBeds + noticePeriodBeds) / totalBeds * 100).toFixed(1) : 0;

    return {
      totalRooms: rooms.length,
      totalBeds,
      availableBeds,
      occupiedBeds,
      noticePeriodBeds,
      noticePeriodRooms,
      occupancyRate
    };
  }, [rooms]);

  // Update stats when calculated stats change
  useEffect(() => {
    setStats(calculatedStats);
  }, [calculatedStats]);

  // Debounced search handler to prevent excessive re-renders
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  // Debounced search effect to prevent excessive filtering
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // This will trigger re-filtering after user stops typing
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch data when branch changes - only depend on selectedBranch
  useEffect(() => {
    if (!selectedBranch) return;
    setLoading(true);
    // Fetch floors and rooms only when branch changes
    const fetchData = async () => {
      try {
        // Fetch floors with branch filtering
        const floorResponse = await fetch(`/api/pg/floors?branchId=${selectedBranch._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        });
        const floorData = await floorResponse.json();
        if (floorData.success) {
          setFloors(floorData.data);
        }

        // Fetch rooms with branch filtering
        const roomResponse = await fetch(`/api/pg/rooms?branchId=${selectedBranch._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        });
        const roomData = await roomResponse.json();
        if (roomData.success) {
          // Server now returns enhanced room data with proper bed status
          // No need to filter by branchId as server handles it
          setRooms(roomData.data);
          setLastFetchTime(Date.now());
          
          // Log enhanced data for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log('Enhanced room data received:', roomData);
            console.log('Metadata:', roomData.metadata);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBranch]); // Only depend on selectedBranch

  // Memoized utility functions
  const getBedStatusColor = useCallback((bed) => {
    if (!bed.isOccupied) return 'bg-green-100 text-green-800 border-green-200';
    if (bed.residentStatus === 'notice_period') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  }, []);

  const getBedStatusIcon = useCallback((bed) => {
    if (!bed.isOccupied) return <CheckCircle className="h-4 w-4" />;
    if (bed.residentStatus === 'notice_period') return <Clock className="h-4 w-4" />;
    return <Users className="h-4 w-4" />;
  }, []);

  const getBedStatusText = useCallback((bed) => {
    if (!bed.isOccupied) return 'Available';
    if (bed.residentStatus === 'notice_period') return 'Notice Period';
    return 'Occupied';
  }, []);

  // Get room status color based on sharing type
  const getRoomStatusColor = useCallback((room) => {
    if (room.beds.some(bed => bed.isOccupied && bed.residentStatus === 'notice_period')) {
      return 'bg-yellow-500';
    }
    if (room.roomStatus === 'fully_available') {
      return 'bg-green-500';
    }
    if (room.roomStatus === 'fully_occupied') {
      return 'bg-blue-500';
    }
    return 'bg-orange-500';
  }, []);

  // Get room status text
  const getRoomStatusText = useCallback((room) => {
    if (room.beds.some(bed => bed.isOccupied && bed.residentStatus === 'notice_period')) {
      return 'Notice Period';
    }
    if (room.roomStatus === 'fully_available') {
      return 'Available';
    }
    if (room.roomStatus === 'fully_occupied') {
      return 'Full';
    }
    return 'Partial';
  }, []);

  // Get sharing type color
  const getSharingTypeColor = useCallback((sharingType) => {
    const colors = {
      '1-sharing': 'bg-purple-100 text-purple-800 border-purple-200',
      '2-sharing': 'bg-blue-100 text-blue-800 border-blue-200',
      '3-sharing': 'bg-green-100 text-green-800 border-green-200',
      '4-sharing': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[sharingType] || 'bg-gray-100 text-gray-800 border-gray-200';
  }, []);

  const handleResidentView = useCallback((resident) => {
    setSelectedResident(resident);
    setShowResidentDetails(true);
  }, []);

  const handleRoomClick = useCallback((room) => {
    setSelectedRoom(room);
    setShowRoomModal(true);
  }, []);

  // Simple refresh function without useCallback to avoid dependency issues
  const handleRefresh = async () => {
    if (!selectedBranch) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/pg/rooms?branchId=${selectedBranch._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        // Server now returns enhanced room data with proper bed status
        setRooms(data.data);
        setLastFetchTime(Date.now());
        toast.success('Rooms refreshed successfully');
        
        // Log enhanced data for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('Refreshed room data:', data);
        }
      } else {
        toast.error(data.message || 'Failed to fetch rooms');
      }
    } catch (error) {
      console.error('Error refreshing rooms:', error);
      toast.error('Failed to refresh rooms');
    } finally {
      setLoading(false);
    }
  };

  // Ultra-Modern Compact Premium Room Card with Enhanced Hover Effects
  const renderCompactRoomCard = useCallback((room) => {
    const isNotice = room.beds.some(bed => bed.isOccupied && bed.residentStatus === 'notice_period');
    const isAvailable = room.roomStatus === 'fully_available';
    const isOccupied = room.roomStatus === 'fully_occupied';
    const isPartial = !isAvailable && !isOccupied && !isNotice;

    const statusConfig = {
      notice: {
        gradient: 'from-amber-500 via-orange-500 to-red-500',
        bgGradient: 'from-amber-50/95 via-orange-50/75 to-red-50/55',
        accentColor: 'border-amber-300/60',
        icon: <Clock className="h-2.5 w-2.5" />,
        glowColor: 'shadow-amber-500/40',
        textColor: 'text-amber-700',
        hoverBg: 'from-amber-100/90 to-orange-100/80',
        statusText: 'Notice Period'
      },
      available: {
        gradient: 'from-emerald-500 via-green-500 to-teal-500',
        bgGradient: 'from-emerald-50/95 via-green-50/75 to-teal-50/55',
        accentColor: 'border-emerald-300/60',
        icon: <CheckCircle className="h-2.5 w-2.5" />,
        glowColor: 'shadow-emerald-500/40',
        textColor: 'text-emerald-700',
        hoverBg: 'from-emerald-100/90 to-green-100/80',
        statusText: 'Available'
      },
      occupied: {
        gradient: 'from-blue-500 via-indigo-500 to-purple-500',
        bgGradient: 'from-blue-50/95 via-indigo-50/75 to-purple-50/55',
        accentColor: 'border-blue-300/60',
        icon: <Users className="h-2.5 w-2.5" />,
        glowColor: 'shadow-blue-500/40',
        textColor: 'text-blue-700',
        hoverBg: 'from-blue-100/90 to-indigo-100/80',
        statusText: 'Occupied'
      },
      partial: {
        gradient: 'from-purple-500 via-pink-500 to-rose-500',
        bgGradient: 'from-purple-50/95 via-pink-50/75 to-rose-50/55',
        accentColor: 'border-purple-300/60',
        icon: <Bed className="h-2.5 w-2.5" />,
        glowColor: 'shadow-purple-500/40',
        textColor: 'text-purple-700',
        hoverBg: 'from-purple-100/90 to-pink-100/80',
        statusText: 'Partial'
      }
    };

    const status = isNotice ? 'notice' : isAvailable ? 'available' : isOccupied ? 'occupied' : 'partial';
    const config = statusConfig[status];
    const occupancyPercent = Math.round((room.beds.filter(bed => bed.isOccupied).length / room.numberOfBeds) * 100);
    const availableBeds = room.availableBedCount || 0;
    const totalBeds = room.numberOfBeds;
    const occupiedBeds = totalBeds - availableBeds;

    return (
      <motion.div
        key={room._id}
        initial={{ opacity: 0, y: 30, scale: 0.88 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94],
          delay: Math.random() * 0.15
        }}
        whileHover={{
          scale: 1.02,
          y: -3,
          transition: {
            duration: 0.2,
            ease: "easeOut"
          }
        }}
        whileTap={{
          scale: 0.95,
          transition: { duration: 0.1 }
        }}
        className="relative group cursor-pointer"
        onClick={() => handleRoomClick(room)}
      >
        {/* Enhanced Multi-layer Glow Effect */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r ${config.gradient} rounded-xl blur-2xl opacity-0 group-hover:opacity-15 transition-all duration-700 ${config.glowColor}`}
          initial={{ scale: 0.8 }}
          whileHover={{ scale: 1.15, opacity: 0.2 }}
        />
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${config.hoverBg} rounded-xl opacity-0 group-hover:opacity-80 transition-all duration-300`}
          initial={{ scale: 0.9 }}
          whileHover={{ scale: 1.02 }}
        />

        {/* Main Card Container */}
        <motion.div
          className={`relative bg-gradient-to-br ${config.bgGradient} rounded-xl overflow-hidden
            border ${config.accentColor} shadow-lg backdrop-blur-sm
            transition-all duration-300 group-hover:shadow-2xl
            group-hover:border-opacity-100 card-hover-pulse
            group-hover:bg-gradient-to-br ${config.hoverBg}`}
          whileHover={{
            boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.12)`
          }}
        >
          {/* Ultra-Minimal Header */}
          <div className="relative px-2 py-2">
            {/* Single Compact Row */}
            <div className="flex items-center justify-between">
              {/* Left: Room Number + Status */}
              <div className="flex items-center space-x-1.5">
                <motion.div
                  className={`bg-gradient-to-r ${config.gradient} px-2 py-0.5 rounded-md shadow-sm flex items-center space-x-1 border border-white/60`}
                  whileHover={{ scale: 1.02 }}
                >
                  <Building2 className="h-2.5 w-2.5 text-white/95" />
                  <span className="text-white font-bold text-xs leading-none">
                    {room.roomNumber}
                  </span>
                </motion.div>
                <motion.div
                  className="bg-white/95 px-1.5 py-0.5 rounded-md shadow-sm border border-gray-200/70 flex items-center"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className={`bg-gradient-to-r ${config.gradient} p-0.5 rounded`}>
                    {config.icon}
                  </div>
                </motion.div>
              </div>

              {/* Right: Price */}
              <div className="text-xs font-bold text-gray-800 bg-white/80 px-1.5 py-0.5 rounded-md border">
                ₹{(room.cost/1000).toFixed(1)}k
              </div>
            </div>

            {/* Secondary Info - Ultra Compact */}
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center space-x-1.5 text-[9px] text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-2 w-2 mr-0.5" />
                  <span className="font-medium truncate max-w-10">{room.floorId?.name}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-2 w-2 mr-0.5" />
                  <span className="font-medium">{room.sharingType.split('-')[0]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Minimal Stats Section */}
          <div className="px-2 pb-2">
            {/* Occupancy Progress - Ultra Compact */}
            <div className="mb-1.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-medium text-gray-600">Occupancy</span>
                <span className={`text-[9px] font-bold ${config.textColor}`}>{occupancyPercent}%</span>
              </div>
              <div className="w-full bg-gray-200/60 rounded-full h-1 overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${config.gradient} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${occupancyPercent}%` }}
                  transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Bed Status - Ultra Minimal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-0.5">
                  {Array.from({ length: Math.min(totalBeds, 4) }, (_, i) => {
                    const bed = room.beds[i];
                    return (
                      <motion.div
                        key={i}
                        className={`w-1 h-1 rounded-full ${
                          bed?.isOccupied
                            ? bed.residentStatus === 'notice_period'
                              ? 'bg-amber-400'
                              : 'bg-blue-500'
                            : 'bg-gray-300'
                        }`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.06 }}
                      />
                    );
                  })}
                  {totalBeds > 4 && (
                    <div className="w-1 h-1 rounded-full bg-gray-400 flex items-center justify-center">
                      <span className="text-[5px] font-bold text-white leading-none">+</span>
                    </div>
                  )}
                </div>
                <span className="text-[8px] text-gray-500 ml-1 font-medium">
                  {availableBeds}/{totalBeds}
                </span>
              </div>

              <div className="text-[8px] text-gray-500 font-medium">
                {occupiedBeds} occupied
              </div>
            </div>
          </div>

          {/* Premium Hover Overlay with Rich Details */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/98 via-white/96 to-white/92 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl"
            initial={{ y: 10 }}
            whileHover={{ y: 0 }}
          >
            <div className="absolute inset-0 p-2">
              {/* Quick Stats Display */}
              <motion.div
                className="bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-white/70 mb-2"
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05 }}
              >
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div className="text-center">
                    <div className={`font-bold ${config.textColor}`}>{occupancyPercent}%</div>
                    <div className="text-gray-500">Occupied</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-700">₹{(room.cost/totalBeds).toFixed(0)}</div>
                    <div className="text-gray-500">Per Bed</div>
                  </div>
                </div>
              </motion.div>

              {/* Action Button */}
              <motion.div
                className="flex justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg px-3 py-1.5 shadow-lg flex items-center space-x-1.5 cursor-pointer"
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Eye className="h-3 w-3" />
                  <span className="text-xs font-semibold">View Details</span>
                </motion.div>
              </motion.div>

              {/* Status Badge */}
              <motion.div
                className="absolute top-2 right-2"
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <div className={`bg-gradient-to-r ${config.gradient} text-white px-2 py-0.5 rounded-md text-[8px] font-bold shadow-md`}>
                  {config.statusText}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Minimal Decorative Accent */}
          <motion.div
            className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-bl from-white/20 to-transparent rounded-bl-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          />
        </motion.div>
      </motion.div>
    );
  }, [handleRoomClick]);

  // Table view renderer
  const renderTableView = useCallback(() => {
    const handleSort = (field) => {
      if (sortBy === field) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortBy(field);
        setSortOrder('asc');
      }
    };

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('roomNumber')}
                    className="flex items-center space-x-1 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <span>Room</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('floor')}
                    className="flex items-center space-x-1 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <span>Floor</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Sharing</th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('cost')}
                    className="flex items-center space-x-1 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <span>Rent</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Beds</th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('occupancy')}
                    className="flex items-center space-x-1 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <span>Occupancy</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center space-x-1 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <span>Status</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedRooms.map((room, index) => {
                const isNotice = room.beds.some(bed => bed.isOccupied && bed.residentStatus === 'notice_period');
                const isAvailable = room.roomStatus === 'fully_available';
                const isOccupied = room.roomStatus === 'fully_occupied';
                const isPartial = !isAvailable && !isOccupied && !isNotice;
                const occupancyPercent = Math.round((room.beds.filter(bed => bed.isOccupied).length / room.numberOfBeds) * 100);

                const statusConfig = {
                  notice: {
                    bg: 'bg-amber-100 text-amber-800 border-amber-200',
                    icon: <Clock className="h-4 w-4" />,
                    text: 'Notice Period'
                  },
                  available: {
                    bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    icon: <CheckCircle className="h-4 w-4" />,
                    text: 'Available'
                  },
                  occupied: {
                    bg: 'bg-blue-100 text-blue-800 border-blue-200',
                    icon: <Users className="h-4 w-4" />,
                    text: 'Occupied'
                  },
                  partial: {
                    bg: 'bg-purple-100 text-purple-800 border-purple-200',
                    icon: <Bed className="h-4 w-4" />,
                    text: 'Partial'
                  }
                };

                const status = isNotice ? 'notice' : isAvailable ? 'available' : isOccupied ? 'occupied' : 'partial';
                const config = statusConfig[status];

                return (
                  <motion.tr
                    key={room._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleRoomClick(room)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{room.roomNumber}</div>
                          <div className="text-sm text-gray-500">Room</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{room.floorId?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {room.sharingType.split('-')[0]} Sharing
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">₹{room.cost.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {room.availableBedCount || 0}/{room.numberOfBeds}
                        </span>
                        <div className="flex space-x-1">
                          {room.beds.map((bed, bedIndex) => (
                            <div
                              key={bedIndex}
                              className={`w-2 h-2 rounded-full ${
                                bed.isOccupied
                                  ? bed.residentStatus === 'notice_period'
                                    ? 'bg-amber-400'
                                    : 'bg-blue-500'
                                  : 'bg-gray-300'
                              }`}
                              title={`Bed ${bed.bedNumber}: ${getBedStatusText(bed)}`}
                            />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              status === 'available' ? 'bg-emerald-500' :
                              status === 'occupied' ? 'bg-blue-500' :
                              status === 'notice' ? 'bg-amber-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${occupancyPercent}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12">{occupancyPercent}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}>
                        {config.icon}
                        <span className="ml-1">{config.text}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRoomClick(room);
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        View
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No rooms found</h4>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || floorFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No rooms have been created yet for this branch.'
              }
            </p>
          </div>
        ) : totalPages > 1 && (
          <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Showing <span className="font-bold text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                  <span className="font-bold text-gray-900">
                    {Math.min(currentPage * itemsPerPage, filteredRooms.length)}
                  </span> of{' '}
                  <span className="font-bold text-gray-900">{filteredRooms.length}</span> rooms
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
    );
  }, [paginatedRooms, filteredRooms, handleRoomClick, sortBy, sortOrder, currentPage, totalPages, itemsPerPage]);

  // Show loading spinner when loading and no rooms
  if (!selectedBranch) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Room Availability</h2>
            <p className="text-gray-600">Please use the branch selector in the header.</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-10 w-10 text-blue-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Select a Branch</h4>
          <p className="text-gray-600">Choose a branch to view room availability and bed status</p>
        </div>
      </div>
    );
  }

  if (loading && rooms.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Room Availability</h2>
            <p className="text-gray-600">Monitor room and bed status across all floors</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading room data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customScrollbarStyles }} />
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Room Availability</h2>
          <p className="text-gray-600">Monitor room and bed status across all floors</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm scale-105'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              title="Grid View"
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
              title="Table View"
            >
              <Table className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedBranch && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 rounded-2xl border border-blue-200/50 p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/30 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalRooms}</div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Rooms</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-100 to-slate-50 rounded-2xl border border-gray-200/50 p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gray-200/30 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Bed className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalBeds}</div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Beds</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-100 to-teal-50 rounded-2xl border border-emerald-200/50 p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/30 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-emerald-700 mb-1">{stats.availableBeds}</div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Available</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50 rounded-2xl border border-indigo-200/50 p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-200/30 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-indigo-700 mb-1">{stats.occupiedBeds}</div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Occupied</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`relative overflow-hidden rounded-2xl border p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 group ${
              stats.noticePeriodBeds > 0 
                ? 'bg-gradient-to-br from-amber-50 via-yellow-100 to-orange-50 border-amber-300/50' 
                : 'bg-gradient-to-br from-amber-50 via-amber-100 to-yellow-50 border-amber-200/50'
            }`}
          >
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500 ${
              stats.noticePeriodBeds > 0 ? 'bg-amber-300/40' : 'bg-amber-200/30'
            }`}></div>
            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                stats.noticePeriodBeds > 0 
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
                  : 'bg-gradient-to-br from-amber-400 to-yellow-500'
              }`}>
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className={`text-3xl font-bold mb-1 ${
                stats.noticePeriodBeds > 0 ? 'text-amber-800' : 'text-amber-700'
              }`}>{stats.noticePeriodBeds}</div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Notice Period</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-violet-100 to-fuchsia-50 rounded-2xl border border-purple-200/50 p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/30 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-purple-700 mb-1">{stats.occupancyRate}%</div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Occupancy</div>
            </div>
          </motion.div>
        </div>
      )}

      {selectedBranch && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-200/50 shadow-lg p-5 backdrop-blur-sm bg-gradient-to-br from-white to-gray-50/50"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search rooms, floors, residents..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-white/80 backdrop-blur-sm border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Room Status</SelectLabel>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="notice">Notice Period</SelectItem>
                    <SelectItem value="partial">Partially Occupied</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              
              <Select value={floorFilter} onValueChange={setFloorFilter}>
                <SelectTrigger className="w-[180px] bg-white/80 backdrop-blur-sm border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select Floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Floor</SelectLabel>
                    <SelectItem value="all">All Floors</SelectItem>
                    {floors.map(floor => (
                      <SelectItem key={floor._id} value={floor._id}>
                        {floor.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
              <div className="text-sm font-semibold text-gray-700">
                Showing <span className="text-blue-600 font-bold">{filteredRooms.length}</span> of <span className="text-gray-900 font-bold">{rooms.length}</span> rooms
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {selectedBranch ? (
        <div className="space-y-4">
          {filteredRooms.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-10 w-10 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Rooms Found</h4>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || floorFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No rooms have been created yet for this branch.'
                }
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4"
            >
              {filteredRooms.map((room, index) => (
                <motion.div
                  key={room._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.05,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                >
                  {renderCompactRoomCard(room)}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {renderTableView()}
            </motion.div>
          )}
        </div>
      ) : null}

      {/* Premium Modern Room Details Modal */}
      <AnimatePresence>
        {showRoomModal && selectedRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowRoomModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-auto max-h-[85vh] overflow-hidden relative border border-gray-100"
            >
              {/* Premium Header with Dynamic Gradient */}
              {(() => {
                const isNotice = selectedRoom.beds.some(bed => bed.isOccupied && bed.residentStatus === 'notice_period');
                const isAvailable = selectedRoom.roomStatus === 'fully_available';
                const isOccupied = selectedRoom.roomStatus === 'fully_occupied';
                const isPartial = !isAvailable && !isOccupied && !isNotice;
                const status = isNotice ? 'notice' : isAvailable ? 'available' : isOccupied ? 'occupied' : 'partial';

                const gradientConfig = {
                  notice: 'from-amber-400 via-orange-500 to-red-500',
                  available: 'from-emerald-400 via-green-500 to-teal-500',
                  occupied: 'from-blue-400 via-indigo-500 to-purple-500',
                  partial: 'from-purple-400 via-pink-500 to-rose-500'
                };

                return (
                  <div className={`relative bg-gradient-to-br ${gradientConfig[status]} p-4 overflow-hidden`}>
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl animate-pulse"></div>
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-white">
                      <div className="flex items-center space-x-3">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                          className="bg-white/25 backdrop-blur-md rounded-xl p-2 shadow-xl border border-white/30"
                        >
                          <Building2 className="h-5 w-5" />
                        </motion.div>
                        <div>
                          <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl font-bold tracking-tight"
                          >
                            Room {selectedRoom.roomNumber}
                          </motion.h2>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className="flex items-center space-x-2 text-white/95 text-xs mt-0.5"
                          >
                            <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md">
                              <MapPin className="h-3 w-3" />
                              <span className="font-medium">{selectedRoom.floorId?.name}</span>
                            </div>
                            <span className="text-white/60">•</span>
                            <span className="font-medium">{selectedRoom.sharingType}</span>
                          </motion.div>
                        </div>
                      </div>
                      <motion.button
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        onClick={() => setShowRoomModal(false)}
                        className="bg-white/25 backdrop-blur-md rounded-lg p-1.5 hover:bg-white/35 transition-all duration-200 shadow-lg border border-white/30 hover:scale-110"
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>
                );
              })()}

              {/* Premium Modal Content */}
              <div className="max-h-[70vh] overflow-y-auto custom-scrollbar bg-gradient-to-br from-gray-50 to-white">
                <div className="p-4 space-y-4">
                  {/* Compact Stats Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
                      className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-3 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="relative z-10">
                        <div className="flex items-center mb-1.5">
                          <DollarSign className="h-4 w-4 opacity-90" />
                        </div>
                        <div className="text-lg font-bold mb-0.5">₹{(selectedRoom.cost/1000).toFixed(1)}k</div>
                        <div className="text-[10px] font-medium opacity-90 uppercase tracking-wide">Monthly</div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-3 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="relative z-10">
                        <div className="flex items-center mb-1.5">
                          <CheckCircle className="h-4 w-4 opacity-90" />
                        </div>
                        <div className="text-lg font-bold mb-0.5">{selectedRoom.availableBedCount || 0}</div>
                        <div className="text-[10px] font-medium opacity-90 uppercase tracking-wide">Available</div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.35, type: "spring", stiffness: 200 }}
                      className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-3 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="relative z-10">
                        <div className="flex items-center mb-1.5">
                          <Users className="h-4 w-4 opacity-90" />
                        </div>
                        <div className="text-lg font-bold mb-0.5">{selectedRoom.beds.filter(bed => bed.isOccupied).length}</div>
                        <div className="text-[10px] font-medium opacity-90 uppercase tracking-wide">Occupied</div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                      className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-3 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="relative z-10">
                        <div className="flex items-center mb-1.5">
                          <BarChart3 className="h-4 w-4 opacity-90" />
                        </div>
                        <div className="text-lg font-bold mb-0.5">{Math.round((selectedRoom.beds.filter(bed => bed.isOccupied).length / selectedRoom.numberOfBeds) * 100)}%</div>
                        <div className="text-[10px] font-medium opacity-90 uppercase tracking-wide">Occupancy</div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Compact Room Information Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-1.5 mr-2 shadow-md">
                          <Building2 className="h-3.5 w-3.5 text-white" />
                        </div>
                        Room Information
                      </h3>
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        selectedRoom.beds.some(bed => bed.isOccupied && bed.residentStatus === 'notice_period')
                          ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-300'
                          : selectedRoom.roomStatus === 'fully_available'
                          ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-300'
                          : selectedRoom.roomStatus === 'fully_occupied'
                          ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-300'
                          : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-300'
                      }`}>
                        <span className="flex items-center space-x-1.5">
                          {selectedRoom.beds.some(bed => bed.isOccupied && bed.residentStatus === 'notice_period')
                            ? <Clock className="h-3 w-3" />
                            : selectedRoom.roomStatus === 'fully_available'
                            ? <CheckCircle className="h-3 w-3" />
                            : selectedRoom.roomStatus === 'fully_occupied'
                            ? <Users className="h-3 w-3" />
                            : <Bed className="h-3 w-3" />
                          }
                          <span>{getRoomStatusText(selectedRoom)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Compact Info Grid */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-200/50">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <MapPin className="h-3 w-3 text-blue-600" />
                          <span className="text-[10px] font-semibold text-gray-600 uppercase">Floor</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900">{selectedRoom.floorId?.name}</div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-2 border border-purple-200/50">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <Users className="h-3 w-3 text-purple-600" />
                          <span className="text-[10px] font-semibold text-gray-600 uppercase">Sharing</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900">{selectedRoom.sharingType}</div>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-2 border border-emerald-200/50">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <Bed className="h-3 w-3 text-emerald-600" />
                          <span className="text-[10px] font-semibold text-gray-600 uppercase">Beds</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900">{selectedRoom.numberOfBeds}</div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-2 border border-orange-200/50">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <DollarSign className="h-3 w-3 text-orange-600" />
                          <span className="text-[10px] font-semibold text-gray-600 uppercase">Per Bed</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900">₹{Math.round(selectedRoom.cost / selectedRoom.numberOfBeds).toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Compact Financial Summary */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-1.5 shadow-md">
                          <DollarSign className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-gray-600 uppercase">Revenue</div>
                          <div className="text-sm font-bold text-green-600">
                            ₹{(selectedRoom.cost * selectedRoom.beds.filter(bed => bed.isOccupied).length).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Compact Bed Status Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-1.5 mr-2 shadow-md">
                          <Bed className="h-3.5 w-3.5 text-white" />
                        </div>
                        Bed Status Overview
                      </h3>
                    </div>

                    {/* Compact Bed Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                      {selectedRoom.beds.map((bed, bedIndex) => {
                        const isOccupied = bed.isOccupied;
                        const isNoticePeriod = isOccupied && bed.residentStatus === 'notice_period';

                        const bedConfig = isOccupied
                          ? isNoticePeriod
                            ? {
                                gradient: 'from-amber-50 to-orange-50',
                                border: 'border-amber-300',
                                headerBg: 'bg-amber-100',
                                iconColor: 'text-amber-700',
                                badgeBg: 'bg-amber-200 text-amber-900',
                                badgeText: 'Notice'
                              }
                            : {
                                gradient: 'from-blue-50 to-indigo-50',
                                border: 'border-blue-300',
                                headerBg: 'bg-blue-100',
                                iconColor: 'text-blue-700',
                                badgeBg: 'bg-blue-200 text-blue-900',
                                badgeText: 'Occupied'
                              }
                          : {
                              gradient: 'from-emerald-50 to-green-50',
                              border: 'border-emerald-300',
                              headerBg: 'bg-emerald-100',
                              iconColor: 'text-emerald-700',
                              badgeBg: 'bg-emerald-200 text-emerald-900',
                              badgeText: 'Free'
                            };

                        return (
                          <motion.div
                            key={bedIndex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.03 * bedIndex, type: "spring", stiffness: 200 }}
                            whileHover={{ scale: 1.02 }}
                            className={`relative group rounded-lg border ${bedConfig.border} bg-gradient-to-br ${bedConfig.gradient} overflow-hidden shadow-sm hover:shadow-md transition-all duration-300`}
                          >
                            {/* Compact Bed Header */}
                            <div className={`px-2 py-1.5 border-b ${bedConfig.headerBg} flex items-center justify-between`}>
                              <div className="flex items-center space-x-1.5">
                                <Bed className={`h-3 w-3 ${bedConfig.iconColor}`} />
                                <span className="font-bold text-gray-900 text-xs">{bed.bedNumber}</span>
                              </div>
                              <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${bedConfig.badgeBg}`}>
                                {bedConfig.badgeText}
                              </div>
                            </div>

                            {/* Compact Bed Content */}
                            <div className="p-2">
                              {isOccupied && bed.resident ? (
                                <div className="space-y-2">
                                  {/* Resident Info */}
                                  <div className="flex items-center space-x-1.5">
                                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                                      <User className="h-3 w-3 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-gray-900 text-[10px] truncate">
                                        {bed.resident.firstName} {bed.resident.lastName}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Notice Period Badge */}
                                  {isNoticePeriod && (
                                    <div className="flex items-center space-x-1 bg-amber-100 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-200">
                                      <Clock className="h-2.5 w-2.5" />
                                      <span>{bed.resident.noticeDays}d</span>
                                    </div>
                                  )}

                                  {/* Action Button */}
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowRoomModal(false);
                                      handleResidentView(bed.resident);
                                    }}
                                    className="w-full text-[10px] py-1 px-2 bg-white hover:bg-gray-50 rounded border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 font-semibold shadow-sm"
                                  >
                                    View
                                  </motion.button>
                                </div>
                              ) : (
                                <div className="text-center py-2">
                                  <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-1 shadow-md">
                                    <CheckCircle className="h-3.5 w-3.5 text-white" />
                                  </div>
                                  <div className="text-[9px] font-bold text-emerald-700 uppercase">Available</div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Compact Occupancy Summary */}
                    <div className="pt-3 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center space-x-1.5 bg-white px-2 py-1 rounded-md shadow-sm border border-emerald-200">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-xs font-semibold text-gray-700">Available: <span className="text-emerald-700 font-bold">{selectedRoom.availableBedCount || 0}</span></span>
                          </div>
                          <div className="flex items-center space-x-1.5 bg-white px-2 py-1 rounded-md shadow-sm border border-blue-200">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-xs font-semibold text-gray-700">Occupied: <span className="text-blue-700 font-bold">{selectedRoom.beds.filter(bed => bed.isOccupied && bed.residentStatus !== 'notice_period').length}</span></span>
                          </div>
                          {selectedRoom.beds.some(bed => bed.isOccupied && bed.residentStatus === 'notice_period') && (
                            <div className="flex items-center space-x-1.5 bg-white px-2 py-1 rounded-md shadow-sm border border-amber-200">
                              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                              <span className="text-xs font-semibold text-gray-700">Notice: <span className="text-amber-700 font-bold">{selectedRoom.beds.filter(bed => bed.isOccupied && bed.residentStatus === 'notice_period').length}</span></span>
                            </div>
                          )}
                        </div>
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1 rounded-lg shadow-md font-bold text-xs">
                          Total: {selectedRoom.numberOfBeds}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showResidentDetails && selectedResident && (
        <ResidentDetails
          isOpen={showResidentDetails}
          onClose={() => setShowResidentDetails(false)}
          resident={selectedResident}
          onEdit={() => {
            setShowResidentDetails(false);
          }}
        />
      )}
      </div>
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(RoomAvailability);
