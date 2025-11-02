const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { validateBranchCreation } = require('../middleware/validation.middleware');
const { trackAdminActivity } = require('../middleware/adminActivity.middleware');
const branchController = require('../controllers/branch.controller');
const Branch = require('../models/branch.model'); // Added missing import

// Create a new branch
router.post('/',
  authenticate,
  validateBranchCreation,
  trackAdminActivity(),
  (req, res) => {
    branchController.createBranch(req, res);
  }
);

// Modify the GET '/' route
router.get('/',
  authenticate,
  trackAdminActivity(),
  async (req, res) => {
    try {
      let branches;
      if (req.user.role === 'maintainer') {
        const Maintainer = require('../models/maintainer.model');
        const maintainer = await Maintainer.findById(req.user.maintainerProfile)
          .populate({
            path: 'branches',
            match: { status: 'active' },
            select: 'name address capacity status'
          });

        if (!maintainer) {
          return res.status(404).json({ 
            success: false, 
            message: 'Maintainer profile not found' 
          });
        }

        branches = maintainer.branches || [];
      } else if (req.user.role === 'admin') {
        const pgId = req.user.pgId;
        if (!pgId) {
          return res.status(400).json({ 
            success: false, 
            message: 'No PG associated with this user' 
          });
        }
        branches = await Branch.find({ 
          pgId, 
          status: 'active' 
        });
      } else {
        return res.status(403).json({ 
          success: false, 
          message: 'Unauthorized to view branches' 
        });
      }

      res.status(200).json({
        success: true,
        data: {
          branches,
          branchCount: branches.length,
          userRole: req.user.role
        }
      });
    } catch (error) {
      console.error('Error fetching branches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch branches',
        error: error.message
      });
    }
  });

// Get branches by PG ID
router.get('/pg/:pgId',
  authenticate,
  trackAdminActivity(),
  async (req, res) => {
    try {
      const { pgId } = req.params;

      // Validate PG ID
      if (!pgId) {
        return res.status(400).json({
          success: false,
          message: 'PG ID is required'
        });
      }

      // Find branches for the specific PG
      const branches = await branchController.getBranchesByPG(pgId);

      // Return branches
      return res.status(200).json({
        success: true,
        branches: branches
      });
    } catch (error) {
      console.error('Error fetching branches by PG:', error);
      
      // Handle different types of errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid PG ID',
          error: error.message
        });
      }

      // Generic server error
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch branches',
        error: error.message
      });
    }
  }
);

// Set a branch as default - DISABLED: Only the first branch can be default
router.patch('/:branchId/default', 
  authenticate, 
  async (req, res) => {
    return res.status(403).json({
      success: false,
      message: 'Setting default branch is not allowed. Only the first branch is automatically set as default and cannot be changed.'
    });
  }
);

// Update a branch
router.put('/:branchId',
  authenticate,
  trackAdminActivity(),
  async (req, res) => {
    try {
      const { branchId } = req.params;
      const updateData = req.body;

      // Validate branch ID and update data
      if (!branchId) {
        return res.status(400).json({
          success: false,
          message: 'Branch ID is required'
        });
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Update data is required'
        });
      }

      // Update branch
      const updatedBranch = await branchController.updateBranch(branchId, updateData);

      // Return updated branch
      return res.status(200).json({
        success: true,
        branch: updatedBranch
      });
    } catch (error) {
      console.error('Error updating branch:', error);
      
      // Handle different types of errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid branch data',
          error: error.message
        });
      }

      // Generic server error
      return res.status(500).json({
        success: false,
        message: 'Failed to update branch',
        error: error.message
      });
    }
  }
);

// Delete a branch
router.delete('/:branchId',
  authenticate,
  trackAdminActivity(),
  async (req, res) => {
    try {
      const { branchId } = req.params;

      // Validate branch ID
      if (!branchId) {
        return res.status(400).json({
          success: false,
          message: 'Branch ID is required'
        });
      }

      // Delete branch
      const deletionResult = await branchController.deleteBranch(branchId);

      // Return deletion result
      return res.status(200).json({
        success: true,
        message: 'Branch deleted successfully',
        result: deletionResult
      });
    } catch (error) {
      console.error('Error deleting branch:', error);
      
      // Handle different types of errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid Branch ID',
          error: error.message
        });
      }

      // Generic server error
      return res.status(500).json({
        success: false,
        message: 'Failed to delete branch',
        error: error.message
      });
    }
  }
);

// Assign maintainer to a branch
router.post('/assign-maintainer',
  authenticate,
  trackAdminActivity(),
  (req, res) => {
    branchController.assignMaintainerToBranch(req, res);
  }
);

// Get branches with their assigned maintainers
router.get('/with-maintainers',
  authenticate,
  trackAdminActivity(),
  (req, res) => {
    branchController.getBranchesWithMaintainers(req, res);
  }
);

module.exports = router; 