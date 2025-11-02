const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { trackAdminActivity } = require('../middleware/adminActivity.middleware');

// Report generation routes - Allow admin and maintainer
router.get('/residents', authenticate, trackAdminActivity(), reportController.generateResidentsReport);
router.get('/payments', authenticate, trackAdminActivity(), reportController.generatePaymentsReport);
router.get('/tickets', authenticate, trackAdminActivity(), reportController.generateTicketsReport);
router.get('/onboarding', authenticate, trackAdminActivity(), reportController.generateOnboardingReport);
router.get('/offboarding', authenticate, trackAdminActivity(), reportController.generateOffboardingReport);
router.get('/occupancy', authenticate, trackAdminActivity(), reportController.generateOccupancyReport);
router.get('/financial-summary', authenticate, trackAdminActivity(), reportController.generateFinancialSummaryReport);

// Analytics and options routes
router.get('/analytics', authenticate, trackAdminActivity(), reportController.getReportAnalytics);
router.get('/options', authenticate, trackAdminActivity(), reportController.getReportOptions);
router.get('/export-formats', authenticate, trackAdminActivity(), reportController.getExportFormats);

// Export route
router.post('/export', authenticate, trackAdminActivity(), reportController.exportReport);

module.exports = router; 