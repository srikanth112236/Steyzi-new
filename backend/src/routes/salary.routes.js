const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const salaryController = require('../controllers/salary.controller');

// Logging middleware for salary routes
router.use((req, res, next) => {
  console.log('🔍 Salary Route Request:', {
    method: req.method,
    path: req.path,
    query: req.query,
    headers: {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      'content-type': req.headers['content-type']
    },
    user: req.user ? {
      id: req.user._id,
      role: req.user.role,
      email: req.user.email
    } : 'Not authenticated'
  });
  next();
});

// Get active maintainers for salary management
router.get('/maintainers',
  authenticate,
  authorize('admin', 'superadmin'),
  (req, res) => salaryController.getActiveMaintainers(req, res)
);

// Get salary statistics
router.get('/stats',
  authenticate,
  authorize('admin', 'superadmin'),
  (req, res) => salaryController.getSalaryStats(req, res)
);

// Get salary analytics
router.get('/analytics',
  authenticate,
  authorize('admin', 'superadmin'),
  (req, res) => salaryController.getSalaryAnalytics(req, res)
);

// Get maintainer salary summary
router.get('/maintainer/:maintainerId/summary',
  authenticate,
  authorize('admin', 'superadmin'),
  (req, res) => salaryController.getMaintainerSalarySummary(req, res)
);

// Check if salary can be edited
router.get('/:salaryId/edit-status',
  authenticate,
  authorize('admin', 'superadmin'),
  (req, res) => salaryController.checkSalaryEditStatus(req, res)
);

// Create or update salary record
router.post('/',
  authenticate,
  authorize('admin', 'superadmin'),
  salaryController.uploadReceipt,
  (req, res) => salaryController.createOrUpdateSalary(req, res)
);

// Get all salaries with filters and pagination
router.get('/',
  authenticate,
  authorize('admin', 'superadmin'),
  (req, res) => salaryController.getAllSalaries(req, res)
);

// Get a single salary by ID
router.get('/:salaryId',
  authenticate,
  authorize('admin', 'superadmin'),
  (req, res) => salaryController.getSalaryById(req, res)
);

// Update a salary record
router.put('/:salaryId',
  authenticate,
  authorize('admin', 'superadmin'),
  salaryController.uploadReceipt,
  (req, res) => salaryController.updateSalary(req, res)
);

// Delete a salary record
router.delete('/:salaryId',
  authenticate,
  authorize('admin', 'superadmin'),
  (req, res) => salaryController.deleteSalary(req, res)
);

// Process salary payment
router.patch('/:salaryId/payment',
  authenticate,
  authorize('admin', 'superadmin'),
  salaryController.uploadReceipt,
  (req, res) => salaryController.processSalaryPayment(req, res)
);

module.exports = router;
