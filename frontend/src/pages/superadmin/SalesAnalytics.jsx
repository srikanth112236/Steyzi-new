import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar as CalendarIcon, 
  RefreshCw,
  AlertTriangle,
  PieChart,
  BarChart,
  ChevronDown,
  Filter as FilterIcon,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

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

import Chart, { 
  RevenueChart, 
  OccupancyChart 
} from "../../components/common/charts/Chart";

import superadminService from '../../services/superadmin.service';

const SalesAnalytics = () => {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: 'weekly',
    startDate: null,
    endDate: null,
    subscriptionType: 'all',
    salesManager: 'all',
    branch: 'all'
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Predefined date ranges
  const dateRanges = {
    'this_week': {
      startDate: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())),
      endDate: new Date(new Date().setDate(new Date().getDate() + (6 - new Date().getDay())))
    },
    'this_month': {
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date())
    },
    'this_year': {
      startDate: startOfYear(new Date()),
      endDate: endOfYear(new Date())
    },
    'last_month': {
      startDate: startOfMonth(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)),
      endDate: endOfMonth(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1))
    }
  };

  useEffect(() => {
    fetchSalesAnalytics();
  }, [filters]);

  const fetchSalesAnalytics = async () => {
    try {
      setLoading(true);
      const response = await superadminService.getSalesAnalytics(filters);
      
      // Handle nested error response
      if (response.success && response.data.success === false) {
        toast.error(response.data.message || 'Failed to fetch sales analytics');
        setSalesData(null);
        return;
      }

      // Handle successful response
      if (response.success) {
        // Ensure we're using the correct data level
        setSalesData(response.data.data || response.data);
      } else {
        toast.error(response.message || 'Failed to fetch sales analytics');
        setSalesData(null);
      }
    } catch (error) {
      console.error('Error fetching sales analytics:', error);
      toast.error('An error occurred while fetching sales analytics');
      setSalesData(null);
    } finally {
      setLoading(false);
    }
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
      period: 'weekly',
      startDate: null,
      endDate: null,
      subscriptionType: 'all',
      salesManager: 'all',
      branch: 'all'
    });
    setShowAdvancedFilters(false);
  };

  // Render filters section
  const renderFilters = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FilterIcon className="mr-2 h-5 w-5 text-blue-600" />
            Sales Filters
          </h3>
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Period Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Period</label>
            <Select 
              value={filters.period} 
              onValueChange={(value) => updateFilters({ period: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Time Periods</SelectLabel>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Predefined Ranges</SelectLabel>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
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

          {/* Refresh Button */}
          <div className="flex items-end">
            <button 
              onClick={fetchSalesAnalytics}
              className="w-full p-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
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
              {/* Subscription Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subscription Type</label>
                <Select 
                  value={filters.subscriptionType} 
                  onValueChange={(value) => updateFilters({ subscriptionType: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Subscription" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subscriptions</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sales Manager Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sales Manager</label>
                <Select 
                  value={filters.salesManager} 
                  onValueChange={(value) => updateFilters({ salesManager: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Managers</SelectItem>
                    {/* Dynamically populate from salesData or API */}
                    <SelectItem value="manager1">John Doe</SelectItem>
                    <SelectItem value="manager2">Jane Smith</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Branch Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
                <Select 
                  value={filters.branch} 
                  onValueChange={(value) => updateFilters({ branch: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {/* Dynamically populate from salesData or API */}
                    <SelectItem value="branch1">Koramangala</SelectItem>
                    <SelectItem value="branch2">Indiranagar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clear Filters Button */}
        {(filters.startDate || filters.endDate || filters.subscriptionType !== 'all' || 
          filters.salesManager !== 'all' || filters.branch !== 'all') && (
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Memoized data processing with enhanced grouping
  const processedSalesData = useMemo(() => {
    console.log("Raw salesData:", salesData);

    if (!salesData?.salesAnalytics || salesData.salesAnalytics.length === 0) {
      console.log("No sales analytics data");
      return null;
    }

    // Group sales data by month and year with more detailed tracking
    const monthlyData = salesData.salesAnalytics.reduce((acc, item) => {
      // Ensure item and item.period exist and have valid values
      if (!item || !item.period || !item.period.year || !item.period.month) {
        console.log("Invalid item:", item);
        return acc;
      }

      const key = `${item.period.year}-${item.period.month}`;
      if (!acc[key]) {
        acc[key] = {
          period: key,
          totalPGs: 0,
          totalRevenue: 0,
          completedPGs: 0,
          weeklyBreakdown: {}
        };
      }

      // Aggregate monthly data
      acc[key].totalPGs += item.totalPGs || 0;
      acc[key].totalRevenue += item.totalRevenue || 0;
      acc[key].completedPGs += item.completedPGs || 0;

      // Track weekly breakdown
      const weekKey = item.period.week;
      if (!acc[key].weeklyBreakdown[weekKey]) {
        acc[key].weeklyBreakdown[weekKey] = {
          pgs: 0,
          revenue: 0,
          completedPGs: 0
        };
      }
      acc[key].weeklyBreakdown[weekKey].pgs += item.totalPGs || 0;
      acc[key].weeklyBreakdown[weekKey].revenue += item.totalRevenue || 0;
      acc[key].weeklyBreakdown[weekKey].completedPGs += item.completedPGs || 0;

      return acc;
    }, {});

    // Convert monthly data to sorted array
    const monthlyBreakdown = Object.values(monthlyData).sort((a, b) => {
      const [aYear, aMonth] = a.period.split('-').map(Number);
      const [bYear, bMonth] = b.period.split('-').map(Number);
      return aYear - bYear || aMonth - bMonth;
    });

    // Prepare weekly trend data for chart
    const weeklyTrendData = {
      labels: [],
      values: []
    };

    monthlyBreakdown.forEach(month => {
      Object.entries(month.weeklyBreakdown).forEach(([week, data]) => {
        weeklyTrendData.labels.push(`${month.period}-W${week}`);
        weeklyTrendData.values.push(data.pgs);
      });
    });

    console.log("Processed salesData:", { monthlyBreakdown, weeklyTrendData });

    return {
      monthlyBreakdown,
      weeklyTrendData
    };
  }, [salesData]);

  // Render method for weekly PG trend chart
  const renderWeeklyPGTrendChart = () => {
    if (!processedSalesData?.weeklyTrendData?.labels.length) {
      return null;
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Weekly PG Acquisition Trend
        </h3>
        <Chart 
          type="bar" 
          data={processedSalesData.weeklyTrendData} 
          height={300} 
          options={{
            plugins: {
              title: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of PGs'
                }
              }
            }
          }} 
        />
      </div>
    );
  };

  // Render method for detailed monthly insights
  const renderMonthlyInsights = () => {
    if (!processedSalesData?.monthlyBreakdown.length) {
      return null;
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Detailed Monthly Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {processedSalesData.monthlyBreakdown.map((monthData, index) => {
            const [year, month] = monthData.period.split('-');
            const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

            return (
              <motion.div 
                key={monthData.period}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-base font-semibold text-gray-800">
                    {monthName} {year}
                  </span>
                  <BarChart2 className="h-6 w-6 text-blue-500" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-gray-500 uppercase">PGs</div>
                    <div className="text-sm font-bold">{monthData.totalPGs || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Revenue</div>
                    <div className="text-sm font-bold text-green-600">
                      {formatCurrency(monthData.totalRevenue || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Completed</div>
                    <div className="text-sm font-bold text-blue-600">
                      {monthData.completedPGs || 0}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-gray-500 uppercase mb-1">Weekly Breakdown</div>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(monthData.weeklyBreakdown).map(([week, weekData]) => (
                      <div 
                        key={week} 
                        className="bg-white rounded-md p-2 text-center shadow-sm"
                      >
                        <div className="text-xs font-medium text-gray-600">Week {week}</div>
                        <div className="text-xs text-blue-600">{weekData.pgs} PGs</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render method for overall insights with robust null checks
  const renderOverallInsights = () => {
    // Ensure overallInsights exists and has valid data
    const overallInsights = salesData?.overallInsights || {};
    const {
      totalPGs = 0, 
      totalRevenue = 0, 
      completedPGs = 0
    } = overallInsights;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 rounded-full p-3">
              <BarChart2 className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total PGs</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totalPGs}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 rounded-full p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Total Revenue</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalRevenue)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 rounded-full p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Completed PGs</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {completedPGs}
          </div>
        </div>
      </div>
    );
  };

  // Render method for subscription plan chart with robust null checks
  const renderSubscriptionPlanChart = () => {
    // Ensure subscriptionAnalytics exists and has valid data
    const subscriptionAnalytics = salesData?.subscriptionAnalytics || {};
    const subscriptionsByPlan = subscriptionAnalytics.subscriptionsByPlan || [];

    if (subscriptionsByPlan.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6 text-center text-gray-500">
          No subscription data available
        </div>
      );
    }

    const subscriptionData = {
      labels: subscriptionsByPlan.map(plan => plan.planName || 'Unknown'),
      values: subscriptionsByPlan.map(plan => plan.count || 0)
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Subscription Plans Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Chart 
              type="pie" 
              data={subscriptionData} 
              height={300} 
              options={{
                plugins: {
                  title: {
                    display: false
                  },
                  legend: {
                    position: 'right'
                  }
                }
              }} 
            />
          </div>
          <div>
            <div className="grid grid-cols-2 gap-2">
              {subscriptionsByPlan.map((plan, index) => (
                <div 
                  key={index} 
                  className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-700 truncate">
                      {plan.planName || 'Unknown Plan'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {plan.count || 0} Subscriptions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderErrorState = () => {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-6">
        <div className="bg-red-100 rounded-full p-4 mb-4">
          <AlertTriangle className="h-12 w-12 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Unable to Load Sales Analytics
        </h2>
        <p className="text-gray-600 mb-4">
          We encountered an issue retrieving the sales data. Please try again later.
        </p>
        <button 
          onClick={fetchSalesAnalytics}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="inline-block mr-2" /> Retry
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no data and not loading, show error state
  if (!salesData) {
    return renderErrorState();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <BarChart2 className="mr-3 text-blue-600" />
          Sales Analytics
        </h1>
      </div>

      {/* Filters Section */}
      {renderFilters()}

      {/* Rest of the component */}
      {renderOverallInsights()}
      {renderWeeklyPGTrendChart()}
      {renderMonthlyInsights()}
      {renderSubscriptionPlanChart()}
    </div>
  );
};

export default SalesAnalytics;
