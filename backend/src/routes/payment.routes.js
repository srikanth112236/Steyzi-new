const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate, adminOrSuperadmin } = require('../middleware/auth.middleware');
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
  upload.single('paymentImage'), 
  paymentController.markPaymentAsCompleted
);

// Get payments by resident
router.get('/resident/:residentId', 
  authenticate, 
  adminOrSuperadmin, 
  paymentController.getPaymentsByResident
);

// Get payments by room
router.get('/room/:roomId', 
  authenticate, 
  adminOrSuperadmin, 
  paymentController.getPaymentsByRoom
);

// Get residents by room
router.get('/rooms/:roomId/residents', 
  authenticate, 
  adminOrSuperadmin, 
  paymentController.getResidentsByRoom
);

// Get payment statistics
router.get('/stats/:pgId', 
  authenticate, 
  adminOrSuperadmin, 
  paymentController.getPaymentStats
);

// Get monthly payments
router.get('/monthly/:pgId', 
  authenticate, 
  adminOrSuperadmin, 
  paymentController.getMonthlyPayments
);

// Get all payments with filters
router.get('/', 
  authenticate, 
  adminOrSuperadmin, 
  paymentController.getPayments
);

// Get payment by ID
router.get('/:paymentId', 
  authenticate, 
  adminOrSuperadmin, 
  paymentController.getPaymentById
);

// Update payment
router.put('/:paymentId', 
  authenticate, 
  adminOrSuperadmin, 
  paymentController.updatePayment
);

// Delete payment
router.delete('/:paymentId', 
  authenticate, 
  adminOrSuperadmin, 
  paymentController.deletePayment
);

// Get payment receipt
router.get('/:paymentId/receipt', 
  authenticate, 
  adminOrSuperadmin, 
  paymentController.getPaymentReceipt
);

// Generate payment report
router.get('/report/:pgId', 
  authenticate, 
  adminOrSuperadmin, 
  paymentController.generatePaymentReport
);

module.exports = router; 