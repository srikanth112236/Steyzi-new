const express = require('express');
const router = express.Router();
const paymentInfoController = require('../controllers/paymentInfo.controller');
const { authenticate, adminOnly } = require('../middleware/auth.middleware');

// Admin routes (protected)
router.get('/admin/all', 
  authenticate, 
  adminOnly, 
  paymentInfoController.getAllPaymentInfo
);

router.get('/admin/:branchId', 
  authenticate, 
  adminOnly, 
  paymentInfoController.getPaymentInfo
);

// Use PUT for create/update payment info (upsert operation)
router.put('/admin/:branchId', 
  authenticate, 
  adminOnly, 
  paymentInfoController.createOrUpdatePaymentInfo
);

router.delete('/admin/:branchId', 
  authenticate, 
  adminOnly, 
  paymentInfoController.deletePaymentInfo
);

module.exports = router; 