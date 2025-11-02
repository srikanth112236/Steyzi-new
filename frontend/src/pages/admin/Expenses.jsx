import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Building2,
  FileText,
  TrendingUp,
  BarChart3,
  PieChart,
  MoreVertical,
  Upload,
  HelpCircle,
  X
} from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import expenseService from '../../services/expense.service';
import branchService from '../../services/branch.service';
import ExpenseForm from '../../components/admin/ExpenseForm';
import ExpenseDetails from '../../components/admin/ExpenseDetails';
import ExpenseApprovalModal from '../../components/admin/ExpenseApprovalModal';
import ExpensePaymentModal from '../../components/admin/ExpensePaymentModal';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
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

import PermissionButton from '../../components/common/PermissionButton';
import PermissionAction from '../../components/common/PermissionAction';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Calendar } from '../../components/ui/calendar';

const Expenses = () => {
  const { user } = useSelector((state) => state.auth);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [expenseToApprove, setExpenseToApprove] = useState(null);
  const [expenseToPay, setExpenseToPay] = useState(null);

  // Filters and search
  const [filters, setFilters] = useState({
    search: '',
    expenseType: '',
    status: '',
    branchId: '',
    startDate: '',
    endDate: '',
    sortBy: 'expenseDate',
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
    totalExpenses: 0,
    totalAmount: 0,
    pendingCount: 0,
    approvedCount: 0,
    paidCount: 0
  });

  // Branches for analytics
  const [branches, setBranches] = useState([]);

  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Load expenses
  const loadExpenses = useCallback(async (page = 1) => {
    try {
      setLoading(true);

      const response = await expenseService.getAllExpenses({
        ...filters,
        page,
        limit: pagination.limit
      });

      if (response.success) {
        setExpenses(response.data.expenses);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const response = await expenseService.getExpenseStats({
        branchId: filters.branchId,
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [filters.branchId, filters.startDate, filters.endDate]);

  // Load branches for analytics
  const loadBranches = useCallback(async () => {
    try {
      const response = await branchService.getAllBranches();
      if (response.success) {
        const branchesData = response.data?.branches || [];
        setBranches(Array.isArray(branchesData) ? branchesData : []);
      } else {
        console.warn('Failed to load branches for analytics');
        setBranches([]);
      }
    } catch (error) {
      console.error('Error loading branches for analytics:', error);
      setBranches([]);
    }
  }, []);

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    try {
      const year = parseInt(filters.year || new Date().getFullYear().toString());
      const response = await expenseService.getExpenseAnalytics(year, filters.branchId);

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
    loadExpenses();
    loadStats();
  }, [loadExpenses, loadStats]);

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
    if (showAnalytics && (filters.year || filters.branchId)) {
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
    loadExpenses(newPage);
  };

  // Handle expense submission
  const handleExpenseSubmit = async (expenseData) => {
    try {
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense._id, expenseData);
        toast.success('Expense updated successfully');
      } else {
        await expenseService.createExpense(expenseData);
        toast.success('Expense created successfully');
      }

      setShowForm(false);
      setEditingExpense(null);
      loadExpenses();
      loadStats();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error(error.message || 'Failed to save expense');
    }
  };

  // Handle expense deletion
  const handleDeleteExpense = async () => {
    try {
      await expenseService.deleteExpense(expenseToDelete._id);
      toast.success('Expense deleted successfully');
      setShowDeleteModal(false);
      setExpenseToDelete(null);
      loadExpenses();
      loadStats();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  // Handle approve expense (opens confirmation modal)
  const handleApproveExpense = (expense) => {
    setExpenseToApprove(expense);
    setShowApprovalModal(true);
  };

  // Handle confirm approval
  const handleConfirmApproval = async (expenseId) => {
    try {
      await expenseService.approveExpense(expenseId);
      toast.success('Expense approved successfully');
      setShowApprovalModal(false);
      setExpenseToApprove(null);
      loadExpenses();
      loadStats();
    } catch (error) {
      console.error('Error approving expense:', error);
      toast.error('Failed to approve expense');
    }
  };

  // Handle mark as paid (opens confirmation modal)
  const handleMarkAsPaid = (expense) => {
    setExpenseToPay(expense);
    setShowPaymentModal(true);
  };

  // Handle confirm payment
  const handleConfirmPayment = async (expenseId, paymentData) => {
    try {
      await expenseService.markExpenseAsPaid(expenseId, paymentData);
      toast.success('Expense marked as paid successfully');
      setShowPaymentModal(false);
      setExpenseToPay(null);
      loadExpenses();
      loadStats();
    } catch (error) {
      console.error('Error marking expense as paid:', error);
      toast.error('Failed to mark expense as paid');
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      await expenseService.exportExpenses(filters);
      toast.success('Expenses exported successfully');
    } catch (error) {
      console.error('Error exporting expenses:', error);
      toast.error('Failed to export expenses');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      expenseType: '',
      status: '',
      branchId: '',
      startDate: '',
      endDate: '',
      sortBy: 'expenseDate',
      sortOrder: 'desc'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {showAnalytics ? 'Expense Analytics' : 'Expense Management'}
          </h1>
          <p className="text-gray-600">
            {showAnalytics ? 'Comprehensive expense insights and trends' : 'Track and manage your PG expenses'}
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
            title="Expense Management Guide"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Help</span>
          </button>
          {!showAnalytics && (
            <PermissionButton
              module="finance_management"
              submodule="expenses"
              action="create"
              onClick={() => {
                setShowForm(true);
                setEditingExpense(null);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add Expense</span>
            </PermissionButton>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalExpenses}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">{expenseService.formatCurrency(stats.totalAmount)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-blue-600">{stats.approvedCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">{stats.paidCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {/* Analytics View */}
      {showAnalytics ? (
        <div className="space-y-6">
          {/* Analytics Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <Select
                  value={filters.year || new Date().getFullYear().toString()}
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
          {analytics && analytics.monthlyAnalytics ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Expense Trends - Bar Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Expense Trends</h3>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: analytics.monthlyAnalytics.map(month =>
                        new Date(parseInt(analytics.year), month._id - 1).toLocaleDateString('en-IN', { month: 'short' })
                      ),
                      datasets: [{
                        label: 'Total Expenses',
                        data: analytics.monthlyAnalytics.map(month => month.totalAmount || 0),
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 1,
                      }],
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
                              return expenseService.formatCurrency(context.raw);
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return expenseService.formatCurrency(value);
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Expense Categories Distribution - Doughnut Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
                <div className="h-80 flex items-center justify-center">
                  <Doughnut
                    data={{
                      labels: analytics.topCategories.map(cat => cat.category.replace('_', ' ')),
                      datasets: [{
                        data: analytics.topCategories.map(cat => cat.totalAmount || 0),
                        backgroundColor: [
                          'rgba(34, 197, 94, 0.8)',
                          'rgba(59, 130, 246, 0.8)',
                          'rgba(245, 158, 11, 0.8)',
                          'rgba(239, 68, 68, 0.8)',
                          'rgba(147, 51, 234, 0.8)',
                          'rgba(6, 182, 212, 0.8)',
                        ],
                        borderColor: [
                          'rgba(34, 197, 94, 1)',
                          'rgba(59, 130, 246, 1)',
                          'rgba(245, 158, 11, 1)',
                          'rgba(239, 68, 68, 1)',
                          'rgba(147, 51, 234, 1)',
                          'rgba(6, 182, 212, 1)',
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
                          labels: {
                            boxWidth: 12,
                            font: {
                              size: 11
                            }
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((context.raw / total) * 100).toFixed(1);
                              return `${context.label}: ${expenseService.formatCurrency(context.raw)} (${percentage}%)`;
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
          {analytics && analytics.monthlyAnalytics && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Year Summary ({analytics.year})</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics.monthlyAnalytics.reduce((sum, month) => sum + (month.count || 0), 0)}
                  </div>
                  <div className="text-sm text-blue-800">Total Expenses</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {expenseService.formatCurrency(
                      analytics.monthlyAnalytics.reduce((sum, month) => sum + (month.totalAmount || 0), 0)
                    )}
                  </div>
                  <div className="text-sm text-green-800">Total Amount</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {analytics.topCategories.length}
                  </div>
                  <div className="text-sm text-yellow-800">Categories</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {expenseService.formatCurrency(
                      analytics.monthlyAnalytics.reduce((sum, month) => sum + (month.totalAmount || 0), 0) /
                      Math.max(analytics.monthlyAnalytics.length, 1)
                    )}
                  </div>
                  <div className="text-sm text-purple-800">Avg Monthly</div>
                </div>
              </div>
            </div>
          )}

          {/* Top Categories Table */}
          {analytics && analytics.topCategories.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Spending Categories</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % of Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.topCategories.map((category, index) => {
                      const totalAmount = analytics.monthlyAnalytics.reduce((sum, month) => sum + (month.totalAmount || 0), 0);
                      const percentage = totalAmount > 0 ? ((category.totalAmount / totalAmount) * 100).toFixed(1) : 0;

                      return (
                        <tr key={category.category}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
                              #{index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {category.category.replace('_', ' ')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-green-600">
                              {expenseService.formatCurrency(category.totalAmount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {percentage}%
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Statistics cards would go here if needed */}
          </div>

          {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search expenses..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <Select
              value={filters.expenseType}
              onValueChange={(value) => handleFilterChange('expenseType', value || '')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="housekeeping">Housekeeping</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="office_supplies">Office Supplies</SelectItem>
                <SelectItem value="repairs">Repairs</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="other">Other</SelectItem>
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => handleFilterChange('sortBy', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expenseDate">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="expenseName">Name</SelectItem>
                <SelectItem value="createdAt">Created</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expense & Details
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Paid By
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
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 py-2 text-center text-gray-500 text-sm">
                    No expenses found
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-25 transition-colors duration-150">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {expense.expenseName}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {expense.purpose}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {expenseService.formatCurrency(expense.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {expense.paidType}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${expenseService.getStatusColor(expense.status)}`}>
                        {expense.status}
                      </span>
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">{expenseService.formatDate(expense.expenseDate)}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {expense.paidBy?.firstName} {expense.paidBy?.lastName}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <PermissionAction
                          module="finance_management"
                          submodule="expenses"
                          action="read"
                        >
                          <button
                            onClick={() => {
                              setSelectedExpense(expense);
                              setShowDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </PermissionAction>

                        <PermissionAction
                          module="finance_management"
                          submodule="expenses"
                          action="update"
                        >
                          <button
                            onClick={() => {
                              setEditingExpense(expense);
                              setShowForm(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </PermissionAction>

                        <PermissionAction
                          module="finance_management"
                          submodule="expenses"
                          action="delete"
                        >
                          <button
                            onClick={() => {
                              setExpenseToDelete(expense);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </PermissionAction>

                        {expense.status === 'pending' && (
                          <PermissionAction
                            module="finance_management"
                            submodule="expenses"
                            action="update"
                          >
                            <button
                              onClick={() => handleApproveExpense(expense)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          </PermissionAction>
                        )}

                        {expense.status === 'approved' && (
                          <PermissionAction
                            module="finance_management"
                            submodule="expenses"
                            action="update"
                          >
                            <button
                              onClick={() => handleMarkAsPaid(expense)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Mark as Paid"
                            >
                              <DollarSign className="h-4 w-4" />
                            </button>
                          </PermissionAction>
                        )}
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
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
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
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>

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

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <ExpenseForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
          onSubmit={handleExpenseSubmit}
          editingExpense={editingExpense}
        />
      )}

      {showDetails && selectedExpense && (
        <ExpenseDetails
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedExpense(null);
          }}
          expense={selectedExpense}
        />
      )}
      </>  // Close the management content fragment
      )}

      {showDeleteModal && expenseToDelete && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setExpenseToDelete(null);
          }}
          onConfirm={handleDeleteExpense}
          title="Delete Expense"
          message={`Are you sure you want to delete the expense "${expenseToDelete.expenseName}"? This action cannot be undone.`}
        />
      )}

      {showApprovalModal && expenseToApprove && (
        <ExpenseApprovalModal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setExpenseToApprove(null);
          }}
          expense={expenseToApprove}
          onConfirmApproval={handleConfirmApproval}
        />
      )}

      {showPaymentModal && expenseToPay && (
        <ExpensePaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setExpenseToPay(null);
          }}
          expense={expenseToPay}
          onConfirmPayment={handleConfirmPayment}
        />
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Expense Management Guide</h3>
                  <p className="text-sm text-gray-600">Complete workflow for managing PG expenses</p>
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
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-green-900 mb-2">💰 Overview</h4>
                <p className="text-green-800">
                  Expense Management helps you track, approve, and process all expenses for your PG property.
                  Each expense goes through a workflow: Submission → Approval → Payment.
                </p>
              </div>

              {/* Workflow Steps */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                  How Expense Management Works
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Step 1 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600">1</span>
                      </div>
                      <h5 className="font-semibold text-gray-900">Submit Expense</h5>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Click "Add Expense" button</li>
                      <li>• Enter expense details and amount</li>
                      <li>• Select expense type (maintenance, utilities, etc.)</li>
                      <li>• Upload receipts if available</li>
                      <li>• Submit for approval</li>
                    </ul>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">2</span>
                      </div>
                      <h5 className="font-semibold text-gray-900">Approval Process</h5>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Expenses start as "Pending" status</li>
                      <li>• Use the green checkmark to approve</li>
                      <li>• Approved expenses move to "Approved" status</li>
                      <li>• Only approved expenses can be paid</li>
                    </ul>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">3</span>
                      </div>
                      <h5 className="font-semibold text-gray-900">Process Payment</h5>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Click the dollar sign ($) on approved expenses</li>
                      <li>• Confirm payment details in modal</li>
                      <li>• Mark as paid when transaction is complete</li>
                      <li>• Status changes to "Paid"</li>
                    </ul>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600">4</span>
                      </div>
                      <h5 className="font-semibold text-gray-900">Monitor & Track</h5>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• View expense analytics and trends</li>
                      <li>• Track spending by category</li>
                      <li>• Monitor approval and payment status</li>
                      <li>• Export expense reports</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Status Explanations */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-600" />
                  Expense Status Meanings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm"><strong>Pending:</strong> Submitted, waiting for approval</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="text-sm"><strong>Approved:</strong> Approved, ready for payment</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm"><strong>Paid:</strong> Payment completed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-sm"><strong>Rejected:</strong> Expense was rejected</span>
                  </div>
                </div>
              </div>

              {/* Expense Types */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Expense Categories
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="text-sm text-blue-800">
                    <strong>🏠 Maintenance</strong><br />
                    Property repairs & upkeep
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>⚡ Utilities</strong><br />
                    Electricity, water, gas
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>🧹 Housekeeping</strong><br />
                    Cleaning & supplies
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>🔒 Security</strong><br />
                    Security services & equipment
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>🍽️ Food</strong><br />
                    Groceries & meals
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>🚗 Transportation</strong><br />
                    Vehicle & travel expenses
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>📢 Marketing</strong><br />
                    Advertising & promotion
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>📎 Office Supplies</strong><br />
                    Stationery & equipment
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>🔧 Repairs</strong><br />
                    Equipment & fixture repairs
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>🛡️ Insurance</strong><br />
                    Insurance premiums
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>⚖️ Legal</strong><br />
                    Legal fees & consultations
                  </div>
                  <div className="text-sm text-blue-800">
                    <strong>❓ Other</strong><br />
                    Miscellaneous expenses
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
                    <span>All expenses must be approved before payment can be processed.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>Always upload receipts for expense verification and audit purposes.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>Use appropriate expense categories for better tracking and reporting.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>The approval workflow ensures proper financial controls and oversight.</span>
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
                      <li><strong>👁 View:</strong> See detailed expense information</li>
                      <li><strong>✏️ Edit:</strong> Modify expense details</li>
                      <li><strong>✓ Approve:</strong> Approve pending expenses</li>
                      <li><strong>💰 Pay:</strong> Mark approved expenses as paid</li>
                      <li><strong>🗑️ Delete:</strong> Remove expense records</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-green-800 mb-2">Analytics Features:</h5>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li><strong>📊 Trends:</strong> Monthly expense patterns</li>
                      <li><strong>🥧 Categories:</strong> Spending breakdown by type</li>
                      <li><strong>📈 Statistics:</strong> Summary metrics and totals</li>
                      <li><strong>📥 Export:</strong> Download expense reports</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
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

export default Expenses;
