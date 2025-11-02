const Salary = require('../models/salary.model');
const Maintainer = require('../models/maintainer.model');
const Branch = require('../models/branch.model');
const { createResponse } = require('../utils/response');
const activityService = require('../services/activity.service');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for receipt image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/salaries');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'salary-' + uniqueSuffix + path.extname(file.originalname));
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

class SalaryController {
  // Create or update salary record
  async createOrUpdateSalary(req, res) {
    try {
      const {
        maintainerId,
        branchId,
        month,
        year,
        baseSalary,
        allowances,
        deductions,
        bonus,
        overtime,
        paymentMethod,
        transactionId,
        notes
      } = req.body;

      const receiptImage = req.file;

      // Validate required fields
      if (!maintainerId || !branchId || !month || !year || !baseSalary) {
        return createResponse(res, 400, false, 'All required fields must be provided');
      }

      // Validate maintainer belongs to user's PG
      const maintainer = await Maintainer.findOne({
        _id: maintainerId,
        pgId: req.user.pgId
      }).populate('user', 'firstName lastName email');

      if (!maintainer) {
        return createResponse(res, 404, false, 'Maintainer not found or access denied');
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

      // Check if salary record already exists for this maintainer, month, and year
      const existingSalary = await Salary.findOne({
        maintainerId,
        month,
        year: parseInt(year),
        isActive: true
      });

      // Prepare salary data
      const salaryData = {
        maintainerId,
        pgId: req.user.pgId,
        branchId,
        month,
        year: parseInt(year),
        baseSalary: parseFloat(baseSalary),
        deductions: {
          other: parseFloat(deductions?.other || 0)
        },
        bonus: parseFloat(bonus || 0),
        overtime: {
          hours: parseFloat(overtime?.hours || 0),
          rate: parseFloat(overtime?.rate || 0),
          amount: parseFloat(overtime?.amount || (overtime?.hours || 0) * (overtime?.rate || 0))
        },
        paymentMethod: paymentMethod || 'cash',
        transactionId: transactionId?.trim(),
        notes: notes?.trim(),
        paidBy: req.user._id
      };

      // Handle receipt image
      if (receiptImage) {
        salaryData.receiptImage = {
          fileName: receiptImage.filename,
          originalName: receiptImage.originalname,
          filePath: receiptImage.path,
          fileSize: receiptImage.size,
          mimeType: receiptImage.mimetype
        };
      }

      let salary;
      if (existingSalary) {
        // Update existing salary
        Object.assign(existingSalary, salaryData);
        salary = await existingSalary.save();
      } else {
        // Create new salary
        salary = new Salary(salaryData);
        await salary.save();
      }

      // Populate salary information
      await salary.populate([
        { path: 'maintainerId', populate: { path: 'user', select: 'firstName lastName email phone' } },
        { path: 'branchId', select: 'name address' },
        { path: 'paidBy', select: 'firstName lastName email' }
      ]);

      // Record activity
      try {
        await activityService.recordActivity({
          type: existingSalary ? 'salary_updated' : 'salary_created',
          title: existingSalary ? 'Salary Updated' : 'Salary Created',
          description: `Salary ${existingSalary ? 'updated' : 'created'} for ${maintainer.user.firstName} ${maintainer.user.lastName} - ${month} ${year}`,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'salary',
          entityId: salary._id,
          category: 'finance',
          priority: 'normal',
          status: 'success'
        });
      } catch (activityError) {
        console.warn('Failed to record activity:', activityError);
      }

      return createResponse(res, 201, true, `Salary ${existingSalary ? 'updated' : 'created'} successfully`, salary);
    } catch (error) {
      console.error('Error creating/updating salary:', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return createResponse(res, 400, false, messages.join(', '));
      }

      // Handle duplicate key errors
      if (error.code === 11000) {
        return createResponse(res, 409, false, 'Salary record already exists for this maintainer in the selected month and year');
      }

      return createResponse(res, 500, false, error.message || 'Failed to create/update salary');
    }
  }

  // Get all salaries with filters and pagination
  async getAllSalaries(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        maintainerId,
        branchId,
        month,
        year,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build filter object
      const filter = {
        pgId: req.user.pgId,
        isActive: true
      };

      if (maintainerId) filter.maintainerId = maintainerId;
      if (branchId) filter.branchId = branchId;
      if (month) filter.month = month;
      if (year) filter.year = parseInt(year);
      if (status) filter.status = status;

      // Sorting
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortOptions,
        populate: [
          { path: 'maintainerId', populate: { path: 'user', select: 'firstName lastName email phone' } },
          { path: 'branchId', select: 'name address' },
          { path: 'paidBy', select: 'firstName lastName email' }
        ]
      };

      const result = await Salary.paginate(filter, options);

      return createResponse(res, 200, true, 'Salaries retrieved successfully', {
        salaries: result.docs,
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
      console.error('Error getting salaries:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get salaries');
    }
  }

  // Get salary by ID
  async getSalaryById(req, res) {
    try {
      const { salaryId } = req.params;

      const salary = await Salary.findOne({
        _id: salaryId,
        pgId: req.user.pgId,
        isActive: true
      }).populate([
        { path: 'maintainerId', populate: { path: 'user', select: 'firstName lastName email phone' } },
        { path: 'branchId', select: 'name address' },
        { path: 'paidBy', select: 'firstName lastName email' }
      ]);

      if (!salary) {
        return createResponse(res, 404, false, 'Salary record not found');
      }

      return createResponse(res, 200, true, 'Salary record retrieved successfully', salary);
    } catch (error) {
      console.error('Error getting salary:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get salary record');
    }
  }

  // Update salary
  async updateSalary(req, res) {
    try {
      const { salaryId } = req.params;
      const updateData = req.body;
      const receiptImage = req.file;

      // Find and validate salary ownership
      const salary = await Salary.findOne({
        _id: salaryId,
        pgId: req.user.pgId,
        isActive: true
      });

      if (!salary) {
        return createResponse(res, 404, false, 'Salary record not found');
      }

      // Validate maintainer if being updated
      if (updateData.maintainerId) {
        const maintainer = await Maintainer.findOne({
          _id: updateData.maintainerId,
          pgId: req.user.pgId
        });

        if (!maintainer) {
          return createResponse(res, 404, false, 'Maintainer not found or access denied');
        }
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
        baseSalary: updateData.baseSalary ? parseFloat(updateData.baseSalary) : undefined,
        bonus: updateData.bonus ? parseFloat(updateData.bonus) : undefined,
        notes: updateData.notes?.trim(),
        transactionId: updateData.transactionId?.trim(),
        paymentMethod: updateData.paymentMethod || undefined
      };

      // Handle deductions
      if (updateData.deductions) {
        sanitizedData.deductions = {
          other: parseFloat(updateData.deductions.other || 0)
        };
      }

      // Handle overtime
      if (updateData.overtime) {
        sanitizedData.overtime = {
          hours: parseFloat(updateData.overtime.hours || 0),
          rate: parseFloat(updateData.overtime.rate || 0),
          amount: parseFloat(updateData.overtime.amount || (updateData.overtime.hours || 0) * (updateData.overtime.rate || 0))
        };
      }

      // Handle receipt image
      if (receiptImage) {
        // Delete old image if exists
        if (salary.receiptImage?.filePath) {
          try {
            fs.unlinkSync(salary.receiptImage.filePath);
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

      // Remove undefined values
      Object.keys(sanitizedData).forEach(key => {
        if (sanitizedData[key] === undefined) {
          delete sanitizedData[key];
        }
      });

      // Update salary
      Object.assign(salary, sanitizedData);
      await salary.save();

      // Populate updated salary
      await salary.populate([
        { path: 'maintainerId', populate: { path: 'user', select: 'firstName lastName email phone' } },
        { path: 'branchId', select: 'name address' },
        { path: 'paidBy', select: 'firstName lastName email' }
      ]);

      // Record activity
      try {
        await activityService.recordActivity({
          type: 'salary_updated',
          title: 'Salary Updated',
          description: `Salary record updated for ${salary.maintainerId.user.firstName} ${salary.maintainerId.user.lastName}`,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'salary',
          entityId: salary._id,
          category: 'finance',
          priority: 'normal',
          status: 'success'
        });
      } catch (activityError) {
        console.warn('Failed to record activity:', activityError);
      }

      return createResponse(res, 200, true, 'Salary updated successfully', salary);
    } catch (error) {
      console.error('Error updating salary:', error);

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return createResponse(res, 400, false, messages.join(', '));
      }

      return createResponse(res, 500, false, error.message || 'Failed to update salary');
    }
  }

  // Delete salary (soft delete)
  async deleteSalary(req, res) {
    try {
      const { salaryId } = req.params;

      const salary = await Salary.findOne({
        _id: salaryId,
        pgId: req.user.pgId,
        isActive: true
      });

      if (!salary) {
        return createResponse(res, 404, false, 'Salary record not found');
      }

      // Soft delete
      salary.isActive = false;
      await salary.save();

      // Delete receipt image if exists
      if (salary.receiptImage?.filePath) {
        try {
          fs.unlinkSync(salary.receiptImage.filePath);
        } catch (fileError) {
          console.warn('Failed to delete receipt image:', fileError);
        }
      }

      // Record activity
      try {
        await activityService.recordActivity({
          type: 'salary_deleted',
          title: 'Salary Deleted',
          description: `Salary record deleted for ${salary.maintainerId.user?.firstName || 'Unknown'} ${salary.maintainerId.user?.lastName || 'Maintainer'}`,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'salary',
          entityId: salary._id,
          category: 'finance',
          priority: 'normal',
          status: 'success'
        });
      } catch (activityError) {
        console.warn('Failed to record activity:', activityError);
      }

      return createResponse(res, 200, true, 'Salary record deleted successfully');
    } catch (error) {
      console.error('Error deleting salary:', error);
      return createResponse(res, 500, false, error.message || 'Failed to delete salary record');
    }
  }

  // Process salary payment
  async processSalaryPayment(req, res) {
    try {
      const { salaryId } = req.params;
      const { paymentAmount, paymentMethod, transactionId, notes } = req.body;
      const receiptImage = req.file;

      // Find and validate salary
      const salary = await Salary.findOne({
        _id: salaryId,
        pgId: req.user.pgId,
        isActive: true
      });

      if (!salary) {
        return createResponse(res, 404, false, 'Salary record not found');
      }

      if (salary.status === 'paid') {
        return createResponse(res, 400, false, 'Salary is already fully paid');
      }

      const paidAmount = parseFloat(paymentAmount || 0);
      if (paidAmount <= 0) {
        return createResponse(res, 400, false, 'Payment amount must be greater than 0');
      }

      // Update payment information
      salary.paidAmount = (salary.paidAmount || 0) + paidAmount;
      salary.paymentMethod = paymentMethod || salary.paymentMethod;
      salary.transactionId = transactionId || salary.transactionId;
      salary.paymentDate = new Date();
      salary.paidAt = new Date();
      salary.notes = notes || salary.notes;

      // Handle receipt image
      if (receiptImage) {
        // Delete old image if exists
        if (salary.receiptImage?.filePath) {
          try {
            fs.unlinkSync(salary.receiptImage.filePath);
          } catch (fileError) {
            console.warn('Failed to delete old receipt image:', fileError);
          }
        }

        salary.receiptImage = {
          fileName: receiptImage.filename,
          originalName: receiptImage.originalname,
          filePath: receiptImage.path,
          fileSize: receiptImage.size,
          mimeType: receiptImage.mimetype
        };
      }

      // Update payment status
      salary.updatePaymentStatus();
      await salary.save();

      // Populate salary information
      await salary.populate([
        { path: 'maintainerId', populate: { path: 'user', select: 'firstName lastName email phone' } },
        { path: 'branchId', select: 'name address' },
        { path: 'paidBy', select: 'firstName lastName email' }
      ]);

      // Record activity
      try {
        await activityService.recordActivity({
          type: 'salary_payment',
          title: 'Salary Payment Processed',
          description: `Salary payment of ₹${paidAmount} processed for ${salary.maintainerId.user.firstName} ${salary.maintainerId.user.lastName}`,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'salary',
          entityId: salary._id,
          category: 'finance',
          priority: 'high',
          status: 'success'
        });
      } catch (activityError) {
        console.warn('Failed to record activity:', activityError);
      }

      return createResponse(res, 200, true, 'Salary payment processed successfully', salary);
    } catch (error) {
      console.error('Error processing salary payment:', error);
      return createResponse(res, 500, false, error.message || 'Failed to process salary payment');
    }
  }

  // Get salary statistics
  async getSalaryStats(req, res) {
    try {
      const { branchId, month, year } = req.query;

      const filters = {};
      if (branchId) filters.branchId = branchId;
      if (month) filters.month = month;
      if (year) filters.year = parseInt(year);

      const stats = await Salary.getSalaryStats(req.user.pgId, filters);

      return createResponse(res, 200, true, 'Salary statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Error getting salary stats:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get salary statistics');
    }
  }

  // Get salary analytics
  async getSalaryAnalytics(req, res) {
    try {
      const { year = new Date().getFullYear(), branchId } = req.query;

      const filters = {};
      if (branchId) filters.branchId = branchId;

      const monthlyTrends = await Salary.getMonthlySalaryTrends(req.user.pgId, parseInt(year), filters);

      return createResponse(res, 200, true, 'Salary analytics retrieved successfully', {
        monthlyTrends,
        year: parseInt(year)
      });
    } catch (error) {
      console.error('Error getting salary analytics:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get salary analytics');
    }
  }

  // Get maintainer salary summary
  async getMaintainerSalarySummary(req, res) {
    try {
      const { maintainerId } = req.params;
      const { year = new Date().getFullYear() } = req.query;

      // Validate maintainer belongs to user's PG
      const maintainer = await Maintainer.findOne({
        _id: maintainerId,
        pgId: req.user.pgId
      });

      if (!maintainer) {
        return createResponse(res, 404, false, 'Maintainer not found or access denied');
      }

      const summary = await Salary.getMaintainerSalarySummary(maintainerId, { year: parseInt(year) });

      return createResponse(res, 200, true, 'Maintainer salary summary retrieved successfully', {
        maintainer: {
          _id: maintainer._id,
          name: maintainer.user.firstName + ' ' + maintainer.user.lastName,
          email: maintainer.user.email,
          phone: maintainer.user.phone
        },
        summary
      });
    } catch (error) {
      console.error('Error getting maintainer salary summary:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get maintainer salary summary');
    }
  }

  // Get active maintainers for salary management
  async getActiveMaintainers(req, res) {
    try {
      const maintainers = await Maintainer.find({
        pgId: req.user.pgId,
        status: 'active'
      }).populate('user', 'firstName lastName email phone')
        .populate('branches', 'name');

      const formattedMaintainers = maintainers.map(maintainer => ({
        _id: maintainer._id,
        name: maintainer.user.firstName + ' ' + maintainer.user.lastName,
        email: maintainer.user.email,
        phone: maintainer.user.phone,
        specialization: maintainer.specialization,
        branches: maintainer.branches.map(branch => ({
          _id: branch._id,
          name: branch.name
        }))
      }));

      return createResponse(res, 200, true, 'Active maintainers retrieved successfully', formattedMaintainers);
    } catch (error) {
      console.error('Error getting active maintainers:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get active maintainers');
    }
  }

  // Middleware for handling file uploads
  uploadReceipt = upload.single('receiptImage');
}

module.exports = new SalaryController();
