const { SalesManager } = require('../models');
const { generateUniquePassword } = require('../utils/passwordGenerator');
const { generateUniqueId } = require('../utils/uniqueIdGenerator');
const emailService = require('./email.service');
const crypto = require('crypto');

class SalesManagerService {
  /**
   * Create a new Sales Manager
   * @param {Object} salesManagerData - Sales Manager details
   * @param {Object} createdBy - Superadmin who created the Sales Manager
   * @returns {Object} Created Sales Manager
   */
  async createSalesManager(salesManagerData, createdBy) {
    try {
      // Check if email already exists
      const existingManager = await SalesManager.findOne({
        email: salesManagerData.email
      });

      if (existingManager) {
        throw new Error('Sales Manager with this email already exists');
      }

      // Generate unique ID and temporary password
      const salesUniqueId = generateUniqueId();
      const tempPassword = generateUniquePassword();

      // Create Sales Manager
      const salesManager = new SalesManager({
        ...salesManagerData,
        salesUniqueId,
        password: tempPassword,
        createdBy: createdBy._id,
        // Validate and set commission rate, defaulting to 10 if not provided
        commissionRate: salesManagerData.commissionRate !== undefined 
          ? salesManagerData.commissionRate 
          : 10
      });

      // Save Sales Manager
      await salesManager.save();

      // Send welcome email with login credentials and unique ID
      await emailService.sendSalesManagerWelcomeEmail({
        firstName: salesManager.firstName,
        lastName: salesManager.lastName,
        email: salesManager.email,
        salesUniqueId,
        tempPassword,
        loginUrl: `${process.env.FRONTEND_URL}/sales/login`
      });

      return salesManager;
    } catch (error) {
      throw new Error(`Failed to create Sales Manager: ${error.message}`);
    }
  }

  /**
   * Get all Sales Managers
   * @param {Object} filters - Optional filters
   * @returns {Array} List of Sales Managers
   */
  async getAllSalesManagers(filters = {}) {
    try {
      const query = {};

      // Apply filters
      if (filters.status) query.status = filters.status;
      if (filters.region) query.assignedRegions = filters.region;

      return await SalesManager.find(query)
        .select('-password')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to fetch Sales Managers: ${error.message}`);
    }
  }

  /**
   * Update Sales Manager
   * @param {String} salesManagerId 
   * @param {Object} updateData 
   * @returns {Object} Updated Sales Manager
   */
  async updateSalesManager(salesManagerId, updateData) {
    try {
      // Validate commission rate if provided
      if (updateData.commissionRate !== undefined) {
        if (updateData.commissionRate < 0 || updateData.commissionRate > 100) {
          throw new Error('Commission rate must be between 0 and 100');
        }
      }

      const salesManager = await SalesManager.findByIdAndUpdate(
        salesManagerId, 
        updateData, 
        { new: true, runValidators: true }
      ).select('-password');

      if (!salesManager) {
        throw new Error('Sales Manager not found');
      }

      return salesManager;
    } catch (error) {
      throw new Error(`Failed to update Sales Manager: ${error.message}`);
    }
  }

  /**
   * Delete Sales Manager
   * @param {String} salesManagerId 
   * @returns {Object} Deleted Sales Manager
   */
  async deleteSalesManager(salesManagerId) {
    try {
      const salesManager = await SalesManager.findByIdAndDelete(salesManagerId);

      if (!salesManager) {
        throw new Error('Sales Manager not found');
      }

      return salesManager;
    } catch (error) {
      throw new Error(`Failed to delete Sales Manager: ${error.message}`);
    }
  }

  /**
   * Reset Sales Manager Password
   * @param {String} salesManagerId 
   * @returns {Object} Sales Manager with reset token
   */
  async resetPassword(salesManagerId) {
    try {
      const salesManager = await SalesManager.findById(salesManagerId);

      if (!salesManager) {
        throw new Error('Sales Manager not found');
      }

      // Generate password reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

      salesManager.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      salesManager.passwordResetExpires = resetTokenExpiry;

      await salesManager.save();

      return {
        salesManager,
        resetToken
      };
    } catch (error) {
      throw new Error(`Failed to reset password: ${error.message}`);
    }
  }

  /**
   * Change Sales Manager Password
   * @param {String} salesManagerId
   * @param {String} currentPassword
   * @param {String} newPassword
   * @returns {Object} Updated Sales Manager
   */
  async changePassword(salesManagerId, currentPassword, newPassword) {
    try {
      const salesManager = await SalesManager.findById(salesManagerId).select('+password');

      if (!salesManager) {
        throw new Error('Sales Manager not found');
      }

      // Verify current password
      const isCurrentPasswordCorrect = await salesManager.correctPassword(currentPassword, salesManager.password);
      if (!isCurrentPasswordCorrect) {
        throw new Error('Current password is incorrect');
      }

      // Update password and flags
      salesManager.password = newPassword;
      salesManager.forcePasswordChange = false;
      salesManager.passwordChanged = true;
      await salesManager.save();

      return salesManager;
    } catch (error) {
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  /**
   * Check if Sales Manager needs to change password
   * @param {String} salesManagerId
   * @returns {Boolean} Whether password change is required
   */
  async needsPasswordChange(salesManagerId) {
    try {
      const salesManager = await SalesManager.findById(salesManagerId);
      return salesManager ? salesManager.forcePasswordChange : false;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new SalesManagerService();
