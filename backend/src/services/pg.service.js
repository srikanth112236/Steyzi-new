const PG = require('../models/pg.model');
const User = require('../models/user.model');
const SalesManager = require('../models/salesManager.model');
const Payment = require('../models/payment.model');
const Ticket = require('../models/ticket.model');
const Floor = require('../models/floor.model');
const Room = require('../models/room.model');
const Branch = require('../models/branch.model');
const XLSX = require('xlsx');
const { createResponse } = require('../utils/response');

class PGService {
  /**
   * Get PG information
   */
  async getPGInfo(pgId) {
    try {
      const pg = await PG.findById(pgId);
      if (!pg) {
        return {
          success: false,
          message: 'PG not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        message: 'PG information retrieved successfully',
        statusCode: 200,
        data: {
          pg: {
            id: pg._id,
            name: pg.name,
            description: pg.description,
            address: pg.address,
            phone: pg.phone,
            email: pg.email,
            isActive: pg.isActive,
            createdAt: pg.createdAt
          }
        }
      };
    } catch (error) {
      console.error('Get PG info error:', error);
      return {
        success: false,
        message: 'Failed to get PG information',
        statusCode: 500,
        error: error.message
      };
    }
  }

  /**
   * Update PG information
   */
  async updatePGInfo(pgId, updateData) {
    try {
      console.log('🔍 PGService.updatePGInfo called:', { pgId, updateData });
      
      const pg = await PG.findById(pgId);
      console.log('🔍 Found PG:', pg ? 'Yes' : 'No');
      
      if (!pg) {
        console.log('❌ PG not found for ID:', pgId);
        return {
          success: false,
          message: 'PG not found',
          statusCode: 404
        };
      }

      // Update PG fields
      const allowedFields = ['name', 'description', 'phone', 'email'];
      const updateFields = {};

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      });

      // Handle address separately since it's an object
      if (updateData.address) {
        updateFields.address = {
          street: updateData.address.street || '',
          city: updateData.address.city || '',
          state: updateData.address.state || '',
          pincode: updateData.address.pincode || '',
          landmark: updateData.address.landmark || ''
        };
      }

      console.log('🔍 Update fields:', updateFields);

      const updatedPG = await PG.findByIdAndUpdate(
        pgId,
        updateFields,
        { new: true, runValidators: true }
      );

      console.log('✅ PG updated successfully:', updatedPG);

      return {
        success: true,
        message: 'PG information updated successfully',
        statusCode: 200,
        data: {
          pg: updatedPG
        }
      };
    } catch (error) {
      console.error('❌ Update PG info error:', error);
      return {
        success: false,
        message: 'Failed to update PG information',
        statusCode: 500,
        error: error.message
      };
    }
  }

  // Create a new PG (for sales users - simplified, no admin user creation)
  async createSalesPG(pgData, salesUserId) {
    try {
      console.log('PG Service createSalesPG called with:', {
        salesUserId: salesUserId,
        salesUserIdType: typeof salesUserId,
        pgDataName: pgData.name,
        salesManager: pgData.salesManager,
        salesStaff: pgData.salesStaff
      });

      // Validate sales user exists - check both User and SalesManager models
      let salesUser = null;
      let userType = '';

      // First check if it's a sales manager
      const salesManager = await SalesManager.findById(salesUserId);
      if (salesManager) {
        salesUser = salesManager;
        userType = 'sales_manager';
      } else {
        // Check if it's a sub_sales user
        const subSalesUser = await User.findById(salesUserId);
        if (subSalesUser && subSalesUser.salesRole === 'sub_sales') {
          salesUser = subSalesUser;
          userType = 'sub_sales';
        }
      }

      if (!salesUser) {
        throw new Error('Unauthorized: Invalid sales user');
      }

      console.log('Sales user validated successfully');

      // Create admin user for this PG (similar to regular PG creation)
      const adminEmail = pgData.contact?.email;
      const adminPassword = pgData.adminPassword || pgData.password || 'Admin@123';
      const adminPhone = pgData.contact?.phone || '0000000000'; // Fallback phone number
      
      if (!adminEmail) {
        throw new Error('PG admin email is required');
      }
      
      console.log('Creating admin user for PG:', {
        email: adminEmail,
        name: pgData.name,
        phone: adminPhone
      });

      // Check if admin user already exists
      let adminUser = await User.findOne({ email: adminEmail });
      
      if (!adminUser) {
        // Create new admin user
        adminUser = new User({
          firstName: pgData.name || 'PG Admin',
          lastName: 'User',
          email: adminEmail,
          password: adminPassword, // Explicitly set the password
          phone: adminPhone, // Add phone number
          role: 'admin',
          isActive: true,
          isEmailVerified: true
        });

        await adminUser.save();
        console.log('Admin user created successfully:', adminUser._id);
      } else {
        console.log('Admin user already exists:', adminUser._id);
        // Update existing user to admin role if needed
        if (adminUser.role !== 'admin') {
          adminUser.role = 'admin';
          adminUser.isActive = true;
          adminUser.isEmailVerified = true;
          adminUser.phone = adminPhone; // Update phone if not set
          await adminUser.save();
          console.log('Existing user updated to admin role');
        }
      }

      // Transform the data to match PG model structure (same as regular PG creation)
      const transformedData = {
        name: pgData.name,
        description: pgData.description || '',
        // Store address as object (same format as regular PG creation)
        address: pgData.address ? {
          street: pgData.address.street || '',
          city: pgData.address.city || '',
          state: pgData.address.state || '',
          pincode: pgData.address.pincode || '',
          landmark: pgData.address.landmark || ''
        } : {
          street: '',
          city: '',
          state: '',
          pincode: '',
          landmark: ''
        },
        phone: pgData.contact?.phone || '',
        email: pgData.contact?.email || '',
        status: pgData.status || 'active', // Use provided status or default to 'active'
        // Sales-specific fields
        salesManager: pgData.salesManager || '',
        salesStaff: pgData.salesStaff || '',
        addedBy: salesUserId,
        // Set admin to the created/updated admin user
        admin: adminUser._id,
        createdBy: salesUserId,
        isActive: true
      };

      console.log('Transformed PG data:', transformedData);

      // Create the PG
      const pg = new PG(transformedData);
      const savedPG = await pg.save();

      console.log('PG created successfully:', savedPG._id);

      // Associate the PG with the admin user
      adminUser.pgId = savedPG._id;
      await adminUser.save();
      console.log('PG associated with admin user:', adminUser._id);

      // Track total PGs added (but don't award commission yet - only when subscription is active)
      // Commission will be awarded when PG admin subscribes to an active plan
      try {
        if (userType === 'sales_manager') {
          // Update sales manager's total PGs added count (not commission)
          await SalesManager.findByIdAndUpdate(salesUserId, {
            $inc: {
              'performanceMetrics.totalPGsAdded': 1
            }
          });
          console.log(`Updated sales manager total PGs: +1`);
        } else if (userType === 'sub_sales') {
          // Update sub-sales user's total PGs added count (not commission)
          await User.findByIdAndUpdate(salesUserId, {
            $inc: {
              'salesPerformanceMetrics.totalPGsAdded': 1
            },
            $set: {
              'salesPerformanceMetrics.lastPGAddedDate': new Date()
            }
          });
          console.log(`Updated sub-sales staff total PGs: +1`);

          // Update parent sales manager's total PGs count (not commission)
          const parentManager = await SalesManager.findById(salesUser.parentSalesPerson);
          if (parentManager) {
            await SalesManager.findByIdAndUpdate(parentManager._id, {
              $inc: {
                'performanceMetrics.totalPGsAdded': 1
              }
            });
            console.log(`Updated parent sales manager total PGs: +1`);
          }
        }
      } catch (error) {
        console.warn('Failed to update PG count metrics:', error.message);
        // Don't fail the PG creation if metric update fails
      }

      console.log('Note: Commission will be awarded when PG admin subscribes to an active plan');

      return {
        success: true,
        data: savedPG,
        message: 'PG created successfully by sales user'
      };
    } catch (error) {
      console.error('PG Service createSalesPG error:', error);
      throw new Error(`Failed to create PG: ${error.message}`);
    }
  }

  // Create a new PG (original method for superadmin)
  async createPG(pgData, adminId) {
    try {
      console.log('PG Service createPG called with:', {
        adminId: adminId,
        adminIdType: typeof adminId,
        pgDataName: pgData.name
      });

      // Validate admin exists and has admin role
      const superadmin = await User.findById(adminId);
      console.log('Superadmin lookup result:', {
        adminFound: !!superadmin,
        adminId: superadmin?._id,
        adminRole: superadmin?.role,
        adminEmail: superadmin?.email
      });

      if (!superadmin || !['admin', 'superadmin'].includes(superadmin.role)) {
        console.log('Authorization failed in PG service:', {
          adminExists: !!superadmin,
          adminRole: superadmin?.role,
          allowedRoles: ['admin', 'superadmin']
        });
        throw new Error('Unauthorized: Only admins can create PGs');
      }

      console.log('User permissions validated successfully');

      // Create admin user for this PG
      const adminEmail = pgData.contact.email;
      const adminPassword = pgData.adminPassword || pgData.password || 'Admin@123';
      const adminPhone = pgData.contact.phone || '0000000000'; // Fallback phone number
      
      console.log('Creating admin user for PG:', {
        email: adminEmail,
        name: pgData.name,
        phone: adminPhone
      });

      // Check if admin user already exists
      let adminUser = await User.findOne({ email: adminEmail });
      
      if (!adminUser) {
        // Create new admin user
        adminUser = new User({
          firstName: pgData.name || 'PG Admin',
          lastName: 'User',
          email: adminEmail,
          password: adminPassword, // Explicitly set the default password
          phone: adminPhone, // Add phone number
          role: 'admin',
          isActive: true,
          isEmailVerified: true
        });

        await adminUser.save();
        console.log('Admin user created successfully:', adminUser._id);
      } else {
        console.log('Admin user already exists:', adminUser._id);
        // Update existing user to admin role if needed
        if (adminUser.role !== 'admin') {
          adminUser.role = 'admin';
          adminUser.isActive = true;
          adminUser.isEmailVerified = true;
          adminUser.phone = adminPhone; // Update phone if not set
          await adminUser.save();
          console.log('Existing user updated to admin role');
        }
      }

      // Format the data for the PG model
      const formattedPGData = {
        name: pgData.name,
        description: pgData.description || '',
        // Store address as object
        address: {
          street: pgData.address?.street || '',
          city: pgData.address?.city || '',
          state: pgData.address?.state || '',
          pincode: pgData.address?.pincode || '',
          landmark: pgData.address?.landmark || ''
        },
        phone: pgData.contact?.phone || '',
        email: pgData.contact?.email || '',
        admin: adminUser._id,
        createdBy: adminId, // Add the createdBy field
        isActive: true,
        status: pgData.status || 'active' // Add status with default
      };

      console.log('Formatted PG data:', formattedPGData);

      // Create and save the PG
      const pg = new PG(formattedPGData);

      console.log('PG object created, attempting to save...');
      const savedPG = await pg.save();
      console.log('PG saved successfully:', savedPG._id);

      // Associate the PG with the admin user
      adminUser.pgId = savedPG._id;
      await adminUser.save();

      return {
        success: true,
        message: 'PG created successfully',
        statusCode: 201,
        data: savedPG
      };

    } catch (error) {
      console.error('PG creation error:', error);
      return {
        success: false,
        message: `Failed to create PG: ${error.message}`,
        statusCode: 500,
        error: error.message
      };
    }
  }

  // Get all PGs with filters
  async getAllPGs(filters = {}, page = 1, limit = 10) {
    try {
      const query = {};

      // Apply filters
      if (filters.status) query.status = filters.status;
      if (filters.city) query['address.city'] = new RegExp(filters.city, 'i');
      if (filters.state) query['address.state'] = new RegExp(filters.state, 'i');
      if (filters.propertyType) query['property.type'] = filters.propertyType;
      if (filters.admin) query.admin = filters.admin;
      if (filters.addedBy) query.addedBy = filters.addedBy;
      if (filters.minPrice || filters.maxPrice) {
        query['pricing.basePrice'] = {};
        if (filters.minPrice) query['pricing.basePrice'].$gte = filters.minPrice;
        if (filters.maxPrice) query['pricing.basePrice'].$lte = filters.maxPrice;
      }

      const skip = (page - 1) * limit;

      const [pgs, total] = await Promise.all([
        PG.find(query)
          .populate('admin', 'firstName lastName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        PG.countDocuments(query)
      ]);

      // Get room and branch data for each PG
      const formattedPGs = await Promise.all(pgs.map(async (pg) => {
        const pgObj = pg.toObject();

        // Address is already stored as object, ensure it has all required fields
        if (pgObj.address && typeof pgObj.address === 'object') {
          pgObj.address = {
            street: pgObj.address.street || '',
            city: pgObj.address.city || '',
            state: pgObj.address.state || '',
            pincode: pgObj.address.pincode || '',
            landmark: pgObj.address.landmark || ''
          };
        } else {
          // Fallback for old data
          pgObj.address = {
            street: '',
            city: '',
            state: '',
            pincode: '',
            landmark: ''
          };
        }

        // Add contact object for frontend
        pgObj.contact = {
          phone: pgObj.phone || '',
          email: pgObj.email || '',
          alternatePhone: ''
        };

        // Get real room and branch data
        const [totalRooms, occupiedRooms, branches] = await Promise.all([
          // Count total rooms for this PG
          Room.countDocuments({ pgId: pg._id, isActive: true }),
          // Count occupied rooms (rooms with active residents)
          Room.countDocuments({
            pgId: pg._id,
            isActive: true,
            status: 'occupied'
          }),
          // Get branches for this PG
          Branch.find({ pgId: pg._id, isActive: true }).select('name address isDefault')
        ]);

        const availableRooms = Math.max(0, totalRooms - occupiedRooms);
        const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

        // Add property object with real data
        pgObj.property = {
          type: pg.sharingTypes?.length > 0 ? pg.sharingTypes[0].name : 'Gents PG', // Use first sharing type as type
          totalRooms: totalRooms,
          availableRooms: availableRooms,
          occupancyRate: occupancyRate
        };

        // Get pricing information (use first sharing type cost as base price)
        const basePrice = pg.sharingTypes?.length > 0 ? pg.sharingTypes[0].cost : 0;
        pgObj.pricing = {
          basePrice: basePrice
        };

        // Add branch information
        pgObj.branches = branches.map(branch => ({
          id: branch._id,
          name: branch.name,
          address: branch.address,
          isDefault: branch.isDefault
        }));

        // Explicitly include status
        pgObj.status = pg.status || 'active';

        return pgObj;
      }));

      return {
        success: true,
        data: formattedPGs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error in getAllPGs:', error);
      throw new Error(`Failed to fetch PGs: ${error.message}`);
    }
  }

  // Get PG by ID
  async getPGById(pgId) {
    try {
      const pg = await PG.findById(pgId)
        .populate('admin', 'firstName lastName email phone');

      if (!pg) {
        throw new Error('PG not found');
      }

      // Format the PG data for frontend consumption
      const pgObj = pg.toObject();
      
      // Address is already stored as object, ensure it has all required fields
      if (pgObj.address && typeof pgObj.address === 'object') {
        pgObj.address = {
          street: pgObj.address.street || '',
          city: pgObj.address.city || '',
          state: pgObj.address.state || '',
          pincode: pgObj.address.pincode || '',
          landmark: pgObj.address.landmark || ''
        };
      } else {
        // Fallback for old data
        pgObj.address = {
          street: '',
          city: '',
          state: '',
          pincode: '',
          landmark: ''
        };
      }

      // Add contact object for frontend
      pgObj.contact = {
        phone: pgObj.phone || '',
        email: pgObj.email || '',
        alternatePhone: ''
      };

      // Add property object for frontend
      pgObj.property = {
        type: 'Gents PG', // Default value
        totalRooms: 0,
        availableRooms: 0
      };

      return {
        success: true,
        data: pgObj
      };
    } catch (error) {
      throw new Error(`Failed to fetch PG: ${error.message}`);
    }
  }

  // Update PG
  async updatePG(pgId, updateData, adminId) {
    try {
      // Validate admin exists and has admin role
      const admin = await User.findById(adminId);
      if (!admin || !['admin', 'superadmin'].includes(admin.role)) {
        throw new Error('Unauthorized: Only admins can update PGs');
      }

      // Check if PG exists and admin has permission
      const existingPG = await PG.findById(pgId);
      if (!existingPG) {
        throw new Error('PG not found');
      }

      // Format the update data for the PG model
      const formattedUpdateData = {
        name: updateData.name,
        description: updateData.description || '',
        // Convert address object to string if it's an object
        address: updateData.address ? 
          (typeof updateData.address === 'string' ? updateData.address :
           `${updateData.address.street}, ${updateData.address.city}, ${updateData.address.state} - ${updateData.address.pincode}${updateData.address.landmark ? ` (${updateData.address.landmark})` : ''}`) : 
          existingPG.address,
        phone: updateData.contact?.phone || updateData.phone || '',
        email: updateData.contact?.email || updateData.email || '',
        isActive: updateData.isActive !== undefined ? updateData.isActive : existingPG.isActive,
        // Explicitly handle status update
        status: updateData.status || existingPG.status
      };

      console.log('Formatted update data:', formattedUpdateData);

      // Update PG
      const updatedPG = await PG.findByIdAndUpdate(
        pgId,
        { ...formattedUpdateData, updatedAt: Date.now() },
        { new: true, runValidators: true }
      ).populate('admin', 'firstName lastName email');

      return {
        success: true,
        data: updatedPG,
        message: 'PG updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update PG: ${error.message}`);
    }
  }

  // Delete PG
  async deletePG(pgId, adminId) {
    try {
      const pg = await PG.findById(pgId);
      if (!pg) {
        throw new Error('PG not found');
      }

      // Check if user is authorized to delete this PG
      const admin = await User.findById(adminId);
      if (!admin || (admin.role !== 'superadmin' && pg.admin.toString() !== adminId)) {
        throw new Error('Unauthorized to delete this PG');
      }

      // Check if PG has active payments or tickets
      const [activePayments, activeTickets] = await Promise.all([
        Payment.countDocuments({ pg: pgId, status: { $in: ['pending', 'processing'] } }),
        Ticket.countDocuments({ pg: pgId, status: { $in: ['open', 'in_progress'] } })
      ]);

      if (activePayments > 0 || activeTickets > 0) {
        throw new Error('Cannot delete PG with active payments or tickets');
      }

      await PG.findByIdAndDelete(pgId);

      return {
        success: true,
        message: 'PG deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete PG: ${error.message}`);
    }
  }

  // Get PG statistics
  async getPGStats(pgId = null) {
    try {
      // If no pgId is provided, get global stats
      if (!pgId) {
        const [totalPGs, activePGs, totalRevenue, totalPayments, pendingTickets, roomStats] = await Promise.all([
          PG.countDocuments(),
          PG.countDocuments({ status: 'active' }),
          Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]),
          Payment.countDocuments({ status: 'completed' }),
          Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
          // Get global room statistics
          Room.aggregate([
            {
              $match: { isActive: true }
            },
            {
              $group: {
                _id: null,
                totalRooms: { $sum: 1 },
                occupiedRooms: {
                  $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] }
                }
              }
            }
          ])
        ]);

        const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
        const roomData = roomStats.length > 0 ? roomStats[0] : { totalRooms: 0, occupiedRooms: 0 };
        const occupancyRate = roomData.totalRooms > 0 ? Math.round((roomData.occupiedRooms / roomData.totalRooms) * 100) : 0;

        return {
          success: true,
          data: {
            totalPGs,
            activePGs,
            totalRevenue: revenue,
            totalPayments,
            pendingTickets,
            occupancyRate,
            totalRooms: roomData.totalRooms,
            occupiedRooms: roomData.occupiedRooms,
            availableRooms: roomData.totalRooms - roomData.occupiedRooms
          }
        };
      }

      // If pgId is provided, get stats for specific PG
      const [pgDetails, totalRevenue, totalPayments, pendingTickets, roomStats] = await Promise.all([
        PG.findById(pgId),
        Payment.aggregate([
          { $match: { pgId: pgId, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Payment.countDocuments({ pgId: pgId, status: 'completed' }),
        Ticket.countDocuments({ pgId: pgId, status: { $in: ['open', 'in_progress'] } }),
        // Get room statistics for this PG
        Room.aggregate([
          {
            $match: { pgId: pgId, isActive: true }
          },
          {
            $group: {
              _id: null,
              totalRooms: { $sum: 1 },
              occupiedRooms: {
                $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] }
              }
            }
          }
        ])
      ]);

      if (!pgDetails) {
        return {
          success: false,
          message: 'PG not found',
          statusCode: 404
        };
      }

      const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
      const roomData = roomStats.length > 0 ? roomStats[0] : { totalRooms: 0, occupiedRooms: 0 };
      const occupancyRate = roomData.totalRooms > 0 ? Math.round((roomData.occupiedRooms / roomData.totalRooms) * 100) : 0;

      return {
        success: true,
        data: {
          totalPGs: 1,
          activePGs: pgDetails.status === 'active' ? 1 : 0,
          totalRevenue: revenue,
          totalPayments,
          pendingTickets,
          occupancyRate,
          totalRooms: roomData.totalRooms,
          occupiedRooms: roomData.occupiedRooms,
          availableRooms: roomData.totalRooms - roomData.occupiedRooms
        }
      };
    } catch (error) {
      console.error('Error in getPGStats:', error);
      return {
        success: false,
        message: 'Failed to fetch PG stats',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Get PG statistics for sales users (only PGs they created)
  async getSalesPGStats(salesUserId) {
    try {
      // Get PGs created by this sales user
      const userPGs = await PG.find({ addedBy: salesUserId });
      const pgIds = userPGs.map(pg => pg._id);

      const [totalPGs, activePGs, totalRevenue, totalPayments, pendingTickets] = await Promise.all([
        PG.countDocuments({ addedBy: salesUserId }),
        PG.countDocuments({ addedBy: salesUserId, status: 'active' }),
        Payment.aggregate([
          { $match: { pg: { $in: pgIds }, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Payment.countDocuments({ pg: { $in: pgIds }, status: 'completed' }),
        Ticket.countDocuments({ pg: { $in: pgIds }, status: { $in: ['open', 'in_progress'] } })
      ]);

      const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

      return {
        success: true,
        data: {
          totalPGs,
          activePGs,
          totalRevenue: revenue,
          totalPayments,
          pendingTickets,
          occupancyRate: totalPGs > 0 ? Math.round((activePGs / totalPGs) * 100) : 0
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch sales PG stats: ${error.message}`);
    }
  }

  // Search PGs
  async searchPGs(searchTerm, filters = {}) {
    try {
      const query = {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { 'address.city': { $regex: searchTerm, $options: 'i' } },
          { 'address.state': { $regex: searchTerm, $options: 'i' } }
        ]
      };

      // Apply additional filters
      if (filters.status) query.status = filters.status;
      if (filters.propertyType) query['property.type'] = filters.propertyType;
      if (filters.minPrice || filters.maxPrice) {
        query['pricing.basePrice'] = {};
        if (filters.minPrice) query['pricing.basePrice'].$gte = filters.minPrice;
        if (filters.maxPrice) query['pricing.basePrice'].$lte = filters.maxPrice;
      }

      const pgs = await PG.find(query)
        .populate('admin', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(20);

      // Format the PGs data for frontend consumption
      const formattedPGs = pgs.map(pg => {
        const pgObj = pg.toObject();
        
        // Address is already stored as object, ensure it has all required fields
        if (pgObj.address && typeof pgObj.address === 'object') {
          pgObj.address = {
            street: pgObj.address.street || '',
            city: pgObj.address.city || '',
            state: pgObj.address.state || '',
            pincode: pgObj.address.pincode || '',
            landmark: pgObj.address.landmark || ''
          };
        } else {
          // Fallback for old data
          pgObj.address = {
            street: '',
            city: '',
            state: '',
            pincode: '',
            landmark: ''
          };
        }

        // Add contact object for frontend
        pgObj.contact = {
          phone: pgObj.phone || '',
          email: pgObj.email || '',
          alternatePhone: ''
        };

        // Add property object for frontend
        pgObj.property = {
          type: 'Gents PG', // Default value
          totalRooms: 0,
          availableRooms: 0
        };

        return pgObj;
      });

      return {
        success: true,
        data: formattedPGs
      };
    } catch (error) {
      throw new Error(`Failed to search PGs: ${error.message}`);
    }
  }

  // Get PGs by location
  async getPGsByLocation(city, state) {
    try {
      const pgs = await PG.find({
        'address.city': new RegExp(city, 'i'),
        'address.state': new RegExp(state, 'i'),
        status: 'active'
      }).populate('admin', 'firstName lastName email');

      // Format the PGs data for frontend consumption
      const formattedPGs = pgs.map(pg => {
        const pgObj = pg.toObject();
        
        // Address is already stored as object, ensure it has all required fields
        if (pgObj.address && typeof pgObj.address === 'object') {
          pgObj.address = {
            street: pgObj.address.street || '',
            city: pgObj.address.city || '',
            state: pgObj.address.state || '',
            pincode: pgObj.address.pincode || '',
            landmark: pgObj.address.landmark || ''
          };
        } else {
          // Fallback for old data
          pgObj.address = {
            street: '',
            city: '',
            state: '',
            pincode: '',
            landmark: ''
          };
        }

        // Add contact object for frontend
        pgObj.contact = {
          phone: pgObj.phone || '',
          email: pgObj.email || '',
          alternatePhone: ''
        };

        // Add property object for frontend
        pgObj.property = {
          type: 'Gents PG', // Default value
          totalRooms: 0,
          availableRooms: 0
        };

        return pgObj;
      });

      return {
        success: true,
        data: formattedPGs,
        message: `Found ${formattedPGs.length} PGs in ${city}, ${state}`
      };
    } catch (error) {
      throw new Error(`Failed to fetch PGs by location: ${error.message}`);
    }
  }

  // Get PG analytics
  async getPGAnalytics(pgId, period = 'month') {
    try {
      const pg = await PG.findById(pgId);
      if (!pg) {
        return {
          success: false,
          message: 'PG not found',
          statusCode: 404
        };
      }

      // Get analytics data based on period
      const analytics = await this.calculatePGAnalytics(pgId, period);

      return {
        success: true,
        data: analytics,
        message: 'PG analytics retrieved successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Error getting PG analytics:', error);
      return {
        success: false,
        message: 'Failed to get PG analytics',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Bulk upload floors and rooms from Excel data
   * @param {Object} uploadData - Upload data containing file and upload type
   * @param {string} userId - User ID performing the upload
   * @returns {Promise<Object>} - Upload result
   */
  async bulkUploadFloorsAndRooms(uploadData, userId) {
    try {
      console.log('🏠 PGService: Starting bulk upload for user:', userId);
      console.log('📊 Upload data:', uploadData);

      const { file, uploadType, branchId } = uploadData;

      if (!file || !uploadType || !branchId) {
        return {
          success: false,
          message: 'Missing required fields: file, uploadType, branchId',
          statusCode: 400
        };
      }

      // Get user and their PG
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      const pgId = user.pgId;
      if (!pgId) {
        return {
          success: false,
          message: 'No PG associated with this user',
          statusCode: 400
        };
      }

      // Parse Excel file
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        return {
          success: false,
          message: 'Excel file must have at least a header row and one data row',
          statusCode: 400
        };
      }

      // Convert to objects using first row as headers
      const headers = jsonData[0];
      const rows = jsonData.slice(1);
      const data = rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      console.log(`📊 Processing ${data.length} rows for ${uploadType}`);

      let uploadedCount = 0;
      let skippedCount = 0;
      let errors = [];
      let duplicates = [];

      if (uploadType === 'floors') {
        // Process floors
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const rowNumber = i + 2; // +2 because Excel is 1-indexed and we skip header
          
          try {
            if (!row.floorName) {
              errors.push(`Row ${rowNumber}: Floor name is required`);
              continue;
            }

            // Check if floor already exists
            const existingFloor = await Floor.findOne({
              pgId,
              branchId,
              name: row.floorName,
              isActive: true
            });

            if (existingFloor) {
              duplicates.push({
                row: rowNumber,
                name: row.floorName,
                type: 'floor',
                reason: 'Floor already exists'
              });
              skippedCount++;
              continue;
            }

            // Create floor
            const floorData = {
              name: row.floorName,
              totalRooms: parseInt(row.totalRooms) || 1,
              pgId,
              branchId,
              createdBy: userId
            };

            const floor = new Floor(floorData);
            await floor.save();
            uploadedCount++;

            console.log(`✅ Created floor: ${row.floorName}`);
          } catch (error) {
            console.error(`❌ Error creating floor from row ${rowNumber}:`, error);
            errors.push(`Row ${rowNumber}: ${error.message}`);
          }
        }
      } else if (uploadType === 'rooms') {
        // Process rooms
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const rowNumber = i + 2; // +2 because Excel is 1-indexed and we skip header
          
          try {
            if (!row.floorName || !row.roomNumber || !row.sharingType) {
              errors.push(`Row ${rowNumber}: Floor name, room number, and sharing type are required`);
              continue;
            }

            // Find the floor
            const floor = await Floor.findOne({
              pgId,
              branchId,
              name: row.floorName,
              isActive: true
            });

            if (!floor) {
              errors.push(`Row ${rowNumber}: Floor "${row.floorName}" not found`);
              continue;
            }

            // Check if room already exists
            const existingRoom = await Room.findOne({
              pgId,
              branchId,
              roomNumber: row.roomNumber,
              isActive: true
            });

            if (existingRoom) {
              duplicates.push({
                row: rowNumber,
                name: `Room ${row.roomNumber}`,
                type: 'room',
                reason: 'Room number already exists'
              });
              skippedCount++;
              continue;
            }

            // Determine number of beds and cost based on sharing type
            let numberOfBeds = 1;
            let cost = 0;
            
            switch (row.sharingType) {
              case '1-sharing':
                numberOfBeds = 1;
                cost = row.cost || 8000; // Default cost for single sharing
                break;
              case '2-sharing':
                numberOfBeds = 2;
                cost = row.cost || 6000; // Default cost for double sharing
                break;
              case '3-sharing':
                numberOfBeds = 3;
                cost = row.cost || 5000; // Default cost for triple sharing
                break;
              case '4-sharing':
                numberOfBeds = 4;
                cost = row.cost || 4000; // Default cost for quad sharing
                break;
              default:
                errors.push(`Row ${rowNumber}: Invalid sharing type "${row.sharingType}"`);
                continue;
            }

            // Generate bed numbers automatically
            const bedNumbers = [];
            const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
            for (let i = 0; i < numberOfBeds; i++) {
              bedNumbers.push(`${row.roomNumber}-${letters[i]}`);
            }

            // Create bed objects for the room
            const beds = bedNumbers.map(bedNumber => ({
              bedNumber,
              isOccupied: false,
              occupiedBy: null,
              occupiedAt: null
            }));

            // Create room using RoomService (includes subscription checking)
            const RoomService = require('./room.service');
            const roomData = {
              floorId: floor._id.toString(),
              roomNumber: row.roomNumber,
              numberOfBeds,
              sharingType: row.sharingType,
              cost: parseInt(cost),
              bedNumbers,
              pgId: pgId.toString(),
              branchId: branchId.toString()
            };

            const roomResult = await RoomService.createRoom(roomData, userId);

            if (roomResult.success) {
              uploadedCount++;
            } else {
              // Handle subscription errors
              if (roomResult.subscriptionError) {
                errors.push(`Row ${rowNumber}: ${roomResult.message}`);
                if (roomResult.upgradeRequired) {
                  return {
                    success: false,
                    message: roomResult.message,
                    statusCode: roomResult.statusCode,
                    subscriptionError: true,
                    upgradeRequired: roomResult.upgradeRequired,
                    bulkUploadLimit: true
                  };
                }
              } else {
                errors.push(`Row ${rowNumber}: ${roomResult.message}`);
              }
              continue;
            }

            console.log(`✅ Created room: ${row.roomNumber} on ${row.floorName} with ${numberOfBeds} beds (${row.sharingType})`);
          } catch (error) {
            console.error(`❌ Error creating room from row ${rowNumber}:`, error);
            errors.push(`Row ${rowNumber}: ${error.message}`);
          }
        }
      } else {
        return {
          success: false,
          message: 'Invalid upload type. Must be "floors" or "rooms"',
          statusCode: 400
        };
      }

      console.log(`✅ Bulk upload completed: ${uploadedCount} ${uploadType} uploaded`);

      // Calculate statistics for rooms
      let roomStats = null;
      if (uploadType === 'rooms' && uploadedCount > 0) {
        const createdRooms = await Room.find({
          pgId,
          branchId,
          createdBy: userId,
          isActive: true
        }).sort({ createdAt: -1 }).limit(uploadedCount);

        const sharingTypeStats = {};
        const totalBeds = createdRooms.reduce((total, room) => {
          const sharingType = room.sharingType;
          sharingTypeStats[sharingType] = (sharingTypeStats[sharingType] || 0) + 1;
          return total + room.numberOfBeds;
        }, 0);

        roomStats = {
          totalRooms: uploadedCount,
          totalBeds,
          sharingTypeBreakdown: sharingTypeStats,
          averageCost: createdRooms.reduce((sum, room) => sum + room.cost, 0) / uploadedCount
        };
      }

      return {
        success: true,
        data: {
          uploadedCount,
          totalRows: data.length,
          errors: errors.length > 0 ? errors : null,
          roomStats,
          skippedCount,
          duplicates: duplicates.length > 0 ? duplicates : null
        },
        message: `Successfully uploaded ${uploadedCount} ${uploadType}`,
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ Bulk upload error:', error);
      return {
        success: false,
        message: 'Failed to process bulk upload',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Configure PG Sharing Types
   * @param {string} pgId - PG ID to configure
   * @param {Array} sharingTypes - Array of sharing types to configure
   * @returns {Promise<Object>} - Configuration result
   */
  async configureSharingTypes(pgId, sharingTypes, user = null) {
    try {
      // Validate input
      if (!pgId) {
        throw new Error('PG ID is required');
      }

      // Validate sharing types
      const validatedSharingTypes = sharingTypes.map(type => {
        // Validate required fields
        if (!type.type || !type.name || type.cost === undefined || type.cost <= 0) {
          throw new Error('Invalid sharing type: Missing or invalid required fields');
        }

        // Ensure type is one of the predefined or custom
        const validTypes = ['1-sharing', '2-sharing', '3-sharing', '4-sharing'];
        if (!validTypes.includes(type.type) && !type.isCustom) {
          throw new Error(`Invalid sharing type: ${type.type}`);
        }

        return {
          type: type.type,
          name: type.name,
          description: type.description || '',
          cost: type.cost,
          isCustom: type.isCustom || false
        };
      });

      // Check if PG exists first
      console.log('PG Service: Looking for PG with ID:', pgId);
      const existingPG = await PG.findById(pgId);
      console.log('PG Service: PG exists:', !!existingPG);
      if (existingPG) {
        console.log('PG Service: Existing PG data:', {
          id: existingPG._id,
          name: existingPG.name,
          isConfigured: existingPG.isConfigured
        });
      }

      // Find and update PG
      const pg = await PG.findByIdAndUpdate(
        pgId,
        {
          sharingTypes: validatedSharingTypes,
          isConfigured: true
        },
        { new: true }
      );

      console.log('PG Service: Update result:', !!pg);
      if (pg) {
        console.log('PG Service: Updated PG:', {
          id: pg._id,
          name: pg.name,
          isConfigured: pg.isConfigured,
          sharingTypesCount: pg.sharingTypes?.length || 0
        });
      }

      if (!pg) {
        console.log('PG Service: PG not found after update attempt');

        // Try to find PGs that might match
        const allPGs = await PG.find({}).limit(10);
        console.log('PG Service: Available PGs in database:', allPGs.map(p => ({
          id: p._id.toString(),
          name: p.name,
          admin: p.admin?.toString()
        })));

        // For development/testing: Create PG if it doesn't exist
        // This should not happen in production, but helps with testing
        console.log('PG Service: Creating PG since it does not exist...');
        try {
          if (!user) {
            throw new Error('User information required to create PG');
          }

          const newPG = new PG({
            _id: pgId,
            name: 'Auto-created PG',
            description: 'PG created automatically during configuration',
            address: {
              street: 'Auto Street',
              city: 'Auto City',
              state: 'Auto State',
              pincode: '110001' // Default valid pincode
            },
            phone: user.phone || '9876543210',
            email: user.email,
            admin: user._id,
            createdBy: user._id,
            isActive: true,
            status: 'active',
            isConfigured: true, // Will be configured below
            sharingTypes: validatedSharingTypes
          });

          const savedPG = await newPG.save();
          console.log('PG Service: Auto-created PG:', savedPG._id);

          // Update user association
          const User = require('../models/user.model');
          await User.findByIdAndUpdate(user._id, {
            pgId: pgId,
            pgConfigured: true
          });

          return {
            success: true,
            message: 'PG created and configured successfully',
            data: savedPG
          };

        } catch (createError) {
          console.error('PG Service: Failed to auto-create PG:', createError);
          throw new Error(`PG with ID ${pgId} not found in database and could not be created. Please contact support.`);
        }
      }

      // Update associated user's PG configuration status
      const User = require('../models/user.model');
      await User.findOneAndUpdate(
        { pgId: pgId }, 
        { pgConfigured: true }, 
        { new: true }
      );

      return {
        success: true,
        message: 'PG sharing types configured successfully',
        data: pg
      };
    } catch (error) {
      console.error('Error configuring PG sharing types:', error);
      return {
        success: false,
        message: error.message || 'Failed to configure PG sharing types',
        error: error.message
      };
    }
  }

  /**
   * Get default sharing types for initial configuration
   * @returns {Array} - Default sharing types
   */
  getDefaultSharingTypes() {
    return [
      {
        type: '1-sharing',
        name: 'Single Occupancy',
        description: 'Private room with single bed',
        cost: 8000,
        isCustom: false
      },
      {
        type: '2-sharing',
        name: 'Double Occupancy',
        description: 'Room shared between two residents',
        cost: 6000,
        isCustom: false
      },
      {
        type: '3-sharing',
        name: 'Triple Occupancy',
        description: 'Room shared between three residents',
        cost: 5000,
        isCustom: false
      },
      {
        type: '4-sharing',
        name: 'Quad Occupancy',
        description: 'Room shared between four residents',
        cost: 4000,
        isCustom: false
      }
    ];
  }

  // Get sharing types for a specific branch
  async getSharingTypesForBranch(branchId) {
    try {
      const Branch = require('../models/branch.model');

      const branch = await Branch.findById(branchId).select('sharingTypes name');

      if (!branch) {
        throw new Error('Branch not found');
      }

      return {
        success: true,
        data: branch.sharingTypes || [],
        message: 'Branch sharing types retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting branch sharing types:', error);
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  // Configure sharing types for a specific branch
  async configureSharingTypesForBranch(branchId, sharingTypes, user = null) {
    try {
      const Branch = require('../models/branch.model');

      // Validate input
      if (!branchId) {
        throw new Error('Branch ID is required');
      }

      // Validate sharing types
      const validatedSharingTypes = sharingTypes.map(type => {
        // Validate required fields
        if (!type.type || !type.name || type.cost === undefined || type.cost <= 0) {
          throw new Error('Invalid sharing type: Missing or invalid required fields');
        }

        // Ensure type is one of the predefined or custom
        const validTypes = ['1-sharing', '2-sharing', '3-sharing', '4-sharing'];
        if (!validTypes.includes(type.type) && !type.isCustom) {
          throw new Error(`Invalid sharing type: ${type.type}`);
        }

        return {
          type: type.type,
          name: type.name,
          description: type.description || '',
          cost: type.cost,
          isCustom: type.isCustom || false
        };
      });

      // Find and update branch
      const branch = await Branch.findByIdAndUpdate(
        branchId,
        { sharingTypes: validatedSharingTypes },
        { new: true }
      );

      if (!branch) {
        throw new Error('Branch not found');
      }

      console.log(`Branch ${branch.name} sharing types configured successfully`);

      return {
        success: true,
        message: 'Branch sharing types configured successfully',
        data: branch.sharingTypes
      };
    } catch (error) {
      console.error('Error configuring branch sharing types:', error);
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }
}

module.exports = new PGService(); 