import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  PieChart,
  MoreVertical,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  History,
  HelpCircle,
  X
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import salaryService from '../../services/salary.service';
import branchService from '../../services/branch.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import SalaryForm from '../../components/admin/SalaryForm';
import SalaryDetails from '../../components/admin/SalaryDetails';
import SalaryPaymentModal from '../../components/admin/SalaryPaymentModal';
import SalaryHistoryModal from '../../components/admin/SalaryHistoryModal';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import PermissionButton from '../../components/common/PermissionButton';
import PermissionAction from '../../components/common/PermissionAction';

const Salaries = () => {
  const { user } = useSelector((state) => state.auth);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [salaryToDelete, setSalaryToDelete] = useState(null);
  const [salaryToPay, setSalaryToPay] = useState(null);
  const [selectedMaintainer, setSelectedMaintainer] = useState(null);

  // Filters and search
  const [filters, setFilters] = useState({
    search: '',
    maintainerId: '',
    month: '',
    year: new Date().getFullYear().toString(),
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Statistics
  const [stats, setStats] = useState({
    totalSalaries: 0,
    totalAmount: 0,
    totalPaidAmount: 0,
    pendingCount: 0,
    paidCount: 0,
    partiallyPaidCount: 0,
    overdueCount: 0
  });

  // Function to calculate status based on current date
  const getCalculatedStatus = (salary) => {
    // If already paid or cancelled, return current status
    if (salary.status === 'paid' || salary.status === 'cancelled') {
      return salary.status;
    }

    // If partially paid, return partially paid
    if (salary.status === 'partially_paid') {
      return 'partially_paid';
    }

    // Check if salary is overdue
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

    const salaryYear = parseInt(salary.year);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const salaryMonth = monthNames.indexOf(salary.month) + 1;

    // If salary is for future months, it's pending
    if (salaryYear > currentYear || (salaryYear === currentYear && salaryMonth > currentMonth)) {
      return 'pending';
    }

    // If salary is for current month or past months and not paid, it's overdue
    if (salaryYear < currentYear || (salaryYear === currentYear && salaryMonth < currentMonth)) {
      return 'overdue';
    }

    // If salary is for current month and not paid, it's pending
    return 'pending';
  };

  // Maintainers
  const [maintainers, setMaintainers] = useState([]);

  // Branches for analytics
  const [branches, setBranches] = useState([]);

  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Load salaries
  const loadSalaries = useCallback(async (page = 1) => {
    try {
      setLoading(true);

      const response = await salaryService.getAllSalaries({
        ...filters,
        page,
        limit: pagination.limit
      });

      if (response.success) {
        setSalaries(response.data.salaries);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error loading salaries:', error);
      toast.error('Failed to load salaries');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const response = await salaryService.getSalaryStats({
        month: filters.month,
        year: parseInt(filters.year)
      });

      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [filters.month, filters.year]);

  // Load maintainers
  const loadMaintainers = useCallback(async () => {
    try {
      const response = await salaryService.getActiveMaintainers();
      if (response.success) {
        setMaintainers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error loading maintainers:', error);
    }
  }, []);

  // Load branches for analytics
  const loadBranches = useCallback(async () => {
    try {
      const response = await branchService.getAllBranches();
      if (response.success) {
        const branchesData = response.data?.branches || [];
        setBranches(Array.isArray(branchesData) ? branchesData : []);
      } else {
        console.warn('Failed to load branches for Salaries analytics');
        setBranches([]);
      }
    } catch (error) {
      console.error('Error loading branches for Salaries analytics:', error);
      setBranches([]);
    }
  }, []);

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    try {
      const year = parseInt(filters.year || new Date().getFullYear().toString());
      const branchId = filters.branchId || null;
      const response = await salaryService.getSalaryAnalytics(year, branchId);

      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        console.warn('Analytics data not available:', response);
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalytics(null);
    }
  }, [filters.year, filters.branchId]);

  // Initialize data
  useEffect(() => {
    loadSalaries();
    loadStats();
    loadMaintainers();
  }, [loadSalaries, loadStats, loadMaintainers]);

  // Load branches when analytics is opened
  useEffect(() => {
    if (showAnalytics) {
      loadBranches();
    }
  }, [showAnalytics, loadBranches]);

  // Load analytics when requested or when filters change
  useEffect(() => {
    if (showAnalytics) {
      loadAnalytics();
    }
  }, [showAnalytics, loadAnalytics]);

  // Reload analytics when relevant filters change while viewing analytics
  useEffect(() => {
    if (showAnalytics && (filters.year || filters.branchId !== undefined)) {
      loadAnalytics();
    }
  }, [filters.year, filters.branchId, showAnalytics]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    loadSalaries(newPage);
  };

  // Handle salary submission
  const handleSalarySubmit = async (salaryData, receiptImage = null) => {
    try {
      await salaryService.createOrUpdateSalary(salaryData, receiptImage);
      toast.success('Salary processed successfully');
      setShowForm(false);
      setEditingSalary(null);
      loadSalaries();
      loadStats();
    } catch (error) {
      console.error('Error saving salary:', error);
      toast.error(error.message || 'Failed to save salary');
    }
  };

  // Handle salary deletion
  const handleDeleteSalary = async () => {
    try {
      await salaryService.deleteSalary(salaryToDelete._id);
      toast.success('Salary record deleted successfully');
      setShowDeleteModal(false);
      setSalaryToDelete(null);
      loadSalaries();
      loadStats();
    } catch (error) {
      console.error('Error deleting salary:', error);
      toast.error('Failed to delete salary record');
    }
  };

  // Handle salary payment
  const handleSalaryPayment = async (paymentData, receiptImage = null) => {
    try {
      // Check if salary adjustments were made
      if (paymentData.salaryAdjustments) {
        // Update salary record with adjustments first
        const salaryUpdateData = {
          baseSalary: paymentData.salaryAdjustments.baseSalary,
          bonus: paymentData.salaryAdjustments.bonus,
          overtime: paymentData.salaryAdjustments.overtime,
          deductions: paymentData.salaryAdjustments.deductions
        };

        await salaryService.updateSalary(salaryToPay._id, salaryUpdateData);
        toast.success('Salary adjustments saved successfully');
      }

      // Process the payment
      const { salaryAdjustments, ...paymentDataWithoutAdjustments } = paymentData;
      await salaryService.processSalaryPayment(salaryToPay._id, paymentDataWithoutAdjustments, receiptImage);

      // Check if this was a full payment or partial payment
      const totalPaid = (salaryToPay.paidAmount || 0) + paymentData.paymentAmount;
      const isFullPayment = totalPaid >= salaryToPay.netSalary;

      toast.success(isFullPayment ? 'Salary payment completed successfully' : `Partial payment of ${salaryService.formatCurrency(paymentData.paymentAmount)} processed successfully`);

      // Update the local salaryToPay state with new payment data for immediate UI update
      if (!isFullPayment && salaryToPay) {
        setSalaryToPay({
          ...salaryToPay,
          paidAmount: (salaryToPay.paidAmount || 0) + paymentData.paymentAmount,
          status: 'partially_paid',
          payments: [
            ...(salaryToPay.payments || []),
            {
              amount: paymentData.paymentAmount,
              paymentMethod: paymentData.paymentMethod,
              transactionId: paymentData.transactionId,
              paymentDate: paymentData.paymentDate,
              paidAt: new Date().toISOString()
            }
          ]
        });
      } else {
        setShowPaymentModal(false);
        setSalaryToPay(null);
      }

      loadSalaries();
      loadStats();
    } catch (error) {
      console.error('Error processing salary payment:', error);
      toast.error(error.message || 'Failed to process salary payment');
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      await salaryService.exportSalaries(filters);
      toast.success('Salaries exported successfully');
    } catch (error) {
      console.error('Error exporting salaries:', error);
      toast.error('Failed to export salaries');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      maintainerId: '',
      month: '',
      year: new Date().getFullYear().toString(),
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Get maintainer name
  const getMaintainerName = (salary) => {
    // Check if salary has embedded maintainer data
    if (salary.maintainerId && typeof salary.maintainerId === 'object') {
      if (salary.maintainerId.user) {
        return `${salary.maintainerId.user.firstName} ${salary.maintainerId.user.lastName}`.trim();
      } else if (salary.maintainerId.name) {
        return salary.maintainerId.name;
      }
    }

    // Fallback to maintainers array lookup by ID
    if (salary.maintainerId && typeof salary.maintainerId === 'string') {
      const maintainer = maintainers.find(m => m._id === salary.maintainerId);
      if (maintainer) {
        return maintainer.name || `${maintainer.firstName} ${maintainer.lastName}`.trim();
      }
    }

    return 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {showAnalytics ? 'Salary Analytics' : 'Salary Management'}
          </h1>
          <p className="text-gray-600">
            {showAnalytics ? 'Comprehensive salary insights and trends' : 'Manage maintainer salaries and payments'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
          >
            <BarChart3 className="h-4 w-4" />
            <span>{showAnalytics ? 'Back to Management' : 'View Analytics'}</span>
          </button>
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200"
            title="Salary Management Guide"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Help</span>
          </button>
          {!showAnalytics && (
            <PermissionButton
              module="finance_management"
              submodule="salaries"
              action="create"
              onClick={() => {
                setShowForm(true);
                setEditingSalary(null);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add Salary</span>
            </PermissionButton>
          )}
        </div>
      </div>

      {/* Analytics View */}
      {showAnalytics ? (
        <div className="space-y-6">
          {/* Analytics Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <Select
                  value={filters.year}
                  onValueChange={(value) => handleFilterChange('year', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                    <SelectItem value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</SelectItem>
                    <SelectItem value={(new Date().getFullYear() - 2).toString()}>{new Date().getFullYear() - 2}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <Select
                  value={filters.branchId || ''}
                  onValueChange={(value) => handleFilterChange('branchId', value || '')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch._id} value={branch._id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Analytics Charts */}
          {analytics && analytics.monthlyTrends ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Salary Trends - Bar Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Salary Trends</h3>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: analytics.monthlyTrends.map(month =>
                        new Date(parseInt(analytics.year), month._id - 1).toLocaleDateString('en-IN', { month: 'short' })
                      ),
                      datasets: [
                        {
                          label: 'Gross Salary',
                          data: analytics.monthlyTrends.map(month => month.totalGrossSalary || 0),
                          backgroundColor: 'rgba(34, 197, 94, 0.8)',
                          borderColor: 'rgba(34, 197, 94, 1)',
                          borderWidth: 1,
                        },
                        {
                          label: 'Paid Amount',
                          data: analytics.monthlyTrends.map(month => month.totalPaidAmount || 0),
                          backgroundColor: 'rgba(59, 130, 246, 0.8)',
                          borderColor: 'rgba(59, 130, 246, 1)',
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return salaryService.formatCurrency(context.raw);
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return salaryService.formatCurrency(value);
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Payment Status Distribution - Doughnut Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Distribution</h3>
                <div className="h-80 flex items-center justify-center">
                  <Doughnut
                    data={{
                      labels: ['Paid', 'Pending', 'Partially Paid'],
                      datasets: [{
                        data: [
                          stats.paidCount || 0,
                          (stats.totalSalaries || 0) - (stats.paidCount || 0) - (stats.partiallyPaidCount || 0),
                          stats.partiallyPaidCount || 0
                        ],
                        backgroundColor: [
                          'rgba(34, 197, 94, 0.8)',
                          'rgba(239, 68, 68, 0.8)',
                          'rgba(245, 158, 11, 0.8)',
                        ],
                        borderColor: [
                          'rgba(34, 197, 94, 1)',
                          'rgba(239, 68, 68, 1)',
                          'rgba(245, 158, 11, 1)',
                        ],
                        borderWidth: 2,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((context.raw / total) * 100).toFixed(1);
                              return `${context.label}: ${context.raw} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data Available</h3>
              <p className="text-gray-600">Analytics data for the selected year could not be loaded.</p>
            </div>
          )}

          {/* Summary Statistics */}
          {analytics && analytics.monthlyTrends && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Year Summary ({analytics.year})</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics.monthlyTrends.reduce((sum, month) => sum + (month.count || 0), 0)}
                  </div>
                  <div className="text-sm text-blue-800">Total Salaries</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {salaryService.formatCurrency(
                      analytics.monthlyTrends.reduce((sum, month) => sum + (month.totalPaidAmount || 0), 0)
                    )}
                  </div>
                  <div className="text-sm text-green-800">Total Paid</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {salaryService.formatCurrency(
                      analytics.monthlyTrends.reduce((sum, month) => sum + (month.totalGrossSalary || 0), 0)
                    )}
                  </div>
                  <div className="text-sm text-yellow-800">Total Gross</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {salaryService.formatCurrency(
                      analytics.monthlyTrends.reduce((sum, month) => sum + (month.totalGrossSalary || 0) - (month.totalPaidAmount || 0), 0)
                    )}
                  </div>
                  <div className="text-sm text-purple-800">Pending Amount</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSalaries}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">{salaryService.formatCurrency(stats.totalAmount)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid Amount</p>
              <p className="text-2xl font-bold text-blue-600">{salaryService.formatCurrency(stats.totalPaidAmount)}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fully Paid</p>
              <p className="text-2xl font-bold text-green-600">{stats.paidCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Partially Paid</p>
              <p className="text-2xl font-bold text-orange-600">{stats.partiallyPaidCount}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdueCount || 0}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && analytics && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Salary Analytics</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Monthly Salary Trends</h3>
              <div className="space-y-2">
                {analytics.monthlyTrends.map((month) => (
                  <div key={month._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">
                      {new Date(parseInt(analytics.year), month._id - 1).toLocaleDateString('en-IN', { month: 'long' })}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">
                        {salaryService.formatCurrency(month.totalGrossSalary)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Paid: {salaryService.formatCurrency(month.totalPaidAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Year Summary ({analytics.year})</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="text-sm font-medium">Total Salaries</span>
                  <span className="text-sm font-bold text-blue-600">
                    {analytics.monthlyTrends.reduce((sum, month) => sum + (month.count || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="text-sm font-medium">Total Paid</span>
                  <span className="text-sm font-bold text-green-600">
                    {salaryService.formatCurrency(
                      analytics.monthlyTrends.reduce((sum, month) => sum + (month.totalPaidAmount || 0), 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                  <span className="text-sm font-medium">Total Gross</span>
                  <span className="text-sm font-bold text-yellow-600">
                    {salaryService.formatCurrency(
                      analytics.monthlyTrends.reduce((sum, month) => sum + (month.totalGrossSalary || 0), 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search maintainers..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <Select
              value={filters.maintainerId}
              onValueChange={(value) => handleFilterChange('maintainerId', value || '')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Maintainers" />
              </SelectTrigger>
              <SelectContent>
                {maintainers.map((maintainer) => (
                  <SelectItem key={maintainer._id} value={maintainer._id}>
                    {maintainer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={filters.month}
              onValueChange={(value) => handleFilterChange('month', value || '')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                {salaryService.getMonthsList().map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={filters.year}
              onValueChange={(value) => handleFilterChange('year', value || '')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value || '')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
            >
              Reset
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Salaries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee & Period
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600 text-sm">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : salaries.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 py-2 text-center text-gray-500 text-sm">
                    No salary records found
                  </td>
                </tr>
              ) : (
                salaries.map((salary) => (
                  <tr key={salary._id} className="hover:bg-gray-25 transition-colors duration-150">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {getMaintainerName(salary)}
                          </div>
                          {salary.status === 'paid' && (
                            <Clock className="h-3 w-3 text-orange-500 flex-shrink-0" title="Locked" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {salary.month} {salary.year}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {salaryService.formatCurrency(salary.netSalary)}
                        </div>
                        {salary.totalDeductions > 0 && (
                          <div className="text-xs text-red-600">
                            -{salaryService.formatCurrency(salary.totalDeductions)}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${salaryService.getStatusColor(getCalculatedStatus(salary))}`}>
                          {getCalculatedStatus(salary).replace('_', ' ').toUpperCase()}
                        </span>
                        {(getCalculatedStatus(salary) === 'partially_paid' || salary.paidAmount > 0) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {salaryService.formatCurrency(salary.paidAmount || 0)}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm">
                        {salary.paymentDate ? (
                          <div>
                            <div className="text-gray-900">{salaryService.formatDate(salary.paymentDate)}</div>
                            <div className="text-xs text-gray-500">{salary.paymentMethod}</div>
                          </div>
                        ) : (
                          <div className="text-gray-400">Not paid</div>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <PermissionAction
                          module="finance_management"
                          submodule="salaries"
                          action="read"
                        >
                          <button
                            onClick={() => {
                              setSelectedSalary(salary);
                              setShowDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </PermissionAction>

                        <PermissionAction
                          module="finance_management"
                          submodule="salaries"
                          action="update"
                        >
                          <button
                            onClick={() => {
                              setEditingSalary(salary);
                              setShowForm(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit Salary"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </PermissionAction>

                        <PermissionAction
                          module="finance_management"
                          submodule="salaries"
                          action="update"
                        >
                          {(() => {
                            // Check if salary is locked (paid and for current/past month)
                            const now = new Date();
                            const currentYear = now.getFullYear();
                            const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

                            const salaryYear = parseInt(salary.year);
                            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                               'July', 'August', 'September', 'October', 'November', 'December'];
                            const salaryMonth = monthNames.indexOf(salary.month) + 1;

                            const isCurrentOrPastMonth = salaryYear < currentYear ||
                              (salaryYear === currentYear && salaryMonth <= currentMonth);
                            const isFullyPaid = salary.status === 'paid';
                            const isLocked = isFullyPaid && isCurrentOrPastMonth;

                            return (
                              <button
                                onClick={
                                  isLocked
                                    ? undefined
                                    : () => {
                                        setSalaryToPay(salary);
                                        setShowPaymentModal(true);
                                      }
                                }
                                className={`p-1 rounded ${
                                  isLocked
                                    ? "text-gray-400 cursor-not-allowed opacity-50"
                                    : "text-green-600 hover:text-green-900"
                                }`}
                                title={
                                  isLocked
                                    ? "Salary is locked until next month"
                                    : salary.paidAmount > 0 ? "Make Partial Payment" : "Process Payment"
                                }
                                disabled={isLocked}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            );
                          })()}
                        </PermissionAction>

                        <PermissionAction
                          module="finance_management"
                          submodule="salaries"
                          action="read"
                        >
                          <button
                            onClick={() => {
                              setSelectedMaintainer(salary.maintainerId);
                              setShowHistoryModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="View Salary History"
                          >
                            <History className="h-4 w-4" />
                          </button>
                        </PermissionAction>

                        <PermissionAction
                          module="finance_management"
                          submodule="salaries"
                          action="delete"
                        >
                          <button
                            onClick={() => {
                              setSalaryToDelete(salary);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete Salary"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </PermissionAction>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-2 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                  <span className="font-medium">{pagination.pages}</span> ({pagination.total} total)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNumber = Math.max(1, pagination.page - 2) + i;
                    if (pageNumber > pagination.pages) return null;

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNumber === pagination.page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <SalaryForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingSalary(null);
          }}
          onSubmit={handleSalarySubmit}
          editingSalary={editingSalary}
          maintainers={maintainers}
        />
      )}

      {showDetails && selectedSalary && (
        <SalaryDetails
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedSalary(null);
          }}
          salary={selectedSalary}
        />
      )}
      </>  // Close the management content fragment
      )}

      {showDeleteModal && salaryToDelete && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSalaryToDelete(null);
          }}
          onConfirm={handleDeleteSalary}
          title="Delete Salary Record"
          message={`Are you sure you want to delete the salary record for ${getMaintainerName(salaryToDelete)} (${salaryToDelete.month} ${salaryToDelete.year})? This action cannot be undone.`}
        />
      )}

      {showPaymentModal && salaryToPay && (
        <SalaryPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSalaryToPay(null);
          }}
          salary={salaryToPay}
          onPaymentProcessed={handleSalaryPayment}
        />
      )}

      {showHistoryModal && selectedMaintainer && (
        <SalaryHistoryModal
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedMaintainer(null);
          }}
          maintainer={selectedMaintainer}
        />
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Salary Management Guide</h3>
                  <p className="text-sm text-gray-600">Complete workflow for managing maintainer salaries</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Overview */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-900 mb-2">🎯 Overview</h4>
                <p className="text-blue-800">
                  Salary Management helps you track and process payments for your property maintainers.
                  Each maintainer has ONE salary record that you update monthly rather than creating multiple records.
                </p>
              </div>

              {/* Workflow Steps */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                  How Salary Management Works
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Step 1 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600">1</span>
                      </div>
                      <h5 className="font-semibold text-gray-900">Add Salary Record</h5>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Click "Add Salary" button</li>
                      <li>• Select a maintainer</li>
                      <li>• Set salary details (base pay, bonus, overtime)</li>
                      <li>• Each maintainer can have only ONE salary record</li>
                    </ul>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">2</span>
                      </div>
                      <h5 className="font-semibold text-gray-900">Edit for Monthly Updates</h5>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Use the Edit button to update salary details</li>
                      <li>• Change month/year for new payment period</li>
                      <li>• Update base salary, bonus, or overtime as needed</li>
                      <li>• One record per maintainer, updated monthly</li>
                    </ul>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">3</span>
                      </div>
                      <h5 className="font-semibold text-gray-900">Process Payments</h5>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Click the green payment button (✓)</li>
                      <li>• Adjust salary components if needed</li>
                      <li>• Enter payment amount and method</li>
                      <li>• Upload receipt (optional)</li>
                      <li>• Process full or partial payments</li>
                    </ul>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600">4</span>
                      </div>
                      <h5 className="font-semibold text-gray-900">Track & Monitor</h5>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• View payment history per maintainer</li>
                      <li>• Check salary analytics and trends</li>
                      <li>• Monitor pending and overdue payments</li>
                      <li>• Export salary data when needed</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Status Explanations */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-600" />
                  Payment Status Meanings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm"><strong>Pending:</strong> Future payment period</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm"><strong>Paid:</strong> Fully paid (locked until next month)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                    <span className="text-sm"><strong>Partially Paid:</strong> Some payment made, balance remaining</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-sm"><strong>Overdue:</strong> Past due date, not paid</span>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Important Notes
                </h4>
                <ul className="text-yellow-800 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>Each maintainer can have only ONE salary record. Update it monthly instead of creating multiple records.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>Once a salary is fully paid, the payment button becomes locked until the next month.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>Use the Edit button to modify salary components before processing payments.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>Partial payments are allowed - the system tracks remaining balances automatically.</span>
                  </li>
                </ul>
              </div>

              {/* Quick Actions Guide */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Quick Actions Reference
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-green-800 mb-2">Table Actions:</h5>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li><strong>👁 View:</strong> See detailed salary breakdown</li>
                      <li><strong>✏️ Edit:</strong> Modify salary components and period</li>
                      <li><strong>✓ Pay:</strong> Process salary payments</li>
                      <li><strong>📋 History:</strong> View payment history</li>
                      <li><strong>🗑️ Delete:</strong> Remove salary record</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-green-800 mb-2">Analytics:</h5>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li><strong>📊 Charts:</strong> Monthly salary trends</li>
                      <li><strong>📈 Statistics:</strong> Payment status distribution</li>
                      <li><strong>📋 Summary:</strong> Year-over-year comparisons</li>
                      <li><strong>📥 Export:</strong> Download salary data</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Got it! Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salaries;
