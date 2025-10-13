const Branch = require('../models/branch.model');
const Floor = require('../models/floor.model');
const Room = require('../models/room.model');
const PG = require('../models/pg.model');
const mongoose = require('mongoose'); // Added for raw MongoDB operations

class BranchService {
  // Get all branches for a PG
  async getBranchesByPG(pgId) {
    try {
      const branches = await Branch.find({ pgId, isActive: true })
        .populate('createdBy', 'firstName lastName email')
        .sort({ isDefault: -1, createdAt: -1 });
      
      return {
        success: true,
        data: branches,
        statusCode: 200
      };
    } catch (error) {
      console.error('Error getting branches:', error);
      return {
        success: false,
        message: 'Failed to get branches',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Get branch by ID
  async getBranchById(branchId) {
    try {
      const branch = await Branch.findById(branchId)
        .populate('createdBy', 'firstName lastName email')
        .populate('pgId', 'name');
      
      if (!branch) {
        return {
          success: false,
          message: 'Branch not found',
          statusCode: 404
        };
      }
      
      return {
        success: true,
        data: branch,
        statusCode: 200
      };
    } catch (error) {
      console.error('Error getting branch:', error);
      return {
        success: false,
        message: 'Failed to get branch',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Create new branch
  async createBranch(branchData, userId) {
    try {
      // Check if PG exists
      const pg = await PG.findById(branchData.pgId);
      if (!pg) {
        return {
          success: false,
          message: 'PG not found',
          statusCode: 404
        };
      }

      // Check if branch name already exists for this PG
      const existingBranch = await Branch.findOne({
        pgId: branchData.pgId,
        name: branchData.name,
        isActive: true
      });

      if (existingBranch) {
        return {
          success: false,
          message: 'Branch with this name already exists',
          statusCode: 400
        };
      }

      // If this is the first branch, make it default
      const branchCount = await Branch.countDocuments({ pgId: branchData.pgId, isActive: true });
      if (branchCount === 0) {
        branchData.isDefault = true;
      }

      const branch = new Branch({
        ...branchData,
        createdBy: userId
      });

      await branch.save();

      const populatedBranch = await Branch.findById(branch._id)
        .populate('createdBy', 'firstName lastName email');

      return {
        success: true,
        data: populatedBranch,
        message: 'Branch created successfully',
        statusCode: 201
      };
    } catch (error) {
      console.error('Error creating branch:', error);
      return {
        success: false,
        message: 'Failed to create branch',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Update branch
  async updateBranch(branchId, updateData, userId) {
    try {
      const branch = await Branch.findById(branchId);
      
      if (!branch) {
        return {
          success: false,
          message: 'Branch not found',
          statusCode: 404
        };
      }

      // Check if branch name already exists for this PG (excluding current branch)
      if (updateData.name && updateData.name !== branch.name) {
        const existingBranch = await Branch.findOne({
          pgId: branch.pgId,
          name: updateData.name,
          isActive: true,
          _id: { $ne: branchId }
        });

        if (existingBranch) {
          return {
            success: false,
            message: 'Branch with this name already exists',
            statusCode: 400
          };
        }
      }

      Object.assign(branch, updateData);
      await branch.save();

      const updatedBranch = await Branch.findById(branchId)
        .populate('createdBy', 'firstName lastName email');

      return {
        success: true,
        data: updatedBranch,
        message: 'Branch updated successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Error updating branch:', error);
      return {
        success: false,
        message: 'Failed to update branch',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Delete branch
  async deleteBranch(branchId, userId) {
    try {
      const branch = await Branch.findById(branchId);
      
      if (!branch) {
        return {
          success: false,
          message: 'Branch not found',
          statusCode: 404
        };
      }

      // Check if branch has floors
      const floorsCount = await Floor.countDocuments({ branchId, isActive: true });
      
      if (floorsCount > 0) {
        return {
          success: false,
          message: `Cannot delete branch. It has ${floorsCount} active floor(s). Please delete all floors first.`,
          statusCode: 400
        };
      }

      // If this is the default branch, make another branch default
      if (branch.isDefault) {
        const otherBranch = await Branch.findOne({ 
          pgId: branch.pgId, 
          isActive: true, 
          _id: { $ne: branchId } 
        });
        
        if (otherBranch) {
          // Use direct database operation to avoid index conflicts
          const db = Branch.db;
          const collection = db.collection('branches');
          
          await collection.updateOne(
            { _id: otherBranch._id },
            { $set: { isDefault: true } }
          );
        }
      }

      // Soft delete the branch
      branch.isActive = false;
      await branch.save();

      return {
        success: true,
        message: 'Branch deleted successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Error deleting branch:', error);
      return {
        success: false,
        message: 'Failed to delete branch',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Set default branch - SIMPLIFIED AND RELIABLE
  async setDefaultBranch(branchId, userId) {
    try {
      const branch = await Branch.findById(branchId);
      
      if (!branch) {
        return {
          success: false,
          message: 'Branch not found',
          statusCode: 404
        };
      }

      // Check if branch is active
      if (!branch.isActive) {
        return {
          success: false,
          message: 'Cannot set inactive branch as default',
          statusCode: 400
        };
      }

      // Check if it's already default
      if (branch.isDefault) {
        return {
          success: true,
          data: await Branch.findById(branchId).populate('createdBy', 'firstName lastName email'),
          message: 'Branch is already set as default',
          statusCode: 200
        };
      }

      console.log(`🔄 Setting branch ${branch.name} (${branchId}) as default for PG ${branch.pgId}`);

      // SIMPLIFIED APPROACH: Use direct MongoDB operations
      const db = Branch.db;
      const collection = db.collection('branches');

      try {
        // Step 1: Get all branches for this PG to verify state
        const allBranches = await collection.find({ 
          pgId: branch.pgId, 
          isActive: true 
        }).toArray();

        console.log(`📋 Found ${allBranches.length} active branches for this PG`);
        console.log(`📋 Current default branches:`, allBranches.filter(b => b.isDefault).map(b => b.name));

        // Step 2: Use updateMany to set all branches to non-default, then updateOne to set the target
        console.log('🔄 Step 1: Setting all branches to non-default...');
        const resetResult = await collection.updateMany(
          { 
            pgId: branch.pgId, 
            isActive: true 
          },
          { 
            $set: { 
              isDefault: false,
              updatedAt: new Date()
            } 
          }
        );
        console.log(`✅ Reset ${resetResult.modifiedCount} branches to non-default`);

        // Step 3: Set the target branch as default
        console.log('🔄 Step 2: Setting target branch as default...');
        const setResult = await collection.updateOne(
          { _id: branch._id },
          { 
            $set: { 
              isDefault: true,
              updatedAt: new Date()
            } 
          }
        );
        console.log(`✅ Set target branch as default, modified: ${setResult.modifiedCount}`);

        // Step 4: Verify the result
        const verifyBranches = await collection.find({ 
          pgId: branch.pgId, 
          isActive: true 
        }).toArray();
        const defaultBranches = verifyBranches.filter(b => b.isDefault);
        console.log(`🔍 Verification: Found ${defaultBranches.length} default branches`);
        console.log(`🔍 Default branch names:`, defaultBranches.map(b => b.name));

        if (defaultBranches.length === 1 && defaultBranches[0]._id.toString() === branchId) {
          const updatedBranch = await Branch.findById(branchId)
            .populate('createdBy', 'firstName lastName email');

          console.log(`✅ Successfully set ${updatedBranch.name} as default branch`);

          return {
            success: true,
            data: updatedBranch,
            message: 'Default branch updated successfully',
            statusCode: 200
          };
        } else {
          console.error('❌ Verification failed: Incorrect number of default branches or wrong branch set as default');
          return {
            success: false,
            message: 'Failed to verify default branch update',
            statusCode: 500
          };
        }

      } catch (dbError) {
        console.error('❌ Database operation failed:', dbError);
        
        // If it's still the index constraint error, try to fix it first
        if (dbError.message.includes('E11000') && dbError.message.includes('pgId_1_isDefault_1')) {
          console.log('🔧 Index constraint detected, attempting to fix...');
          const indexFixResult = await this.fixBranchIndexIssues();
          
          if (indexFixResult.success) {
            console.log('✅ Index fixed, retrying default branch operation...');
            // Retry the operation after fixing the index
            return await this.setDefaultBranch(branchId, userId);
          } else {
            return {
              success: false,
              message: 'Database index constraint prevents this operation. Please contact administrator.',
              error: 'Failed to fix database index constraint',
              statusCode: 500
            };
          }
        }
        
        return {
          success: false,
          message: 'Database operation failed',
          error: dbError.message,
          statusCode: 500
        };
      }

    } catch (error) {
      console.error('❌ Error setting default branch:', error);
      return {
        success: false,
        message: 'Failed to set default branch',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Activate branch
  async activateBranch(branchId, userId) {
    try {
      const branch = await Branch.findById(branchId);
      
      if (!branch) {
        return {
          success: false,
          message: 'Branch not found',
          statusCode: 404
        };
      }

      if (branch.isActive) {
        return {
          success: false,
          message: 'Branch is already active',
          statusCode: 400
        };
      }

      // Activate the branch
      branch.isActive = true;
      await branch.save();

      const updatedBranch = await Branch.findById(branchId)
        .populate('createdBy', 'firstName lastName email');

      return {
        success: true,
        data: updatedBranch,
        message: 'Branch activated successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Error activating branch:', error);
      return {
        success: false,
        message: 'Failed to activate branch',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Deactivate branch
  async deactivateBranch(branchId, userId) {
    try {
      const branch = await Branch.findById(branchId);
      
      if (!branch) {
        return {
          success: false,
          message: 'Branch not found',
          statusCode: 404
        };
      }

      if (!branch.isActive) {
        return {
          success: false,
          message: 'Branch is already inactive',
          statusCode: 400
        };
      }

      // Check if this is the default branch
      if (branch.isDefault) {
        return {
          success: false,
          message: 'Cannot deactivate the default branch. Please set another branch as default first.',
          statusCode: 400
        };
      }

      // Check if branch has active floors
      const floorsCount = await Floor.countDocuments({ branchId, isActive: true });
      
      if (floorsCount > 0) {
        return {
          success: false,
          message: `Cannot deactivate branch. It has ${floorsCount} active floor(s). Please deactivate all floors first.`,
          statusCode: 400
        };
      }

      // Deactivate the branch
      branch.isActive = false;
      await branch.save();

      const updatedBranch = await Branch.findById(branchId)
        .populate('createdBy', 'firstName lastName email');

      return {
        success: true,
        data: updatedBranch,
        message: 'Branch deactivated successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Error deactivating branch:', error);
      return {
        success: false,
        message: 'Failed to deactivate branch',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Get branch statistics
  async getBranchStats(pgId) {
    try {
      const branches = await Branch.find({ pgId, isActive: true });
      const floors = await Floor.find({ pgId, isActive: true });
      const rooms = await Room.find({ pgId, isActive: true });

      const stats = branches.map(branch => {
        const branchFloors = floors.filter(floor => floor.branchId.toString() === branch._id.toString());
        const branchRooms = rooms.filter(room => room.branchId.toString() === branch._id.toString());
        const occupiedRooms = branchRooms.filter(room => room.isOccupied);
        
        return {
          branchId: branch._id,
          branchName: branch.name,
          totalFloors: branchFloors.length,
          totalRooms: branchRooms.length,
          occupiedRooms: occupiedRooms.length,
          availableRooms: branchRooms.length - occupiedRooms.length,
          occupancyRate: branchRooms.length > 0 ? Math.round(((branchRooms.length - occupiedRooms.length) / branchRooms.length) * 100) : 0,
          status: branch.status,
          isDefault: branch.isDefault,
          isActive: branch.isActive
        };
      });

      return {
        success: true,
        data: stats,
        statusCode: 200
      };
    } catch (error) {
      console.error('Error getting branch stats:', error);
      return {
        success: false,
        message: 'Failed to get branch statistics',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Get default branch for PG
  async getDefaultBranch(pgId) {
    try {
      const defaultBranch = await Branch.findOne({ pgId, isDefault: true, isActive: true });
      
      if (!defaultBranch) {
        // If no default branch, get the first active branch
        const firstBranch = await Branch.findOne({ pgId, isActive: true }).sort({ createdAt: 1 });
        
        if (firstBranch) {
          // Use direct database operations to avoid index conflicts
          const db = Branch.db;
          const collection = db.collection('branches');

          // First, remove default from all other branches in this PG
          await collection.updateMany(
            { 
              pgId, 
              isActive: true, 
              _id: { $ne: firstBranch._id } 
            },
            { $set: { isDefault: false } }
          );

          // Then set this branch as default
          await collection.updateOne(
            { _id: firstBranch._id },
            { $set: { isDefault: true } }
          );

          // Fetch the updated branch
          const updatedBranch = await Branch.findById(firstBranch._id);
          return {
            success: true,
            data: updatedBranch,
            statusCode: 200
          };
        }
        
        return {
          success: false,
          message: 'No branches found for this PG',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: defaultBranch,
        statusCode: 200
      };
    } catch (error) {
      console.error('Error getting default branch:', error);
      return {
        success: false,
        message: 'Failed to get default branch',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Get all branches (including inactive) for a PG
  async getAllBranchesByPG(pgId) {
    try {
      const branches = await Branch.find({ pgId })
        .populate('createdBy', 'firstName lastName email')
        .sort({ isDefault: -1, isActive: -1, createdAt: -1 });
      
      return {
        success: true,
        data: branches,
        statusCode: 200
      };
    } catch (error) {
      console.error('Error getting all branches:', error);
      return {
        success: false,
        message: 'Failed to get branches',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Clean up duplicate branches
  async cleanupDuplicateBranches(pgId) {
    try {
      console.log('🧹 Cleaning up duplicate branches for PG:', pgId);
      
      // Find all branches for this PG
      const branches = await Branch.find({ pgId, isActive: true });
      console.log(`📊 Found ${branches.length} active branches`);
      
      // Group branches by name
      const branchesByName = {};
      branches.forEach(branch => {
        if (!branchesByName[branch.name]) {
          branchesByName[branch.name] = [];
        }
        branchesByName[branch.name].push(branch);
      });
      
      let duplicatesRemoved = 0;
      
      // Process each group
      for (const [name, branchGroup] of Object.entries(branchesByName)) {
        if (branchGroup.length > 1) {
          console.log(`🔍 Found ${branchGroup.length} branches with name "${name}"`);
          
          // Sort by creation date (keep the oldest)
          branchGroup.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          
          // Keep the first one, mark others as inactive
          const keepBranch = branchGroup[0];
          const removeBranches = branchGroup.slice(1);
          
          console.log(`✅ Keeping branch: ${keepBranch._id} (${keepBranch.name})`);
          
          for (const branch of removeBranches) {
            console.log(`🗑️ Marking as inactive: ${branch._id} (${branch.name})`);
            branch.isActive = false;
            branch.isDefault = false;
            await branch.save();
            duplicatesRemoved++;
          }
        }
      }
      
      // Ensure only one default branch
      const defaultBranches = await Branch.find({ pgId, isDefault: true, isActive: true });
      if (defaultBranches.length > 1) {
        console.log(`🔍 Found ${defaultBranches.length} default branches, keeping the first one`);
        
        // Sort by creation date
        defaultBranches.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // Keep the first one, mark others as non-default
        const keepDefault = defaultBranches[0];
        const removeDefault = defaultBranches.slice(1);
        
        for (const branch of removeDefault) {
          console.log(`🔧 Removing default status from: ${branch._id} (${branch.name})`);
          branch.isDefault = false;
          await branch.save();
        }
      }
      
      console.log(`✅ Cleanup complete. Removed ${duplicatesRemoved} duplicate branches`);
      
      return {
        success: true,
        message: `Cleaned up ${duplicatesRemoved} duplicate branches`,
        duplicatesRemoved,
        statusCode: 200
      };
    } catch (error) {
      console.error('Error cleaning up duplicate branches:', error);
      return {
        success: false,
        message: 'Failed to cleanup duplicate branches',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Fix branch index issues programmatically
  async fixBranchIndexIssues() {
    try {
      console.log('🔧 Attempting to fix branch index issues...');
      
      const db = Branch.db;
      const collection = db.collection('branches');
      
      // Check if the problematic index exists
      const indexes = await collection.indexes();
      const problematicIndex = indexes.find(index => 
        index.key.pgId === 1 && index.key.isDefault === 1 && Object.keys(index.key).length === 2
      );

      if (problematicIndex) {
        console.log(`Found problematic index: ${problematicIndex.name}`);
        
        try {
          // Try to drop the problematic index
          await collection.dropIndex(problematicIndex.name);
          console.log('✅ Successfully dropped problematic index');
          
          // Create proper non-unique indexes
          await collection.createIndex({ pgId: 1, isActive: 1 });
          await collection.createIndex({ pgId: 1, isDefault: 1, isActive: 1 });
          
          console.log('✅ Created proper indexes');
          
          return {
            success: true,
            message: 'Branch index issues fixed successfully',
            statusCode: 200
          };
          
        } catch (dropError) {
          console.error('Failed to drop index:', dropError);
          return {
            success: false,
            message: 'Failed to fix index issues',
            error: dropError.message,
            statusCode: 500
          };
        }
      } else {
        console.log('No problematic index found');
        return {
          success: true,
          message: 'No index issues found',
          statusCode: 200
        };
      }
      
    } catch (error) {
      console.error('Error fixing branch index issues:', error);
      return {
        success: false,
        message: 'Failed to fix branch index issues',
        error: error.message,
        statusCode: 500
      };
    }
  }
}

module.exports = new BranchService(); 