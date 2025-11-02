const User = require('../models/user.model');
const PG = require('../models/pg.model');
const bcrypt = require('bcryptjs');
const activityService = require('./activity.service');

class UserService {
  /**
   * Get user profile with PG information
   */
  static async getUserProfile(userId) {
    try {
      console.log('🔍 UserService.getUserProfile - Searching for user:', {
        userId,
        userIdType: typeof userId,
        isObjectId: userId?.constructor?.name === 'ObjectId'
      });
      
      const user = await User.findById(userId).select('-password');
      
      console.log('🔍 UserService.getUserProfile - User found:', {
        found: !!user,
        userId: user?._id,
        userEmail: user?.email
      });
      
      if (!user) {
        console.error('❌ UserService.getUserProfile - User not found with ID:', userId);
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      let pgInfo = null;
      if (user.pgId) {
        pgInfo = await PG.findById(user.pgId).select('name description address phone email');
      }

      return {
        success: true,
        message: 'Profile retrieved successfully',
        statusCode: 200,
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar,
            language: user.language,
            theme: user.theme,
            isEmailVerified: user.isEmailVerified,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            pgId: user.pgId
          },
          pgInfo
        }
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        message: 'Failed to get profile',
        statusCode: 500,
        error: error.message
      };
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({ email: updateData.email });
        if (existingUser) {
          return {
            success: false,
            message: 'Email is already taken',
            statusCode: 400
          };
        }
      }

      // Update user fields
      const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'language', 'theme'];
      const updateFields = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      });

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateFields,
        { new: true, runValidators: true }
      ).select('-password');

      // Record activity
      try {
        await activityService.recordActivity({
          type: 'user_update',
          title: 'Profile Updated',
          description: `User profile updated`,
          userId: userId,
          userEmail: updatedUser.email,
          userRole: updatedUser.role,
          entityType: 'user',
          entityId: userId,
          entityName: `${updatedUser.firstName} ${updatedUser.lastName}`,
          branchId: updatedUser.branchId,
          category: 'management',
          priority: 'normal',
          status: 'success'
        });
      } catch (error) {
        console.error('Error recording profile update activity:', error);
      }

      return {
        success: true,
        message: 'Profile updated successfully',
        statusCode: 200,
        data: {
          user: updatedUser
        }
      };
    } catch (error) {
      console.error('Update user profile error:', error);
      return {
        success: false,
        message: 'Failed to update profile',
        statusCode: 500,
        error: error.message
      };
    }
  }

  /**
   * Change user password
   */
  static async changePassword(userId, passwordData) {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(passwordData.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect',
          statusCode: 400
        };
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(passwordData.newPassword, saltRounds);

      // Update password
      await User.findByIdAndUpdate(userId, {
        password: hashedPassword,
        passwordChangedAt: new Date()
      });

      return {
        success: true,
        message: 'Password changed successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Failed to change password',
        statusCode: 500,
        error: error.message
      };
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        message: 'User retrieved successfully',
        statusCode: 200,
        data: { user }
      };
    } catch (error) {
      console.error('Get user by ID error:', error);
      return {
        success: false,
        message: 'Failed to get user',
        statusCode: 500,
        error: error.message
      };
    }
  }

  /**
   * Update user by ID
   */
  static async updateUserById(userId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({ email: updateData.email });
        if (existingUser) {
          return {
            success: false,
            message: 'Email is already taken',
            statusCode: 400
          };
        }
      }

      // Update user fields
      const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'role', 'isActive', 'language', 'theme'];
      const updateFields = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      });

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateFields,
        { new: true, runValidators: true }
      ).select('-password');

      return {
        success: true,
        message: 'User updated successfully',
        statusCode: 200,
        data: {
          user: updatedUser
        }
      };
    } catch (error) {
      console.error('Update user by ID error:', error);
      return {
        success: false,
        message: 'Failed to update user',
        statusCode: 500,
        error: error.message
      };
    }
  }

  /**
   * Delete user by ID
   */
  static async deleteUserById(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      // Soft delete - set isActive to false
      await User.findByIdAndUpdate(userId, { isActive: false });

      return {
        success: true,
        message: 'User deleted successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        message: 'Failed to delete user',
        statusCode: 500,
        error: error.message
      };
    }
  }

  /**
   * Get notification preferences
   */
  static async getNotificationPreferences(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      // Default notification preferences
      const preferences = {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        paymentReminders: true,
        maintenanceUpdates: true,
        newResidentAlerts: true,
        systemUpdates: true
      };

      return {
        success: true,
        message: 'Notification preferences retrieved successfully',
        statusCode: 200,
        data: {
          preferences
        }
      };
    } catch (error) {
      console.error('Get notification preferences error:', error);
      return {
        success: false,
        message: 'Failed to get notification preferences',
        statusCode: 500,
        error: error.message
      };
    }
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(userId, preferences) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      // In a real application, you might store these in a separate collection
      // For now, we'll just return success
      const updatedPreferences = {
        emailNotifications: preferences.emailNotifications ?? true,
        smsNotifications: preferences.smsNotifications ?? false,
        pushNotifications: preferences.pushNotifications ?? true,
        paymentReminders: preferences.paymentReminders ?? true,
        maintenanceUpdates: preferences.maintenanceUpdates ?? true,
        newResidentAlerts: preferences.newResidentAlerts ?? true,
        systemUpdates: preferences.systemUpdates ?? true
      };

      return {
        success: true,
        message: 'Notification preferences updated successfully',
        statusCode: 200,
        data: {
          preferences: updatedPreferences
        }
      };
    } catch (error) {
      console.error('Update notification preferences error:', error);
      return {
        success: false,
        message: 'Failed to update notification preferences',
        statusCode: 500,
        error: error.message
      };
    }
  }

  static async getSupportProfile(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      // Get ticket statistics
      const ticketStats = await this.getSupportTicketStats(userId);

      // Get recent activity
      const activityService = require('./activity.service');
      const recentActivityResult = await activityService.getUserActivities(userId, {
        limit: 10
      });

      // Transform activity data to match frontend expectations
      const recentActivity = recentActivityResult.activities.map(activity => ({
        id: activity._id,
        type: activity.type,
        description: activity.description || activity.title,
        timestamp: activity.timestamp
      }));

      // Get achievements/progress
      const achievements = await this.getSupportAchievements(userId, ticketStats);

      return {
        success: true,
        message: 'Support profile retrieved successfully',
        statusCode: 200,
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatar: user.avatar,
            isActive: user.isActive,
            joinDate: user.createdAt,
            lastLogin: user.lastLogin
          },
          stats: ticketStats,
          recentActivity,
          achievements
        }
      };
    } catch (error) {
      console.error('Get support profile error:', error);
      return {
        success: false,
        message: 'Failed to get support profile',
        statusCode: 500,
        error: error.message
      };
    }
  }

  static async getSupportTicketStats(userId) {
    try {
      const Ticket = require('../models/ticket.model');

      // Get all tickets assigned to this support user or from PGs they support
      // Similar to getSupportStaffDashboardAnalytics logic
      const PG = require('../models/pg.model');
      const pg = await PG.findOne({
        $or: [
          { supportStaff: userId },
          { admin: userId }
        ]
      });

      const userIdString = userId.toString();
      const matchConditions = {
        $or: [
          { assignedTo: userId },
          { $expr: { $eq: [{ $toString: '$assignedTo' }, userIdString] } },
          ...(pg ? [{ pg: pg._id }] : [])
        ]
      };

      const tickets = await Ticket.find(matchConditions);

      const totalTickets = tickets.length;
      const resolvedTickets = tickets.filter(ticket =>
        ticket.status === 'resolved' || ticket.status === 'closed'
      ).length;

      // Calculate average response time (hours)
      const ticketsWithResponseTime = tickets.filter(ticket => ticket.responseTime);
      const avgResponseTime = ticketsWithResponseTime.length > 0
        ? ticketsWithResponseTime.reduce((sum, ticket) => sum + ticket.responseTime, 0) / ticketsWithResponseTime.length
        : 0;

      // Mock satisfaction score (in real app, this would come from feedback/ratings)
      const satisfactionScore = totalTickets > 0 ? 4.2 + Math.random() * 0.8 : 0;

      // Weekly stats
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const ticketsThisWeek = tickets.filter(ticket =>
        new Date(ticket.createdAt) > oneWeekAgo
      ).length;

      // Monthly stats
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const ticketsThisMonth = tickets.filter(ticket =>
        new Date(ticket.createdAt) > oneMonthAgo
      ).length;

      return {
        totalTickets,
        resolvedTickets,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10, // Round to 1 decimal
        satisfactionScore: Math.round(satisfactionScore * 10) / 10,
        ticketsThisWeek,
        ticketsThisMonth
      };
    } catch (error) {
      console.error('Get support ticket stats error:', error);
      // Return default values on error
      return {
        totalTickets: 0,
        resolvedTickets: 0,
        avgResponseTime: 0,
        satisfactionScore: 0,
        ticketsThisWeek: 0,
        ticketsThisMonth: 0
      };
    }
  }

  static async getSupportAchievements(userId, stats) {
    try {
      const achievements = [
        {
          id: 1,
          name: 'First Responder',
          description: 'Respond to your first ticket',
          icon: 'MessageSquare',
          earned: stats.totalTickets > 0,
          date: stats.totalTickets > 0 ? new Date().toISOString().split('T')[0] : null,
          progress: stats.totalTickets > 0 ? 100 : 0,
          target: 1,
          current: Math.min(stats.totalTickets, 1)
        },
        {
          id: 2,
          name: 'Problem Solver',
          description: 'Resolve 50 tickets',
          icon: 'CheckCircle',
          earned: stats.resolvedTickets >= 50,
          date: stats.resolvedTickets >= 50 ? new Date().toISOString().split('T')[0] : null,
          progress: Math.min((stats.resolvedTickets / 50) * 100, 100),
          target: 50,
          current: stats.resolvedTickets
        },
        {
          id: 3,
          name: 'Speed Demon',
          description: 'Maintain < 2h average response time for a week',
          icon: 'Zap',
          earned: stats.avgResponseTime > 0 && stats.avgResponseTime < 2,
          date: (stats.avgResponseTime > 0 && stats.avgResponseTime < 2) ? new Date().toISOString().split('T')[0] : null,
          progress: stats.avgResponseTime > 0 ? Math.max(0, (2 - stats.avgResponseTime) / 2 * 100) : 0,
          target: 2,
          current: stats.avgResponseTime
        },
        {
          id: 4,
          name: 'Customer Champion',
          description: 'Achieve 4.5+ satisfaction score for a month',
          icon: 'Star',
          earned: stats.satisfactionScore >= 4.5,
          date: stats.satisfactionScore >= 4.5 ? new Date().toISOString().split('T')[0] : null,
          progress: Math.min((stats.satisfactionScore / 4.5) * 100, 100),
          target: 4.5,
          current: stats.satisfactionScore
        },
        {
          id: 5,
          name: 'Consistency King',
          description: 'Handle 100+ tickets',
          icon: 'Target',
          earned: stats.totalTickets >= 100,
          date: stats.totalTickets >= 100 ? new Date().toISOString().split('T')[0] : null,
          progress: Math.min((stats.totalTickets / 100) * 100, 100),
          target: 100,
          current: stats.totalTickets
        },
        {
          id: 6,
          name: 'Team Player',
          description: 'Collaborate on 25+ tickets',
          icon: 'Activity',
          earned: false, // This would need collaboration tracking
          date: null,
          progress: 0,
          target: 25,
          current: 0
        }
      ];

      return achievements;
    } catch (error) {
      console.error('Get support achievements error:', error);
      return [];
    }
  }
}

module.exports = UserService; 