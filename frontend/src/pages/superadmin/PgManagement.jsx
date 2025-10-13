import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter as FilterIcon, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  MapPin,
  Users,
  Building2,
  CreditCard,
  TrendingUp,
  MoreVertical,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectLabel,
  SelectGroup,
  SelectSeparator
} from "../../components/ui/select";

import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "../../components/ui/popover";

import { Calendar as CalendarComponent } from "../../components/ui/calendar";

import pgService from '../../services/pg.service';
import PgFormModal from '../../components/superadmin/PgFormModal';
import DeleteConfirmModal from '../../components/superadmin/DeleteConfirmModal';
import PgDetailsModal from '../../components/superadmin/PgDetailsModal';

// Modern Dropdown Component
const DropdownMenu = ({ trigger, children, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 ${
              align === 'left' ? 'left-0' : 'right-0'
            }`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DropdownItem = ({ icon: Icon, children, onClick, className = '', danger = false }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors ${
      danger 
        ? 'text-red-700 hover:bg-red-50' 
        : 'text-gray-700 hover:bg-gray-50'
    } ${className}`}
  >
    {Icon && <Icon className={`h-4 w-4 mr-3 ${danger ? 'text-red-500' : 'text-gray-500'}`} />}
    {children}
  </button>
);

// Avatar Component
const Avatar = ({ name, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg'
  };

  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];

  const getInitials = (name) => {
    if (!name) return 'PG';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getColorFromName = (name) => {
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`${sizes[size]} ${getColorFromName(name)} rounded-full flex items-center justify-center text-white font-semibold ${className}`}>
      {getInitials(name)}
    </div>
  );
};

const PgManagement = () => {
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    city: '',
    state: '',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    startDate: null,
    endDate: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPG, setSelectedPG] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load PGs and stats
  useEffect(() => {
    loadPGs();
    loadStats();
  }, [currentPage, filters]);

  const loadPGs = async () => {
    try {
      setLoading(true);
      const response = await pgService.getAllPGs(filters, currentPage, 10);
      if (response.success) {
        setPgs(response.data);
        setTotalPages(response.pagination.pages);
      }
    } catch (error) {
      toast.error('Failed to load PGs');
      console.error('Error loading PGs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // First, check if the user is authenticated
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Please log in to view PG statistics');
        setStats({
          totalPGs: 0,
          activePGs: 0,
          totalRevenue: 0,
          occupancyRate: 0,
          activePercentage: 0,
          newPGsThisMonth: 0,
          revenueGrowth: null,
          vacantRooms: 0
        });
        return;
      }

      const response = await pgService.getPGStats();
      
      if (response.success) {
        // Enhance stats with more meaningful and calculated data
        const enhancedStats = {
          ...response.data,
          // Calculate active PG percentage
          activePercentage: response.data.totalPGs > 0 
            ? Math.round((response.data.activePGs / response.data.totalPGs) * 100) 
            : 0,
          
          // Calculate new PGs this month (assuming the API provides this)
          newPGsThisMonth: response.data.newPGsThisMonth || 0,
          
          // Calculate revenue growth (assuming the API provides previous month's revenue)
          revenueGrowth: response.data.revenueGrowth 
            ? Math.round(response.data.revenueGrowth * 100) 
            : null,
          
          // Calculate vacant rooms
          vacantRooms: response.data.totalRooms && response.data.occupiedRooms 
            ? response.data.totalRooms - response.data.occupiedRooms 
            : undefined
        };

        setStats(enhancedStats);
      } else {
        // Handle API-level errors
        toast.error(response.message || 'Failed to load PG statistics');
        
        // Set default/fallback stats
        setStats({
          totalPGs: 0,
          activePGs: 0,
          totalRevenue: 0,
          occupancyRate: 0,
          activePercentage: 0,
          newPGsThisMonth: 0,
          revenueGrowth: null,
          vacantRooms: 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      
      // Check if it's an authentication error
      if (error.response && error.response.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      // Set default/fallback stats
      setStats({
        totalPGs: 0,
        activePGs: 0,
        totalRevenue: 0,
        occupancyRate: 0,
        activePercentage: 0,
        newPGsThisMonth: 0,
        revenueGrowth: null,
        vacantRooms: 0
      });

      // Show a generic error message
      toast.error('Failed to load PG statistics. Please try again later.');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadPGs();
      return;
    }

    try {
      setLoading(true);
      const response = await pgService.searchPGs(searchTerm, filters);
      if (response.success) {
        setPgs(response.data);
        setTotalPages(1);
      }
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPG = () => {
    setSelectedPG(null);
    setShowFormModal(true);
  };

  const handleEditPG = (pg) => {
    setSelectedPG(pg);
    setShowFormModal(true);
  };

  const handleDeletePG = (pg) => {
    setSelectedPG(pg);
    setShowDeleteModal(true);
  };

  const handleViewPG = (pg) => {
    setSelectedPG(pg);
    setShowDetailsModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedPG) return;

    try {
      setActionLoading(true);
      const response = await pgService.deletePG(selectedPG._id);
      if (response.success) {
        toast.success('PG deleted successfully');
        loadPGs();
        loadStats();
        setShowDeleteModal(false);
        setSelectedPG(null);
      } else {
        toast.error(response.message || 'Failed to delete PG');
      }
    } catch (error) {
      toast.error('Failed to delete PG');
      console.error('Error deleting PG:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormSuccess = () => {
    loadPGs();
    loadStats();
  };

  // Update filters with new values
  const updateFilters = (newFilters) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: '',
      city: '',
      state: '',
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      startDate: null,
      endDate: null
    });
    setSearchTerm('');
    setShowAdvancedFilters(false);
  };

  // Render filters section
  const renderFilters = () => {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FilterIcon className="mr-2 h-5 w-5 text-blue-600" />
            PG Filters
          </h3>
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search PGs by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Property Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Property Type</label>
            <Select 
              value={filters.propertyType || 'all'} 
              onValueChange={(value) => updateFilters({ propertyType: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>PG Types</SelectLabel>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Gents PG">Gents PG</SelectItem>
                  <SelectItem value="Ladies PG">Ladies PG</SelectItem>
                  <SelectItem value="Coliving PG">Coliving PG</SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Other Property Types</SelectLabel>
                  <SelectItem value="PG">PG</SelectItem>
                  <SelectItem value="Hostel">Hostel</SelectItem>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="Independent">Independent</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <Select 
              value={filters.status || 'all'} 
              onValueChange={(value) => updateFilters({ status: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="full">Full</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* City Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                <input
                  type="text"
                  placeholder="Enter city"
                  value={filters.city || ''}
                  onChange={(e) => updateFilters({ city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* State Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                <input
                  type="text"
                  placeholder="Enter state"
                  value={filters.state || ''}
                  onChange={(e) => updateFilters({ state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                        {filters.startDate
                          ? format(new Date(filters.startDate), "MMM dd, yyyy")
                          : "Select Start Date"}
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={filters.startDate ? new Date(filters.startDate) : undefined}
                      onSelect={(date) => updateFilters({ 
                        startDate: date ? format(date, 'yyyy-MM-dd') : null 
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                        {filters.endDate
                          ? format(new Date(filters.endDate), "MMM dd, yyyy")
                          : "Select End Date"}
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={filters.endDate ? new Date(filters.endDate) : undefined}
                      onSelect={(date) => updateFilters({ 
                        endDate: date ? format(date, 'yyyy-MM-dd') : null 
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Price Range Filters */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Min Price</label>
                <input
                  type="number"
                  placeholder="Min price"
                  value={filters.minPrice || ''}
                  onChange={(e) => updateFilters({ minPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Price</label>
                <input
                  type="number"
                  placeholder="Max price"
                  value={filters.maxPrice || ''}
                  onChange={(e) => updateFilters({ maxPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clear Filters Button */}
        {(Object.values(filters).some(val => val !== '' && val !== null) || searchTerm) && (
          <div className="mt-4 flex justify-end">
            <button 
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    );
  };

  // Status color mapping
  const getStatusColor = (status) => {
    const statusColors = {
      active: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200'
      },
      inactive: {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200'
      },
      maintenance: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200'
      },
      full: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200'
      },
      under_renovation: {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200'
      },
      pending_approval: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200'
      },
      suspended: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200'
      },
      closed: {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200'
      },
      limited_occupancy: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200'
      }
    };
    return statusColors[status] || statusColors.inactive;
  };

  // Render PG list
  const renderPGList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (pgs.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No PGs Found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || Object.values(filters).some(val => val !== '')
              ? 'No PGs match your current filters.'
              : 'Start by adding your first PG.'}
          </p>
          <button
            onClick={handleAddPG}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New PG
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PG Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rooms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pgs.map((pg, index) => {
                const statusColors = getStatusColor(pg.status);
                return (
                  <motion.tr
                    key={pg._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar name={pg.name} size="md" />
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {pg.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {pg.property?.type || 'Unknown Type'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {pg.address?.city || pg.address?.state || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {pg.property?.availableRooms || 0}/{pg.property?.totalRooms || 0} 
                        <span className="text-xs text-gray-500 ml-1">
                          ({pg.property?.occupancyRate || 0}% occupied)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {pg.pricing?.basePrice 
                          ? formatPrice(pg.pricing.basePrice) 
                          : '₹NaN'} per month
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium 
                          ${statusColors.bg} 
                          ${statusColors.text} 
                          ${statusColors.border} 
                          border`}
                      >
                        {pg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <DropdownMenu
                        trigger={
                          <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        }
                      >
                        <DropdownItem 
                          icon={Eye} 
                          onClick={() => handleViewPG(pg)}
                        >
                          View Details
                        </DropdownItem>
                        <DropdownItem 
                          icon={Edit} 
                          onClick={() => handleEditPG(pg)}
                        >
                          Edit PG
                        </DropdownItem>
                        <DropdownItem 
                          icon={Trash2} 
                          onClick={() => handleDeletePG(pg)}
                          danger
                        >
                          Delete PG
                        </DropdownItem>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden">
          {pgs.map((pg, index) => {
            const statusColors = getStatusColor(pg.status);
            return (
              <motion.div
                key={pg._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <Avatar name={pg.name} size="md" />
                    <div className="ml-3">
                      <div className="text-sm font-semibold text-gray-900">
                        {pg.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {pg.property?.type || 'Unknown Type'}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu
                    trigger={
                      <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    }
                    align="right"
                  >
                    <DropdownItem 
                      icon={Eye} 
                      onClick={() => handleViewPG(pg)}
                    >
                      View Details
                    </DropdownItem>
                    <DropdownItem 
                      icon={Edit} 
                      onClick={() => handleEditPG(pg)}
                    >
                      Edit PG
                    </DropdownItem>
                    <DropdownItem 
                      icon={Trash2} 
                      onClick={() => handleDeletePG(pg)}
                      danger
                    >
                      Delete PG
                    </DropdownItem>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">Location</div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-900">
                        {pg.address?.city || pg.address?.state || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1">Rooms</div>
                    <div className="text-gray-900">
                      {pg.property?.availableRooms || 0}/{pg.property?.totalRooms || 0}
                      <span className="text-xs text-gray-500 ml-1">
                        ({pg.property?.occupancyRate || 0}% occupied)
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1">Price</div>
                    <div className="text-gray-900 font-semibold">
                      {pg.pricing?.basePrice 
                        ? formatPrice(pg.pricing.basePrice) 
                        : '₹NaN'} per month
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1">Status</div>
                    <span 
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                        ${statusColors.bg} 
                        ${statusColors.text} 
                        ${statusColors.border} 
                        border`}
                    >
                      {pg.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">PG Management</h1>
              <p className="text-gray-600 text-lg">Manage all PG properties and their details</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleAddPG}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New PG
              </button>
              
              <button
                onClick={() => loadPGs()}
                className="inline-flex items-center justify-center px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Render Filters */}
        {renderFilters()}

        {/* Modern PG List */}
        {renderPGList()}

        {/* Modern Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <PgFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setSelectedPG(null);
          }}
          pg={selectedPG}
          onSuccess={handleFormSuccess}
        />

        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedPG(null);
          }}
          onConfirm={confirmDelete}
          itemName={selectedPG?.name || ''}
          itemType="PG"
        />

        <PgDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPG(null);
          }}
          pg={selectedPG}
        />
      </div>
    </div>
  );
};

export default PgManagement; 