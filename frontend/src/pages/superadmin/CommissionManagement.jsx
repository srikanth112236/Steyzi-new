import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Filter,
  Download,
  PieChart,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Building2,
  Award,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import salesService from '../../services/sales.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../components/ui/select';

const CommissionManagement = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedManager, setSelectedManager] = useState('all');
  const [expandedManagers, setExpandedManagers] = useState(new Set());
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchCommissionData();
  }, [filters]);

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      const response = await salesService.getCommissionManagement(filters);
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch commission data');
        setData(null);
      }
    } catch (error) {
      console.error('Error fetching commission data:', error);
      toast.error('Failed to load commission management data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleManagerExpansion = (managerId) => {
    const newExpanded = new Set(expandedManagers);
    if (newExpanded.has(managerId)) {
      newExpanded.delete(managerId);
    } else {
      newExpanded.add(managerId);
    }
    setExpandedManagers(newExpanded);
  };

  const getPhaseName = (phase) => {
    const phaseNames = {
      'phase1_0-6months': 'Phase 1: 0-6 Months (20%)',
      'phase2_6-12months': 'Phase 2: 6-12 Months (15%)',
      'phase3_1-3years': 'Phase 3: 1-3 Years (10%)',
      'phase4_closed': 'Phase 4: Closed (0%)',
      'inactive': 'Inactive'
    };
    return phaseNames[phase] || phase;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">No commission data available</p>
          <button
            onClick={fetchCommissionData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { summary, managers } = data;

  // Filter managers if selected
  const filteredManagers = selectedManager === 'all'
    ? managers
    : managers.filter(m => m.manager._id === selectedManager);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commission Management</h1>
          <p className="text-gray-600 mt-1">Track and manage sales manager commissions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchCommissionData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              // Export functionality can be added here
              toast.success('Export feature coming soon');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sales Manager
            </label>
            <Select value={selectedManager} onValueChange={setSelectedManager}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Managers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Managers</SelectItem>
                {managers.map((m) => (
                  <SelectItem key={m.manager._id} value={m.manager._id}>
                    {m.manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sales Managers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.totalSalesManagers}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total PGs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.totalPGs}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {summary.activePGs} active
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Month Recurring Commission</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary.currentMonthRecurringCommission || summary.totalCommission)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Last month: {formatCurrency(summary.lastMonthRecurringCommission || 0)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sub-Sales Staff</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.totalSubSalesStaff}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Commission Breakdown */}
      {summary.overallBreakdown && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Commission Breakdown by Phase</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(summary.overallBreakdown).map(([phase, data]) => {
              if (phase === 'inactive') return null;
              return (
                <div key={phase} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    {getPhaseName(phase)}
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {data.count} PGs
                  </p>
                  <p className="text-sm text-blue-600 font-medium mt-1">
                    {formatCurrency(data.commission)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Managers List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          Sales Managers ({filteredManagers.length})
        </h2>
        {filteredManagers.map((managerData, index) => {
          const isExpanded = expandedManagers.has(managerData.manager._id);
          return (
            <motion.div
              key={managerData.manager._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              {/* Manager Header */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => toggleManagerExpansion(managerData.manager._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {managerData.manager.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {managerData.manager.email} • ID: {managerData.manager.salesUniqueId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">This Month Commission</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatCurrency(managerData.performance.currentMonthCommission || managerData.performance.totalCommission)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last: {formatCurrency(managerData.performance.lastMonthCommission || 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Active PGs</p>
                      <p className="text-xl font-bold text-green-600">
                        {managerData.performance.activePGs}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total PGs</p>
                      <p className="text-xl font-bold text-gray-900">
                        {managerData.performance.totalPGs}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200"
                  >
                    <div className="p-6 space-y-6">
                      {/* Team Info */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Team Overview</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Sub-Sales Staff</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">
                              {managerData.team.totalSubSalesStaff}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              {managerData.team.activeSubSalesStaff} active
                            </p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Revenue Generated</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">
                              {managerData.performance.revenueGenerated} PGs
                            </p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Commission Rate</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">
                              Phased Rates
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Commission Breakdown */}
                      {managerData.performance.commissionBreakdown && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Commission by Phase</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            {Object.entries(managerData.performance.commissionBreakdown).map(([phase, data]) => {
                              if (phase === 'inactive') return null;
                              return (
                                <div key={phase} className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                                  <p className="text-xs font-medium text-blue-800 mb-1">
                                    {getPhaseName(phase)}
                                  </p>
                                  <p className="text-lg font-bold text-blue-900">
                                    {data.count} PGs
                                  </p>
                                  <p className="text-sm text-blue-700 font-medium mt-1">
                                    {formatCurrency(data.commission)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Monthly Trends */}
                      {managerData.monthlyTrends && managerData.monthlyTrends.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Monthly Recurring Commissions (Last 12 Months)</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Month</th>
                                  <th className="px-4 py-2 text-right text-gray-700 font-semibold">New PGs</th>
                                  <th className="px-4 py-2 text-right text-gray-700 font-semibold">Active PGs</th>
                                  <th className="px-4 py-2 text-right text-gray-700 font-semibold">Recurring Commission</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {managerData.monthlyTrends.slice(-6).map((trend, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-gray-900">{trend.month}</td>
                                    <td className="px-4 py-2 text-right text-gray-700">{trend.totalPGs}</td>
                                    <td className="px-4 py-2 text-right text-green-600 font-medium">{trend.activePGs}</td>
                                    <td className="px-4 py-2 text-right text-blue-600 font-semibold">
                                      {formatCurrency(trend.monthlyCommission || trend.commission)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Upcoming Months */}
                      {managerData.upcomingMonths && managerData.upcomingMonths.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Projected Recurring Commissions (Next 6 Months)</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-blue-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Month</th>
                                  <th className="px-4 py-2 text-right text-gray-700 font-semibold">Projected Active PGs</th>
                                  <th className="px-4 py-2 text-right text-gray-700 font-semibold">Projected Commission</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {managerData.upcomingMonths.map((upcoming, idx) => (
                                  <tr key={idx} className="hover:bg-blue-50">
                                    <td className="px-4 py-2 text-gray-900 font-medium">{upcoming.month}</td>
                                    <td className="px-4 py-2 text-right text-blue-600 font-medium">{upcoming.projectedActivePGs}</td>
                                    <td className="px-4 py-2 text-right text-blue-700 font-semibold">
                                      {formatCurrency(upcoming.projectedCommission)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Team Members */}
                      {managerData.team.subSalesStaff && managerData.team.subSalesStaff.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Team Members</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Name</th>
                                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Email</th>
                                  <th className="px-4 py-2 text-right text-gray-700 font-semibold">PGs Added</th>
                                  <th className="px-4 py-2 text-right text-gray-700 font-semibold">Active PGs</th>
                                  <th className="px-4 py-2 text-right text-gray-700 font-semibold">Commission</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {managerData.team.subSalesStaff.map((staff) => (
                                  <tr key={staff._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-gray-900">{staff.name}</td>
                                    <td className="px-4 py-2 text-gray-600">{staff.email}</td>
                                    <td className="px-4 py-2 text-right text-gray-700">{staff.pgsAdded}</td>
                                    <td className="px-4 py-2 text-right text-green-600 font-medium">{staff.activePGs}</td>
                                    <td className="px-4 py-2 text-right text-blue-600 font-semibold">
                                      {formatCurrency(staff.commissionEarned)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* PGs List */}
                      {managerData.pgs && managerData.pgs.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            PGs List ({managerData.pgs.length})
                          </h4>
                          <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">PG Name</th>
                                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Admin</th>
                                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Added By</th>
                                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Status</th>
                                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Phase</th>
                                  <th className="px-4 py-2 text-right text-gray-700 font-semibold">Commission Rate</th>
                                  <th className="px-4 py-2 text-left text-gray-700 font-semibold">Created</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {managerData.pgs.slice(0, 10).map((pg) => (
                                  <tr key={pg._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-gray-900 font-medium">{pg.name}</td>
                                    <td className="px-4 py-2 text-gray-600">
                                      {pg.admin ? `${pg.admin.name}` : 'N/A'}
                                    </td>
                                    <td className="px-4 py-2 text-gray-600">
                                      {pg.addedBy ? `${pg.addedBy.name}` : 'N/A'}
                                    </td>
                                    <td className="px-4 py-2">
                                      {pg.commission.hasActiveSubscription ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          Active
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                          Inactive
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2">
                                      <span className="text-xs font-medium text-blue-700">
                                        {getPhaseName(pg.commission.phase)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-right font-semibold text-blue-600">
                                      {formatCurrency(pg.commission.monthlyCommission || pg.commission.commission || 0)} ({pg.commission.rate}%)
                                    </td>
                                    <td className="px-4 py-2 text-gray-600 text-xs">
                                      {pg.commission.monthsSubscribed !== undefined ? `${pg.commission.monthsSubscribed} months` : 'N/A'}
                                    </td>
                                    <td className="px-4 py-2 text-gray-500 text-xs">
                                      {pg.createdAt ? format(parseISO(pg.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {managerData.pgs.length > 10 && (
                            <p className="text-sm text-gray-500 mt-2">
                              Showing 10 of {managerData.pgs.length} PGs
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {filteredManagers.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No sales managers found</p>
        </div>
      )}
    </div>
  );
};

export default CommissionManagement;

