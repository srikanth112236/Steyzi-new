const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate, adminOrSuperadmin } = require('../middleware/auth.middleware');
const { trackAdminActivity } = require('../middleware/adminActivity.middleware');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Mark payment as completed (with image upload)
router.post('/resident/:residentId/mark-paid',
  authenticate,
  adminOrSuperadmin,
  trackAdminActivity(),
  upload.single('paymentImage'),
  paymentController.markPaymentAsCompleted
);

// Get payments by resident
router.get('/resident/:residentId',
  authenticate,
  adminOrSuperadmin,
  trackAdminActivity(),
  paymentController.getPaymentsByResident
);

// Get payments by room
router.get('/room/:roomId',
  authenticate,
  adminOrSuperadmin,
  trackAdminActivity(),
  paymentController.getPaymentsByRoom
);

// Get residents by room
router.get('/rooms/:roomId/residents',
  authenticate,
  adminOrSuperadmin,
  trackAdminActivity(),
  paymentController.getResidentsByRoom
);

// Get payment statistics
router.get('/stats/:pgId',
  authenticate,
  adminOrSuperadmin,
  trackAdminActivity(),
  paymentController.getPaymentStats
);

// Get monthly payments
router.get('/monthly/:pgId',
  authenticate,
  adminOrSuperadmin,
  trackAdminActivity(),
  paymentController.getMonthlyPayments
);

// Get all payments with filters
router.get('/',
  authenticate,
  adminOrSuperadmin,
  trackAdminActivity(),
  paymentController.getPayments
);

// Get payment receipt (must come before /:paymentId to avoid route conflicts)
router.get('/:paymentId/receipt',
  authenticate,
  adminOrSuperadmin,
  trackAdminActivity(),
  paymentController.getPaymentReceipt
);

// Get payment by ID
router.get('/:paymentId',
  authenticate,
  adminOrSuperadmin,
  trackAdminActivity(),
  paymentController.getPaymentById
);

// Update payment
router.put('/:paymentId',
  authenticate,
  adminOrSuperadmin,
  trackAdminActivity(),
  paymentController.updatePayment
);

// Delete payment
router.delete('/:paymentId',
  authenticate,
  adminOrSuperadmin,
  trackAdminActivity(),
  paymentController.deletePayment
);

// Generate payment report
router.get('/report/:pgId',
  authenticate,
  adminOrSuperadmin,
  trackAdminActivity(),
  paymentController.generatePaymentReport
);

module.exports = router; 