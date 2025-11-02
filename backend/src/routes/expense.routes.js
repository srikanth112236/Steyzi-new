const express = require('express');
const router = express.Router();
const expenseService = require('../services/expense.service');
const { authenticate, superadminOnly } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/expenses
 * @desc    Create a new expense
 * @access  Superadmin only
 */
router.post('/', authenticate, superadminOnly, async (req, res) => {
  try {
    const result = await expenseService.createExpense(req.body, req.user._id);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Create expense route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/expenses
 * @desc    Get all expenses with filters and pagination
 * @access  Superadmin only
 */
router.get('/', authenticate, superadminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const filters = {};

    if (req.query.type) filters.type = req.query.type;
    if (req.query.startDate) filters.startDate = req.query.startDate;
    if (req.query.endDate) filters.endDate = req.query.endDate;

    const result = await expenseService.getAllExpenses(filters, page, limit);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Get expenses route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/expenses/statistics
 * @desc    Get expense statistics
 * @access  Superadmin only
 */
router.get('/statistics', authenticate, superadminOnly, async (req, res) => {
  try {
    const result = await expenseService.getExpenseStatistics();
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Get expense statistics route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch expense statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/expenses/monthly
 * @desc    Get expenses for a specific month
 * @access  Superadmin only
 */
router.get('/monthly', authenticate, superadminOnly, async (req, res) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);
    const month = parseInt(req.query.month || (new Date().getMonth() + 1), 10);

    const result = await expenseService.getExpensesForMonth(year, month);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Get monthly expenses route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly expenses',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/expenses/:id
 * @desc    Get expense by ID
 * @access  Superadmin only
 */
router.get('/:id', authenticate, superadminOnly, async (req, res) => {
  try {
    const result = await expenseService.getExpenseById(req.params.id);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Get expense route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch expense',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/expenses/:id
 * @desc    Update expense
 * @access  Superadmin only
 */
router.put('/:id', authenticate, superadminOnly, async (req, res) => {
  try {
    const result = await expenseService.updateExpense(req.params.id, req.body, req.user._id);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Update expense route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete expense
 * @access  Superadmin only
 */
router.delete('/:id', authenticate, superadminOnly, async (req, res) => {
  try {
    const result = await expenseService.deleteExpense(req.params.id);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Delete expense route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: error.message
    });
  }
});

module.exports = router;
