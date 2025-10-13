const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, adminOrSuperadmin } = require('../middleware/auth.middleware');

// Report generation routes
router.get('/residents', authenticate, adminOrSuperadmin, reportController.generateResidentsReport);
router.get('/payments', authenticate, adminOrSuperadmin, reportController.generatePaymentsReport);
router.get('/tickets', authenticate, adminOrSuperadmin, reportController.generateTicketsReport);
router.get('/onboarding', authenticate, adminOrSuperadmin, reportController.generateOnboardingReport);
router.get('/offboarding', authenticate, adminOrSuperadmin, reportController.generateOffboardingReport);
router.get('/occupancy', authenticate, adminOrSuperadmin, reportController.generateOccupancyReport);
router.get('/financial-summary', authenticate, adminOrSuperadmin, reportController.generateFinancialSummaryReport);

// Analytics and options routes
router.get('/analytics', authenticate, adminOrSuperadmin, reportController.getReportAnalytics);
router.get('/options', authenticate, adminOrSuperadmin, reportController.getReportOptions);
router.get('/export-formats', authenticate, adminOrSuperadmin, reportController.getExportFormats);

// Export route
router.post('/export', authenticate, adminOrSuperadmin, reportController.exportReport);

module.exports = router; 