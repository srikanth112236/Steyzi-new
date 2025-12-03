import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  MessageSquare, 
  UserPlus, 
  UserMinus, 
  Building2, 
  BarChart3,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
  PieChart,
  Activity,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Download as DownloadIcon,
  FileSpreadsheet,
  FileText as FileTextIcon,
  Info,
  AlertCircle,
  CheckCircle,
  Clock,
  LogOut,
  DollarSign,
  Target,
  Zap,
  Star,
  Crown,
  Shield,
  Heart,
  MoreVertical,
  ExternalLink,
  Copy,
  MessageCircle,
  Camera,
  Wifi,
  Car,
  Dumbbell,
  Tv,
  Coffee,
  Home,
  Briefcase,
  GraduationCap,
  MapPin as LocationIcon,
  DownloadCloud,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import reportService from '../../services/report.service';
import { selectSelectedBranch } from '../../store/slices/branch.slice';

// Import Antd components
import { Dropdown, Menu, Button, Tooltip } from 'antd';

const PgReports = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const selectedBranch = useSelector(selectSelectedBranch);
  
  // State management
  const [activeTab, setActiveTab] = useState('residents');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [reportOptions, setReportOptions] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    pgId: '',
    status: 'all',
    paymentMethod: 'all',
    priority: 'all',
    vacationType: 'all'
  });
  
  const [dateRange, setDateRange] = useState('last30days');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Report tabs configuration with enhanced styling
  const reportTabs = [
    {
      id: 'residents',
      name: 'Residents',
      icon: Users,
      description: 'Resident management and occupancy reports',
      color: 'bg-gradient-to-br from-blue-400 to-indigo-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      id: 'payments',
      name: 'Payments',
      icon: CreditCard,
      description: 'Payment tracking and financial reports',
      color: 'bg-gradient-to-br from-green-400 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      id: 'tickets',
      name: 'Tickets',
      icon: MessageSquare,
      description: 'Support ticket and maintenance reports',
      color: 'bg-gradient-to-br from-purple-400 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      id: 'onboarding',
      name: 'Onboarding',
      icon: UserPlus,
      description: 'Resident onboarding and admission reports',
      color: 'bg-gradient-to-br from-orange-400 to-red-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      id: 'offboarding',
      name: 'Offboarding',
      icon: UserMinus,
      description: 'Resident vacation and departure reports',
      color: 'bg-gradient-to-br from-red-400 to-pink-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      id: 'occupancy',
      name: 'Occupancy',
      icon: Building2,
      description: 'Room occupancy and utilization reports',
      color: 'bg-gradient-to-br from-indigo-400 to-purple-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    {
      id: 'financial-summary',
      name: 'Financial Summary',
      icon: BarChart3,
      description: 'Comprehensive financial analysis',
      color: 'bg-gradient-to-br from-emerald-400 to-teal-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    }
  ];

  useEffect(() => {
    // Check authentication - get user from Redux or localStorage as fallback
    const currentUser = user || (() => {
      try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
      } catch (e) {
        return null;
      }
    })();

    if (!currentUser) {
      navigate('/admin/login');
      return;
    }

    const userRole = currentUser?.role;
    if (!userRole || !['admin', 'maintainer'].includes(userRole)) {
      console.error('Access denied - User role:', userRole, 'User:', currentUser);
      toast.error('Access denied. Admin or Maintainer privileges required.');
      navigate('/login');
      return;
    }

    loadReportOptions();
    setDefaultDateRange();
  }, [user, navigate]);

  // Refresh report when branch changes
  useEffect(() => {
    if (selectedBranch && reportOptions) {
      generateReport();
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (reportOptions && selectedBranch) {
      generateReport();
    }
  }, [activeTab, filters, reportOptions]);

  const setDefaultDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    setFilters(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }));
  };

  const loadReportOptions = async () => {
    try {
      const response = await reportService.getReportOptions();
      if (response.success) {
        setReportOptions(response.data);
      }
    } catch (error) {
      console.error('Error loading report options:', error);
      toast.error('Failed to load report options');
    }
  };

  const generateReport = async () => {
    // Don't fetch if no branch is selected
    if (!selectedBranch) {
      console.log('⚠️ No branch selected, skipping report generation');
      return;
    }

    try {
      setLoading(true);
      const withBranch = { ...filters, branchId: selectedBranch._id };
      console.log('🔍 Generating report:', { activeTab, filters: withBranch });
      
      const response = await reportService.generateReportByType(activeTab, withBranch);
      console.log('📊 Report response:', response);
      
      if (response.success) {
        // The response.data contains the actual report data from service
        // For tickets, it has nested structure, for others it's direct
        setReportData(response.data || response);
        await loadAnalytics(withBranch);
      } else {
        console.error('❌ Report generation failed:', response.message);
        toast.error(response.message || 'Failed to generate report');
        setReportData(null);
      }
    } catch (error) {
      console.error('❌ Error generating report:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate report';
      toast.error(errorMessage);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (inputFilters = filters) => {
    if (!selectedBranch) return;
    
    try {
      const withBranch = { ...inputFilters, branchId: selectedBranch._id };
      const response = await reportService.getReportAnalytics(activeTab, withBranch);
      
      if (response.success) {
        setAnalyticsData(response.data || response);
      }
    } catch (error) {
      console.error('⚠️ Error loading analytics:', error);
      // Don't show error toast for analytics, it's optional
      setAnalyticsData(null);
    }
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    const endDate = new Date();
    const startDate = new Date();

    switch (range) {
      case 'last7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'last3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'last6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'last12months':
        startDate.setMonth(startDate.getMonth() - 12);
        break;
      default:
        return;
    }

    setFilters(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Export functionality with Antd dropdown
  const [exportFormats, setExportFormats] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  // Load export formats
  useEffect(() => {
    loadExportFormats();
  }, []);

  const loadExportFormats = async () => {
    try {
      const response = await reportService.getExportFormats();
      if (response.success) {
        setExportFormats(response.data);
      }
    } catch (error) {
      console.error('Error loading export formats:', error);
    }
  };

  const handleExport = async (format) => {
    try {
      setExportLoading(true);
      const withBranch = { ...filters, branchId: selectedBranch?._id };
      const response = await reportService.exportReport(activeTab, withBranch, format);
      
      if (response.success) {
        // Create download link
        const link = document.createElement('a');
        link.href = `data:text/${format};charset=utf-8,${encodeURIComponent(response.data)}`;
        link.download = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`${format.toUpperCase()} report exported successfully`);
      } else {
        toast.error(response.message || 'Export failed');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  // Export dropdown menu
  const exportMenu = (
    <Menu>
      {exportFormats.map((format) => (
        <Menu.Item 
          key={format.value}
          icon={
            format.value === 'pdf' ? <DownloadCloud /> :
            format.value === 'excel' ? <DownloadCloud /> :
            <DownloadCloud />
          }
          onClick={() => handleExport(format.value)}
        >
          {format.icon} {format.label}
        </Menu.Item>
      ))}
    </Menu>
  );

  // Enhanced Statistics Cards with Modern Design
  const renderStatistics = () => {
    // Handle different data structures for different report types
    let stats = {};
    
    // Tickets report has nested structure: { success: true, data: { data: [], statistics: {}, ... } }
    if (activeTab === 'tickets') {
      if (reportData?.data?.statistics) {
        stats = reportData.data.statistics;
      } else if (reportData?.statistics) {
        stats = reportData.statistics;
      } else {
        return null;
      }
    } else {
      // Other reports: { success: true, data: [], statistics: {}, ... }
      if (reportData?.statistics) {
        stats = reportData.statistics;
      } else if (reportData?.data?.statistics) {
        stats = reportData.data.statistics;
      } else {
        return null;
      }
    }

    const currentTab = reportTabs.find(tab => tab.id === activeTab);

    // Filter out zero values for better display, but always show important keys
    const importantKeys = ['total', 'totalRooms', 'totalBeds', 'occupiedBeds', 'availableBeds', 'occupancyRate', 'immediate', 'noticePeriod', 'averageNoticeDays', 'thisMonth', 'lastMonth'];
    const nonZeroStats = Object.entries(stats).filter(([key, value]) => {
      if (typeof value === 'number') {
        // Always show important keys even if zero
        if (importantKeys.includes(key)) {
          return true;
        }
        return value > 0;
      }
      return false;
    });

    // If no data, show a message
    if (nonZeroStats.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8"
        >
          <div className="text-center">
            <div className={`w-20 h-20 ${currentTab?.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
              {currentTab?.icon && <currentTab.icon className={`h-10 w-10 ${currentTab?.textColor}`} />}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No data available</h3>
            <p className="text-gray-600 mb-4">
              No {currentTab?.name.toLowerCase()} data found for the selected filters.
            </p>
            <button
              onClick={() => setShowFilters(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              Adjust Filters
            </button>
          </div>
        </motion.div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {Object.entries(stats).map(([key, value], index) => {
          if (typeof value === 'number') {
            const isPercentage = key.includes('Rate') || key.includes('percentage') || key === 'occupancyRate';
            // Only show currency for payment-related or offboarding total (which is revenue)
            const isCurrency = (key.includes('Amount') || key.includes('Revenue') || (key === 'total' && activeTab === 'offboarding')) && !key.includes('Rooms') && !key.includes('Beds');
            const isZero = value === 0;
            
            // Get icon and color based on key
            const getStatConfig = (statKey) => {
              const configs = {
                total: { icon: Users, color: 'from-blue-400 to-indigo-500', bgColor: 'bg-blue-50' },
                active: { icon: CheckCircle, color: 'from-green-400 to-emerald-500', bgColor: 'bg-green-50' },
                inactive: { icon: AlertCircle, color: 'from-gray-400 to-slate-500', bgColor: 'bg-gray-50' },
                pending: { icon: Clock, color: 'from-yellow-400 to-orange-500', bgColor: 'bg-yellow-50' },
                movedOut: { icon: LogOut, color: 'from-red-400 to-pink-500', bgColor: 'bg-red-50' },
                paid: { icon: DollarSign, color: 'from-green-400 to-emerald-500', bgColor: 'bg-green-50' },
                overdue: { icon: AlertCircle, color: 'from-red-400 to-pink-500', bgColor: 'bg-red-50' },
                open: { icon: MessageSquare, color: 'from-blue-400 to-indigo-500', bgColor: 'bg-blue-50' },
                inProgress: { icon: Clock, color: 'from-yellow-400 to-orange-500', bgColor: 'bg-yellow-50' },
                resolved: { icon: CheckCircle, color: 'from-green-400 to-emerald-500', bgColor: 'bg-green-50' },
                closed: { icon: X, color: 'from-gray-400 to-slate-500', bgColor: 'bg-gray-50' },
                urgent: { icon: AlertTriangle, color: 'from-red-400 to-pink-500', bgColor: 'bg-red-50' },
                high: { icon: AlertCircle, color: 'from-orange-400 to-red-500', bgColor: 'bg-orange-50' },
                medium: { icon: Clock, color: 'from-yellow-400 to-orange-500', bgColor: 'bg-yellow-50' },
                low: { icon: CheckCircle, color: 'from-green-400 to-emerald-500', bgColor: 'bg-green-50' },
                totalRevenue: { icon: DollarSign, color: 'from-emerald-400 to-teal-500', bgColor: 'bg-emerald-50' },
                averageRent: { icon: Target, color: 'from-purple-400 to-pink-500', bgColor: 'bg-purple-50' },
                thisMonth: { icon: Calendar, color: 'from-blue-400 to-indigo-500', bgColor: 'bg-blue-50' },
                lastMonth: { icon: Calendar, color: 'from-gray-400 to-slate-500', bgColor: 'bg-gray-50' },
                // Offboarding specific
                immediate: { icon: Zap, color: 'from-red-400 to-pink-500', bgColor: 'bg-red-50' },
                noticePeriod: { icon: Clock, color: 'from-yellow-400 to-orange-500', bgColor: 'bg-yellow-50' },
                averageNoticeDays: { icon: Calendar, color: 'from-blue-400 to-indigo-500', bgColor: 'bg-blue-50' },
                // Occupancy specific
                totalRooms: { icon: Building2, color: 'from-indigo-400 to-purple-500', bgColor: 'bg-indigo-50' },
                totalBeds: { icon: Users, color: 'from-blue-400 to-indigo-500', bgColor: 'bg-blue-50' },
                occupiedBeds: { icon: CheckCircle, color: 'from-green-400 to-emerald-500', bgColor: 'bg-green-50' },
                availableBeds: { icon: UserPlus, color: 'from-gray-400 to-slate-500', bgColor: 'bg-gray-50' },
                occupancyRate: { icon: BarChart3, color: 'from-purple-400 to-pink-500', bgColor: 'bg-purple-50' }
              };
              return configs[statKey] || { icon: BarChart3, color: 'from-blue-400 to-indigo-500', bgColor: 'bg-blue-50' };
            };

            const config = getStatConfig(key);
            const Icon = config.icon;
            
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group ${
                  isZero ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 capitalize mb-1">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className={`text-3xl font-bold ${isZero ? 'text-gray-400' : 'text-gray-900'}`}>
                      {isCurrency ? `₹${value.toLocaleString()}` : 
                       isPercentage ? `${value}%` : 
                       value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                    isZero ? 'opacity-50' : ''
                  }`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                </div>
                
                {/* Interactive tooltip */}
                <div className="relative">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                    <div className="flex items-center gap-1">
                      <Info className="h-3 w-3 text-gray-400" />
                      <span>Hover for details</span>
                    </div>
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {key.replace(/([A-Z])/g, ' $1').trim()}: {value.toLocaleString()}
                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </motion.div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  // Enhanced Chart Component
  const renderChart = () => {
    // Handle different data structures for different report types
    let data = [];
    
    // Tickets report has nested structure
    if (activeTab === 'tickets') {
      if (reportData?.data?.monthlyTrend) {
        data = reportData.data.monthlyTrend;
      } else if (reportData?.monthlyTrend) {
        data = reportData.monthlyTrend;
      } else {
        return null;
      }
    } else {
      // Other reports
      if (reportData?.monthlyTrend) {
        data = reportData.monthlyTrend;
      } else if (reportData?.data?.monthlyTrend) {
        data = reportData.data.monthlyTrend;
      } else {
        return null;
      }
    }

    if (!data || data.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8"
        >
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trend data available</h3>
            <p className="text-gray-600">Monthly trend data will appear here when available.</p>
          </div>
        </motion.div>
      );
    }

    const maxValue = Math.max(...data.map(item => item.count || 0));

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Monthly Trend</h3>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">Last 12 months</span>
          </div>
        </div>
        
        <div className="flex items-end space-x-2 h-48">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center group">
              <div 
                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                style={{ 
                  height: `${maxValue > 0 ? (item.count / maxValue) * 100 : 0}%`,
                  minHeight: item.count > 0 ? '20px' : '4px'
                }}
              />
              <p className="text-xs text-gray-500 mt-2 text-center group-hover:text-gray-700 transition-colors">
                {new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
              </p>
              <p className="text-xs font-medium text-gray-700 mt-1 group-hover:text-blue-600 transition-colors">{item.count}</p>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  // Enhanced Comparison Analytics
  const renderComparisonAnalytics = () => {
    // Handle different data structures for different report types
    let comparisonData = null;
    
    // Tickets report has nested structure
    if (activeTab === 'tickets') {
      if (reportData?.data?.comparisonData) {
        comparisonData = reportData.data.comparisonData;
      } else if (reportData?.comparisonData) {
        comparisonData = reportData.comparisonData;
      } else {
        return null;
      }
    } else {
      // Other reports
      if (reportData?.comparisonData) {
        comparisonData = reportData.comparisonData;
      } else if (reportData?.data?.comparisonData) {
        comparisonData = reportData.data.comparisonData;
      } else {
        return null;
      }
    }

    if (!comparisonData) return null;

    const { currentPeriod, previousPeriod, change } = comparisonData;
    const isPositive = change.count >= 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Period Comparison</h3>
          <div className="flex items-center space-x-2">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{change.count} ({isPositive ? '+' : ''}{change.percentage.toFixed(1)}%)
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Period */}
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Current Period</h4>
            <p className="text-3xl font-bold text-blue-600">{currentPeriod.count}</p>
            <p className="text-xs text-gray-500 mt-1">{activeTab}</p>
          </div>

          {/* Previous Period */}
          <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Previous Period</h4>
            <p className="text-3xl font-bold text-gray-600">{previousPeriod.count}</p>
            <p className="text-xs text-gray-500 mt-1">{activeTab}</p>
          </div>

          {/* Change */}
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Change</h4>
            <p className={`text-3xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{change.count}
            </p>
            <p className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'} mt-1`}>
              {isPositive ? '+' : ''}{change.percentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  // Enhanced Resolution Time Analytics
  const renderResolutionTimeAnalytics = () => {
    // Handle different data structures for different report types
    let resolutionTimeData = null;
    
    // Only tickets have resolution time analytics
    if (activeTab === 'tickets') {
      if (reportData?.data?.resolutionTimeData) {
        resolutionTimeData = reportData.data.resolutionTimeData;
      } else if (reportData?.resolutionTimeData) {
        resolutionTimeData = reportData.resolutionTimeData;
      } else {
        return null;
      }
    } else {
      return null;
    }

    if (!resolutionTimeData || activeTab !== 'tickets') return null;

    const { averageResolutionTime, minResolutionTime, maxResolutionTime, totalResolved } = resolutionTimeData;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Resolution Time Analytics</h3>
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-purple-500" />
            <span className="text-sm text-gray-600">Performance metrics</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Average Resolution</h4>
            <p className="text-2xl font-bold text-purple-600">
              {averageResolutionTime > 0 ? averageResolutionTime.toFixed(1) : '0'} days
            </p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Fastest Resolution</h4>
            <p className="text-2xl font-bold text-green-600">
              {minResolutionTime > 0 ? minResolutionTime.toFixed(1) : '0'} days
            </p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Slowest Resolution</h4>
            <p className="text-2xl font-bold text-orange-600">
              {maxResolutionTime > 0 ? maxResolutionTime.toFixed(1) : '0'} days
            </p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Resolved</h4>
            <p className="text-2xl font-bold text-blue-600">{totalResolved}</p>
            <p className="text-xs text-gray-500 mt-1">tickets</p>
          </div>
        </div>
      </motion.div>
    );
  };

  // Enhanced Data Table
  const renderDataTable = () => {
    if (!reportData) return null;

    // Handle different data structures for different report types
    let data = [];
    
    // Tickets report has nested structure: { success: true, data: { data: [], ... } }
    if (activeTab === 'tickets') {
      if (reportData?.data?.data && Array.isArray(reportData.data.data)) {
        data = reportData.data.data;
      } else if (reportData?.data && Array.isArray(reportData.data)) {
        data = reportData.data;
      } else {
        data = [];
      }
    } else {
      // Other reports: { success: true, data: [], ... }
      if (reportData?.data && Array.isArray(reportData.data)) {
        data = reportData.data;
      } else if (reportData?.data?.data && Array.isArray(reportData.data.data)) {
        data = reportData.data.data;
      } else {
        data = [];
      }
    }

    // Ensure data is an array
    if (!Array.isArray(data)) {
      console.error('Data is not an array:', data);
      data = [];
    }

    const filteredData = data.filter(item => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return Object.values(item).some(value => 
        value && value.toString().toLowerCase().includes(searchLower)
      );
    });

    const getTableHeaders = () => {
      switch (activeTab) {
        case 'residents':
          return ['Name', 'Phone', 'Room', 'Status', 'Check-in Date', 'Actions'];
        case 'payments':
          return ['Resident', 'Amount', 'Method', 'Status', 'Date', 'Actions'];
        case 'tickets':
          return ['Subject', 'Priority', 'Status', 'Category', 'Created', 'Assigned To', 'Actions'];
        case 'onboarding':
          return ['Resident', 'Room', 'Check-in Date', 'Rent Amount', 'Actions'];
        case 'offboarding':
          return ['Resident', 'Vacation Type', 'Notice Days', 'Check-out Date', 'Actions'];
        default:
          return [];
      }
    };

    const renderTableRow = (item, index) => {
      switch (activeTab) {
        case 'residents':
          return (
            <tr key={item._id || index} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mr-3">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {item.firstName} {item.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{item.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.phone}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.roomId?.roomNumber || 'Not Assigned'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  item.status === 'active' ? 'bg-green-100 text-green-800' :
                  item.status === 'inactive' ? 'bg-red-100 text-red-800' :
                  item.status === 'notice_period' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.checkInDate ? new Date(item.checkInDate).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button className="text-blue-600 hover:text-blue-900 transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
              </td>
            </tr>
          );
        case 'payments':
          return (
            <tr key={item._id || index} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {item.residentId?.firstName} {item.residentId?.lastName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{item.amount?.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.paymentMethod}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  item.status === 'paid' ? 'bg-green-100 text-green-800' :
                  item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(item.paymentDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button className="text-blue-600 hover:text-blue-900 transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
              </td>
            </tr>
          );
        case 'tickets':
          return (
            <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {item.subject}
                </div>
                <div className="text-sm text-gray-500 truncate max-w-xs">
                  {item.description}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  item.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {item.priority}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  item.status === 'open' ? 'bg-blue-100 text-blue-800' :
                  item.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                  item.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  item.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className="capitalize">{item.category}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(item.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.assignedTo}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button className="text-blue-600 hover:text-blue-900 transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
              </td>
            </tr>
          );
        case 'onboarding':
          return (
            <tr key={item._id || index} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {item.firstName} {item.lastName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.roomId?.roomNumber || 'Not Assigned'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.checkInDate ? new Date(item.checkInDate).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{item.rentAmount?.toLocaleString() || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button className="text-blue-600 hover:text-blue-900 transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
              </td>
            </tr>
          );
        case 'offboarding':
          return (
            <tr key={item._id || index} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {item.firstName} {item.lastName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.vacationType || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.noticeDays || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.checkOutDate ? new Date(item.checkOutDate).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button className="text-blue-600 hover:text-blue-900 transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
              </td>
            </tr>
          );
        default:
          return null;
      }
    };

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {reportTabs.find(tab => tab.id === activeTab)?.name} Data
            </h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {getTableHeaders().map((header, index) => (
                  <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item, index) => renderTableRow(item, index))}
            </tbody>
          </table>
        </div>
        
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No data found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Enhanced Filters
  const renderFilters = () => {
    if (!reportOptions) return null;

    return (
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {reportOptions.dateRanges?.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              {activeTab === 'residents' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {reportOptions.statusOptions?.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment Status Filter */}
              {activeTab === 'payments' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {reportOptions.paymentStatusOptions?.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment Method Filter */}
              {activeTab === 'payments' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={filters.paymentMethod}
                    onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {reportOptions.paymentMethodOptions?.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Ticket Status Filter */}
              {activeTab === 'tickets' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {reportOptions.ticketStatusOptions?.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority Filter */}
              {activeTab === 'tickets' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {reportOptions.priorityOptions?.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Vacation Type Filter */}
              {activeTab === 'offboarding' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vacation Type</label>
                  <select
                    value={filters.vacationType}
                    onChange={(e) => handleFilterChange('vacationType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {reportOptions.vacationTypeOptions?.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4 mr-2 inline" />
                Close
              </button>
              <button
                onClick={() => {
                  setFilters({
                    startDate: '',
                    endDate: '',
                    pgId: '',
                    status: 'all',
                    paymentMethod: 'all',
                    priority: 'all',
                    vacationType: 'all'
                  });
                  setSearchTerm('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2 inline" />
                Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // Get user from Redux or localStorage as fallback for render check
  const currentUserForRender = user || (() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  })();

  if (!currentUserForRender || !currentUserForRender?.role || !['admin', 'maintainer'].includes(currentUserForRender.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!selectedBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Branch Selected</h2>
          <p className="text-gray-600 mb-4">Please select a branch from the header to view reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-2">Comprehensive reports and insights for your PG management</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  if (selectedBranch) {
                    generateReport();
                    toast.success('Report refreshed');
                  } else {
                    toast.error('Please select a branch first');
                  }
                }}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              
              <Dropdown overlay={exportMenu} trigger={['click']}>
                <Button 
                  type="primary"
                  loading={exportLoading}
                  className="flex items-center"
                >
                  <DownloadCloud className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </Dropdown>
            </div>
          </div>
        </div>

        {/* Filters */}
        {renderFilters()}

        {/* Report Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {reportTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition duration-200 ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {reportTabs.find(tab => tab.id === activeTab)?.name} Report
              </h2>
              <p className="text-gray-600">
                {reportTabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Statistics Cards */}
                {renderStatistics()}

                {/* Chart */}
                {renderChart()}

                {/* Comparison Analytics */}
                {renderComparisonAnalytics()}

                {/* Resolution Time Analytics */}
                {renderResolutionTimeAnalytics()}

                {/* Data Table */}
                {renderDataTable()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PgReports; 


