const express = require('express');
const router = express.Router();
const AuthService = require('../services/auth.service');
const activityService = require('../services/activity.service');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail,
  validateResendVerification,
  validateUpdateProfile,
  validateEmailVerificationQuery,
  validatePasswordResetQuery
} = require('../middleware/validation.middleware');
const {
  authenticate,
  requireEmailVerification
} = require('../middleware/auth.middleware');
const { authRateLimit } = require('../middleware/rateLimit.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register new superadmin
 * @access  Public
 */
router.post('/register', authRateLimit, validateRegister, async (req, res) => {
  try {
    const result = await AuthService.registerSuperadmin(req.body);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Registration route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/register-support
 * @desc    Register new support staff (superadmin only)
 * @access  Private (superadmin)
 */
router.post('/register-support', authRateLimit, authenticate, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmins can register support staff'
      });
    }

    const result = await AuthService.registerSupportStaff(req.body);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Support registration route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Support registration failed. Please try again.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authRateLimit, validateLogin, async (req, res) => {
  try {
    const loginInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    };

    const result = await AuthService.login(req.body, loginInfo);

    // Record login activity when successful
    try {
      if (result && result.success) {
        const user = (result.data && result.data.user) || result.user || {};
        const userId = user._id || user.id;
        const userEmail = user.email || req.body.email;
        const userRole = user.role;
        let branchId = user.branchId;
        let branchName = user.branchName;
        
        // For admin users, get the default branch if no branchId is set
        if (userRole === 'admin' && !branchId && user.pgId) {
          try {
            const Branch = require('../models/branch.model');
            const defaultBranch = await Branch.findOne({ pgId: user.pgId, isDefault: true });
            if (defaultBranch) {
              branchId = defaultBranch._id;
              branchName = defaultBranch.name;
              console.log('🔍 Using default branch for admin:', { branchId, branchName });
            }
          } catch (error) {
            console.error('❌ Error getting default branch:', error);
          }
        }
        
        console.log('🔍 Recording login activity for user:', {
          userId,
          userEmail,
          userRole,
          branchId,
          branchName
        });
        
        if (userId) {
          const activityData = {
            type: 'user_login',
            title: 'User Login',
            description: `User ${userEmail || 'unknown'} logged in`,
            userId: userId,
            userEmail: userEmail,
            userRole: userRole,
            category: 'authentication',
            priority: 'normal',
            ipAddress: loginInfo.ipAddress,
            userAgent: loginInfo.userAgent,
            status: 'success'
          };
          
          // Add branch information if available
          if (branchId) {
            activityData.branchId = branchId;
          }
          if (branchName) {
            activityData.branchName = branchName;
          }
          
          console.log('🔍 Activity data to record:', activityData);
          
          const recordedActivity = await activityService.recordActivity(activityData);
          console.log('✅ Login activity recorded successfully:', recordedActivity._id);
        } else {
          console.log('⚠️ No userId found, skipping activity recording');
        }
      } else {
        console.log('⚠️ Login result not successful, skipping activity recording');
      }
    } catch (error) {
      console.error('❌ Error recording login activity:', error);
    }

    // Return tokens in response body for localStorage storage
    // No need to set cookies since we're using localStorage
    if (result && result.success) {
      console.log('✅ Login successful, returning tokens in response body');
    } else {
      console.log('❌ Login failed, returning error response');
    }

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Login route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/support-login
 * @desc    Login support staff
 * @access  Public
 */
router.post('/support-login', authRateLimit, validateLogin, async (req, res) => {
  try {
    const loginInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    };

    const result = await AuthService.supportLogin(req.body, loginInfo);

    // Record support login activity when successful
    try {
      if (result && result.success) {
        const user = (result.data && result.data.user) || result.user || {};
        const userId = user._id || user.id;
        const userEmail = user.email || req.body.email;
        const userRole = user.role;
        if (userId) {
          await activityService.recordActivity({
            type: 'user_login',
            title: 'Support Login',
            description: `Support user ${userEmail || 'unknown'} logged in`,
            userId: userId,
            userEmail: userEmail,
            userRole: userRole,
            category: 'authentication',
            priority: 'normal',
            ipAddress: loginInfo.ipAddress,
            userAgent: loginInfo.userAgent,
            status: 'success'
          });
        }
      }
    } catch (_) {}

    // Return tokens in response body for localStorage storage
    console.log('✅ Support login successful, returning tokens in response body');

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Support login route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Support login failed. Please try again.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/sales-login
 * @desc    Login sales manager
 * @access  Public
 */
router.post('/sales-login', authRateLimit, async (req, res) => {
  try {
    const loginInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    };

    const result = await AuthService.salesManagerLogin(req.body, loginInfo);

    // Record sales manager login activity when successful
    try {
      if (result.success && result.data?.user) {
        const userId = result.data.user._id;
        const userEmail = result.data.user.email;
        const userRole = result.data.user.role;

        if (userId) {
          await activityService.recordActivity({
            type: 'user_login',
            title: 'Sales Manager Login',
            description: `Sales Manager ${userEmail || 'unknown'} logged in`,
            userId: userId,
            userEmail: userEmail,
            userRole: userRole,
            category: 'authentication',
            priority: 'normal',
            ipAddress: loginInfo.ipAddress,
            userAgent: loginInfo.userAgent,
            status: 'success'
          });
        }
      }
    } catch (_) {}

    // Return tokens in response body for localStorage storage
    console.log('✅ Sales manager login successful, returning tokens in response body');

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Sales manager login route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Sales manager login failed. Please try again.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 Refresh token request received');
    
    // Get refresh token from request body (sent from frontend localStorage)
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      console.log('❌ No refresh token provided in request body');
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided'
      });
    }

    console.log('✅ Refresh token received, attempting to refresh...');
    const result = await AuthService.refreshToken(refreshToken);

    // Return new access token in response body
    console.log('✅ Token refresh successful, returning new access token');

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('❌ Token refresh route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Token refresh failed.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', authRateLimit, validateForgotPassword, async (req, res) => {
  try {
    const result = await AuthService.forgotPassword(req.body.email);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Forgot password route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send password reset email.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', authRateLimit, validateResetPassword, async (req, res) => {
  try {
    const result = await AuthService.resetPassword(req.body.token, req.body.password);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Reset password route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Password reset failed.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with credentials
 * @access  Public
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required'
      });
    }

    const result = await AuthService.verifyEmailWithCredentials(email, password, firstName, lastName);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Email verification route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email verification failed.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/verify-email
 * @desc    Verify email with credentials from query parameters
 * @access  Public
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.query;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required'
      });
    }

    const result = await AuthService.verifyEmailWithCredentials(email, password, firstName, lastName);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Email verification route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email verification failed.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post('/resend-verification', authRateLimit, validateResendVerification, async (req, res) => {
  try {
    const result = await AuthService.resendEmailVerification(req.body.email);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Resend verification route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend verification email.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Since we're using localStorage, we don't need to pass the token
    // The authenticate middleware already verified the token
    const result = await AuthService.logout();

    // No need to clear cookies since we're using localStorage
    // Frontend will handle clearing localStorage

    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Logout route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout failed.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await AuthService.getProfile(req.user._id);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Get profile route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get profile.',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', authenticate, validateUpdateProfile, async (req, res) => {
  try {
    const result = await AuthService.updateProfile(req.user._id, req.body);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Update profile route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user with onboarding status
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await AuthService.getCurrentUser(req.user._id);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Get current user route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get current user',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/reset-password
 * @desc    Validate reset password token from query parameter
 * @access  Public
 */
router.get('/reset-password', validatePasswordResetQuery, async (req, res) => {
  try {
    // This endpoint validates the token and returns success if valid
    // The actual password reset happens via POST /api/auth/reset-password
    return res.status(200).json({
      success: true,
      message: 'Reset token is valid',
      data: {
        token: req.query.token
      }
    });
  } catch (error) {
    console.error('Validate reset token route error:', error);
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token.'
    });
  }
});

/**
 * @route   GET /api/auth/support-staff
 * @desc    Get all support staff members (superadmin only)
 * @access  Private (superadmin)
 */
router.get('/support-staff', authenticate, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmins can view support staff'
      });
    }

    const result = await AuthService.getSupportStaff();
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Get support staff route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get support staff.',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/auth/users/:userId
 * @desc    Delete a user (superadmin only)
 * @access  Private (superadmin)
 */
router.delete('/users/:userId', authenticate, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmins can delete users'
      });
    }

    const result = await AuthService.deleteUser(req.params.userId);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Delete user route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user.',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/auth/users/:userId/status
 * @desc    Update user status (activate/deactivate) (superadmin only)
 * @access  Private (superadmin)
 */
router.patch('/users/:userId/status', authenticate, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmins can update user status'
      });
    }

    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const result = await AuthService.updateUserStatus(req.params.userId, isActive);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Update user status route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status.',
      error: error.message
    });
  }
});

module.exports = router; 