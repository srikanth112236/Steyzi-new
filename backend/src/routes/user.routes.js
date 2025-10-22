const express = require('express');
const { authenticate, superadminOnly, adminOnly } = require('../middleware/auth.middleware');
const { checkTrialExpiration } = require('../middleware/subscription.middleware');
const { trackAdminActivity } = require('../middleware/adminActivity.middleware');
const AuthService = require('../services/auth.service');
const UserService = require('../services/user.service');
const { validateRequest, schemas } = require('../middleware/validation.middleware');
const userSubscriptionController = require('../controllers/userSubscription.controller');

const router = express.Router();

// Import the already instantiated PGService
const pgService = require('../services/pg.service');

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile with PG information
 * @access  Private
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await UserService.getUserProfile(req.user.id);
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
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, validateRequest(schemas.updateProfile), async (req, res) => {
  try {
    const result = await UserService.updateUserProfile(req.user.id, req.body);
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
 * @route   GET /api/users/support-profile
 * @desc    Get support user profile with statistics, activity and achievements
 * @access  Private (Support users only)
 */
router.get('/support-profile', authenticate, async (req, res) => {
  try {
    // Only allow support users to access this endpoint
    if (req.user.role !== 'support') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Support role required.'
      });
    }

    const userId = req.user._id || req.user.id;
    const result = await UserService.getSupportProfile(userId);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Get support profile route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get support profile.',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticate, validateRequest(schemas.changePassword), async (req, res) => {
  try {
    const result = await UserService.changePassword(req.user.id, req.body);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Change password route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/users/pg-info
 * @desc    Get PG information for admin user
 * @access  Private (Admin)
 */
router.get('/pg-info', authenticate, adminOnly, checkTrialExpiration, trackAdminActivity(), async (req, res) => {
  try {
    const result = await pgService.getPGInfo(req.user.pgId);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Get PG info route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get PG information.',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/users/pg-info
 * @desc    Update PG information (admin only)
 * @access  Private (Admin)
 */
router.put('/pg-info', authenticate, adminOnly, checkTrialExpiration, validateRequest(schemas.updatePG), trackAdminActivity(), async (req, res) => {
  try {
    console.log('🔍 PG Update Request:', {
      userId: req.user.id,
      pgId: req.user.pgId,
      body: req.body
    });
    
    // Check if admin has a PG assigned
    if (!req.user.pgId) {
      console.log('❌ Admin user has no PG assigned');
      return res.status(400).json({
        success: false,
        message: 'No PG assigned to this admin account. Please contact superadmin to assign a PG.',
        statusCode: 400
      });
    }
    
    const result = await pgService.updatePGInfo(req.user.pgId, req.body);
    console.log('✅ PG Update Result:', result);
    
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('❌ Update PG info route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update PG information.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/users/notifications
 * @desc    Get user notification preferences
 * @access  Private
 */
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const result = await UserService.getNotificationPreferences(req.user.id);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Get notifications route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get notification preferences.',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/users/notifications
 * @desc    Update user notification preferences
 * @access  Private
 */
router.put('/notifications', authenticate, validateRequest(schemas.notificationPreferences), async (req, res) => {
  try {
    const result = await UserService.updateNotificationPreferences(req.user.id, req.body);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Update notifications route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/users
 * @desc    Get all users with lock status (superadmin only)
 * @access  Private (Superadmin)
 */
router.get('/', authenticate, superadminOnly, trackAdminActivity(), async (req, res) => {
  try {
    const result = await AuthService.getUsersWithLockStatus();
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Get users route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get users.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/users/:userId/unlock
 * @desc    Unlock user account (superadmin only)
 * @access  Private (Superadmin)
 */
router.post('/:userId/unlock', authenticate, superadminOnly, trackAdminActivity(), async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await AuthService.unlockUserAccount(userId);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Unlock user route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unlock user account.',
      error: error.message
    });
  }
});

/**
 * Subscription Routes
 */

/**
 * @route   GET /api/users/my-subscription
 * @desc    Get current user's subscription
 * @access  Private
 */
router.get('/my-subscription', authenticate, userSubscriptionController.getMySubscription);

/**
 * @route   POST /api/users/select-subscription
 * @desc    Select a subscription plan
 * @access  Private
 */
router.post('/select-subscription', authenticate, userSubscriptionController.selectSubscription);

/**
 * @route   PUT /api/users/subscription-usage
 * @desc    Update subscription usage
 * @access  Private
 */
router.put('/subscription-usage', authenticate, userSubscriptionController.updateSubscriptionUsage);

/**
 * @route   GET /api/users/check-restrictions
 * @desc    Check subscription restrictions
 * @access  Private
 */
router.get('/check-restrictions', authenticate, userSubscriptionController.checkRestrictions);

/**
 * @route   POST /api/users/subscription/add-beds
 * @desc    Add beds to subscription (Top-up)
 * @access  Private
 */
router.post('/subscription/add-beds', authenticate, userSubscriptionController.addBedsToSubscription);

/**
 * @route   POST /api/users/subscription/add-branches
 * @desc    Add branches to subscription
 * @access  Private
 */
router.post('/subscription/add-branches', authenticate, userSubscriptionController.addBranchesToSubscription);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await UserService.getUserById(req.params.id);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Get user by ID route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user.',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID
 * @access  Private/Admin
 */
router.put('/:id', authenticate, validateRequest(schemas.updateProfile), async (req, res) => {
  try {
    const result = await UserService.updateUserById(req.params.id, req.body);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Update user by ID route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user.',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user by ID
 * @access  Private/Admin
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await UserService.deleteUserById(req.params.id);
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

module.exports = router; 