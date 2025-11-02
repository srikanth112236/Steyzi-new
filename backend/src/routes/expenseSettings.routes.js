const express = require('express');
const router = express.Router();
const ExpenseSettings = require('../models/expenseSettings.model');
const expenseReportService = require('../services/expenseReport.service');
const expenseMonthlyReportJob = require('../jobs/expenseMonthlyReport.job');
const { authenticate, superadminOnly } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/expense-settings
 * @desc    Get expense settings
 * @access  Superadmin only
 */
router.get('/', authenticate, superadminOnly, async (req, res) => {
  try {
    const settings = await ExpenseSettings.getSettings();
    return res.json({
      success: true,
      data: settings,
      statusCode: 200
    });
  } catch (error) {
    console.error('Get expense settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch expense settings',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/expense-settings
 * @desc    Update expense settings
 * @access  Superadmin only
 */
router.put('/', authenticate, superadminOnly, async (req, res) => {
  try {
    const settings = await ExpenseSettings.getSettings();

    // Update fields
    if (req.body.monthlyReportEmail !== undefined) {
      settings.monthlyReportEmail = req.body.monthlyReportEmail || '';
    }
    if (req.body.monthlyReportsEnabled !== undefined) {
      settings.monthlyReportsEnabled = req.body.monthlyReportsEnabled;
    }
    if (req.body.reportDay !== undefined) {
      settings.reportDay = req.body.reportDay;
    }
    settings.updatedBy = req.user._id;

    await settings.save();

    return res.json({
      success: true,
      message: 'Expense settings updated successfully',
      data: settings,
      statusCode: 200
    });
  } catch (error) {
    console.error('Update expense settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update expense settings',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/expense-settings/send-report
 * @desc    Manually trigger monthly expense report
 * @access  Superadmin only
 */
router.post('/send-report', authenticate, superadminOnly, async (req, res) => {
  try {
    const { year, month, email } = req.body;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }

    const settings = await ExpenseSettings.getSettings();
    const emailAddress = email || settings.monthlyReportEmail;

    if (!emailAddress) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required. Please configure it in settings first.'
      });
    }

    const result = await expenseMonthlyReportJob.triggerManually(
      parseInt(year, 10),
      parseInt(month, 10),
      emailAddress
    );

    if (result.success) {
      // Update last sent date if it's a scheduled report
      if (!email) {
        settings.lastSentDate = new Date();
        await settings.save();
      }
    }

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Send expense report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send expense report',
      error: error.message
    });
  }
});

module.exports = router;

