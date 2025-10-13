const Branch = require('../models/branch.model');
const User = require('../models/user.model');
const activityService = require('../services/activity.service');

class BranchController {
  /**
   * Create a new branch
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Created branch
   */
  async createBranch(req, res) {
    try {
      // Validate required fields
      const {
        pgId,
        name,
        address,
        maintainer,
        contact,
        capacity,
        amenities,
        status,
        isDefault
      } = req.body;

      // Validate required fields
      if (!pgId || !name || !address || !maintainer || !contact) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          error: 'PG ID, name, address, maintainer, and contact are required'
        });
      }

      // Prepare branch data with validation
      const branchData = {
        pgId,
        name,
        address: {
          street: address.street || '',
          city: address.city || '',
          state: address.state || '',
          pincode: address.pincode || '',
          landmark: address.landmark || ''
        },
        maintainer: {
          name: maintainer.name || '',
          mobile: maintainer.mobile || '',
          email: maintainer.email || ''
        },
        contact: {
          phone: contact.phone || '',
          email: contact.email || '',
          alternatePhone: contact.alternatePhone || ''
        },
        capacity: {
          totalRooms: capacity?.totalRooms || 0,
          totalBeds: capacity?.totalBeds || 0,
          availableRooms: capacity?.availableRooms || 0
        },
        amenities: amenities || [],
        status: status || 'active',
        isDefault: isDefault || false,
        createdBy: req.user._id
      };

      // Create new branch
      const newBranch = new Branch(branchData);
      const savedBranch = await newBranch.save();

      // If this is set as default, update other branches
      if (savedBranch.isDefault) {
        await Branch.updateMany(
          { pgId, _id: { $ne: savedBranch._id } },
          { isDefault: false }
        );
      }

      // Update user's default branch flag and default branch ID
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          defaultBranch: true,
          defaultBranchId: savedBranch._id
        },
        { new: true }
      );

      // Record activity
      try {
        await activityService.recordActivity({
          type: 'branch_create',
          title: 'Branch Created',
          description: `New branch "${savedBranch.name}" created${savedBranch.isDefault ? ' and set as default' : ''}`,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'branch',
          entityId: savedBranch._id,
          entityName: savedBranch.name,
          category: 'management',
          priority: 'normal',
          status: 'success'
        });
      } catch (_) {}

      res.status(201).json({
        success: true,
        message: 'Branch created successfully',
        data: {
          branch: savedBranch,
          user: {
            defaultBranch: true,
            defaultBranchId: savedBranch._id
          }
        }
      });
    } catch (error) {
      console.error('Error creating branch:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: errors.join(', ')
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create branch',
        error: error.message
      });
    }
  }

  /**
   * Get branches for a specific PG
   * @param {string} pgId - PG ID to fetch branches for
   * @returns {Array} - List of branches
   */
  async getBranchesByPG(pgId) {
    try {
      // Validate PG ID
      if (!pgId) {
        throw new Error('PG ID is required');
      }

      // Find branches for the specific PG
      const branches = await Branch.find({ 
        pgId, 
        status: 'active' 
      }).select('-__v');

      // If no branches found, return empty array
      if (!branches || branches.length === 0) {
        return [];
      }

      return branches;
    } catch (error) {
      console.error('Error fetching branches by PG:', error);
      throw error;
    }
  }

  /**
   * Set a branch as default
   * @param {string} branchId - Branch ID to set as default
   * @returns {Object} - Updated branch
   */
  async setDefaultBranch(branchId) {
    try {
      // Find the branch to set as default
      const branch = await Branch.findById(branchId);
      
      if (!branch) {
        throw new Error('Branch not found');
      }

      // Update all branches for this PG to not be default
      await Branch.updateMany(
        { pgId: branch.pgId }, 
        { isDefault: false }
      );

      // Set this branch as default
      branch.isDefault = true;
      const updatedBranch = await branch.save();

      return updatedBranch;
    } catch (error) {
      console.error('Error setting default branch:', error);
      throw error;
    }
  }

  /**
   * Update a branch
   * @param {string} branchId - Branch ID to update
   * @param {Object} updateData - Branch update details
   * @returns {Object} - Updated branch
   */
  async updateBranch(branchId, updateData) {
    try {
      // Find and update the branch
      const updatedBranch = await Branch.findByIdAndUpdate(
        branchId, 
        updateData, 
        { new: true, runValidators: true }
      );

      if (!updatedBranch) {
        throw new Error('Branch not found');
      }

      return updatedBranch;
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  }

  /**
   * Delete a branch
   * @param {string} branchId - Branch ID to delete
   * @returns {Object} - Deletion result
   */
  async deleteBranch(branchId) {
    try {
      // Find the branch to delete
      const branch = await Branch.findById(branchId);
      
      if (!branch) {
        throw new Error('Branch not found');
      }

      // Soft delete: set status to inactive
      branch.status = 'inactive';
      await branch.save();

      return { 
        message: 'Branch deleted successfully', 
        branchId 
      };
    } catch (error) {
      console.error('Error deleting branch:', error);
      throw error;
    }
  }
}

module.exports = new BranchController();
