import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  UserPlus,
  BarChart3,
  Target,
  Award,
  Clock,
  Star,
  Zap,
  Heart,
  CheckCircle,
  Calendar,
  Activity
} from 'lucide-react';
import salesService from '../../services/sales.service';
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
const StatCardGridSkeleton = ({ count = 4 }) => {
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

// Recent Staff Component
const RecentStaffCard = ({ staff }) => (
  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
        <span className="text-white font-semibold text-sm">
          {staff.firstName[0]}{staff.lastName[0]}
        </span>
      </div>
      <div>
        <p className="font-medium text-gray-900">{staff.firstName} {staff.lastName}</p>
        <p className="text-sm text-gray-600">{staff.salesUniqueId}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm text-gray-600">PGs Added</p>
      <p className="font-semibold text-blue-600">{staff.pgsAdded}</p>
    </div>
  </div>
);

// Recent PGs Component
const RecentPGCard = ({ pg, userRole }) => (
  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100 hover:shadow-md transition-shadow">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
        <Building2 className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="font-medium text-gray-900">{pg.name}</p>
        <p className="text-sm text-gray-600">
          {userRole === 'sales_manager' && pg.addedBy ?
            `Added by ${pg.addedBy.firstName} ${pg.addedBy.lastName}` :
            `Added ${new Date(pg.createdAt).toLocaleDateString()}`
          }
        </p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm text-gray-600">Sales Info</p>
      <p className="font-semibold text-green-600 text-sm">
        {pg.salesManager && pg.salesStaff ?
          `${pg.salesManager.split(' ')[0]} → ${pg.salesStaff.split(' ')[0]}` :
          'Direct'
        }
      </p>
    </div>
  </div>
);

// Motivational Message Component
const MotivationalCard = ({ message, performanceRate }) => {
  const getPerformanceColor = (rate) => {
    if (rate >= 90) return 'from-yellow-400 to-orange-500';
    if (rate >= 70) return 'from-blue-400 to-blue-600';
    if (rate >= 40) return 'from-green-400 to-green-600';
    return 'from-red-400 to-red-600';
  };

  const getPerformanceIcon = (rate) => {
    if (rate >= 90) return <Award className="h-6 w-6" />;
    if (rate >= 70) return <Star className="h-6 w-6" />;
    if (rate >= 40) return <TrendingUp className="h-6 w-6" />;
    return <Target className="h-6 w-6" />;
  };

  return (
    <div className={`bg-gradient-to-r ${getPerformanceColor(performanceRate)} text-white rounded-xl p-6 shadow-lg`}>
      <div className="flex items-center space-x-3 mb-4">
        {getPerformanceIcon(performanceRate)}
        <h3 className="text-lg font-bold">Motivational Message</h3>
      </div>
      <p className="text-white/90 leading-relaxed">{message}</p>
    </div>
  );
};

// Performance Overview Component
const PerformanceOverview = ({ data, userRole }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <Activity className="h-5 w-5 mr-2 text-blue-600" />
        Performance Overview
      </h3>
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${data.performanceRate >= 70 ? 'bg-green-500' : data.performanceRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
        <span className="text-sm font-medium text-gray-700">{data.performanceRate}%</span>
      </div>
    </div>

    <div className="space-y-4">
      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
        <span className="text-gray-600">Total PGs Added</span>
        <span className="font-semibold text-gray-900">{data.totalPGsAdded}</span>
      </div>

      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
        <span className="text-gray-600">Commission Earned</span>
        <span className="font-semibold text-green-600">₹{data.totalCommissionEarned.toLocaleString()}</span>
      </div>

      {userRole === 'sales_manager' && (
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600">Team Size</span>
          <span className="font-semibold text-blue-600">{data.totalSubSalesStaff} members</span>
        </div>
      )}

      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
        <span className="text-gray-600">Recent Activity (7 days)</span>
        <span className="font-semibold text-purple-600">{data.recentActivity} PGs</span>
      </div>

      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <div className="flex items-center space-x-2 mb-2">
          <Zap className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Performance Indicator</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              data.performanceRate >= 90 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
              data.performanceRate >= 70 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
              data.performanceRate >= 40 ? 'bg-gradient-to-r from-green-400 to-green-600' :
              'bg-gradient-to-r from-red-400 to-red-600'
            }`}
            style={{ width: `${Math.min(data.performanceRate, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  </div>
);

const SalesDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState({
    totalSubSalesStaff: 0,
    totalPGsAdded: 0,
    totalCommissionEarned: 0,
    performanceRate: 0,
    recentSubSalesStaff: [],
    recentPGs: [],
    recentActivity: 0,
    motivationalMessage: '',
    role: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await salesService.getDashboardData();
        setDashboardData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        // If authentication fails, the user will be redirected by the auth middleware
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data if we have a user (authentication is established)
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const getAdditionalStats = () => {
    if (dashboardData.role === 'sales_manager') {
      return (
        <StatCard
          icon={<UserPlus className="h-6 w-6 text-indigo-600" />}
          title="Recent Activity"
          value={dashboardData.recentActivity}
          subtitle="PGs this week"
        />
      );
    } else {
      return (
        <StatCard
          icon={<Target className="h-6 w-6 text-indigo-600" />}
          title="Manager"
          value={dashboardData.managerInfo ? `${dashboardData.managerInfo.firstName} ${dashboardData.managerInfo.lastName}` : 'N/A'}
          subtitle={dashboardData.managerInfo?.salesUniqueId || ''}
        />
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Motivational Message */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">
            {dashboardData.role === 'sales_manager' ? 'Sales Manager Dashboard' : 'Sub-Sales Dashboard'}
          </p>
        </div>

        {!loading && dashboardData.motivationalMessage && (
          <div className="lg:max-w-md">
            <MotivationalCard
              message={dashboardData.motivationalMessage}
              performanceRate={dashboardData.performanceRate}
            />
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {loading ? (
        <StatCardGridSkeleton count={dashboardData.role === 'sales_manager' ? 5 : 4} />
      ) : (
        <StatCardGrid>
          {dashboardData.role === 'sales_manager' && (
            <StatCard
              icon={<Users className="h-6 w-6 text-blue-600" />}
              title="Team Members"
              value={dashboardData.totalSubSalesStaff}
              subtitle="Active sub-sales staff"
            />
          )}
          <StatCard
            icon={<Building2 className="h-6 w-6 text-green-600" />}
            title="PGs Added"
            value={dashboardData.totalPGsAdded}
            subtitle="Total properties onboarded"
          />
          <StatCard
            icon={<DollarSign className="h-6 w-6 text-purple-600" />}
            title="Commission Earned"
            value={`₹${dashboardData.totalCommissionEarned.toLocaleString()}`}
            subtitle="Total earnings this month"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6 text-orange-600" />}
            title="Performance Rate"
            value={`${dashboardData.performanceRate}%`}
            subtitle="Monthly target achievement"
          />
          {getAdditionalStats()}
        </StatCardGrid>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Performance Overview */}
        <div className="xl:col-span-1">
          <PerformanceOverview data={dashboardData} userRole={dashboardData.role} />
        </div>

        {/* Right Column - Recent Items */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Sub-Sales Staff (Only for Managers) */}
          {dashboardData.role === 'sales_manager' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <UserPlus className="h-6 w-6 mr-3 text-blue-600" />
                Recent Sub Sales Staff
              </h2>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((_, index) => (
                    <div
                      key={index}
                      className="h-16 bg-gray-200 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : dashboardData.recentSubSalesStaff?.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {dashboardData.recentSubSalesStaff.map((staff, index) => (
                    <RecentStaffCard key={staff._id || index} staff={staff} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No recent staff</p>
                  <p className="text-sm">New team members will appear here</p>
                </div>
              )}
            </div>
          )}

          {/* Recent PGs Added */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="h-6 w-6 mr-3 text-green-600" />
              Recently Added PGs
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((_, index) => (
                  <div
                    key={index}
                    className="h-16 bg-gray-200 rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
            ) : dashboardData.recentPGs?.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {dashboardData.recentPGs.map((pg, index) => (
                  <RecentPGCard key={pg._id || index} pg={pg} userRole={dashboardData.role} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No recent PGs</p>
                <p className="text-sm">New properties will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Insights for Sub-Sales */}
      {dashboardData.role === 'sub_sales' && !loading && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="h-6 w-6 text-indigo-600" />
            <h3 className="text-lg font-bold text-indigo-900">Your Progress</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Target</p>
                  <p className="text-2xl font-bold text-indigo-600">30 PGs</p>
                </div>
                <Target className="h-8 w-8 text-indigo-400" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Progress</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardData.totalPGsAdded}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Commission Rate</p>
                  <p className="text-2xl font-bold text-purple-600">₹500/PG</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;
