const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { validateBranchCreation } = require('../middleware/validation.middleware');
const branchController = require('../controllers/branch.controller');

// Create a new branch
router.post('/',
  authenticate,
  validateBranchCreation,
  (req, res) => {
    branchController.createBranch(req, res);
  }
);

// Get branches for current user's PG (admin only)
router.get('/',
  authenticate,
  async (req, res) => {
    try {
      const pgId = req.user.pgId;

      if (!pgId) {
        return res.status(400).json({
          success: false,
          message: 'No PG associated with this user. Please contact superadmin to assign a PG or complete your PG setup.'
        });
      }

      // Find branches for the current user's PG
      const branches = await branchController.getBranchesByPG(pgId);

      // Add cache control headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      return res.status(200).json({
        success: true,
        data: branches
      });
    } catch (error) {
      console.error('Error fetching branches:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch branches',
        error: error.message
      });
    }
  }
);

// Get branches by PG ID
router.get('/pg/:pgId', 
  authenticate, 
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

// Set a branch as default
router.patch('/:branchId/default', 
  authenticate, 
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

      // Set branch as default
      const updatedBranch = await branchController.setDefaultBranch(branchId);

      // Return updated branch
      return res.status(200).json({
        success: true,
        branch: updatedBranch
      });
    } catch (error) {
      console.error('Error setting default branch:', error);
      
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
        message: 'Failed to set default branch',
        error: error.message
      });
    }
  }
);

// Update a branch
router.put('/:branchId', 
  authenticate, 
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

module.exports = router; 