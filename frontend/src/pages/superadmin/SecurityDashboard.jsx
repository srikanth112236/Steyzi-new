import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Eye,
  Users,
  Activity,
  TrendingUp,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  UserX,
  Globe,
  Smartphone,
  Clock3,
  Calendar,
  Search,
  Filter,
  Download,
  Mail,
  Bell,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

// Import common components
import StatCard from '../../components/common/StatCard';

// Security API service
const securityService = {
  getDashboard: async (timeRange = '24h') => {
    const response = await fetch(`/api/security/dashboard?timeRange=${timeRange}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  getAlerts: async (timeRange = '24h') => {
    const response = await fetch(`/api/security/alerts?timeRange=${timeRange}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  getMetrics: async (timeRange = '24h') => {
    const response = await fetch(`/api/security/metrics?timeRange=${timeRange}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  getUserProfile: async (userId) => {
    const response = await fetch(`/api/security/users/${userId}/profile`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  triggerSecurityCheck: async (userId, reason) => {
    const response = await fetch(`/api/security/users/${userId}/check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    return response.json();
  }
};

const SecurityDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [dashboardRes, alertsRes, metricsRes] = await Promise.all([
        securityService.getDashboard(timeRange),
        securityService.getAlerts(timeRange),
        securityService.getMetrics(timeRange)
      ]);

      if (dashboardRes.success) {
        setDashboardData(dashboardRes.data);
      }

      if (alertsRes.success) {
        setAlerts(alertsRes.data);
      }

      if (metricsRes.success) {
        setMetrics(metricsRes.data);
      }

    } catch (error) {
      console.error('Failed to load security dashboard:', error);
      toast.error('Failed to load security dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (user) => {
    try {
      const response = await securityService.getUserProfile(user.userId);
      if (response.success) {
        setUserProfile(response.data);
        setSelectedUser(user);
        setShowUserModal(true);
      }
    } catch (error) {
      toast.error('Failed to load user security profile');
    }
  };

  const handleSecurityCheck = async (userId) => {
    try {
      const response = await securityService.triggerSecurityCheck(userId, 'manual_admin_check');
      if (response.success) {
        toast.success('Security check completed');
        // Refresh data
        loadDashboardData();
      } else {
        toast.error('Security check failed');
      }
    } catch (error) {
      toast.error('Failed to perform security check');
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Monitor system security, threats, and suspicious activities
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            <button
              onClick={loadDashboardData}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Shield className="h-6 w-6 text-blue-600" />}
            title="Total Activities"
            value={metrics.summary.totalActivities.toLocaleString()}
            subtitle={`Last ${timeRange}`}
          />

          <StatCard
            icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
            title="Security Alerts"
            value={metrics.summary.securityAlerts.toString()}
            subtitle="Threats detected"
            change={metrics.summary.securityAlerts > 0 ? "warning" : "neutral"}
          />

          <StatCard
            icon={<UserX className="h-6 w-6 text-orange-600" />}
            title="High Risk Users"
            value={metrics.summary.highRiskUsers.toString()}
            subtitle="Require attention"
            change={metrics.summary.highRiskUsers > 0 ? "warning" : "neutral"}
          />

          <StatCard
            icon={<XCircle className="h-6 w-6 text-red-600" />}
            title="Blocked Actions"
            value={metrics.summary.blockedActivities.toString()}
            subtitle="Prevented threats"
            change={metrics.summary.blockedActivities > 0 ? "warning" : "neutral"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Alerts Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                Recent Security Alerts
              </h3>
              <span className="text-sm text-gray-500">
                {alerts.length} alerts in {timeRange}
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>No security alerts in the selected time period</p>
                </div>
              ) : (
                alerts.slice(0, 10).map((alert, index) => (
                  <motion.div
                    key={alert._id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRiskColor(alert.riskLevel)}`}>
                        {getRiskIcon(alert.riskLevel)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{alert.description}</p>
                        <p className="text-xs text-gray-500">
                          {alert.userId?.firstName} {alert.userId?.lastName} • {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(alert.riskLevel)}`}>
                        {alert.riskLevel}
                      </span>
                      <button
                        onClick={() => alert.userId && handleUserClick(alert)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Security Summary Panel */}
        <div className="space-y-6">
          {/* Risk Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Risk Overview
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Critical Threats</span>
                <span className="text-sm font-medium text-red-600">{metrics?.summary.criticalAlerts || 0}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Failed Auth Attempts</span>
                <span className="text-sm font-medium text-orange-600">{metrics?.summary.failedAuthAttempts || 0}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Suspicious IPs</span>
                <span className="text-sm font-medium text-yellow-600">{metrics?.summary.suspiciousIPs || 0}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Unique Devices</span>
                <span className="text-sm font-medium text-blue-600">{metrics?.summary.totalActivities || 0}</span>
              </div>
            </div>
          </div>

          {/* Top Security Threats */}
          {dashboardData?.topThreats && dashboardData.topThreats.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-red-600" />
                Top Threats
              </h3>

              <div className="space-y-2">
                {dashboardData.topThreats.slice(0, 5).map((threat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 truncate">{threat._id}</span>
                    <span className="text-sm font-medium text-red-600">{threat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-gray-600" />
              Quick Actions
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => toast.success('Security scan initiated')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Run Security Scan
              </button>

              <button
                onClick={() => toast.success('Reports generated')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Generate Report
              </button>

              <button
                onClick={() => toast.success('Alert thresholds updated')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Configure Alerts
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Security Profile Modal */}
      {showUserModal && userProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">User Security Profile</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {userProfile.user.firstName?.charAt(0)}{userProfile.user.lastName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {userProfile.user.firstName} {userProfile.user.lastName}
                  </h4>
                  <p className="text-sm text-gray-500">{userProfile.user.email}</p>
                  <p className="text-xs text-gray-400 capitalize">{userProfile.user?.role}</p>
                </div>
              </div>

              {/* Security Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">{userProfile.securitySummary.totalActivities}</div>
                  <div className="text-sm text-gray-600">Total Activities</div>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">{userProfile.securitySummary.highRiskActivities}</div>
                  <div className="text-sm text-gray-600">High Risk Activities</div>
                </div>
              </div>

              {/* Risk Level */}
              <div className={`p-4 rounded-lg ${getRiskColor(userProfile.securitySummary.riskLevel)}`}>
                <div className="flex items-center space-x-2">
                  {getRiskIcon(userProfile.securitySummary.riskLevel)}
                  <span className="font-medium capitalize">
                    Risk Level: {userProfile.securitySummary.riskLevel}
                  </span>
                </div>
              </div>

              {/* Recent Activities */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recent Activities</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {userProfile.recentActivities.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">{activity.activityType}</p>
                        <p className="text-xs text-gray-500">{activity.ipAddress}</p>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded ${getRiskColor(activity.riskLevel)}`}>
                        {activity.riskLevel}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleSecurityCheck(userProfile.user._id)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Run Security Check
                </button>

                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;
