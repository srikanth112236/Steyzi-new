const express = require('express');
const multer = require('multer');
const router = express.Router();
const expenseService = require('../services/expense.service');
const { authenticate, adminOrSuperadmin } = require('../middleware/auth.middleware');

// Configure multer for file uploads (receipt images)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * @route   POST /api/expenses
 * @desc    Create a new expense
 * @access  Admin or Superadmin
 */
router.post('/', authenticate, adminOrSuperadmin, upload.single('receiptImage'), async (req, res) => {
  try {
    // Parse FormData fields from req.body (multer makes them available)
    // FormData sends all values as strings, so we need to parse them
    const expenseData = {
      description: req.body.description ? String(req.body.description).trim() : null,
      date: req.body.date ? String(req.body.date).trim() : null,
      type: req.body.type ? String(req.body.type).trim() : null,
      amount: req.body.amount ? parseFloat(String(req.body.amount)) : null,
      category: req.body.category ? String(req.body.category).trim() : null,
      branchId: req.body.branchId ? String(req.body.branchId).trim() : null,
      status: req.body.status ? String(req.body.status).trim() : 'pending',
      paidType: req.body.paidType ? String(req.body.paidType).trim() : null,
      notes: req.body.notes ? String(req.body.notes).trim() : null
    };

    // Handle tags - can be array or comma-separated string
    if (req.body.tags) {
      if (Array.isArray(req.body.tags)) {
        expenseData.tags = req.body.tags.map(t => String(t).trim()).filter(t => t);
      } else {
        expenseData.tags = String(req.body.tags).split(',').map(t => t.trim()).filter(t => t);
      }
    }

    // Handle receipt image if uploaded
    if (req.file) {
      // For now, we'll store the file info (you can implement file storage later)
      expenseData.receipt = req.file.buffer.toString('base64'); // Store as base64 for now
      // Or you can save to disk/cloud storage and store the URL
    }

    // Log the received data for debugging
    console.log('Received expense data:', {
      description: expenseData.description,
      date: expenseData.date,
      type: expenseData.type,
      amount: expenseData.amount,
      hasReceipt: !!req.file
    });

    const result = await expenseService.createExpense(expenseData, req.user._id);
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
 * @access  Admin or Superadmin
 */
router.get('/', authenticate, adminOrSuperadmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const filters = {};

    // Map query parameters to filters
    if (req.query.type) filters.type = req.query.type;
    if (req.query.expenseType) filters.expenseType = req.query.expenseType;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.branchId) filters.branchId = req.query.branchId;
    if (req.query.startDate) filters.startDate = req.query.startDate;
    if (req.query.endDate) filters.endDate = req.query.endDate;
    // Map expenseDate to date for sorting (frontend uses expenseDate, backend uses date)
    if (req.query.sortBy) {
      filters.sortBy = req.query.sortBy === 'expenseDate' ? 'date' : req.query.sortBy;
    }
    if (req.query.sortOrder) filters.sortOrder = req.query.sortOrder;

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
 * @access  Admin or Superadmin
 */
router.get('/statistics', authenticate, adminOrSuperadmin, async (req, res) => {
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
 * @access  Admin or Superadmin
 */
router.get('/monthly', authenticate, adminOrSuperadmin, async (req, res) => {
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
 * @access  Admin or Superadmin
 */
router.get('/:id', authenticate, adminOrSuperadmin, async (req, res) => {
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
 * @access  Admin or Superadmin
 */
router.put('/:id', authenticate, adminOrSuperadmin, async (req, res) => {
  try {
    // Parse update data similar to create route
    const updateData = {};
    
    if (req.body.description) updateData.description = String(req.body.description).trim();
    if (req.body.date) updateData.date = String(req.body.date).trim();
    if (req.body.type) updateData.type = String(req.body.type).trim();
    if (req.body.amount !== undefined) updateData.amount = parseFloat(String(req.body.amount));
    if (req.body.category) updateData.category = String(req.body.category).trim();
    if (req.body.branchId !== undefined) {
      updateData.branchId = req.body.branchId && String(req.body.branchId).trim() !== '' 
        ? String(req.body.branchId).trim() 
        : null;
    }
    if (req.body.status) updateData.status = String(req.body.status).trim();
    if (req.body.paidType) updateData.paidType = String(req.body.paidType).trim();
    if (req.body.notes !== undefined) updateData.notes = req.body.notes ? String(req.body.notes).trim() : null;
    
    // Handle tags
    if (req.body.tags !== undefined) {
      if (Array.isArray(req.body.tags)) {
        updateData.tags = req.body.tags.map(t => String(t).trim()).filter(t => t);
      } else if (typeof req.body.tags === 'string') {
        updateData.tags = String(req.body.tags).split(',').map(t => t.trim()).filter(t => t);
      }
    }

    console.log('Update expense data:', updateData);
    
    const result = await expenseService.updateExpense(req.params.id, updateData, req.user._id);
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
 * @access  Admin or Superadmin
 */
router.delete('/:id', authenticate, adminOrSuperadmin, async (req, res) => {
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
