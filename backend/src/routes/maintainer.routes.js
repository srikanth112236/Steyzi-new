const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const maintainerController = require('../controllers/maintainer.controller');

// Logging middleware for maintainer routes
router.use((req, res, next) => {
  console.log('🔍 Maintainer Route Request:', {
    method: req.method,
    path: req.path,
    query: req.query,
    headers: {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      cookie: req.headers.cookie ? 'Present' : 'Missing'
    },
    cookies: Object.keys(req.cookies || {}),
    user: req.user ? {
      id: req.user._id,
      role: req.user.role,
      email: req.user.email
    } : 'Not authenticated'
  });
  next();
});

// Create a new maintainer (admin only)
router.post('/', 
  authenticate,
  authorize('admin', 'superadmin'),
  (req, res) => maintainerController.createMaintainer(req, res)
);

// Get all maintainers (admin only)
router.get('/', 
  authenticate,
  authorize('admin', 'superadmin'),
  (req, res) => maintainerController.getAllMaintainers(req, res)
);

// Get a single maintainer by ID (admin only)
router.get('/:id', 
  authenticate,
  authorize('admin', 'superadmin'),
  (req, res) => maintainerController.getMaintainerById(req, res)
);

// Update a maintainer (admin only)
router.put('/:id', 
  authenticate,
  authorize('admin', 'superadmin'),
  (req, res) => maintainerController.updateMaintainer(req, res)
);

// Delete a maintainer (admin only)
router.delete('/:id', 
  authenticate,
  authorize('admin', 'superadmin'),
  (req, res) => maintainerController.deleteMaintainer(req, res)
);

// Assign branches to a maintainer (admin only)
router.post('/assign-branches', 
  authenticate,
  authorize('admin', 'superadmin'),
  (req, res) => maintainerController.assignBranches(req, res)
);

// Remove branches from a maintainer (admin only)
router.post('/remove-branches', 
  authenticate,
  authorize('admin', 'superadmin'),
  (req, res) => maintainerController.removeBranches(req, res)
);

// Get maintainer's assigned branches (maintainer only)
router.get('/my-branches', 
  authenticate,
  authorize('maintainer'),
  (req, res) => maintainerController.getAssignedBranches(req, res)
);

module.exports = router;
