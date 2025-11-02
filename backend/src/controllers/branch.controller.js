const Branch = require('../models/branch.model');
const User = require('../models/user.model');
const activityService = require('../services/activity.service');
const Maintainer = require('../models/maintainer.model');

class BranchController {
  /**
   * Assign a maintainer to a branch
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Updated branch with maintainer
   */
  async assignMaintainerToBranch(req, res) {
    try {
      const { branchId, maintainerId } = req.body;

      // Validate inputs
      if (!branchId || !maintainerId) {
        return res.status(400).json({
          success: false,
          message: 'Branch ID and Maintainer ID are required'
        });
      }

      // Find the branch and maintainer
      const branch = await Branch.findOne({ 
        _id: branchId, 
        pgId: req.user.pgId 
      });
      const maintainer = await Maintainer.findOne({ 
        _id: maintainerId, 
        pgId: req.user.pgId 
      });

      // Validate branch and maintainer
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }
      if (!maintainer) {
        return res.status(404).json({
          success: false,
          message: 'Maintainer not found'
        });
      }

      // Update branch with maintainer
      branch.maintainerId = maintainerId;
      const updatedBranch = await branch.save();

      // Update maintainer's branches
      await Maintainer.findByIdAndUpdate(
        maintainerId,
        { $addToSet: { branches: branchId } },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Maintainer assigned to branch successfully',
        data: {
          branch: updatedBranch,
          maintainer: {
            _id: maintainer._id,
            name: maintainer.user.firstName + ' ' + maintainer.user.lastName
          }
        }
      });
    } catch (error) {
      console.error('Error assigning maintainer to branch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign maintainer to branch',
        error: error.message
      });
    }
  }

  /**
   * Get branches with their assigned maintainers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Branches with maintainer details
   */
  async getBranchesWithMaintainers(req, res) {
    try {
      const branches = await Branch.find({ 
        pgId: req.user.pgId, 
        status: 'active' 
      })
      .populate({
        path: 'maintainerId',
        populate: {
          path: 'user',
          select: 'firstName lastName email phone'
        }
      })
      .select('-__v');

      res.status(200).json({
        success: true,
        data: {
          branches: branches.map(branch => ({
            ...branch.toObject(),
            maintainer: branch.maintainerId ? {
              _id: branch.maintainerId._id,
              name: `${branch.maintainerId.user.firstName} ${branch.maintainerId.user.lastName}`,
              email: branch.maintainerId.user.email,
              phone: branch.maintainerId.user.phone
            } : null
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching branches with maintainers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch branches',
        error: error.message
      });
    }
  }

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
        maintainerId, // Add this to support direct maintainer assignment
        contact,
        capacity,
        amenities,
        status,
        isDefault
      } = req.body;

      // Validate required fields
      if (!pgId || !name || !address || !contact) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          error: 'PG ID, name, address, and contact are required'
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
        createdBy: req.user._id,
        maintainerId: maintainerId || null // Add maintainer ID if provided
      };

      // Create new branch
      const newBranch = new Branch(branchData);
      const savedBranch = await newBranch.save();

      // If a maintainer is assigned, update their branches
      if (maintainerId) {
        await Maintainer.findByIdAndUpdate(
          maintainerId,
          { $addToSet: { branches: savedBranch._id } },
          { new: true }
        );
      }

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
          },
          maintainer: maintainerId ? { _id: maintainerId } : null
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
      // Prevent changing isDefault - only the first branch can be default
      if (updateData.hasOwnProperty('isDefault')) {
        delete updateData.isDefault;
      }

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
