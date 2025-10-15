import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Clock, 
  CheckCircle, 
  Star, 
  Activity, 
  Award,
  Calendar,
  MessageSquare,
  TrendingUp,
  Target,
  Zap,
  Shield
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ticketService from '../../services/ticket.service';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SupportProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    name: `${user?.firstName} ${user?.lastName}`,
    email: user?.email,
    role: 'Support Staff',
    joinDate: 'January 2024',
    avatar: user?.firstName?.charAt(0) || 'S'
  });

  const [stats, setStats] = useState({
    totalTickets: 0,
    resolvedTickets: 0,
    avgResponseTime: 0,
    satisfactionScore: 0,
    ticketsThisWeek: 0,
    ticketsThisMonth: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      // Load support profile data from backend using the api service
      const response = await api.get('/users/support-profile');

      if (response.data.success) {
        const { user, stats, recentActivity, achievements } = response.data.data;

        // Update profile data
        setProfileData({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: 'Support Staff',
          joinDate: new Date(user.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          avatar: user.firstName?.charAt(0) || 'S'
        });

        // Update stats
        setStats(stats);

        // Transform recent activity data
        const transformedActivity = recentActivity.map(activity => ({
          id: activity.id,
          action: getActivityAction(activity.type),
          description: activity.description,
          time: getRelativeTime(activity.timestamp),
          type: getActivityType(activity.type)
        }));

        setRecentActivity(transformedActivity);

        // Transform achievements data
        const transformedAchievements = achievements.map(achievement => ({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: getIconComponent(achievement.icon),
          earned: achievement.earned,
          date: achievement.date,
          progress: achievement.progress,
          target: achievement.target,
          current: achievement.current
        }));

        setAchievements(transformedAchievements);
      } else {
        throw new Error(response.data.message || 'Failed to load profile data');
      }

    } catch (error) {
      console.error('Error loading profile data:', error);

      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        // Clear invalid tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Redirect to login
        window.location.href = '/login';
      } else {
        toast.error('Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getActivityAction = (type) => {
    const actions = {
      ticket_created: 'Created ticket',
      ticket_updated: 'Updated ticket status',
      ticket_resolved: 'Resolved ticket',
      ticket_assigned: 'Assigned new ticket',
      ticket_closed: 'Closed ticket'
    };
    return actions[type] || 'Activity';
  };

  const getActivityType = (type) => {
    const types = {
      ticket_created: 'assigned',
      ticket_updated: 'updated',
      ticket_resolved: 'resolved',
      ticket_assigned: 'assigned',
      ticket_closed: 'resolved'
    };
    return types[type] || 'updated';
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return time.toLocaleDateString();
  };

  const getIconComponent = (iconName) => {
    const icons = {
      MessageSquare,
      CheckCircle,
      Zap,
      Star,
      Target,
      Activity
    };
    return icons[iconName] || Activity;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'assigned':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'resolved':
        return 'bg-green-50 border-green-200';
      case 'updated':
        return 'bg-blue-50 border-blue-200';
      case 'assigned':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Your support performance and achievements</p>
      </div>

      {/* Profile Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold">{profileData.avatar}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{profileData.name}</h2>
            <p className="text-gray-600">{profileData.email}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <Shield className="h-4 w-4 mr-1" />
                {profileData.role}
              </span>
              <span className="text-sm text-gray-500">Joined {profileData.joinDate}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolvedTickets}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}h</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Satisfaction Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.satisfactionScore}/5</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.ticketsThisWeek}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Calendar className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.ticketsThisMonth}</p>
            </div>
            <div className="p-3 bg-pink-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-pink-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity and Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
              >
                {getActivityIcon(activity.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
          <div className="space-y-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border ${
                    achievement.earned
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    achievement.earned ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      achievement.earned ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      achievement.earned ? 'text-green-900' : 'text-gray-500'
                    }`}>
                      {achievement.name}
                    </p>
                    <p className="text-xs text-gray-600">{achievement.description}</p>
                    {achievement.earned && achievement.date && (
                      <p className="text-xs text-green-600 mt-1">Earned {achievement.date}</p>
                    )}
                    {!achievement.earned && achievement.target && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{achievement.current}/{achievement.target}</span>
                          <span>{Math.round(achievement.progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${achievement.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  {achievement.earned && (
                    <Award className="h-4 w-4 text-green-600" />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SupportProfile; 