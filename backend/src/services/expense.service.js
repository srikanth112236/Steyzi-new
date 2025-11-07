const Expense = require('../models/expense.model');
const User = require('../models/user.model');

class ExpenseService {
  /**
   * Create a new expense
   */
  async createExpense(expenseData, userId) {
    try {
      // Validate required fields
      if (!expenseData.description || expenseData.description.trim() === '') {
        return {
          success: false,
          message: 'Expense description is required',
          statusCode: 400
        };
      }

      if (!expenseData.amount || expenseData.amount <= 0) {
        return {
          success: false,
          message: 'Expense amount is required and must be greater than 0',
          statusCode: 400
        };
      }

      if (!expenseData.type || expenseData.type.trim() === '') {
        return {
          success: false,
          message: 'Expense type is required',
          statusCode: 400
        };
      }

      // Validate expense type against enum values
      const validTypes = ['server', 'maintenance', 'office', 'utilities', 'marketing', 'software', 'hardware', 'travel', 'miscellaneous'];
      const expenseType = expenseData.type.trim().toLowerCase();
      if (!validTypes.includes(expenseType)) {
        return {
          success: false,
          message: `Invalid expense type. Valid types are: ${validTypes.join(', ')}`,
          statusCode: 400
        };
      }

      // Validate and parse date
      if (!expenseData.date) {
        return {
          success: false,
          message: 'Expense date is required',
          statusCode: 400
        };
      }

      const expenseDate = new Date(expenseData.date);
      if (isNaN(expenseDate.getTime())) {
        return {
          success: false,
          message: 'Invalid date format',
          statusCode: 400
        };
      }

      // Validate date is not in future
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      if (expenseDate > today) {
        return {
          success: false,
          message: 'Expense date cannot be in the future',
          statusCode: 400
        };
      }

      // Get user's pgId for expense association
      const User = require('../models/user.model');
      const user = await User.findById(userId).select('pgId');
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      // Prepare expense data with proper field mapping
      const expenseFields = {
        description: expenseData.description.trim(),
        amount: parseFloat(expenseData.amount),
        type: expenseType, // Use validated type
        date: expenseDate,
        createdBy: userId,
        pgId: user.pgId || null // Add pgId from user
      };

      // Add optional fields if provided
      if (expenseData.category) expenseFields.category = expenseData.category;
      if (expenseData.branchId && expenseData.branchId.trim() !== '') {
        expenseFields.branchId = expenseData.branchId;
      }
      if (expenseData.receipt) expenseFields.receipt = expenseData.receipt;
      if (expenseData.notes) expenseFields.notes = expenseData.notes;
      if (expenseData.tags && Array.isArray(expenseData.tags)) {
        expenseFields.tags = expenseData.tags;
      }

      const expense = new Expense(expenseFields);

      await expense.save();
      await expense.populate('createdBy', 'firstName lastName email');
      await expense.populate('branchId', 'name address');

      return {
        success: true,
        message: 'Expense created successfully',
        data: expense,
        statusCode: 201
      };
    } catch (error) {
      console.error('Create expense error:', error);
      return {
        success: false,
        message: 'Failed to create expense',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get all expenses with filters and pagination
   */
  async getAllExpenses(filters = {}, page = 1, limit = 10) {
    try {
      const query = {};

      // Apply filters
      if (filters.type) query.type = filters.type;
      if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) query.date.$gte = new Date(filters.startDate);
        if (filters.endDate) query.date.$lte = new Date(filters.endDate);
      }

      const skip = (page - 1) * limit;

      // Handle sorting
      const sortField = filters.sortBy || 'date';
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
      const sortOptions = { [sortField]: sortOrder };
      // Add createdAt as secondary sort for consistent ordering
      if (sortField !== 'createdAt') {
        sortOptions.createdAt = -1;
      }

      const [expenses, total] = await Promise.all([
        Expense.find(query)
          .populate('createdBy', 'firstName lastName email')
          .populate('branchId', 'name address')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit),
        Expense.countDocuments(query)
      ]);

      return {
        success: true,
        data: expenses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Get expenses error:', error);
      return {
        success: false,
        message: 'Failed to fetch expenses',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(expenseId) {
    try {
      const expense = await Expense.findById(expenseId)
        .populate('createdBy', 'firstName lastName email')
        .populate('branchId', 'name address');

      if (!expense) {
        return {
          success: false,
          message: 'Expense not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: expense,
        statusCode: 200
      };
    } catch (error) {
      console.error('Get expense error:', error);
      return {
        success: false,
        message: 'Failed to fetch expense',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Update expense
   */
  async updateExpense(expenseId, updateData, userId) {
    try {
      const expense = await Expense.findById(expenseId);

      if (!expense) {
        return {
          success: false,
          message: 'Expense not found',
          statusCode: 404
        };
      }

      // Validate date is not in future
      if (updateData.date) {
        const expenseDate = new Date(updateData.date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (expenseDate > today) {
          return {
            success: false,
            message: 'Expense date cannot be in the future',
            statusCode: 400
          };
        }
        updateData.date = expenseDate;
      }

      Object.assign(expense, updateData);
      await expense.save();
      await expense.populate('createdBy', 'firstName lastName email');
      await expense.populate('branchId', 'name address');

      return {
        success: true,
        message: 'Expense updated successfully',
        data: expense,
        statusCode: 200
      };
    } catch (error) {
      console.error('Update expense error:', error);
      return {
        success: false,
        message: 'Failed to update expense',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Delete expense
   */
  async deleteExpense(expenseId) {
    try {
      const expense = await Expense.findByIdAndDelete(expenseId);

      if (!expense) {
        return {
          success: false,
          message: 'Expense not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        message: 'Expense deleted successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Delete expense error:', error);
      return {
        success: false,
        message: 'Failed to delete expense',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get expense statistics
   */
  async getExpenseStatistics() {
    try {
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Total expenses
      const totalExpensesResult = await Expense.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 }
          }
        }
      ]);

      // Current month expenses
      const currentMonthResult = await Expense.aggregate([
        {
          $match: {
            date: { $gte: startOfCurrentMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 }
          }
        }
      ]);

      // Last month expenses
      const lastMonthResult = await Expense.aggregate([
        {
          $match: {
            date: {
              $gte: startOfLastMonth,
              $lte: endOfLastMonth
            }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 }
          }
        }
      ]);

      // Expenses by type
      const expensesByType = await Expense.aggregate([
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { totalAmount: -1 }
        }
      ]);

      // Monthly trend (last 12 months)
      const monthlyTrend = await Expense.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(now.getFullYear(), now.getMonth() - 12, 1)
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      return {
        success: true,
        data: {
          total: {
            amount: totalExpensesResult[0]?.totalAmount || 0,
            count: totalExpensesResult[0]?.totalCount || 0
          },
          currentMonth: {
            amount: currentMonthResult[0]?.totalAmount || 0,
            count: currentMonthResult[0]?.totalCount || 0
          },
          lastMonth: {
            amount: lastMonthResult[0]?.totalAmount || 0,
            count: lastMonthResult[0]?.totalCount || 0
          },
          byType: expensesByType,
          monthlyTrend: monthlyTrend.map(item => ({
            month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            amount: item.totalAmount,
            count: item.count
          }))
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Get expense statistics error:', error);
      return {
        success: false,
        message: 'Failed to fetch expense statistics',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get expenses for a specific month
   */
  async getExpensesForMonth(year, month) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      endDate.setHours(23, 59, 59, 999);

      const expenses = await Expense.find({
        date: {
          $gte: startDate,
          $lte: endDate
        }
      })
        .populate('createdBy', 'firstName lastName email')
        .sort({ date: -1 });

      const summary = await Expense.aggregate([
        {
          $match: {
            date: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        success: true,
        data: {
          expenses,
          summary
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Get expenses for month error:', error);
      return {
        success: false,
        message: 'Failed to fetch monthly expenses',
        error: error.message,
        statusCode: 500
      };
    }
  }
}

module.exports = new ExpenseService();

