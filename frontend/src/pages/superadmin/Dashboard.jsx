import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  Shield,
  UserCheck,
  Unlock,
  HeadphonesIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Home,
  MapPin,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

// Import modern components
import Chart, { RevenueChart, OccupancyChart, TicketStatusChart, PaymentTrendChart } from '../../components/common/charts/Chart';
import superadminService from '../../services/superadmin.service';
import activityService from '../../services/activity.service';
import StatCard from '../../components/common/StatCard';

// Create a StatCardGrid component inline to avoid import issues
const StatCardGrid = ({ children, className }) => {
  return (
    <div 
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className || ''}`}
    >
      {children}
    </div>
  );
};

// Create a StatCardGridSkeleton component
const StatCardGridSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(count)].map((_, index) => (
        <div 
          key={index} 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
        >
          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 w-36 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  // State management 
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time data state
  const [realtimeStats, setRealtimeStats] = useState({
    totalPGs: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeTickets: 0,
    occupancyRate: 0,
    monthlyGrowth: 0
  });

  const [analyticsData, setAnalyticsData] = useState({
    revenue: null,
    occupancy: null,
    tickets: null,
    payments: null,
    activities: [],
    alerts: [],
    ticketActivities: []
  });

  // Data fetching functions using centralized service
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await superadminService.fetchAllDashboardData(selectedPeriod);

      // Overview & realtime stats
      if (data.overview) {
        setDashboardData(data.overview);
        setRealtimeStats((prev) => ({
          ...prev,
          totalPGs: data.overview.totalPGs || 0,
          totalUsers: data.overview.totalUsers || 0,
          totalRevenue: data.overview.todayRevenue || 0,
          activeTickets: data.overview.openTickets || 0,
          occupancyRate: data.occupancy?.occupancyRate || 0,
          monthlyGrowth: (() => {
            const curr = data.overview.todayRevenue || 0;
            const prevDay = data.overview.yesterdayRevenue || 0;
            if (!prevDay) return 0;
            return Number((((curr - prevDay) / prevDay) * 100).toFixed(1));
          })()
        }));
      }

      // Analytics blocks
      setAnalyticsData({
        revenue: data.revenue ? {
          labels: data.revenue.labels || [],
          values: data.revenue.values || []
        } : null,
        occupancy: data.occupancy ? {
          occupied: data.occupancy.occupied || 0,
          vacant: data.occupancy.vacant || 0,
          totalBeds: data.occupancy.totalBeds || 0,
          occupancyRate: data.occupancy.occupancyRate || 0
        } : null,
        tickets: data.tickets ? {
          labels: data.tickets.labels || ['Open', 'In Progress', 'Resolved', 'Closed'],
          values: data.tickets.values || [0, 0, 0, 0],
          urgent: data.tickets.urgent || 0
        } : null,
        payments: data.payments ? {
          labels: generatePaymentLabels(selectedPeriod),
          completed: distributeCounts(data.payments.totalCount, generatePaymentLabels(selectedPeriod).length, 0.7),
          pending: distributeCounts(data.payments.totalCount, generatePaymentLabels(selectedPeriod).length, 0.2),
          overdue: distributeCounts(data.payments.totalCount, generatePaymentLabels(selectedPeriod).length, 0.1)
        } : null,
        activities: data.activities || [],
        alerts: (() => {
          const list = [];
          (data.alerts?.criticalTickets || []).forEach(t => list.push({
            id: t._id,
            type: 'ticket',
            title: `Critical Ticket: ${t.title || t._id}`,
            description: t.description || 'High priority ticket',
            timestamp: t.createdAt
          }));
          (data.alerts?.overduePayments || []).forEach(p => list.push({
            id: p._id,
            type: 'payment',
            title: `Overdue Payment: ₹${p.amount || 0}`,
            description: `Payment overdue${p.residentName ? ' for ' + p.residentName : ''}`,
            timestamp: p.dueDate
          }));
          return list;
        })(),
        ticketActivities: []
      });

      // Fallback: If activities not provided by dashboard API, fetch directly
      if (!data.activities || (Array.isArray(data.activities) && data.activities.length === 0)) {
        try {
          const res = await activityService.getSuperadminActivities({ page: 1, limit: 5 });
          if (res?.success && Array.isArray(res.data)) {
            setAnalyticsData(prev => ({ ...prev, activities: res.data }));
          }
        } catch (e) {
          // ignore; dashboard can work without activities
        }
      }

      // Ticket-only activities (support category) for quick tracking
      try {
        const ticketRes = await activityService.getSuperadminActivities({ page: 1, limit: 5, category: 'support' });
        if (ticketRes?.success && Array.isArray(ticketRes.data)) {
          setAnalyticsData(prev => ({ ...prev, ticketActivities: ticketRes.data }));
        }
      } catch (_) {}

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  // Helpers
  const generatePaymentLabels = (period) => {
    const labels = [];
    const now = new Date();
    if (period === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        labels.push(d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
      }
    } else if (period === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 7 * 86400000);
        // simple week label
        labels.push(`Wk ${d.getMonth() + 1}-${d.getDate()}`);
      }
    } else if (period === 'monthly') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }));
      }
    } else if (period === 'yearly') {
      for (let i = 4; i >= 0; i--) {
        labels.push(String(now.getFullYear() - i));
      }
    }
    return labels;
  };

  const distributeCounts = (total, buckets, ratio) => {
    if (!buckets) return [];
    const per = Math.floor((total * ratio) / buckets);
    return Array.from({ length: buckets }, () => per);
  };

  // Real-time updates
  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchDashboardData();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchDashboardData, autoRefresh]);

  // Handle period change
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  // Handle manual refresh
  const handleManualRefresh = () => {
    fetchDashboardData();
  };

  // Handle export using centralized service
  const handleExport = async (format) => {
    try {
      const blob = await superadminService.exportDashboardData(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `superadmin-dashboard-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value?.toFixed(1)}%`;
  };

  // Get trend data
  const getTrendData = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, direction: 'neutral' };
    
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Superadmin Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Monitor and manage your PG ecosystem in real-time
              </p>
              {lastUpdated && (
                <div className="flex items-center space-x-2 mt-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Period Selector */}
              <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
                  <button
                    key={period}
                    onClick={() => handlePeriodChange(period)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      selectedPeriod === period
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="relative">
                <select
                  onChange={(e) => handleExport(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>Export</option>
                  <option value="pdf">PDF Report</option>
                  <option value="excel">Excel Report</option>
                  <option value="csv">CSV Data</option>
                </select>
                <Download className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Alert Section */}
        {analyticsData.alerts.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <div>
                  <h3 className="font-semibold text-red-800">System Alerts</h3>
                  <p className="text-red-600 text-sm">
                    {analyticsData.alerts.length} alerts require your attention
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Cards */}
        {loading ? (
          <StatCardGridSkeleton />
        ) : (
          <StatCardGrid className="mb-8">
            <StatCard
              title="Total PGs"
              value={realtimeStats.totalPGs}
              icon={Building2}
              iconColor="bg-blue-500"
              link="/superadmin/pg-management"
              trend={getTrendData(realtimeStats.totalPGs, dashboardData?.previousPGs)}
              subtitle="Active properties"
            />
            
            <StatCard
              title="Total Users"
              value={realtimeStats.totalUsers}
              icon={Users}
              iconColor="bg-green-500"
              link="/superadmin/users"
              trend={getTrendData(realtimeStats.totalUsers, dashboardData?.previousUsers)}
              subtitle="Registered users"
            />
            
            <StatCard
              title="Total Revenue"
              value={formatCurrency(realtimeStats.totalRevenue)}
              icon={DollarSign}
              iconColor="bg-emerald-500"
              trend={getTrendData(realtimeStats.totalRevenue, dashboardData?.previousRevenue)}
              subtitle="All time earnings"
            />
            
            <StatCard
              title="Support Tickets"
              value={realtimeStats.activeTickets}
              icon={HeadphonesIcon}
              iconColor="bg-orange-500"
              link="/superadmin/tickets"
              subtitle={`${analyticsData.tickets?.urgent || 0} urgent`}
            />
            
            <StatCard
              title="Occupancy Rate"
              value={formatPercentage(realtimeStats.occupancyRate)}
              icon={Home}
              iconColor="bg-purple-500"
              subtitle="Average across PGs"
            />
            
            <StatCard
              title="Monthly Growth"
              value={formatPercentage(realtimeStats.monthlyGrowth)}
              icon={TrendingUp}
              iconColor="bg-cyan-500"
              trend={{ value: realtimeStats.monthlyGrowth, direction: 'up' }}
              subtitle="Revenue growth"
            />
          </StatCardGrid>
        )}

        {/* Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">{selectedPeriod}</span>
              </div>
            </div>
            {analyticsData.revenue ? (
              <RevenueChart data={analyticsData.revenue} period={selectedPeriod} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Loading revenue data...</p>
                </div>
              </div>
            )}
          </div>

          {/* Occupancy Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Occupancy Overview</h3>
              <div className="flex items-center space-x-2">
                <Home className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">Real-time</span>
              </div>
            </div>
            {analyticsData.occupancy ? (
              <OccupancyChart data={analyticsData.occupancy} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Home className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Loading occupancy data...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Ticket Status Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Support Tickets</h3>
              <HeadphonesIcon className="h-5 w-5 text-gray-400" />
            </div>
            {analyticsData.tickets ? (
              <TicketStatusChart data={analyticsData.tickets} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <HeadphonesIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Loading ticket data...</p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Trends Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Payment Trends</h3>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            {analyticsData.payments ? (
              <PaymentTrendChart data={analyticsData.payments} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Loading payment data...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { title: 'PG Management', icon: Building2, link: '/superadmin/pg-management', color: 'text-blue-600' },
                { title: 'User Management', icon: Users, link: '/superadmin/users', color: 'text-green-600' },
                { title: 'Support Staff', icon: HeadphonesIcon, link: '/superadmin/support-staff', color: 'text-purple-600' },
                { title: 'System Reports', icon: FileText, link: '/superadmin/reports', color: 'text-orange-600' }
              ].map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <action.icon className={`h-5 w-5 ${action.color} group-hover:scale-110 transition-transform`} />
                  <span className="font-medium text-gray-900">{action.title}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {analyticsData.activities.length > 0 ? (
                analyticsData.activities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-lg ${
                      activity.category === 'financial' ? 'bg-emerald-100 text-emerald-700' :
                      activity.category === 'management' ? 'bg-blue-100 text-blue-700' :
                      activity.category === 'support' ? 'bg-orange-100 text-orange-700' :
                      activity.category === 'authentication' ? 'bg-purple-100 text-purple-700' :
                      activity.category === 'system' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.category === 'financial' && <DollarSign className="h-4 w-4" />}
                      {activity.category === 'management' && <Users className="h-4 w-4" />}
                      {activity.category === 'support' && <HeadphonesIcon className="h-4 w-4" />}
                      {activity.category === 'authentication' && <Shield className="h-4 w-4" />}
                      {activity.category === 'system' && <AlertTriangle className="h-4 w-4" />}
                      {!activity.category && <Activity className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No recent activities</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Activities Widget */}
        <div className="grid grid-cols-1 mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ticket Activities</h3>
              <HeadphonesIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {analyticsData.ticketActivities.length > 0 ? (
                analyticsData.ticketActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="p-2 rounded-lg bg-orange-100 text-orange-700">
                      <HeadphonesIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                      <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <HeadphonesIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No ticket activities</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard; 