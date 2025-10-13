const express = require('express');
const mongoose = require('mongoose');
const SalesController = require('../controllers/sales.controller');
const {
  authenticate,
  authorize,
  optionalAuthenticate
} = require('../middleware/auth.middleware');
const rbacMiddleware = require('../middleware/rbac.middleware');

const router = express.Router();

// Comprehensive logging middleware for all sales routes
router.use((req, res, next) => {
  console.group('🔍 Sales Route Middleware');
  console.log('Detailed Request Information:', {
    method: req.method,
    fullPath: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path,
    headers: {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type']
    },
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    query: req.query,
    body: req.method !== 'GET' ? req.body : 'N/A'
  });
  console.groupEnd();
  next();
});

// Enhanced logging middleware for sales routes
const logSalesRoute = (req, res, next) => {
  const logDetails = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    headers: {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type']
    },
    body: req.method !== 'GET' ? req.body : 'N/A',
    user: req.user ? {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    } : 'Unauthenticated',
    environment: process.env.NODE_ENV
  };

  console.group('🔍 Sales Route Called');
  console.log(JSON.stringify(logDetails, null, 2));
  console.groupEnd();

  next();
};

// Removed development fallback authentication - using proper authentication now

// Comprehensive error handling middleware
const salesErrorHandler = (err, req, res, next) => {
  const errorDetails = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    requestBody: req.method !== 'GET' ? req.body : undefined,
    user: req.user ? {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    } : 'Unauthenticated'
  };

  console.group('❌ Sales Route Error');
  console.error(JSON.stringify(errorDetails, null, 2));
  console.groupEnd();

  res.status(err.status || 500).json({
    success: false,
    error: 'Sales Route Error',
    message: err.message || 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
  });
};

// Removed development authentication - using proper authentication now

// Comprehensive debug route
router.get('/debug', (req, res) => {
  const debugInfo = {
    message: 'Sales routes are fully operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    availableRoutes: [
      { 
        path: '/staff', 
        methods: ['GET', 'POST'], 
        requiredRoles: ['superadmin', 'sales'],
        description: 'Manage sales staff'
      },
      { 
        path: '/staff/:id', 
        methods: ['GET', 'PUT', 'DELETE'], 
        requiredRoles: ['superadmin', 'sales'],
        description: 'Manage individual sales staff member'
      }
    ],
    authenticationInfo: {
      developmentMode: process.env.NODE_ENV === 'development',
      requiredMiddleware: ['authenticate', 'authorize']
    }
  };

  console.group('🔍 Sales Routes Debug');
  console.log(JSON.stringify(debugInfo, null, 2));
  console.groupEnd();

  res.status(200).json(debugInfo);
});

// Authentication middleware for sales staff management (superadmin and sales managers)
const salesStaffAuth = async (req, res, next) => {
  try {
    console.log('🔐 Sales Staff Management Authentication');

    // Use proper authentication - no development bypass
    await authenticate(req, res, () => {
      // Authorize superadmin and sales managers for sales staff management
      authorize('superadmin', 'sales_manager')(req, res, next);
    });
  } catch (error) {
    console.log('🚨 Sales Staff Auth Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      details: error.message
    });
  }
};

// Authentication middleware for sales users (managers and staff)
const salesUserAuth = async (req, res, next) => {
  try {
    console.log('🔐 Sales User Authentication');

    // Use proper authentication
    await authenticate(req, res, () => {
      // Authorize sales managers and sub-sales staff
      authorize('sales_manager', 'sub_sales')(req, res, next);
    });
  } catch (error) {
    console.log('🚨 Sales User Auth Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      details: error.message
    });
  }
};

// Create sales staff route
router.post('/staff',
  salesStaffAuth,
  (req, res, next) => {
    console.log('🚀 Sales Staff Creation Attempt:', {
      body: req.body,
      user: req.user
    });
    next();
  },
  SalesController.createSalesStaff
);

// Get all sales staff route
router.get('/staff',
  salesStaffAuth,
  (req, res, next) => {
    console.log('🔍 Fetching Sales Staff:', {
      query: req.query,
      user: req.user
    });
    next();
  },
  SalesController.getAllSalesStaff
);

// Get specific sales staff details route
router.get('/staff/:id',
  salesStaffAuth,
  (req, res, next) => {
    console.log('🔍 Fetching Sales Staff Details:', {
      staffId: req.params.id,
      user: req.user
    });
    next();
  },
  SalesController.getSalesStaffDetails
);

// Update sales staff route
router.put('/staff/:id',
  salesStaffAuth,
  (req, res, next) => {
    console.log('🔄 Updating Sales Staff:', {
      staffId: req.params.id,
      body: req.body,
      user: req.user
    });
    next();
  },
  SalesController.updateSalesStaff
);

// Delete sales staff route
router.delete('/staff/:id',
  salesStaffAuth,
  (req, res, next) => {
    console.log('🗑️ Deleting Sales Staff:', {
      staffId: req.params.id,
      user: req.user
    });
    next();
  },
  SalesController.deleteSalesStaff
);

// Get dashboard data for sales users
router.get('/dashboard',
  salesUserAuth,
  SalesController.getDashboardData
);

// Get performance analytics for sales users
router.get('/performance',
  salesUserAuth,
  SalesController.getPerformanceAnalytics
);

// Get detailed sales reports for sales users
router.get('/reports',
  salesUserAuth,
  SalesController.getSalesReports
);

// Change password for sales users
router.put('/change-password',
  salesUserAuth,
  SalesController.changePassword
);

// Update profile for sales users
router.put('/profile',
  salesUserAuth,
  SalesController.updateProfile
);

// Get profile for sales users
router.get('/profile',
  salesUserAuth,
  SalesController.getProfile
);

// Get team PGs for sales managers
router.get('/team/pgs',
  salesUserAuth,
  SalesController.getTeamPGs
);

// Get my PGs for sub-sales staff
router.get('/my-pgs',
  salesUserAuth,
  SalesController.getMyPGs
);

// Get financial data for sub-sales staff
router.get('/my-financials',
  salesUserAuth,
  SalesController.getMyFinancials
);

// Sales Analytics Route
router.get('/analytics', 
  authenticate,
  rbacMiddleware.checkPermission('sales', 'analytics', 'read'),
  SalesController.getSalesAnalytics
);

// Add error handling middleware
router.use(salesErrorHandler);

module.exports = router;
