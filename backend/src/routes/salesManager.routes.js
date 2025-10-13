const express = require('express');
const SalesManagerController = require('../controllers/salesManager.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { 
  validateSalesManagerCreation, 
  validateSalesManagerUpdate 
} = require('../middleware/validation.middleware');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Routes for superadmin only
router.post('/',
  authorize('superadmin'),
  validateSalesManagerCreation,
  SalesManagerController.createSalesManager
);

router.get('/',
  authorize('superadmin'),
  SalesManagerController.getAllSalesManagers
);

router.get('/:id/performance',
  authorize('superadmin'),
  SalesManagerController.getSalesManagerPerformance
);

router.put('/:id',
  authorize('superadmin'),
  validateSalesManagerUpdate,
  SalesManagerController.updateSalesManager
);

router.delete('/:id',
  authorize('superadmin'),
  SalesManagerController.deleteSalesManager
);

router.post('/:id/reset-password',
  authorize('superadmin'),
  SalesManagerController.resetPassword
);

// Routes that sales users (managers and sub-sales) can access for themselves
router.put('/:id/change-password',
  authorize('sales_manager', 'sub_sales'),
  SalesManagerController.changePassword
);

router.get('/:id/needs-password-change',
  authorize('sales_manager', 'sub_sales'),
  SalesManagerController.needsPasswordChange
);

module.exports = router;
