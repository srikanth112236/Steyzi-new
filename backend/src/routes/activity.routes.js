const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// General activity routes
router.get('/recent', activityController.getRecentActivities);
router.get('/stats', activityController.getActivityStats);
router.get('/user/:userId', activityController.getUserActivities);
router.get('/branch/:branchId', activityController.getBranchActivities);
router.get('/timeline/:entityType/:entityId', activityController.getEntityTimeline);
router.post('/record', activityController.recordActivity);
router.post('/cleanup', activityController.cleanOldActivities);
router.get('/export/csv', activityController.exportActivities);

// Role-specific activity routes
router.get('/admin', authorize('admin'), activityController.getAdminActivities);
router.get('/superadmin', authorize('superadmin'), activityController.getSuperadminActivities);
router.get('/support', authorize('support'), activityController.getSupportActivities);

// Role-specific stats
router.get('/stats/role-specific', activityController.getRoleSpecificStats);

// Role-specific user activities
router.get('/user/:userId/role-specific', activityController.getRoleSpecificUserActivities);

// Role-specific branch activities
router.get('/branch/:branchId/role-specific', activityController.getRoleSpecificBranchActivities);

module.exports = router; 