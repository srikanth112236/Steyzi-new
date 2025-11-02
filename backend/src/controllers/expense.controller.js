const Expense = require('../models/expense.model');
const Branch = require('../models/branch.model');
const { createResponse } = require('../utils/response');
const activityService = require('../services/activity.service');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for receipt image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/expenses');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'expense-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

class ExpenseController {
  // Create a new expense
  async createExpense(req, res) {
    try {
      const {
        expenseName,
        expenseDate,
        paidType,
        expenseType,
        purpose,
        amount,
        branchId,
        status,
        notes,
        tags
      } = req.body;

      const receiptImage = req.file;

      // Validate required fields
      if (!expenseName || !expenseDate || !paidType || !expenseType || !purpose || !amount || !branchId) {
        return createResponse(res, 400, false, 'All required fields must be provided');
      }

      // Validate branch belongs to user's PG
      const branch = await Branch.findOne({
        _id: branchId,
        pgId: req.user.pgId,
        isActive: true
      });

      if (!branch) {
        return createResponse(res, 404, false, 'Branch not found or access denied');
      }

      // Prepare expense data
      const expenseData = {
        pgId: req.user.pgId,
        branchId,
        expenseName: expenseName.trim(),
        expenseDate: new Date(expenseDate),
        paidType,
        expenseType,
        purpose: purpose.trim(),
        amount: parseFloat(amount),
        status: status || 'pending',
        notes: notes?.trim(),
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        paidBy: req.user._id
      };

      // Handle receipt image
      if (receiptImage) {
        expenseData.receiptImage = {
          fileName: receiptImage.filename,
          originalName: receiptImage.originalname,
          filePath: receiptImage.path,
          fileSize: receiptImage.size,
          mimeType: receiptImage.mimetype
        };
      }

      const expense = new Expense(expenseData);
      await expense.save();

      // Populate branch information
      await expense.populate('branchId', 'name address');
      await expense.populate('paidBy', 'firstName lastName email');

      // Record activity
      try {
        await activityService.recordActivity({
          type: 'expense_created',
          title: 'Expense Created',
          description: `New expense "${expenseName}" created for ₹${amount}`,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'expense',
          entityId: expense._id,
          category: 'finance',
          priority: 'normal',
          status: 'success'
        });
      } catch (activityError) {
        console.warn('Failed to record activity:', activityError);
      }

      return createResponse(res, 201, true, 'Expense created successfully', expense);
    } catch (error) {
      console.error('Error creating expense:', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return createResponse(res, 400, false, messages.join(', '));
      }

      // Handle duplicate key errors
      if (error.code === 11000) {
        return createResponse(res, 409, false, 'An expense with similar details already exists');
      }

      return createResponse(res, 500, false, error.message || 'Failed to create expense');
    }
  }

  // Get all expenses with filters and pagination
  async getAllExpenses(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        branchId,
        expenseType,
        status,
        paidType,
        startDate,
        endDate,
        sortBy = 'expenseDate',
        sortOrder = 'desc'
      } = req.query;

      // Build filter object
      const filter = {
        pgId: req.user.pgId,
        isActive: true
      };

      if (branchId) filter.branchId = branchId;
      if (expenseType) filter.expenseType = expenseType;
      if (status) filter.status = status;
      if (paidType) filter.paidType = paidType;

      // Date range filter
      if (startDate || endDate) {
        filter.expenseDate = {};
        if (startDate) filter.expenseDate.$gte = new Date(startDate);
        if (endDate) filter.expenseDate.$lte = new Date(endDate);
      }

      // Sorting
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortOptions,
        populate: [
          { path: 'branchId', select: 'name address' },
          { path: 'paidBy', select: 'firstName lastName email' },
          { path: 'approvedBy', select: 'firstName lastName email' }
        ]
      };

      const result = await Expense.paginate(filter, options);

      return createResponse(res, 200, true, 'Expenses retrieved successfully', {
        expenses: result.docs,
        pagination: {
          total: result.totalDocs,
          page: result.page,
          pages: result.totalPages,
          limit: result.limit,
          hasNext: result.hasNextPage,
          hasPrev: result.hasPrevPage
        }
      });
    } catch (error) {
      console.error('Error getting expenses:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get expenses');
    }
  }

  // Get expense by ID
  async getExpenseById(req, res) {
    try {
      const { expenseId } = req.params;

      const expense = await Expense.findOne({
        _id: expenseId,
        pgId: req.user.pgId,
        isActive: true
      }).populate([
        { path: 'branchId', select: 'name address' },
        { path: 'paidBy', select: 'firstName lastName email' },
        { path: 'approvedBy', select: 'firstName lastName email' }
      ]);

      if (!expense) {
        return createResponse(res, 404, false, 'Expense not found');
      }

      return createResponse(res, 200, true, 'Expense retrieved successfully', expense);
    } catch (error) {
      console.error('Error getting expense:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get expense');
    }
  }

  // Update expense
  async updateExpense(req, res) {
    try {
      const { expenseId } = req.params;
      const updateData = req.body;
      const receiptImage = req.file;

      // Find and validate expense ownership
      const expense = await Expense.findOne({
        _id: expenseId,
        pgId: req.user.pgId,
        isActive: true
      });

      if (!expense) {
        return createResponse(res, 404, false, 'Expense not found');
      }

      // Validate branch if being updated
      if (updateData.branchId) {
        const branch = await Branch.findOne({
          _id: updateData.branchId,
          pgId: req.user.pgId,
          isActive: true
        });

        if (!branch) {
          return createResponse(res, 404, false, 'Branch not found or access denied');
        }
      }

      // Prepare update data
      const sanitizedData = {
        ...updateData,
        expenseName: updateData.expenseName?.trim(),
        purpose: updateData.purpose?.trim(),
        notes: updateData.notes?.trim(),
        tags: updateData.tags ? updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined,
        amount: updateData.amount ? parseFloat(updateData.amount) : undefined,
        expenseDate: updateData.expenseDate ? new Date(updateData.expenseDate) : undefined
      };

      // Remove undefined values
      Object.keys(sanitizedData).forEach(key => {
        if (sanitizedData[key] === undefined) {
          delete sanitizedData[key];
        }
      });

      // Handle receipt image
      if (receiptImage) {
        // Delete old image if exists
        if (expense.receiptImage?.filePath) {
          try {
            fs.unlinkSync(expense.receiptImage.filePath);
          } catch (fileError) {
            console.warn('Failed to delete old receipt image:', fileError);
          }
        }

        sanitizedData.receiptImage = {
          fileName: receiptImage.filename,
          originalName: receiptImage.originalname,
          filePath: receiptImage.path,
          fileSize: receiptImage.size,
          mimeType: receiptImage.mimetype
        };
      }

      // Update expense
      Object.assign(expense, sanitizedData);
      await expense.save();

      // Populate updated expense
      await expense.populate([
        { path: 'branchId', select: 'name address' },
        { path: 'paidBy', select: 'firstName lastName email' },
        { path: 'approvedBy', select: 'firstName lastName email' }
      ]);

      // Record activity
      try {
        await activityService.recordActivity({
          type: 'expense_updated',
          title: 'Expense Updated',
          description: `Expense "${expense.expenseName}" updated`,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'expense',
          entityId: expense._id,
          category: 'finance',
          priority: 'normal',
          status: 'success'
        });
      } catch (activityError) {
        console.warn('Failed to record activity:', activityError);
      }

      return createResponse(res, 200, true, 'Expense updated successfully', expense);
    } catch (error) {
      console.error('Error updating expense:', error);

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return createResponse(res, 400, false, messages.join(', '));
      }

      return createResponse(res, 500, false, error.message || 'Failed to update expense');
    }
  }

  // Delete expense (soft delete)
  async deleteExpense(req, res) {
    try {
      const { expenseId } = req.params;

      const expense = await Expense.findOne({
        _id: expenseId,
        pgId: req.user.pgId,
        isActive: true
      });

      if (!expense) {
        return createResponse(res, 404, false, 'Expense not found');
      }

      // Soft delete
      expense.isActive = false;
      await expense.save();

      // Delete receipt image if exists
      if (expense.receiptImage?.filePath) {
        try {
          fs.unlinkSync(expense.receiptImage.filePath);
        } catch (fileError) {
          console.warn('Failed to delete receipt image:', fileError);
        }
      }

      // Record activity
      try {
        await activityService.recordActivity({
          type: 'expense_deleted',
          title: 'Expense Deleted',
          description: `Expense "${expense.expenseName}" deleted`,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'expense',
          entityId: expense._id,
          category: 'finance',
          priority: 'normal',
          status: 'success'
        });
      } catch (activityError) {
        console.warn('Failed to record activity:', activityError);
      }

      return createResponse(res, 200, true, 'Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      return createResponse(res, 500, false, error.message || 'Failed to delete expense');
    }
  }

  // Approve expense
  async approveExpense(req, res) {
    try {
      const { expenseId } = req.params;

      const expense = await Expense.findOne({
        _id: expenseId,
        pgId: req.user.pgId,
        isActive: true
      });

      if (!expense) {
        return createResponse(res, 404, false, 'Expense not found');
      }

      if (expense.status !== 'pending') {
        return createResponse(res, 400, false, 'Expense is not in pending status');
      }

      expense.status = 'approved';
      expense.approvedBy = req.user._id;
      expense.approvedAt = new Date();
      await expense.save();

      await expense.populate([
        { path: 'branchId', select: 'name address' },
        { path: 'paidBy', select: 'firstName lastName email' },
        { path: 'approvedBy', select: 'firstName lastName email' }
      ]);

      // Record activity
      try {
        await activityService.recordActivity({
          type: 'expense_approved',
          title: 'Expense Approved',
          description: `Expense "${expense.expenseName}" approved`,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'expense',
          entityId: expense._id,
          category: 'finance',
          priority: 'normal',
          status: 'success'
        });
      } catch (activityError) {
        console.warn('Failed to record activity:', activityError);
      }

      return createResponse(res, 200, true, 'Expense approved successfully', expense);
    } catch (error) {
      console.error('Error approving expense:', error);
      return createResponse(res, 500, false, error.message || 'Failed to approve expense');
    }
  }

  // Mark expense as paid
  async markExpenseAsPaid(req, res) {
    try {
      const { expenseId } = req.params;
      const { paymentMethod, transactionId, paymentDate, notes } = req.body;

      const expense = await Expense.findOne({
        _id: expenseId,
        pgId: req.user.pgId,
        isActive: true
      });

      if (!expense) {
        return createResponse(res, 404, false, 'Expense not found');
      }

      if (expense.status !== 'approved') {
        return createResponse(res, 400, false, 'Expense must be approved before marking as paid');
      }

      // Update payment information
      expense.status = 'paid';
      expense.paidAt = paymentDate ? new Date(paymentDate) : new Date();
      if (paymentMethod) expense.paymentMethod = paymentMethod;
      if (transactionId) expense.transactionId = transactionId;
      if (notes) expense.notes = (expense.notes ? expense.notes + '\n' : '') + notes;

      await expense.save();

      await expense.populate([
        { path: 'branchId', select: 'name address' },
        { path: 'paidBy', select: 'firstName lastName email' },
        { path: 'approvedBy', select: 'firstName lastName email' }
      ]);

      // Record activity
      try {
        let description = `Expense "${expense.expenseName}" marked as paid`;
        if (paymentMethod) {
          description += ` via ${paymentMethod}`;
        }
        if (transactionId) {
          description += ` (Transaction: ${transactionId})`;
        }

        await activityService.recordActivity({
          type: 'expense_paid',
          title: 'Expense Marked as Paid',
          description,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'expense',
          entityId: expense._id,
          category: 'finance',
          priority: 'normal',
          status: 'success'
        });
      } catch (activityError) {
        console.warn('Failed to record activity:', activityError);
      }

      return createResponse(res, 200, true, 'Expense marked as paid successfully', expense);
    } catch (error) {
      console.error('Error marking expense as paid:', error);
      return createResponse(res, 500, false, error.message || 'Failed to mark expense as paid');
    }
  }

  // Get expense statistics
  async getExpenseStats(req, res) {
    try {
      const { branchId, startDate, endDate } = req.query;

      const filters = {};
      if (branchId) filters.branchId = branchId;
      if (startDate || endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }

      const stats = await Expense.getExpenseStats(req.user.pgId, filters);

      return createResponse(res, 200, true, 'Expense statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Error getting expense stats:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get expense statistics');
    }
  }

  // Get expense analytics
  async getExpenseAnalytics(req, res) {
    try {
      const { year = new Date().getFullYear(), branchId } = req.query;

      const filters = {};
      if (branchId) filters.branchId = branchId;

      const [monthlyAnalytics, topCategories] = await Promise.all([
        Expense.getMonthlyAnalytics(req.user.pgId, parseInt(year), filters),
        Expense.getTopSpendingCategories(req.user.pgId, 5, {
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`
        })
      ]);

      return createResponse(res, 200, true, 'Expense analytics retrieved successfully', {
        monthlyAnalytics,
        topCategories,
        year: parseInt(year)
      });
    } catch (error) {
      console.error('Error getting expense analytics:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get expense analytics');
    }
  }

  // Get expense types for dropdown
  async getExpenseTypes(req, res) {
    try {
      const expenseTypes = [
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'utilities', label: 'Utilities' },
        { value: 'housekeeping', label: 'Housekeeping' },
        { value: 'security', label: 'Security' },
        { value: 'food', label: 'Food' },
        { value: 'transportation', label: 'Transportation' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'office_supplies', label: 'Office Supplies' },
        { value: 'repairs', label: 'Repairs' },
        { value: 'insurance', label: 'Insurance' },
        { value: 'legal', label: 'Legal' },
        { value: 'other', label: 'Other' }
      ];

      return createResponse(res, 200, true, 'Expense types retrieved successfully', expenseTypes);
    } catch (error) {
      console.error('Error getting expense types:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get expense types');
    }
  }

  // Middleware for handling file uploads
  uploadReceipt = upload.single('receiptImage');
}

module.exports = new ExpenseController();
