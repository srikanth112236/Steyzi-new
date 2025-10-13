import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Award,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  Star,
  ArrowUp,
  ArrowDown,
  LineChart,
  BarChart,
  PieChart as PieChartIcon,
  Calendar as CalendarIcon,
  Trophy,
  Medal,
  Crown
} from 'lucide-react';
import salesService from '../../services/sales.service';

const Reports = () => {
  const { user } = useSelector((state) => state.auth);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedStaff, setExpandedStaff] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await salesService.getSalesReports();
      setReports(response.data.data || response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch reports data');
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'on-target': return 'text-green-600 bg-green-100';
      case 'below-target': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAchievementColor = (achievement) => {
    if (achievement >= 100) return 'text-green-600';
    if (achievement >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!reports) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No reports data available</p>
      </div>
    );
  }

  const isManager = user?.role === 'sales_manager' || user?.salesRole === 'sales_manager';
  const isSubSales = user?.salesRole === 'sub_sales';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isSubSales ? 'My Performance Reports' : 'Sales Reports'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isSubSales ? 'Your personal performance and analytics reports' : 'Comprehensive performance and analytics reports'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Generated: {new Date(reports.generatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isManager ? (
            <>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Team Size</p>
                    <p className="text-2xl font-bold text-blue-900">{reports.summary.teamSize}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">PGs This Month</p>
                    <p className="text-2xl font-bold text-green-900">{reports.summary.totalPGsThisMonth}</p>
                    <p className="text-xs text-green-600">
                      {reports.summary.monthlyGrowth}% growth
                    </p>
                  </div>
                  <Building2 className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Earnings Earned</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatCurrency(reports.summary.totalEarnings)}
                    </p>
                    <p className="text-xs text-purple-600">
                      {reports.summary.commissionRate}% rate
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Yearly Target</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {Math.min((reports.summary.totalPGsThisYear / reports.summary.yearlyTarget) * 100, 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-yellow-600">
                      {reports.summary.totalPGsThisYear}/{reports.summary.yearlyTarget} PGs
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">PGs This Month</p>
                    <p className="text-2xl font-bold text-green-900">{reports.summary.pgsThisMonth || 0}</p>
                    <p className="text-xs text-green-600">
                      {reports.summary.monthlyGrowth || 0}% growth
                    </p>
                  </div>
                  <Building2 className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Earnings Earned</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatCurrency(reports.summary.totalCommission || 0)}
                    </p>
                    <p className="text-xs text-purple-600">
                      {reports.summary.commissionRate || 0}% rate
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Monthly Achievement</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {reports.performance?.thisMonth?.achievement?.toFixed(1) || 0}%
                    </p>
                    <p className="text-xs text-yellow-600">
                      {reports.performance?.thisMonth?.pgs || 0}/{reports.performance?.thisMonth?.target || 0} PGs
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-yellow-600" />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Yearly Progress</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {reports.performance?.thisYear?.achievement?.toFixed(1) || 0}%
                    </p>
                    <p className="text-xs text-blue-600">
                      {reports.summary.pgsThisYear || 0}/{reports.summary.yearlyTarget || 0} PGs
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Enhanced Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends Chart */}
      <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <LineChart className="h-5 w-5 mr-2 text-blue-600" />
              Performance Trends (12 Months)
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-600">PGs Added</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Earnings</span>
        </div>
                    </div>

          <div className="h-64 flex items-end justify-between space-x-2">
              {reports.monthlyTrends?.map((item, index) => {
              const maxPGs = Math.max(...reports.monthlyTrends.map(d => d.teamPGs || d.pgs || 0));
              const maxCommission = Math.max(...reports.monthlyTrends.map(d => d.commission || 0));
              const pgValue = item.teamPGs || item.pgs || 0;
              const pgHeight = maxPGs > 0 ? (pgValue / maxPGs) * 100 : 0;
              const commissionHeight = maxCommission > 0 ? (item.commission / maxCommission) * 100 : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                  <div className="relative w-full flex justify-center">
                    {/* Commission Bar */}
                    <div
                      className="bg-green-500 rounded-t w-3/4 transition-all duration-500 hover:bg-green-600"
                      style={{ height: `${Math.max(commissionHeight, 8)}px` }}
                      title={`₹${item.commission?.toLocaleString() || 0}`}
                    ></div>
                    {/* PGs Bar */}
                    <div
                      className="bg-blue-500 rounded-t w-3/4 absolute left-1/2 transform -translate-x-1/2 transition-all duration-500 hover:bg-blue-600"
                      style={{
                        height: `${Math.max(pgHeight, 8)}px`,
                        bottom: `${Math.max(commissionHeight, 8) + 4}px`
                      }}
                      title={`${pgValue} PGs`}
                    ></div>
                    </div>
                  <div className="text-xs text-gray-500 transform -rotate-45 origin-center">
                    {item.month}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend and Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-600">Avg Monthly PGs</p>
                <p className="font-semibold text-blue-600">
                  {reports.monthlyTrends?.length > 0 ?
                    Math.round(reports.monthlyTrends.reduce((sum, item) => sum + (item.teamPGs || item.pgs || 0), 0) / reports.monthlyTrends.length) : 0
                  }
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Avg Monthly Earnings</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(reports.monthlyTrends?.length > 0 ?
                    reports.monthlyTrends.reduce((sum, item) => sum + (item.commission || 0), 0) / reports.monthlyTrends.length : 0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2 text-purple-600" />
              Performance Distribution
            </h3>
            <div className="text-xs text-gray-500">This Year</div>
          </div>

          <div className="flex items-center justify-center h-48">
            <div className="relative">
              {/* Simple Pie Chart Representation */}
              <div className="w-32 h-32 rounded-full border-8 border-gray-200 relative">
                {isManager ? (
                  <>
                    <div className="absolute inset-0 rounded-full border-8 border-blue-500 transform rotate-0"
                         style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}></div>
                    <div className="absolute inset-0 rounded-full border-8 border-green-500 transform rotate-90"
                         style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)' }}></div>
                    <div className="absolute inset-0 rounded-full border-8 border-purple-500 transform rotate-180"
                         style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)' }}></div>
                    <div className="absolute inset-0 rounded-full border-8 border-yellow-500 transform rotate-270"
                         style={{ clipPath: 'polygon(0 50%, 50% 50%, 50% 100%, 0 100%)' }}></div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 rounded-full border-8 border-green-500 transform rotate-0"
                         style={{ clipPath: 'polygon(0 0, 100% 0, 100% 30%, 0 30%)' }}></div>
                    <div className="absolute inset-0 rounded-full border-8 border-blue-500 transform rotate-108"
                         style={{ clipPath: 'polygon(0 30%, 100% 30%, 100% 70%, 0 70%)' }}></div>
                    <div className="absolute inset-0 rounded-full border-8 border-red-500 transform rotate-252"
                         style={{ clipPath: 'polygon(0 70%, 100% 70%, 100% 100%, 0 100%)' }}></div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {isManager ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">High Performers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Good Performers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Average</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Needs Attention</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">This Month</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">This Quarter</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">This Year</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-xs text-gray-600">Remaining</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Achievement Milestones */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center space-x-3 mb-6">
          <Trophy className="h-6 w-6 text-indigo-600" />
          <h3 className="text-lg font-bold text-indigo-900">Achievement Milestones</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Medal className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Monthly Champion</p>
                <p className="text-xs text-gray-600">
                  {isManager ? `${reports.summary?.totalPGsThisMonth || 0} team PGs` : `${reports.summary?.pgsThisMonth || 0} PGs`}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Crown className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Commission Leader</p>
                <p className="text-xs text-gray-600">
                  {isManager ?
                    formatCurrency(reports.summary?.totalEarnings || 0) :
                    formatCurrency(reports.summary?.totalCommission || 0)
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Star className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Target Achievement</p>
                <p className="text-xs text-gray-600">
                  {isManager ?
                    `${Math.min((reports.summary?.totalPGsThisYear / reports.summary?.yearlyTarget) * 100, 100).toFixed(1)}% of annual target` :
                    `${reports.performance?.thisYear?.achievement?.toFixed(1) || 0}% of yearly target`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Performance Reports (For Managers Only) */}
      {isManager && !isSubSales && reports.staffReports && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Staff Performance Reports</h3>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {reports.staffReports.map((staff) => (
              <div key={staff.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{staff.name}</h4>
                    <p className="text-sm text-gray-500">{staff.uniqueId} • {staff.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(staff.status)}`}>
                      {staff.status.replace('-', ' ').toUpperCase()}
                    </span>
                    <button
                      onClick={() => setExpandedStaff(expandedStaff === staff.id ? null : staff.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedStaff === staff.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">This Month</p>
                    <p className="text-lg font-semibold text-gray-900">{staff.performance.thisMonth.pgs} PGs</p>
                    <p className={`text-xs font-medium ${getAchievementColor(staff.performance.thisMonth.achievement)}`}>
                      {staff.performance.thisMonth.achievement.toFixed(1)}% target
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">This Quarter</p>
                    <p className="text-lg font-semibold text-gray-900">{staff.performance.thisQuarter.pgs} PGs</p>
                    <p className={`text-xs font-medium ${getAchievementColor(staff.performance.thisQuarter.achievement)}`}>
                      {staff.performance.thisQuarter.achievement.toFixed(1)}% target
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">This Year</p>
                    <p className="text-lg font-semibold text-gray-900">{staff.performance.thisYear.pgs} PGs</p>
                    <p className={`text-xs font-medium ${getAchievementColor(staff.performance.thisYear.achievement)}`}>
                      {staff.performance.thisYear.achievement.toFixed(1)}% target
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Earnings</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(staff.performance.thisYear.commission)}
                    </p>
                    <p className="text-xs text-gray-500">This year</p>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedStaff === staff.id && (
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Monthly Breakdown</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>This Month:</span>
                            <span className="font-medium">{staff.performance.thisMonth.pgs}/{staff.performance.thisMonth.target} PGs</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Last Month:</span>
                            <span className="font-medium">{staff.performance.lastMonth.pgs}/{staff.performance.lastMonth.target} PGs</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Earnings Details</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Rate:</span>
                            <span className="font-medium">{staff.commissionRate}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>This Month:</span>
                            <span className="font-medium text-green-600">{formatCurrency(staff.performance.thisMonth.commission)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>This Year:</span>
                            <span className="font-medium text-green-600">{formatCurrency(staff.performance.thisYear.commission)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Targets & Status</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Monthly Target:</span>
                            <span className="font-medium">{staff.performance.thisMonth.target} PGs</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Yearly Target:</span>
                            <span className="font-medium">{staff.performance.thisYear.target} PGs</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Status:</span>
                            <span className={`font-medium px-2 py-1 rounded-full text-xs ${getStatusColor(staff.status)}`}>
                              {staff.status.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performers / Personal Achievements */}
        <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
            {isManager && !isSubSales ? 'Top Performers This Month' : 'Your Achievements This Month'}
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4" />
            <span>Current Month</span>
          </div>
        </div>

        {isManager && reports.topPerformers && reports.topPerformers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.topPerformers.slice(0, 6).map((performer, index) => (
              <div key={performer.id || index} className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                      'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}>
                      {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{performer.name}</h4>
                      <p className="text-xs text-gray-600">{performer.uniqueId}</p>
                    </div>
                  </div>
                  <Award className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">PGs Added:</span>
                    <span className="font-semibold text-blue-600">{performer.pgsThisMonth || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Commission:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(performer.commission || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Performance:</span>
                    <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
                      (performer.pgsThisMonth || 0) >= 25 ? 'bg-green-100 text-green-800' :
                      (performer.pgsThisMonth || 0) >= 15 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(performer.pgsThisMonth || 0) >= 25 ? 'Excellent' :
                       (performer.pgsThisMonth || 0) >= 15 ? 'Good' : 'Needs Focus'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !isManager ? (
          // Personal achievements for sub_sales
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">PGs This Month</h4>
                  <p className="text-sm text-gray-600">Property additions</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {reports.summary?.pgsThisMonth || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Target: {reports.performance?.thisMonth?.target || 30} PGs
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Earnings This Month</h4>
                  <p className="text-sm text-gray-600">Commission earned</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(reports.performance?.thisMonth?.commission || 0)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Rate: {reports.summary?.commissionRate || 0}% per PG
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Achievement Rate</h4>
                  <p className="text-sm text-gray-600">Target completion</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {reports.performance?.thisMonth?.achievement?.toFixed(1) || 0}%
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {reports.performance?.thisMonth?.pgs || 0} / {reports.performance?.thisMonth?.target || 30} PGs
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Award className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No performers data available</p>
            <p className="text-sm">Team members will appear here once they start adding PGs</p>
        </div>
      )}
      </div>

      {/* Detailed Performance Analytics (For Sub-sales) */}
      {!isManager && reports.performance && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              Detailed Performance Analytics
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Zap className="h-4 w-4" />
              <span>Real-time data</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                This Month
              </h4>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <p className="text-3xl font-bold text-blue-900 mb-2">{reports.performance.thisMonth?.pgs || 0}</p>
                <p className="text-sm text-blue-700 font-medium">PGs Added</p>
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-gray-600">
                    Target: {reports.performance.thisMonth?.target || 30} PGs
                  </p>
                  <p className="text-xs font-medium text-blue-600">
                    {reports.performance.thisMonth?.achievement?.toFixed(1) || 0}% achieved
                  </p>
                  <p className="text-xs font-medium text-green-600">
                    {formatCurrency(reports.performance.thisMonth?.commission || 0)} earned
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 mr-2 text-green-600" />
                This Quarter
              </h4>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <p className="text-3xl font-bold text-green-900 mb-2">{reports.performance.thisQuarter?.pgs || 0}</p>
                <p className="text-sm text-green-700 font-medium">PGs Added</p>
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-gray-600">
                    Target: {reports.performance.thisQuarter?.target || 90} PGs
                  </p>
                  <p className="text-xs font-medium text-green-600">
                    {reports.performance.thisQuarter?.achievement?.toFixed(1) || 0}% achieved
                  </p>
                  <p className="text-xs font-medium text-green-700">
                    {formatCurrency(reports.performance.thisQuarter?.commission || 0)} earned
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 mr-2 text-purple-600" />
                This Year
              </h4>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <p className="text-3xl font-bold text-purple-900 mb-2">{reports.performance.thisYear?.pgs || 0}</p>
                <p className="text-sm text-purple-700 font-medium">PGs Added</p>
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-gray-600">
                    Target: {reports.performance.thisYear?.target || 360} PGs
                  </p>
                  <p className="text-xs font-medium text-purple-600">
                    {reports.performance.thisYear?.achievement?.toFixed(1) || 0}% achieved
                  </p>
                  <p className="text-xs font-medium text-green-600">
                    {formatCurrency(reports.performance.thisYear?.commission || 0)} earned
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Progress Bars */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Progress Towards Targets</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Monthly Target</span>
                  <span className="text-blue-600 font-medium">
                    {reports.performance.thisMonth?.pgs || 0} / {reports.performance.thisMonth?.target || 30}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((reports.performance.thisMonth?.pgs || 0) / (reports.performance.thisMonth?.target || 30) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Quarterly Target</span>
                  <span className="text-green-600 font-medium">
                    {reports.performance.thisQuarter?.pgs || 0} / {reports.performance.thisQuarter?.target || 90}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((reports.performance.thisQuarter?.pgs || 0) / (reports.performance.thisQuarter?.target || 90) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Yearly Target</span>
                  <span className="text-purple-600 font-medium">
                    {reports.performance.thisYear?.pgs || 0} / {reports.performance.thisYear?.target || 360}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((reports.performance.thisYear?.pgs || 0) / (reports.performance.thisYear?.target || 360) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
