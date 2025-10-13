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
      const user = await User.findById(userId).select('-password');
      if (!user) {
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
}

module.exports = UserService; 