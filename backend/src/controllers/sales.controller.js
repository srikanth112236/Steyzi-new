const SalesService = require('../services/sales.service');
const { handleError } = require('../utils/errorHandler');

class SalesController {
  /**
   * Create a new sales staff member
   * @route POST /api/sales/staff
   * @access Superadmin only
   */
  async createSalesStaff(req, res) {
    try {
      console.log('🚀 Creating Sales Staff:', {
        requestBody: req.body,
        requestUser: {
          id: req.user._id,
          email: req.user.email,
          role: req.user.role
        }
      });

      // Validate input
      const requiredFields = ['firstName', 'lastName', 'email'];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            success: false,
            message: `${field} is required`
          });
        }
      }

      const newStaff = await SalesService.createSalesStaff(req.body, req.user);
      
      console.log('✅ Sales Staff Created Successfully:', {
        staffId: newStaff._id,
        staffEmail: newStaff.email,
        staffRole: newStaff.role
      });

      res.status(201).json({
        success: true,
        message: 'Sales staff created successfully',
        data: {
          _id: newStaff._id,
          firstName: newStaff.firstName,
          lastName: newStaff.lastName,
          email: newStaff.email,
          salesUniqueId: newStaff.salesUniqueId,
          role: newStaff.role
        }
      });
    } catch (error) {
      console.error('❌ Sales Staff Creation Error:', {
        errorMessage: error.message,
        errorStack: error.stack,
        requestBody: req.body
      });

      const statusCode = error.message.includes('exists') ? 409 : 
                         error.message.includes('Unauthorized') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create sales staff',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get all sales staff
   * @route GET /api/sales/staff
   * @access Superadmin only
   */
  async getAllSalesStaff(req, res) {
    try {
      console.log('🔍 Fetching All Sales Staff:', {
        requestUser: {
          id: req.user._id,
          email: req.user.email,
          role: req.user.role
        },
        queryParams: req.query
      });

      // Optional filtering
      const filters = {};
      if (req.query.status) filters.isActive = req.query.status === 'active';
      if (req.query.search) {
        filters.$or = [
          { firstName: { $regex: req.query.search, $options: 'i' } },
          { lastName: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } }
        ];
      }

      const salesStaff = await SalesService.getAllSalesStaff(req.user, filters);
      
      console.log('✅ Sales Staff Retrieved Successfully:', {
        staffCount: salesStaff.length
      });

      res.status(200).json({
        success: true,
        message: 'Sales staff retrieved successfully',
        data: salesStaff,
        total: salesStaff.length
      });
    } catch (error) {
      console.error('❌ Get Sales Staff Error:', {
        errorMessage: error.message,
        errorStack: error.stack
      });

      const statusCode = error.message.includes('Unauthorized') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve sales staff',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get specific sales staff details
   * @route GET /api/sales/staff/:id
   * @access Superadmin only
   */
  async getSalesStaffDetails(req, res) {
    try {
      console.log('🔍 Fetching Sales Staff Details:', {
        staffId: req.params.id,
        requestUser: {
          id: req.user._id,
          email: req.user.email,
          role: req.user.role
        }
      });

      const staffDetails = await SalesService.getSalesStaffDetails(
        req.params.id, 
        req.user
      );
      
      console.log('✅ Sales Staff Details Retrieved Successfully:', {
        staffId: staffDetails._id
      });

      res.status(200).json({
        success: true,
        message: 'Sales staff details retrieved successfully',
        data: staffDetails
      });
    } catch (error) {
      console.error('❌ Get Sales Staff Details Error:', {
        errorMessage: error.message,
        errorStack: error.stack,
        staffId: req.params.id
      });

      const statusCode = error.message.includes('not found') ? 404 :
                         error.message.includes('Unauthorized') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve sales staff details',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Update sales staff details
   * @route PUT /api/sales/staff/:id
   * @access Superadmin only
   */
  async updateSalesStaff(req, res) {
    try {
      console.log('🚀 Updating Sales Staff:', {
        staffId: req.params.id,
        requestBody: req.body,
        requestUser: {
          id: req.user._id,
          email: req.user.email,
          role: req.user.role
        }
      });

      const updatedStaff = await SalesService.updateSalesStaff(
        req.params.id, 
        req.body, 
        req.user
      );
      
      console.log('✅ Sales Staff Updated Successfully:', {
        staffId: updatedStaff._id
      });

      res.status(200).json({
        success: true,
        message: 'Sales staff updated successfully',
        data: {
          _id: updatedStaff._id,
          firstName: updatedStaff.firstName,
          lastName: updatedStaff.lastName,
          email: updatedStaff.email,
          salesUniqueId: updatedStaff.salesUniqueId
        }
      });
    } catch (error) {
      console.error('❌ Update Sales Staff Error:', {
        errorMessage: error.message,
        errorStack: error.stack,
        staffId: req.params.id
      });

      const statusCode = error.message.includes('not found') ? 404 :
                         error.message.includes('Unauthorized') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update sales staff',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Delete sales staff
   * @route DELETE /api/sales/staff/:id
   * @access Superadmin only
   */
  async deleteSalesStaff(req, res) {
    try {
      console.log('🚀 Deleting Sales Staff:', {
        staffId: req.params.id,
        requestUser: {
          id: req.user._id,
          email: req.user.email,
          role: req.user.role
        }
      });

      await SalesService.deleteSalesStaff(req.params.id, req.user);
      
      console.log('✅ Sales Staff Deleted Successfully:', {
        staffId: req.params.id
      });

      res.status(200).json({
        success: true,
        message: 'Sales staff removed successfully'
      });
    } catch (error) {
      console.error('❌ Delete Sales Staff Error:', {
        errorMessage: error.message,
        errorStack: error.stack,
        staffId: req.params.id
      });

      const statusCode = error.message.includes('not found') ? 404 :
                         error.message.includes('Unauthorized') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete sales staff',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get dashboard data for sales users
   * @route GET /api/sales/dashboard
   * @access Sales Manager and Sub-Sales Staff
   */
  async getDashboardData(req, res) {
    try {
      console.log('🚀 Getting Dashboard Data for:', {
        userId: req.user._id,
        userRole: req.user.role,
        userType: req.userType,
        salesRole: req.user.salesRole
      });

      const dashboardData = await SalesService.getDashboardData(req.user);

      console.log('✅ Dashboard Data Retrieved:', dashboardData);

      res.status(200).json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: dashboardData
      });
    } catch (error) {
      console.error('Error in getDashboardData:', error);
      return       res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error.message
      });
    }
  }

  /**
   * Get performance analytics
   * @route GET /api/sales/performance
   * @access Sales users only
   */
  async getPerformanceAnalytics(req, res) {
    try {
      const analytics = await SalesService.getPerformanceAnalytics(req.user);
      res.status(200).json({
        success: true,
        message: 'Performance analytics retrieved successfully',
        data: analytics
      });
    } catch (error) {
      console.error('Performance analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get performance analytics',
        error: error.message
      });
    }
  }

  /**
   * Get detailed sales reports
   * @route GET /api/sales/reports
   * @access Sales users only
   */
  async getSalesReports(req, res) {
    try {
      const reports = await SalesService.getSalesReports(req.user);
      res.status(200).json({
        success: true,
        message: 'Sales reports retrieved successfully',
        data: reports
      });
    } catch (error) {
      console.error('Sales reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sales reports',
        error: error.message
      });
    }
  }

  /**
   * Change password for sales users
   * @route PUT /api/sales/change-password
   * @access Sales users only
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long'
        });
      }

      const result = await SalesService.changePassword(req.user._id, currentPassword, newPassword, req.userType);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        data: result
      });
    } catch (error) {
      console.error('Change password error:', error);
      const statusCode = error.message.includes('Invalid') || error.message.includes('not match') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to change password'
      });
    }
  }

  /**
   * Get financial data for sub-sales staff
   * @route GET /api/sales/my-financials
   * @access Sub-sales staff only
   */
  async getMyFinancials(req, res) {
    try {
      const financials = await SalesService.getMyFinancials(req.user);
      res.status(200).json({
        success: true,
        message: 'Financial data retrieved successfully',
        data: financials
      });
    } catch (error) {
      console.error('Get financials error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get financial data',
        error: error.message
      });
    }
  }

  /**
   * Get team PGs for sales manager
   * @route GET /api/sales/team/pgs
   * @access Sales manager only
   */
  async getTeamPGs(req, res) {
    try {
      console.log('🔍 Getting team PGs for:', {
        userId: req.user._id,
        userRole: req.user.role,
        userEmail: req.user.email
      });

      const teamPGs = await SalesService.getTeamPGs(req.user);

      console.log('✅ Team PGs retrieved:', {
        count: teamPGs.length,
        userId: req.user._id
      });

      res.status(200).json({
        success: true,
        message: 'Team PGs retrieved successfully',
        data: teamPGs,
        total: teamPGs.length
      });
    } catch (error) {
      console.error('❌ Get team PGs error:', {
        error: error.message,
        userId: req.user._id,
        userRole: req.user.role
      });

      const statusCode = error.message.includes('Unauthorized') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to get team PGs',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get PGs added by current sub-sales staff
   * @route GET /api/sales/my-pgs
   * @access Sub-sales staff only
   */
  async getMyPGs(req, res) {
    try {
      console.log('🔍 Getting my PGs for sub-sales staff:', {
        userId: req.user._id,
        userRole: req.user.role,
        salesRole: req.user.salesRole,
        userEmail: req.user.email
      });

      const myPGs = await SalesService.getMyPGs(req.user);

      console.log('✅ My PGs retrieved:', {
        count: myPGs.length,
        userId: req.user._id
      });

      res.status(200).json({
        success: true,
        message: 'My PGs retrieved successfully',
        data: myPGs,
        total: myPGs.length
      });
    } catch (error) {
      console.error('❌ Get my PGs error:', {
        error: error.message,
        userId: req.user._id,
        userRole: req.user.role
      });

      const statusCode = error.message.includes('Unauthorized') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to get my PGs',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get profile for sales users
   * @route GET /api/sales/profile
   * @access Sales users only
   */
  async getProfile(req, res) {
    try {
      console.log('🔍 Getting profile for sales user:', {
        userId: req.user._id,
        userRole: req.user.role,
        userEmail: req.user.email
      });

      const profile = await SalesService.getProfile(req.user);

      console.log('✅ Profile retrieved successfully:', {
        userId: req.user._id,
        hasAddress: !!profile.address
      });

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: profile
      });
    } catch (error) {
      console.error('❌ Get profile error:', {
        error: error.message,
        userId: req.user._id,
        userRole: req.user.role
      });

      const statusCode = error.message.includes('not found') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to get profile',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Update profile for sales users
   * @route PUT /api/sales/profile
   * @access Sales users only
   */
  async updateProfile(req, res) {
    try {
      console.log('🚀 Updating profile for sales user:', {
        userId: req.user._id,
        userRole: req.user.role,
        updateData: req.body
      });

      const updatedProfile = await SalesService.updateProfile(req.user._id, req.body, req.user);

      console.log('✅ Profile updated successfully:', {
        userId: req.user._id,
        updatedFields: Object.keys(req.body)
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      console.error('❌ Update profile error:', {
        error: error.message,
        userId: req.user._id,
        userRole: req.user.role
      });

      const statusCode = error.message.includes('not found') ? 404 :
                         error.message.includes('Invalid') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update profile',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  async getSalesAnalytics(req, res) {
    try {
      const { period = 'monthly', startDate, endDate } = req.query;
      
      // Construct filters based on request parameters
      const filters = {};
      if (startDate) filters.createdAt = { $gte: new Date(startDate) };
      if (endDate) {
        filters.createdAt = filters.createdAt || {};
        filters.createdAt.$lte = new Date(endDate);
      }

      // Call service method to get sales analytics
      const salesAnalytics = await SalesService.getSalesAnalytics(period, filters);

      // Return response
      return res.status(200).json({
        success: true,
        data: salesAnalytics
      });
    } catch (error) {
      console.error('Error in getSalesAnalytics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve sales analytics',
        error: error.message
      });
    }
  }
}

module.exports = new SalesController();
