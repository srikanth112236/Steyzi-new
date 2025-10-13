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
      
      // Load ticket statistics
      const ticketsResponse = await ticketService.getMyTickets();
      const tickets = ticketsResponse.data || [];
      
      // Calculate statistics
      const totalTickets = tickets.length;
      const resolvedTickets = tickets.filter(ticket => ticket.status === 'resolved' || ticket.status === 'closed').length;
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 7);
      const ticketsThisWeek = tickets.filter(ticket => new Date(ticket.createdAt) > thisWeek).length;
      
      const thisMonth = new Date();
      thisMonth.setMonth(thisMonth.getMonth() - 1);
      const ticketsThisMonth = tickets.filter(ticket => new Date(ticket.createdAt) > thisMonth).length;

      // Mock performance data (in real app, this would come from backend)
      const avgResponseTime = 2.5; // hours
      const satisfactionScore = 4.6; // out of 5

      setStats({
        totalTickets,
        resolvedTickets,
        avgResponseTime,
        satisfactionScore,
        ticketsThisWeek,
        ticketsThisMonth
      });

      // Mock recent activity
      setRecentActivity([
        {
          id: 1,
          action: 'Resolved ticket',
          description: 'Technical issue with login system',
          time: '2 hours ago',
          type: 'resolved'
        },
        {
          id: 2,
          action: 'Updated ticket status',
          description: 'Payment processing inquiry',
          time: '4 hours ago',
          type: 'updated'
        },
        {
          id: 3,
          action: 'Assigned new ticket',
          description: 'Account access request',
          time: '6 hours ago',
          type: 'assigned'
        },
        {
          id: 4,
          action: 'Resolved ticket',
          description: 'Feature request for mobile app',
          time: '1 day ago',
          type: 'resolved'
        },
        {
          id: 5,
          action: 'Updated ticket status',
          description: 'Billing question resolved',
          time: '2 days ago',
          type: 'updated'
        }
      ]);

      // Mock achievements
      setAchievements([
        {
          id: 1,
          name: 'First Responder',
          description: 'Respond to your first ticket',
          icon: MessageSquare,
          earned: true,
          date: 'Jan 15, 2024'
        },
        {
          id: 2,
          name: 'Problem Solver',
          description: 'Resolve 50 tickets',
          icon: CheckCircle,
          earned: totalTickets >= 50,
          date: totalTickets >= 50 ? 'Feb 20, 2024' : null
        },
        {
          id: 3,
          name: 'Speed Demon',
          description: 'Maintain < 2h average response time for a week',
          icon: Zap,
          earned: avgResponseTime < 2,
          date: avgResponseTime < 2 ? 'Mar 10, 2024' : null
        },
        {
          id: 4,
          name: 'Customer Champion',
          description: 'Achieve 4.5+ satisfaction score for a month',
          icon: Star,
          earned: satisfactionScore >= 4.5,
          date: satisfactionScore >= 4.5 ? 'Mar 15, 2024' : null
        },
        {
          id: 5,
          name: 'Consistency King',
          description: 'Handle 100+ tickets',
          icon: Target,
          earned: totalTickets >= 100,
          date: totalTickets >= 100 ? null : null
        },
        {
          id: 6,
          name: 'Team Player',
          description: 'Collaborate on 25+ tickets',
          icon: Activity,
          earned: false,
          date: null
        }
      ]);

    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
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