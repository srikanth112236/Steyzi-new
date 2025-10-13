const SalesManagerService = require('../services/salesManager.service');
const { catchAsync } = require('../utils/errorHandler');

class SalesManagerController {
  /**
   * Create Sales Manager
   */
  createSalesManager = catchAsync(async (req, res) => {
    const salesManagerData = req.body;
    const createdBy = req.user; // Superadmin who is creating the sales manager

    const salesManager = await SalesManagerService.createSalesManager(
      salesManagerData, 
      createdBy
    );

    res.status(201).json({
      success: true,
      message: 'Sales Manager created successfully',
      data: {
        _id: salesManager._id,
        firstName: salesManager.firstName,
        lastName: salesManager.lastName,
        email: salesManager.email,
        phone: salesManager.phone,
        salesUniqueId: salesManager.salesUniqueId,
        status: salesManager.status,
        createdAt: salesManager.createdAt
      }
    });
  });

  /**
   * Get All Sales Managers
   */
  getAllSalesManagers = catchAsync(async (req, res) => {
    const { status, region } = req.query;
    const filters = { status, region };

    const salesManagers = await SalesManagerService.getAllSalesManagers(filters);

    res.status(200).json({
      success: true,
      message: 'Sales Managers retrieved successfully',
      data: salesManagers,
      total: salesManagers.length
    });
  });

  /**
   * Update Sales Manager
   */
  updateSalesManager = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const updatedSalesManager = await SalesManagerService.updateSalesManager(
      id, 
      updateData
    );

    res.status(200).json({
      success: true,
      message: 'Sales Manager updated successfully',
      data: {
        _id: updatedSalesManager._id,
        firstName: updatedSalesManager.firstName,
        lastName: updatedSalesManager.lastName,
        email: updatedSalesManager.email,
        phone: updatedSalesManager.phone,
        salesUniqueId: updatedSalesManager.salesUniqueId,
        status: updatedSalesManager.status,
        createdAt: updatedSalesManager.createdAt
      }
    });
  });

  /**
   * Delete Sales Manager
   */
  deleteSalesManager = catchAsync(async (req, res) => {
    const { id } = req.params;

    await SalesManagerService.deleteSalesManager(id);

    res.status(200).json({
      success: true,
      message: 'Sales Manager deleted successfully'
    });
  });

  /**
   * Reset Sales Manager Password
   */
  resetPassword = catchAsync(async (req, res) => {
    const { id } = req.params;

    const { salesManager, resetToken } = await SalesManagerService.resetPassword(id);

    res.status(200).json({
      success: true,
      message: 'Password reset initiated',
      data: {
        email: salesManager.email,
        resetTokenExpiry: salesManager.passwordResetExpires
      }
    });
  });

  /**
   * Get Sales Manager Performance
   */
  getSalesManagerPerformance = catchAsync(async (req, res) => {
    const { id } = req.params;

    const salesManager = await SalesManager.findById(id)
      .select('performanceMetrics salesUniqueId');

    if (!salesManager) {
      return res.status(404).json({
        success: false,
        message: 'Sales Manager not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sales Manager performance retrieved successfully',
      data: salesManager
    });
  });

  /**
   * Change Password for Sales Users (Managers and Sub-Sales)
   */
  changePassword = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Check if user is authorized to change this password
    if ((req.userType === 'sales_manager' || req.userType === 'sub_sales') && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only change your own password.'
      });
    }

    // Determine which service to use based on user type
    let updatedUser;
    if (req.userType === 'sales_manager') {
      updatedUser = await SalesManagerService.changePassword(id, currentPassword, newPassword);
    } else if (req.userType === 'sub_sales') {
      // Create a generic password change service that works for User model
      const { User } = require('../models');

      const user = await User.findById(id).select('+password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordCorrect = await user.correctPassword(currentPassword, user.password);
      if (!isCurrentPasswordCorrect) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password and flags
      user.password = newPassword;
      user.forcePasswordChange = false;
      user.passwordChanged = true;
      await user.save();

      updatedUser = user;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Invalid user type for password change'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        forcePasswordChange: updatedUser.forcePasswordChange,
        passwordChanged: updatedUser.passwordChanged
      }
    });
  });

  /**
   * Check if Password Change is Required for Sales Users
   */
  needsPasswordChange = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Check if user is authorized to check this password status
    if ((req.userType === 'sales_manager' || req.userType === 'sub_sales') && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only check your own password status.'
      });
    }

    let needsChange = false;

    if (req.userType === 'sales_manager') {
      needsChange = await SalesManagerService.needsPasswordChange(id);
    } else if (req.userType === 'sub_sales') {
      const { User } = require('../models');
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      needsChange = user.forcePasswordChange;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Invalid user type'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password change requirement checked successfully',
      data: {
        needsPasswordChange: needsChange
      }
    });
  });
}

module.exports = new SalesManagerController();
