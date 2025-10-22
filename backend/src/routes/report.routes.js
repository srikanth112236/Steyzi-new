const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, adminOrSuperadmin } = require('../middleware/auth.middleware');
const { trackAdminActivity } = require('../middleware/adminActivity.middleware');

// Report generation routes
router.get('/residents', authenticate, adminOrSuperadmin, trackAdminActivity(), reportController.generateResidentsReport);
router.get('/payments', authenticate, adminOrSuperadmin, trackAdminActivity(), reportController.generatePaymentsReport);
router.get('/tickets', authenticate, adminOrSuperadmin, trackAdminActivity(), reportController.generateTicketsReport);
router.get('/onboarding', authenticate, adminOrSuperadmin, trackAdminActivity(), reportController.generateOnboardingReport);
router.get('/offboarding', authenticate, adminOrSuperadmin, trackAdminActivity(), reportController.generateOffboardingReport);
router.get('/occupancy', authenticate, adminOrSuperadmin, trackAdminActivity(), reportController.generateOccupancyReport);
router.get('/financial-summary', authenticate, adminOrSuperadmin, trackAdminActivity(), reportController.generateFinancialSummaryReport);

// Analytics and options routes
router.get('/analytics', authenticate, adminOrSuperadmin, trackAdminActivity(), reportController.getReportAnalytics);
router.get('/options', authenticate, adminOrSuperadmin, trackAdminActivity(), reportController.getReportOptions);
router.get('/export-formats', authenticate, adminOrSuperadmin, trackAdminActivity(), reportController.getExportFormats);

// Export route
router.post('/export', authenticate, adminOrSuperadmin, trackAdminActivity(), reportController.exportReport);

module.exports = router; 