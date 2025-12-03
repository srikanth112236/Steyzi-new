const Resident = require('../models/resident.model');
const User = require('../models/user.model');
const PG = require('../models/pg.model');
const Room = require('../models/room.model');
const Branch = require('../models/branch.model');
const XLSX = require('xlsx');
const { calculatePaymentStatus, generatePaymentMonths } = require('../utils/paymentStatus');
const NotificationService = require('./notification.service');

class ResidentService {
  /**
   * Create a new resident
   * @param {Object} residentData - Resident data
   * @param {string} userId - User ID who created the resident
   * @returns {Promise<Object>} - Creation result
   */
  async createResident(residentData, userId) {
    try {
      console.log('🏠 ResidentService: Creating new resident');
      console.log('📊 Resident Data:', residentData);

      // Check for duplicate email if email is provided (system-wide within same PG)
      if (residentData.email && residentData.email.trim()) {
        const cleanEmail = residentData.email.toLowerCase().trim();
        const existingByEmail = await Resident.findOne({
          email: cleanEmail,
          pgId: residentData.pgId,
          isActive: true
        });
        
        if (existingByEmail) {
          return {
            success: false,
            message: 'This email is already registered to another resident',
            statusCode: 409
          };
        }
      }

      // Check for duplicate phone (system-wide within same PG)
      if (residentData.phone && residentData.phone.trim()) {
        const cleanPhone = residentData.phone.replace(/\D/g, '');
        if (cleanPhone.length === 10) {
          const existingByPhone = await Resident.findOne({
            phone: cleanPhone,
            pgId: residentData.pgId,
            isActive: true
          });
          
          if (existingByPhone) {
            return {
              success: false,
              message: 'This phone number is already registered to another resident',
              statusCode: 409
            };
          }
        } else {
          return {
            success: false,
            message: 'Phone number must be exactly 10 digits',
            statusCode: 400
          };
        }
      }

      // Check if room is available if roomId is provided
      if (residentData.roomId && residentData.bedNumber) {
        const isRoomAvailable = await this.checkRoomAvailability(
          residentData.roomId, 
          residentData.bedNumber
        );
        
        if (!isRoomAvailable) {
          return {
            success: false,
            message: 'Room or bed is not available',
            statusCode: 400
          };
        }
      }

      // Convert workAddress object to string if it's an object
      if (residentData.workDetails?.workAddress && typeof residentData.workDetails.workAddress === 'object') {
        const addr = residentData.workDetails.workAddress;
        const addressParts = [];
        if (addr.street) addressParts.push(addr.street);
        if (addr.city) addressParts.push(addr.city);
        if (addr.state) addressParts.push(addr.state);
        if (addr.pincode) addressParts.push(addr.pincode);
        residentData.workDetails.workAddress = addressParts.join(', ');
      }

      // Convert emergencyContact.address object to string if it's an object
      if (residentData.emergencyContact?.address && typeof residentData.emergencyContact.address === 'object') {
        const addr = residentData.emergencyContact.address;
        const addressParts = [];
        if (addr.street) addressParts.push(addr.street);
        if (addr.city) addressParts.push(addr.city);
        if (addr.state) addressParts.push(addr.state);
        if (addr.pincode) addressParts.push(addr.pincode);
        residentData.emergencyContact.address = addressParts.join(', ');
      }

      // Create resident
      const resident = new Resident({
        ...residentData,
        createdBy: userId
      });

      await resident.save();
      console.log('✅ ResidentService: Resident created successfully:', resident._id);

      // Populate related data
      await resident.populate([
        { path: 'roomId', select: 'roomNumber floorId' },
        { path: 'branchId', select: 'name' }
      ]);

      return {
        success: true,
        data: resident,
        message: 'Resident created successfully',
        statusCode: 201
      };
    } catch (error) {
      console.error('❌ ResidentService: Create resident error:', error);
      return {
        success: false,
        message: 'Failed to create resident',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get all residents for a PG
   * @param {string} pgId - PG ID
   * @param {Object} filters - Filter options
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} - Residents list
   */
  async getResidents(pgId, filters = {}, page = 1, limit = 10) {
    try {
      console.log('🔄 ResidentService: Getting residents for PG:', pgId);
      console.log('📊 Filters:', filters);

      const query = { pgId, ...filters };
      
      // Only add isActive: true if not explicitly specified in filters
      if (!filters.hasOwnProperty('isActive')) {
        query.isActive = true;
      }
      
      // Ensure branchId is properly handled if provided
      if (filters.branchId) {
        query.branchId = filters.branchId;
        console.log('🏢 Filtering by branchId:', filters.branchId);
      }
      
      console.log('🔍 Final query:', JSON.stringify(query, null, 2));
      
      const skip = (page - 1) * limit;
      
      const [residents, total] = await Promise.all([
        Resident.find(query)
          .populate('roomId', 'roomNumber floorId')
          .populate('branchId', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Resident.countDocuments(query)
      ]);

      console.log(`📊 Found ${residents.length} residents out of ${total} total`);

      // Get current month and year
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
      const currentYear = currentDate.getFullYear();

      // Check for existing payments for current month for each resident
      const Payment = require('../models/payment.model');
      const residentsWithPaymentStatus = await Promise.all(
        residents.map(async (resident) => {
          // Check if there's already a payment for current month and get its actual status
          const existingPayment = await Payment.findOne({
            residentId: resident._id,
            month: currentMonth,
            year: currentYear,
            isActive: true
          });

          // Convert to plain object and add payment status
          const residentObj = resident.toObject();
          // Only mark as paid if payment exists AND status is 'paid'
          residentObj.hasCurrentMonthPayment = existingPayment && existingPayment.status === 'paid';
          residentObj.currentMonthPaymentStatus = existingPayment ? existingPayment.status : null;
          
          // Update paymentStatus based on actual payment status if payment exists
          if (existingPayment) {
            // If there's a current month payment, use its status
            if (existingPayment.status === 'paid') {
              residentObj.paymentStatus = 'paid';
            } else if (existingPayment.status === 'pending') {
              residentObj.paymentStatus = 'pending';
            }
            // Otherwise keep the resident's existing paymentStatus
          }
          
          return residentObj;
        })
      );

      const totalPages = Math.ceil(total / limit);

      console.log('✅ ResidentService: Found', residentsWithPaymentStatus.length, 'residents');

      return {
        success: true,
        data: {
          residents: residentsWithPaymentStatus,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit
          }
        },
        message: 'Residents retrieved successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ ResidentService: Get residents error:', error);
      return {
        success: false,
        message: 'Failed to get residents',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get resident by ID
   * @param {string} residentId - Resident ID
   * @returns {Promise<Object>} - Resident data
   */
  async getResidentById(residentId) {
    try {
      console.log('🔄 ResidentService: Getting resident by ID:', residentId);

      const resident = await Resident.findById(residentId)
        .populate('roomId', 'roomNumber floorId')
        .populate('branchId', 'name')
        .populate('createdBy', 'firstName lastName');

      if (!resident) {
        return {
          success: false,
          message: 'Resident not found',
          statusCode: 404
        };
      }

      console.log('✅ ResidentService: Resident found:', resident.fullName);

      return {
        success: true,
        data: resident,
        message: 'Resident retrieved successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ ResidentService: Get resident by ID error:', error);
      return {
        success: false,
        message: 'Failed to get resident',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get comprehensive resident details including payments, room history, and allocation
   * @param {string} residentId - Resident ID
   * @returns {Promise<Object>} - Comprehensive resident data
   */
  async getResidentComprehensiveDetails(residentId) {
    try {
      console.log('🔍 ResidentService: Getting comprehensive details for resident:', residentId);
      
      // Get resident with all populated fields
      const resident = await Resident.findById(residentId)
        .populate('roomId', 'roomNumber floorId sharingType cost numberOfBeds')
        .populate('branchId', 'name')
        .populate('pgId', 'name')
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName');
      
      if (!resident) {
        return {
          success: false,
          message: 'Resident not found',
          statusCode: 404
        };
      }

      // Get payment history from Payment model
      const Payment = require('../models/payment.model');
      const payments = await Payment.find({ 
        residentId: residentId, 
        isActive: true 
      }).sort({ paymentDate: -1 });

      // Get allocation letter if exists
      const AllocationLetter = require('../models/allocationLetter.model');
      const allocationLetter = await AllocationLetter.findOne({ 
        residentId: residentId 
      }).sort({ createdAt: -1 });

      // Separate rent payments from advance payments
      const rentPayments = payments.filter(payment => 
        payment.month !== 'Advance' && 
        !payment.notes?.includes('Advance payment') && 
        !payment.notes?.includes('advance payment')
      );
      const advancePayments = payments.filter(payment => 
        payment.month === 'Advance' || 
        payment.notes?.includes('Advance payment') || 
        payment.notes?.includes('advance payment')
      );

      // Calculate payment statistics
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalRentPaid = rentPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalAdvancePaid = advancePayments.reduce((sum, payment) => sum + payment.amount, 0);
      const lastPayment = payments.length > 0 ? payments[0] : null;
      const lastRentPayment = rentPayments.length > 0 ? rentPayments[0] : null;
      
      // Update resident with calculated fields
      const residentData = resident.toObject();
      residentData.paymentHistory = payments;
      residentData.rentPayments = rentPayments;
      residentData.advancePayments = advancePayments;
      residentData.allocationLetter = allocationLetter;
      residentData.totalAmountPaid = totalPaid;
      residentData.totalRentPaid = totalRentPaid;
      residentData.totalAdvancePaid = totalAdvancePaid;
      residentData.lastPaymentDate = lastPayment ? lastPayment.paymentDate : null;
      residentData.lastRentPaymentDate = lastRentPayment ? lastRentPayment.paymentDate : null;
      residentData.paymentCount = payments.length;
      residentData.rentPaymentCount = rentPayments.length;
      residentData.advancePaymentCount = advancePayments.length;

      // Calculate current month payment status (rent payments only)
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
      const currentYear = currentDate.getFullYear();
      
      const currentMonthPayment = rentPayments.find(payment => 
        payment.month === currentMonth && payment.year === currentYear
      );
      
      residentData.currentMonthPayment = currentMonthPayment;
      // Use the actual payment status from the payment record, not just check if it exists
      // If payment exists and status is 'paid', show 'paid', otherwise show the actual status or 'pending'
      if (currentMonthPayment) {
        residentData.paymentStatus = currentMonthPayment.status === 'paid' ? 'paid' : 
                                     currentMonthPayment.status || 'pending';
      } else {
        // Check if resident has a paymentStatus field that might indicate pending payments
        residentData.paymentStatus = resident.paymentStatus || 'pending';
      }

      // Enhanced payment and deposit information for offboarding
      residentData.paymentSummary = {
        // Current month payment status
        currentMonth: {
          month: currentMonth,
          year: currentYear,
          isPaid: !!currentMonthPayment,
          paymentDate: currentMonthPayment ? currentMonthPayment.paymentDate : null,
          amount: currentMonthPayment ? currentMonthPayment.amount : (residentData.cost || 0),
          paymentMethod: currentMonthPayment ? currentMonthPayment.paymentMethod : null,
          status: currentMonthPayment ? 'paid' : 'pending'
        },
        
        // Last 3 months payment history
        recentPayments: payments.slice(0, 3).map(payment => ({
          month: payment.month,
          year: payment.year,
          amount: payment.amount,
          paymentDate: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          status: payment.status
        })),
        
        // Payment statistics
        totalPaid: totalPaid,
        totalRentPaid: totalRentPaid,
        totalAdvancePaid: totalAdvancePaid,
        totalMonths: rentPayments.length, // Only count rent payments, not advance
        totalPayments: payments.length, // Total payments including advance
        averageRentAmount: rentPayments.length > 0 ? Math.round(totalRentPaid / rentPayments.length) : 0,
        averageAmount: payments.length > 0 ? Math.round(totalPaid / payments.length) : 0,
        lastPaymentDate: lastPayment ? lastPayment.paymentDate : null,
        lastRentPaymentDate: lastRentPayment ? lastRentPayment.paymentDate : null,
        
        // Outstanding calculations
        expectedMonthlyRent: residentData.cost || 0,
        pendingAmount: currentMonthPayment ? 0 : (residentData.cost || 0),
        
        // Advance/Deposit information
        advancePayment: {
          amount: residentData.advancePayment?.amount || 0,
          date: residentData.advancePayment?.date || null,
          receiptNumber: residentData.advancePayment?.receiptNumber || null,
          status: residentData.advancePayment?.amount > 0 ? 'paid' : 'pending'
        },
        
        // Security deposit (if stored separately or as advance)
        securityDeposit: {
          amount: residentData.advancePayment?.amount || 0, // Using advance as security deposit
          refundable: true,
          status: residentData.advancePayment?.amount > 0 ? 'collected' : 'pending'
        }
      };

      // Add room switching history if exists
      if (residentData.switchHistory && residentData.switchHistory.length > 0) {
        // Populate performer details for each switch
        for (let switchRecord of residentData.switchHistory) {
          if (switchRecord.performedBy) {
            const performer = await User.findById(switchRecord.performedBy).select('firstName lastName');
            if (performer) {
              switchRecord.performedByDetails = performer;
            }
          }
        }
      }

      console.log('✅ ResidentService: Comprehensive details retrieved successfully');
      
      return {
        success: true,
        data: residentData,
        message: 'Resident comprehensive details retrieved successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ ResidentService: Get comprehensive details error:', error);
      return {
        success: false,
        message: 'Failed to get resident comprehensive details',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Update resident
   * @param {string} residentId - Resident ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User ID who updated the resident
   * @returns {Promise<Object>} - Update result
   */
  async updateResident(residentId, updateData, userId) {
    try {
      console.log('🔄 ResidentService: Updating resident:', residentId);
      console.log('📊 Update Data:', updateData);

      // Get the existing resident to check current values
      const existingResident = await Resident.findById(residentId);
      if (!existingResident) {
        return {
          success: false,
          message: 'Resident not found',
          statusCode: 404
        };
      }

      // Check for duplicate email if email is being changed
      if (updateData.email && updateData.email.trim() && updateData.email.toLowerCase().trim() !== existingResident.email?.toLowerCase()) {
        const existingByEmail = await Resident.findOne({
          email: updateData.email.toLowerCase().trim(),
          pgId: existingResident.pgId,
          isActive: true,
          _id: { $ne: residentId } // Exclude current resident
        });
        
        if (existingByEmail) {
          return {
            success: false,
            message: 'This email is already registered to another resident',
            statusCode: 409
          };
        }
      }

      // Check for duplicate phone if phone is being changed
      if (updateData.phone && updateData.phone.trim()) {
        const cleanPhone = updateData.phone.replace(/\D/g, '');
        const existingCleanPhone = existingResident.phone ? existingResident.phone.replace(/\D/g, '') : '';
        
        if (cleanPhone.length === 10) {
          // Only check for duplicates if phone has actually changed
          if (cleanPhone !== existingCleanPhone) {
            const existingByPhone = await Resident.findOne({
              phone: cleanPhone,
              pgId: existingResident.pgId,
              isActive: true,
              _id: { $ne: residentId } // Exclude current resident
            });
            
            if (existingByPhone) {
              return {
                success: false,
                message: 'This phone number is already registered to another resident',
                statusCode: 409
              };
            }
          }
          // Update the phone to cleaned version
          updateData.phone = cleanPhone;
        } else {
          return {
            success: false,
            message: 'Phone number must be exactly 10 digits',
            statusCode: 400
          };
        }
      }

      // Convert workAddress object to string if it's an object
      if (updateData.workDetails?.workAddress && typeof updateData.workDetails.workAddress === 'object') {
        const addr = updateData.workDetails.workAddress;
        const addressParts = [];
        if (addr.street) addressParts.push(addr.street);
        if (addr.city) addressParts.push(addr.city);
        if (addr.state) addressParts.push(addr.state);
        if (addr.pincode) addressParts.push(addr.pincode);
        updateData.workDetails.workAddress = addressParts.join(', ');
      }

      // Convert emergencyContact.address object to string if it's an object
      if (updateData.emergencyContact?.address && typeof updateData.emergencyContact.address === 'object') {
        const addr = updateData.emergencyContact.address;
        const addressParts = [];
        if (addr.street) addressParts.push(addr.street);
        if (addr.city) addressParts.push(addr.city);
        if (addr.state) addressParts.push(addr.state);
        if (addr.pincode) addressParts.push(addr.pincode);
        updateData.emergencyContact.address = addressParts.join(', ');
      }

      // Update resident
      const updatedResident = await Resident.findByIdAndUpdate(
        residentId,
        {
          ...updateData,
          updatedBy: userId
        },
        { new: true, runValidators: true }
      );

      if (!updatedResident) {
        return {
          success: false,
          message: 'Resident not found',
          statusCode: 404
        };
      }

      // Populate related data
      await updatedResident.populate([
        { path: 'roomId', select: 'roomNumber floorId' },
        { path: 'branchId', select: 'name' }
      ]);

      console.log('✅ ResidentService: Resident updated successfully');
      
      return {
        success: true,
        data: updatedResident,
        message: 'Resident updated successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ ResidentService: Update resident error:', error);
      return {
        success: false,
        message: 'Failed to update resident',
        error: error.message,
        statusCode: 500
      };
    }
  }

  // Legacy method - keeping for backward compatibility
  async updateResidentLegacy(residentId, updateData, userId) {
    try {
      console.log('🔄 ResidentService: Updating resident:', residentId);
      console.log('📊 Update Data:', updateData);

      const resident = await Resident.findById(residentId);
      
      if (!resident) {
        return {
          success: false,
          message: 'Resident not found',
          statusCode: 404
        };
      }

      // Check for duplicate email if email is being changed
      if (updateData.email && updateData.email.trim() && updateData.email.toLowerCase().trim() !== resident.email?.toLowerCase()) {
        const existingByEmail = await Resident.findOne({
          email: updateData.email.toLowerCase().trim(),
          pgId: resident.pgId,
          isActive: true,
          _id: { $ne: residentId } // Exclude current resident
        });
        
        if (existingByEmail) {
          return {
            success: false,
            message: 'This email is already registered to another resident',
            statusCode: 409
          };
        }
      }

      // Check for duplicate phone if phone is being changed
      if (updateData.phone && updateData.phone.trim()) {
        const cleanPhone = updateData.phone.replace(/\D/g, '');
        if (cleanPhone.length === 10 && cleanPhone !== resident.phone) {
          const existingByPhone = await Resident.findOne({
            phone: cleanPhone,
            pgId: resident.pgId,
            isActive: true,
            _id: { $ne: residentId } // Exclude current resident
          });
          
          if (existingByPhone) {
            return {
              success: false,
              message: 'This phone number is already registered to another resident',
              statusCode: 409
            };
          }
        }
      }

      // Convert workAddress object to string if it's an object
      if (updateData.workDetails?.workAddress && typeof updateData.workDetails.workAddress === 'object') {
        const addr = updateData.workDetails.workAddress;
        const addressParts = [];
        if (addr.street) addressParts.push(addr.street);
        if (addr.city) addressParts.push(addr.city);
        if (addr.state) addressParts.push(addr.state);
        if (addr.pincode) addressParts.push(addr.pincode);
        updateData.workDetails.workAddress = addressParts.join(', ');
      }

      // Convert emergencyContact.address object to string if it's an object
      if (updateData.emergencyContact?.address && typeof updateData.emergencyContact.address === 'object') {
        const addr = updateData.emergencyContact.address;
        const addressParts = [];
        if (addr.street) addressParts.push(addr.street);
        if (addr.city) addressParts.push(addr.city);
        if (addr.state) addressParts.push(addr.state);
        if (addr.pincode) addressParts.push(addr.pincode);
        updateData.emergencyContact.address = addressParts.join(', ');
      }

      // Check if room is available if room assignment is being changed
      if (updateData.roomId && updateData.bedNumber) {
        const isRoomAvailable = await this.checkRoomAvailability(
          updateData.roomId, 
          updateData.bedNumber, 
          residentId
        );
        
        if (!isRoomAvailable) {
          return {
            success: false,
            message: 'Room or bed is not available',
            statusCode: 400
          };
        }
      }

      // Update resident
      Object.assign(resident, updateData, { updatedBy: userId });
      await resident.save();

      // Populate related data
      await resident.populate([
        { path: 'roomId', select: 'roomNumber floorId' },
        { path: 'branchId', select: 'name' }
      ]);

      console.log('✅ ResidentService: Resident updated successfully');

      return {
        success: true,
        data: resident,
        message: 'Resident updated successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ ResidentService: Update resident error:', error);
      return {
        success: false,
        message: 'Failed to update resident',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Delete resident (soft delete)
   * @param {string} residentId - Resident ID
   * @param {string} userId - User ID who deleted the resident
   * @returns {Promise<Object>} - Delete result
   */
  async deleteResident(residentId, userId) {
    try {
      console.log('🔄 ResidentService: Deleting resident:', residentId);

      const resident = await Resident.findById(residentId);
      
      if (!resident) {
        return {
          success: false,
          message: 'Resident not found',
          statusCode: 404
        };
      }

      // Soft delete
      const residentName = `${resident.firstName} ${resident.lastName}`;
      resident.isActive = false;
      resident.updatedBy = userId;
      await resident.save();

      console.log('✅ ResidentService: Resident deleted successfully');

      return {
        success: true,
        message: 'Resident deleted successfully',
        data: {
          _id: resident._id,
          name: residentName
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ ResidentService: Delete resident error:', error);
      return {
        success: false,
        message: 'Failed to delete resident',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Check room availability
   * @param {string} roomId - Room ID
   * @param {number} bedNumber - Bed number
   * @param {string} excludeResidentId - Resident ID to exclude from check
   * @returns {Promise<boolean>} - Room availability
   */
  async checkRoomAvailability(roomId, bedNumber, excludeResidentId = null) {
    try {
      const query = {
        roomId,
        bedNumber,
        status: 'active',
        isActive: true
      };

      if (excludeResidentId) {
        query._id = { $ne: excludeResidentId };
      }

      const existingResident = await Resident.findOne(query);
      return !existingResident;
    } catch (error) {
      console.error('❌ ResidentService: Check room availability error:', error);
      return false;
    }
  }

  /**
   * Get residents by room
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} - Residents in room
   */
  async getResidentsByRoom(roomId) {
    try {
      console.log('🔄 ResidentService: Getting residents by room:', roomId);

      const residents = await Resident.find({
        roomId,
        isActive: true
      })
      .populate('roomId', 'roomNumber')
      .sort({ createdAt: -1 });

      console.log('✅ ResidentService: Found', residents.length, 'residents in room');

      return {
        success: true,
        data: residents,
        message: 'Residents retrieved successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ ResidentService: Get residents by room error:', error);
      return {
        success: false,
        message: 'Failed to get residents by room',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get resident statistics
   * @param {string} pgId - PG ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Statistics
   */
  async getResidentStats(pgId, filters = {}) {
    try {
      console.log('🔄 ResidentService: Getting resident stats for PG:', pgId);
      console.log('📊 Filters:', filters);

      const baseQuery = { pgId, isActive: true, ...filters };

      const [
        totalResidents,
        activeResidents,
        pendingResidents,
        movedOutResidents,
        inactiveResidents,
        residentsByStatus,
        residentsByGender
      ] = await Promise.all([
        Resident.countDocuments(baseQuery),
        Resident.countDocuments({ ...baseQuery, status: 'active' }),
        Resident.countDocuments({ ...baseQuery, status: 'pending' }),
        Resident.countDocuments({ ...baseQuery, status: 'moved_out' }),
        Resident.countDocuments({ ...baseQuery, status: 'inactive' }),
        Resident.aggregate([
          { $match: baseQuery },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Resident.aggregate([
          { $match: baseQuery },
          { $group: { _id: '$gender', count: { $sum: 1 } } }
        ])
      ]);

      // Calculate total moved out (inactive + moved_out)
      const totalMovedOut = movedOutResidents + inactiveResidents;

      // Get current month moved out count
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const thisMonthMovedOut = await Resident.countDocuments({
        ...baseQuery,
        status: { $in: ['inactive', 'moved_out'] },
        checkOutDate: { $gte: currentMonth }
      });

      const stats = {
        total: totalResidents,
        active: activeResidents,
        pending: pendingResidents,
        movedOut: totalMovedOut, // Total moved out (inactive + moved_out)
        inactive: inactiveResidents,
        movedOutStatus: movedOutResidents, // Only moved_out status
        thisMonth: thisMonthMovedOut,
        byStatus: residentsByStatus,
        byGender: residentsByGender
      };

      console.log('✅ ResidentService: Stats calculated successfully');
      console.log('📊 Stats:', stats);

      return {
        success: true,
        data: stats,
        message: 'Resident statistics retrieved successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ ResidentService: Get resident stats error:', error);
      return {
        success: false,
        message: 'Failed to get resident statistics',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Search residents
   * @param {string} pgId - PG ID
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} - Search results
   */
  async searchResidents(pgId, searchTerm, filters = {}) {
    try {
      console.log('🔄 ResidentService: Searching residents');
      console.log('📊 Search term:', searchTerm);
      console.log('📊 Filters:', filters);

      const searchQuery = {
        pgId,
        isActive: true,
        ...filters,
        $or: [
          { firstName: { $regex: searchTerm, $options: 'i' } },
          { lastName: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { phone: { $regex: searchTerm, $options: 'i' } },
          { 'workDetails.company': { $regex: searchTerm, $options: 'i' } },
          { 'workDetails.designation': { $regex: searchTerm, $options: 'i' } }
        ]
      };

      // Ensure branchId is properly handled if provided
      if (filters.branchId) {
        searchQuery.branchId = filters.branchId;
        console.log('🏢 Filtering search by branchId:', filters.branchId);
      }

      console.log('🔍 Final search query:', JSON.stringify(searchQuery, null, 2));

      const residents = await Resident.find(searchQuery)
        .populate('roomId', 'roomNumber floorId')
        .populate('branchId', 'name')
        .sort({ createdAt: -1 });

      console.log('✅ ResidentService: Found', residents.length, 'matching residents');

      return {
        success: true,
        data: residents,
        message: 'Search completed successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ ResidentService: Search residents error:', error);
      return {
        success: false,
        message: 'Failed to search residents',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Assign resident to room during onboarding
   * @param {string} residentId - Resident ID
   * @param {string} roomId - Room ID
   * @param {Object} onboardingData - Onboarding data
   * @param {string} userId - User ID who performed the assignment
   * @returns {Promise<Object>} - Assignment result
   */
  async assignResidentToRoom(residentId, roomId, onboardingData, userId) {
    try {
      console.log('🏠 ResidentService: Assigning resident to room during onboarding');
      console.log('📊 Resident ID:', residentId, 'Room ID:', roomId, 'Bed Number:', onboardingData.bedNumber);

      // Get resident and room
      const [resident, room] = await Promise.all([
        Resident.findById(residentId),
        Room.findById(roomId)
      ]);

      if (!resident) {
        return {
          success: false,
          message: 'Resident not found',
          statusCode: 404
        };
      }

      if (!room) {
        return {
          success: false,
          message: 'Room not found',
          statusCode: 404
        };
      }

      // Check if resident is already assigned to a room
      if (resident.roomId) {
        return {
          success: false,
          message: 'Resident is already assigned to a room',
          statusCode: 400
        };
      }

      // Validate bed number
      const bedNumber = onboardingData.bedNumber;
      if (!bedNumber || bedNumber < 1 || bedNumber > room.numberOfBeds) {
        return {
          success: false,
          message: `Invalid bed number. Room has ${room.numberOfBeds} beds (1-${room.numberOfBeds})`,
          statusCode: 400
        };
      }

      // Check if the specific bed is available
      const bed = room.beds.find(b => b.bedNumber === bedNumber);
      if (!bed) {
        return {
          success: false,
          message: `Bed ${bedNumber} not found in room ${room.roomNumber}`,
          statusCode: 400
        };
      }

      if (bed.isOccupied) {
        return {
          success: false,
          message: `Bed ${bedNumber} in Room ${room.roomNumber} is already occupied`,
          statusCode: 400
        };
      }

      // Assign bed to resident and persist room state
      const bedAssigned = room.assignBed(bedNumber, residentId);
      if (!bedAssigned) {
        return {
          success: false,
          message: 'Failed to assign bed to resident',
          statusCode: 400
        };
      }

      // Persist bed occupancy change
      await room.save();

      // Update resident with room assignment
      const updateData = {
        roomId: room._id,
        roomNumber: room.roomNumber,
        bedNumber: onboardingData.bedNumber,
        sharingType: room.sharingType,
        cost: room.cost,
        checkInDate: onboardingData.checkInDate,
        contractStartDate: onboardingData.contractStartDate,
        status: 'active',
        updatedBy: userId
      };

      // Add payment information if provided
      if (onboardingData.advancePayment) {
        updateData.advancePayment = {
          amount: onboardingData.advancePayment.amount || 0,
          date: onboardingData.advancePayment.date ? new Date(onboardingData.advancePayment.date) : new Date(),
          receiptNumber: onboardingData.advancePayment.receiptNumber || `ADV-${Date.now()}`,
          status: onboardingData.advancePayment.status || 'pending'
        };
      }

      if (onboardingData.rentPayment) {
        updateData.rentPayment = {
          amount: onboardingData.rentPayment.amount || 0,
          date: onboardingData.rentPayment.date ? new Date(onboardingData.rentPayment.date) : new Date(),
          receiptNumber: onboardingData.rentPayment.receiptNumber || `RENT-${Date.now()}`,
          status: onboardingData.rentPayment.status || 'pending'
        };
      }

      // Calculate total amount paid
      const advanceAmount = (onboardingData.advancePayment?.amount || 0);
      const rentAmount = (onboardingData.rentPayment?.amount || 0);
      updateData.totalAmountPaid = advanceAmount + rentAmount;

      // Update payment status based on payment status from frontend
      if (onboardingData.paymentStatus) {
        const { advance, rent } = onboardingData.paymentStatus;
        
        // Determine overall payment status
        if (advance === 'paid' && rent === 'paid') {
          updateData.paymentStatus = 'paid';
          updateData.lastPaymentDate = new Date();
        } else if (advance === 'paid' || rent === 'paid') {
          updateData.paymentStatus = 'partial';
          updateData.lastPaymentDate = new Date();
        } else if (advance === 'pending' || rent === 'pending') {
          updateData.paymentStatus = 'pending';
        } else {
          updateData.paymentStatus = 'not_required';
        }
      } else {
        // Fallback to old logic
        if (updateData.totalAmountPaid > 0) {
          updateData.paymentStatus = 'paid';
          updateData.lastPaymentDate = new Date();
        } else {
          updateData.paymentStatus = 'pending';
        }
      }

      const result = await Resident.findByIdAndUpdate(residentId, updateData, { new: true });

      // Create Payment records for advance and rent payments if they exist
      if (result) {
        await this.createOnboardingPayments(result, onboardingData, userId);
      }
      try {
        await NotificationService.createNotification({
          pgId: result.pgId || room.pgId,
          branchId: result.branchId,
          roleScope: 'admin',
          type: 'resident.onboarded',
          title: 'Resident onboarded',
          message: `${result.firstName || 'Resident'} assigned to Room ${result.roomNumber}, Bed ${result.bedNumber}`,
          data: { residentId: result._id, roomId: room._id, branchName: result.branchName }
        });
      } catch (e) { console.error('Notif error (onboard):', e.message); }
      return {
        success: true,
        message: 'Resident assigned successfully',
        data: result,
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ ResidentService: Assign resident to room error:', error);
      return {
        success: false,
        message: 'Failed to assign resident to room',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get room details with bed information
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} - Room details with beds
   */
  async getRoomWithBeds(roomId) {
    try {
      console.log('🏠 ResidentService: Getting room details with beds');
      console.log('📊 Room ID:', roomId);

      const room = await Room.findById(roomId).populate([
        { path: 'floorId', select: 'floorNumber name' },
        { path: 'pgId', select: 'name' }
      ]);

      if (!room) {
        return {
          success: false,
          message: 'Room not found',
          statusCode: 404
        };
      }

      // Get all beds with resident information
      const bedsWithResidents = await Promise.all(
        room.beds.map(async (bed) => {
          if (bed.isOccupied && bed.occupiedBy) {
            // Populate resident information for occupied beds
            const resident = await Resident.findById(bed.occupiedBy).select('firstName lastName status checkOutDate noticeDays');
            return {
              ...bed.toObject(),
              resident: resident ? {
                firstName: resident.firstName,
                lastName: resident.lastName,
                status: resident.status,
                checkOutDate: resident.checkOutDate,
                noticeDays: resident.noticeDays
              } : null
            };
          } else {
            return {
              ...bed.toObject(),
              resident: null
            };
          }
        })
      );

      // Calculate counts
      const occupiedBeds = bedsWithResidents.filter(bed => bed.isOccupied);
      const availableBeds = bedsWithResidents.filter(bed => !bed.isOccupied);

      // Create the response structure
      const populatedRoom = room.toObject();
      populatedRoom.beds = bedsWithResidents;
      populatedRoom.availableBedsCount = availableBeds.length;
      populatedRoom.occupiedBedsCount = occupiedBeds.length;

      console.log('✅ ResidentService: Room details retrieved successfully');

      return {
        success: true,
        data: populatedRoom,
        message: 'Room details retrieved successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ ResidentService: Get room with beds error:', error);
      return {
        success: false,
        message: 'Failed to get room details',
        error: error.message,
        statusCode: 200
      };
    }
  }

  /**
   * Export residents data
   * @param {string} pgId - PG ID
   * @param {string} format - Export format (csv, pdf)
   * @returns {Promise<Object>} - Export result
   */
  async exportResidents(pgId, format = 'csv') {
    try {
      console.log('🔄 ResidentService: Exporting residents data');
      console.log('📊 Format:', format);

      const residents = await Resident.find({ pgId, isActive: true })
        .populate('roomId', 'roomNumber')
        .populate('branchId', 'name')
        .sort({ createdAt: -1 });

      // Transform data for export
      const exportData = residents.map(resident => ({
        'Full Name': resident.fullName,
        'Email': resident.email,
        'Phone': resident.phone,
        'Gender': resident.gender,
        'Age': resident.age,
        'Company': resident.workDetails?.company || '',
        'Designation': resident.workDetails?.designation || '',
        'Room Number': resident.roomNumber || '',
        'Status': resident.status,
        'Check-in Date': resident.checkInDate ? new Date(resident.checkInDate).toLocaleDateString() : '',
        'Rent Amount': resident.rentAmount,
        'Payment Cycle': resident.paymentCycle
      }));

      console.log('✅ ResidentService: Export data prepared');

      return {
        success: true,
        data: {
          residents: exportData,
          format,
          totalRecords: residents.length
        },
        message: 'Export data prepared successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ ResidentService: Export residents error:', error);
      return {
        success: false,
        message: 'Failed to export residents',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Calculate and update payment status for a resident
   * @param {string} residentId - Resident ID
   * @returns {Promise<Object>} - Updated resident with payment status
   */
  async calculateAndUpdatePaymentStatus(residentId) {
    try {
      console.log('💰 ResidentService: Calculating payment status for resident:', residentId);
      
      const resident = await Resident.findById(residentId);
      if (!resident) {
        return {
          success: false,
          message: 'Resident not found',
          statusCode: 404
        };
      }

      // Calculate current payment status
      const paymentStatus = calculatePaymentStatus(
        resident.checkInDate,
        resident.lastPaymentDate
      );

      // Update resident's payment status
      await Resident.findByIdAndUpdate(residentId, {
        paymentStatus: paymentStatus.status
      });

      console.log('✅ ResidentService: Payment status updated to:', paymentStatus.status);
      
      return {
        success: true,
        data: {
          ...resident.toObject(),
          paymentStatus: paymentStatus.status,
          paymentDetails: paymentStatus
        },
        message: 'Payment status updated successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ ResidentService: Calculate payment status error:', error);
      return {
        success: false,
        message: 'Failed to calculate payment status',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Update payment status for all residents
   * @param {string} pgId - PG ID
   * @returns {Promise<Object>} - Update result
   */
  async updateAllResidentsPaymentStatus(pgId) {
    try {
      console.log('💰 ResidentService: Updating payment status for all residents in PG:', pgId);
      
      const residents = await Resident.find({ pgId, isActive: true });
      let updatedCount = 0;
      
      for (const resident of residents) {
        const paymentStatus = calculatePaymentStatus(
          resident.checkInDate,
          resident.lastPaymentDate
        );
        
        if (resident.paymentStatus !== paymentStatus.status) {
          await Resident.findByIdAndUpdate(resident._id, {
            paymentStatus: paymentStatus.status
          });
          updatedCount++;
        }
      }
      
      console.log('✅ ResidentService: Updated payment status for', updatedCount, 'residents');
      
      return {
        success: true,
        data: { updatedCount },
        message: `Updated payment status for ${updatedCount} residents`,
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ ResidentService: Update all residents payment status error:', error);
      return {
        success: false,
        message: 'Failed to update payment status for all residents',
        error: error.message,
        statusCode: 500
      };
    }
  }

  async bulkUploadResidents(uploadData, userId) {
    try {
      console.log('🚀 ResidentService: Starting bulk upload for user:', userId);
      console.log('📊 Upload data:', uploadData);
      
      const { file, branchId } = uploadData;
      
      if (!file || !branchId) {
        console.error('❌ Missing required data:', { file: !!file, branchId: !!branchId });
        return {
          success: false,
          message: 'Missing required fields: file and branchId',
          statusCode: 400
        };
      }
      
      // Validate user and get PG
      const user = await User.findById(userId);
      if (!user) {
        console.error('❌ User not found:', userId);
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }
      
      console.log('👤 User found:', { userId: user._id, pgId: user.pgId, branchId: user.branchId });
      
      // Get PG for the user using user.pgId
      const pg = await PG.findById(user.pgId);
      if (!pg) {
        console.error('❌ PG not found for user:', userId, 'pgId:', user.pgId);
        return {
          success: false,
          message: 'PG not found for user',
          statusCode: 404
        };
      }
      
      console.log('🏠 PG found:', { pgId: pg._id, pgName: pg.name });
      
      // Validate branchId exists
      const branch = await Branch.findById(branchId);
      if (!branch) {
        console.error('❌ Branch not found:', branchId);
        return {
          success: false,
          message: 'Branch not found',
          statusCode: 404
        };
      }
      
      console.log('🏢 Branch found:', { branchId: branch._id, branchName: branch.name });
      
      // Read Excel file
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`📊 Excel data parsed: ${jsonData.length} rows`);
      
      if (jsonData.length === 0) {
        return {
          success: false,
          message: 'No data found in file',
          statusCode: 400
        };
      }
      
      let uploadedCount = 0;
      let skippedCount = 0;
      let errors = [];
      let duplicates = [];
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 2; // Excel is 1-indexed, skip header
        
        try {
          console.log(`📝 Processing row ${rowNumber}:`, { firstName: row.firstName, lastName: row.lastName, email: row.email });
          
          // Validate required fields
          if (!row.firstName || !row.lastName || !row.email || !row.phone) {
            errors.push(`Row ${rowNumber}: Missing required fields (firstName, lastName, email, phone)`);
            continue;
          }
          
          // Validate email format
          const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
          if (!emailRegex.test(row.email)) {
            errors.push(`Row ${rowNumber}: Invalid email format "${row.email}"`);
            continue;
          }
          
          // Validate phone format (10 digits only)
          const phoneRegex = /^[0-9]{10}$/;
          
          // Clean phone number - remove country codes and non-digits
          let cleanPhone = row.phone.toString().replace(/[^0-9]/g, '');
          
          // If phone number starts with 91 and has 12 digits, remove the country code
          if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
            cleanPhone = cleanPhone.substring(2);
          }
          
          if (!phoneRegex.test(cleanPhone)) {
            errors.push(`Row ${rowNumber}: Invalid phone number "${row.phone}". Must be exactly 10 digits`);
            continue;
          }
          
          // Use cleaned phone number
          const phoneNumber = cleanPhone;
          
          // Validate date of birth
          if (!row.dateOfBirth) {
            errors.push(`Row ${rowNumber}: Date of birth is required`);
            continue;
          }
          
          let dateOfBirth = new Date(row.dateOfBirth);
          if (isNaN(dateOfBirth.getTime())) {
            errors.push(`Row ${rowNumber}: Invalid date of birth "${row.dateOfBirth}"`);
            continue;
          }
          
          // Validate gender
          const validGenders = ['male', 'female', 'other'];
          if (!row.gender || !validGenders.includes(row.gender.toLowerCase())) {
            errors.push(`Row ${rowNumber}: Invalid gender "${row.gender}". Must be male, female, or other`);
            continue;
          }
          
          // Validate permanent address fields
          if (!row.permanentStreet || !row.permanentCity || !row.permanentState || !row.permanentPincode) {
            errors.push(`Row ${rowNumber}: Missing permanent address fields (permanentStreet, permanentCity, permanentState, permanentPincode)`);
            continue;
          }
          
          // Validate pincode format (6 digits)
          const pincodeRegex = /^\d{6}$/;
          if (!pincodeRegex.test(row.permanentPincode)) {
            errors.push(`Row ${rowNumber}: Invalid pincode "${row.permanentPincode}". Must be exactly 6 digits`);
            continue;
          }
          
          // Validate emergency contact fields
          if (!row.emergencyName || !row.emergencyRelationship || !row.emergencyPhone || !row.emergencyAddress) {
            errors.push(`Row ${rowNumber}: Missing emergency contact fields (emergencyName, emergencyRelationship, emergencyPhone, emergencyAddress)`);
            continue;
          }
          
          // Validate emergency contact phone
          if (!phoneRegex.test(row.emergencyPhone)) {
            errors.push(`Row ${rowNumber}: Invalid emergency contact phone "${row.emergencyPhone}". Must be exactly 10 digits`);
            continue;
          }
          
          // Clean emergency contact phone
          let cleanEmergencyPhone = row.emergencyPhone.toString().replace(/[^0-9]/g, '');
          if (cleanEmergencyPhone.startsWith('91') && cleanEmergencyPhone.length === 12) {
            cleanEmergencyPhone = cleanEmergencyPhone.substring(2);
          }
          
          if (!phoneRegex.test(cleanEmergencyPhone)) {
            errors.push(`Row ${rowNumber}: Invalid emergency contact phone "${row.emergencyPhone}". Must be exactly 10 digits`);
            continue;
          }
          
          // Validate check-in date
          if (!row.checkInDate) {
            errors.push(`Row ${rowNumber}: Check-in date is required`);
            continue;
          }
          
          let checkInDate = new Date(row.checkInDate);
          if (isNaN(checkInDate.getTime())) {
            errors.push(`Row ${rowNumber}: Invalid check-in date "${row.checkInDate}"`);
            continue;
          }
          
          // Validate contract start date
          if (!row.contractStartDate) {
            errors.push(`Row ${rowNumber}: Contract start date is required`);
            continue;
          }
          
          let contractStartDate = new Date(row.contractStartDate);
          if (isNaN(contractStartDate.getTime())) {
            errors.push(`Row ${rowNumber}: Invalid contract start date "${row.contractStartDate}"`);
            continue;
          }
          
          // Check for duplicates by email
          const existingByEmail = await Resident.findOne({ 
            email: row.email.toLowerCase(), 
            pgId: pg._id, 
            isActive: true 
          });
          
          if (existingByEmail) {
            duplicates.push({
              row: rowNumber,
              name: `${row.firstName} ${row.lastName}`,
              type: 'resident',
              reason: `Email "${row.email}" already exists`
            });
            skippedCount++;
            continue;
          }
          
          // Check for duplicates by phone
          const existingByPhone = await Resident.findOne({ 
            phone: phoneNumber, 
            pgId: pg._id, 
            isActive: true 
          });
          
          if (existingByPhone) {
            duplicates.push({
              row: rowNumber,
              name: `${row.firstName} ${row.lastName}`,
              type: 'resident',
              reason: `Phone "${row.phone}" already exists`
            });
            skippedCount++;
            continue;
          }
          
          // Validate status
          const validStatuses = ['active', 'inactive', 'moved_out', 'pending', 'notice_period'];
          const status = row.status ? row.status.toLowerCase() : 'active'; // Default to active instead of pending
          if (!validStatuses.includes(status)) {
            errors.push(`Row ${rowNumber}: Invalid status "${row.status}". Must be active, inactive, moved_out, pending, or notice_period`);
            continue;
          }
          
          console.log(`📝 Row ${rowNumber}: Status set to "${status}"`);
          
          // Create resident data with all required fields
          const residentData = {
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            email: row.email.toLowerCase().trim(),
            phone: phoneNumber,
            dateOfBirth: dateOfBirth,
            gender: row.gender.toLowerCase(),
            permanentAddress: {
              street: row.permanentStreet.trim(),
              city: row.permanentCity.trim(),
              state: row.permanentState.trim(),
              pincode: row.permanentPincode.trim()
            },
            emergencyContact: {
              name: row.emergencyName.trim(),
              relationship: row.emergencyRelationship.trim(),
              phone: cleanEmergencyPhone,
              address: row.emergencyAddress.trim()
            },
            checkInDate: checkInDate,
            contractStartDate: contractStartDate,
            status: status,
            pgId: pg._id,
            branchId: branchId, // Use the branchId from upload data
            createdBy: userId,
            isActive: true // Ensure resident is active
          };
          
          console.log(`📝 Creating resident with data:`, {
            firstName: residentData.firstName,
            lastName: residentData.lastName,
            email: residentData.email,
            phone: residentData.phone,
            pgId: residentData.pgId,
            branchId: residentData.branchId
          });
          
          // Add optional fields if provided
          if (row.alternatePhone) {
            let cleanAlternatePhone = row.alternatePhone.toString().replace(/[^0-9]/g, '');
            if (cleanAlternatePhone.startsWith('91') && cleanAlternatePhone.length === 12) {
              cleanAlternatePhone = cleanAlternatePhone.substring(2);
            }
            
            if (phoneRegex.test(cleanAlternatePhone)) {
              residentData.alternatePhone = cleanAlternatePhone;
            } else {
              errors.push(`Row ${rowNumber}: Invalid alternate phone "${row.alternatePhone}". Must be exactly 10 digits`);
              continue;
            }
          }
          
          if (row.workCompany) {
            residentData.workDetails = {
              company: row.workCompany.trim()
            };
            
            if (row.workDesignation) {
              residentData.workDetails.designation = row.workDesignation.trim();
            }
            
            if (row.workAddress) {
              residentData.workDetails.workAddress = row.workAddress.trim();
            }
            
            if (row.workPhone) {
              let cleanWorkPhone = row.workPhone.toString().replace(/[^0-9]/g, '');
              if (cleanWorkPhone.startsWith('91') && cleanWorkPhone.length === 12) {
                cleanWorkPhone = cleanWorkPhone.substring(2);
              }
              if (phoneRegex.test(cleanWorkPhone)) {
                residentData.workDetails.workPhone = cleanWorkPhone;
              } else {
                errors.push(`Row ${rowNumber}: Invalid work phone "${row.workPhone}". Must be exactly 10 digits`);
                continue;
              }
            }
            
            if (row.workEmail) {
              if (emailRegex.test(row.workEmail)) {
                residentData.workDetails.workEmail = row.workEmail.toLowerCase().trim();
              } else {
                errors.push(`Row ${rowNumber}: Invalid work email "${row.workEmail}"`);
                continue;
              }
            }
            
            if (row.workSalary) {
              const salary = parseFloat(row.workSalary);
              if (!isNaN(salary) && salary >= 0) {
                residentData.workDetails.salary = salary;
              } else {
                errors.push(`Row ${rowNumber}: Invalid salary "${row.workSalary}". Must be a positive number`);
                continue;
              }
            }
            
            if (row.workJoiningDate) {
              const joiningDate = new Date(row.workJoiningDate);
              if (!isNaN(joiningDate.getTime())) {
                residentData.workDetails.joiningDate = joiningDate;
              } else {
                errors.push(`Row ${rowNumber}: Invalid work joining date "${row.workJoiningDate}"`);
                continue;
              }
            }
          }
          
          if (row.contractEndDate) {
            const contractEndDate = new Date(row.contractEndDate);
            if (!isNaN(contractEndDate.getTime())) {
              residentData.contractEndDate = contractEndDate;
            } else {
              errors.push(`Row ${rowNumber}: Invalid contract end date "${row.contractEndDate}"`);
              continue;
            }
          }
          
          if (row.checkOutDate) {
            const checkOutDate = new Date(row.checkOutDate);
            if (!isNaN(checkOutDate.getTime())) {
              residentData.checkOutDate = checkOutDate;
            } else {
              errors.push(`Row ${rowNumber}: Invalid check-out date "${row.checkOutDate}"`);
              continue;
            }
          }
          
          // Create new resident
          const resident = new Resident(residentData);
          
          try {
            await resident.save();
            
            console.log(`✅ Resident created successfully:`, {
              residentId: resident._id,
              firstName: resident.firstName,
              lastName: resident.lastName,
              email: resident.email,
              phone: resident.phone,
              pgId: resident.pgId,
              branchId: resident.branchId,
              status: resident.status
            });
            
            uploadedCount++;
          } catch (saveError) {
            console.error(`❌ Error saving resident for row ${rowNumber}:`, saveError);
            errors.push(`Row ${rowNumber}: Failed to save resident - ${saveError.message}`);
            continue;
          }
          
        } catch (error) {
          console.error(`❌ Error processing row ${rowNumber}:`, error);
          errors.push(`Row ${rowNumber}: ${error.message}`);
        }
      }
      
      console.log(`📊 Bulk upload completed: ${uploadedCount} uploaded, ${skippedCount} skipped, ${errors.length} errors`);
      
      // Verify data was actually saved by querying the database
      const verificationQuery = {
        pgId: pg._id,
        branchId: branchId,
        isActive: true
      };
      
      // Get residents created in the last 5 minutes to verify our upload
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      verificationQuery.createdAt = { $gte: fiveMinutesAgo };
      
      const verifiedResidents = await Resident.find(verificationQuery).sort({ createdAt: -1 });
      console.log(`🔍 Verification: Found ${verifiedResidents.length} residents created in the last 5 minutes`);
      
      // Calculate statistics for residents
      let residentStats = null;
      if (uploadedCount > 0) {
        const createdResidents = await Resident.find({ 
          pgId: pg._id, 
          branchId: branchId, // Filter by branchId as well
          createdBy: userId, 
          isActive: true 
        }).sort({ createdAt: -1 }).limit(uploadedCount);
        
        console.log(`📊 Found ${createdResidents.length} created residents for stats`);
        
        const genderBreakdown = {};
        let activeCount = 0;
        let pendingCount = 0;
        let maleCount = 0;
        let femaleCount = 0;
        
        createdResidents.forEach(resident => {
          const gender = resident.gender || 'other';
          genderBreakdown[gender] = (genderBreakdown[gender] || 0) + 1;
          
          if (resident.status === 'active') activeCount++;
          if (resident.status === 'pending') pendingCount++;
          if (resident.gender === 'male') maleCount++;
          if (resident.gender === 'female') femaleCount++;
        });
        
        residentStats = {
          totalResidents: uploadedCount,
          activeCount,
          pendingCount,
          maleCount,
          femaleCount,
          genderBreakdown
        };
      }
      
      return {
        success: true,
        data: {
          uploadedCount,
          totalRows: jsonData.length,
          errors: errors.length > 0 ? errors : null,
          residentStats,
          skippedCount,
          duplicates: duplicates.length > 0 ? duplicates : null,
          verification: {
            verifiedCount: verifiedResidents.length,
            expectedCount: uploadedCount,
            verificationPassed: verifiedResidents.length === uploadedCount
          }
        },
        message: `Successfully uploaded ${uploadedCount} residents${verifiedResidents.length !== uploadedCount ? ` (Verification: ${verifiedResidents.length} found in DB)` : ''}`,
        statusCode: 200
      };
      
    } catch (error) {
      console.error('❌ Error in bulkUploadResidents:', error);
      return {
        success: false,
        message: 'Failed to bulk upload residents',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Vacate a resident from their room
   */
  async vacateResident(residentId, vacationData) {
    try {
      const { vacationType, noticeDays, vacationDate } = vacationData;
      
      // Find the resident
      const resident = await Resident.findById(residentId);
      if (!resident) {
        throw new Error('Resident not found');
      }

      // Check if resident is assigned to a room
      if (!resident.roomId || !resident.bedNumber) {
        throw new Error('Resident is not assigned to any room');
      }

      if (vacationType === 'immediate') {
        // Immediate vacation - update resident status to inactive
        await Resident.findByIdAndUpdate(residentId, {
          status: 'inactive',
          isActive: false,
          roomId: null,
          bedNumber: null,
          sharingTypeId: null,
          vacationDate: null,
          checkOutDate: new Date(),
          noticeDays: null
        });

        // Update bed status on the room document (schema fields: isOccupied, occupiedBy)
        const vacateRoom = await Room.findById(resident.roomId);
        if (vacateRoom) {
          const bed = vacateRoom.beds.find(b => String(b.bedNumber) === String(resident.bedNumber));
          if (bed) {
            bed.isOccupied = false;
            bed.occupiedBy = null;
            bed.occupiedAt = null;
            await vacateRoom.save();
          }
        }

        try {
          await NotificationService.createNotification({
            pgId: resident.pgId,
            branchId: resident.branchId,
            roleScope: 'admin',
            type: 'resident.vacated',
            title: 'Resident vacated',
            message: `${resident.firstName || 'Resident'} moved out from Room ${resident.roomNumber}`,
            data: { residentId: resident._id, branchName: resident.branchName }
          });
        } catch (e) { console.error('Notif error (vacate immediate):', e.message); }
        return {
          success: true,
          message: 'Resident vacated immediately. Room and bed are now available.',
          data: { vacationType: 'immediate' }
        };

      } else if (vacationType === 'notice') {
        // Validate notice period
        if (!noticeDays || noticeDays < 1 || noticeDays > 30) {
          throw new Error('Notice days must be between 1 and 30 days');
        }

        if (!vacationDate) {
          throw new Error('Vacation date is required for notice period');
        }

        // Schedule vacation - update resident status to notice_period
        await Resident.findByIdAndUpdate(residentId, {
          status: 'notice_period',
          vacationDate: new Date(vacationDate),
          noticeDays: noticeDays
        });

        try {
          await NotificationService.createNotification({
            pgId: resident.pgId,
            branchId: resident.branchId,
            roleScope: 'admin',
            type: 'resident.notice',
            title: 'Resident vacating (notice period)',
            message: `${resident.firstName || 'Resident'} scheduled to vacate on ${new Date(vacationDate).toLocaleDateString()}`,
            data: { residentId: resident._id, vacationDate, noticeDays, branchName: resident.branchName }
          });
        } catch (e) { console.error('Notif error (vacate notice):', e.message); }
        return {
          success: true,
          message: `Resident will be vacated on ${new Date(vacationDate).toLocaleDateString()} (${noticeDays} days notice).`,
          data: { 
            vacationType: 'notice',
            vacationDate: vacationDate,
            noticeDays: noticeDays
          }
        };
      }

      throw new Error('Invalid vacation type');

    } catch (error) {
      console.error('Error vacating resident:', error);
      throw error;
    }
  }

  /**
   * Process scheduled vacations (cron job)
   */
  async processScheduledVacations() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find residents whose vacation date has passed
      const overdueResidents = await Resident.find({
        status: 'notice_period',
        vacationDate: { $lte: today },
        isActive: true
      });

      console.log(`Found ${overdueResidents.length} residents with overdue vacation dates`);

      let processedCount = 0;
      for (const resident of overdueResidents) {
        try {
          // Update resident status to inactive (moved out)
          await Resident.findByIdAndUpdate(resident._id, {
            status: 'inactive',
            isActive: false,
            roomId: null,
            bedNumber: null,
            sharingTypeId: null,
            vacationDate: null,
            checkOutDate: new Date(),
            noticeDays: null
          });

          // Update room occupancy if room exists
          if (resident.roomId) {
            await Room.findByIdAndUpdate(resident.roomId, {
              $inc: { occupiedBeds: -1 }
            });

            // Update bed status
            await Room.updateOne(
              { _id: resident.roomId, 'beds.bedNumber': resident.bedNumber },
              { $set: { 'beds.$.isOccupied': false, 'beds.$.residentId': null } }
            );
          }

          processedCount++;
          console.log(`Processed vacation for resident: ${resident.firstName} ${resident.lastName}`);
        } catch (error) {
          console.error(`Error processing vacation for resident ${resident._id}:`, error);
        }
      }

      return {
        success: true,
        message: `Processed ${processedCount} overdue vacations`,
        data: { processedCount, totalFound: overdueResidents.length }
      };

    } catch (error) {
      console.error('Error processing scheduled vacations:', error);
      throw error;
    }
  }

  /**
   * Get overdue vacations
   */
  async getOverdueVacations() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueResidents = await Resident.find({
        status: 'notice_period',
        vacationDate: { $lte: today },
        isActive: true
      }).populate('roomId', 'roomNumber');

      return {
        success: true,
        data: { overdueResidents }
      };
    } catch (error) {
      console.error('Error getting overdue vacations:', error);
      throw error;
    }
  }

  /**
   * Switch resident between rooms/beds
   * @param {string} residentId - Resident ID
   * @param {string} newRoomId - New room ID
   * @param {string} newBedNumber - New bed number
   * @param {Object} switchData - Additional switch data
   * @param {string} userId - User ID who performed the switch
   * @returns {Promise<Object>} - Switch result
   */
  async switchResidentRoom(residentId, newRoomId, newBedNumber, switchData = {}, userId) {
    try {
      console.log('🔄 ResidentService: Switching resident room');
      console.log('📊 Resident ID:', residentId, 'New Room ID:', newRoomId, 'New Bed:', newBedNumber);

      // Get resident and validate
      const resident = await Resident.findById(residentId);
      if (!resident) {
        return {
          success: false,
          message: 'Resident not found',
          statusCode: 404
        };
      }

      // Get new room and validate
      const newRoom = await Room.findById(newRoomId);
      if (!newRoom) {
        return {
          success: false,
          message: 'New room not found',
          statusCode: 404
        };
      }

      // Check if bed is available in new room
      const targetBed = newRoom.beds.find(bed => bed.bedNumber === newBedNumber);
      if (!targetBed || targetBed.isOccupied) {
        return {
          success: false,
          message: `Bed ${newBedNumber} is not available in room ${newRoom.roomNumber}`,
          statusCode: 400
        };
      }

      // Store current room info for history
      const currentRoomInfo = {
        roomId: resident.roomId,
        roomNumber: resident.roomNumber,
        bedNumber: resident.bedNumber,
        sharingType: resident.sharingType,
        cost: resident.cost
      };

      // Update old room bed status if resident was in a room
      if (resident.roomId) {
        const oldRoom = await Room.findById(resident.roomId);
        if (oldRoom) {
          const oldBed = oldRoom.beds.find(bed => bed.bedNumber === resident.bedNumber);
          if (oldBed) {
            oldBed.isOccupied = false;
            oldBed.occupiedBy = null;
            oldBed.occupiedAt = null;
            await oldRoom.save();
            console.log('✅ Freed up old bed:', oldBed.bedNumber);
          }
        }
      }

      // Update new room bed status
      targetBed.isOccupied = true;
      targetBed.occupiedBy = residentId;
      targetBed.occupiedAt = new Date();
      await newRoom.save();
      console.log('✅ Occupied new bed:', targetBed.bedNumber);

      // Update resident information
      const updateData = {
        roomId: newRoom._id,
        roomNumber: newRoom.roomNumber,
        bedNumber: newBedNumber,
        sharingType: newRoom.sharingType,
        cost: newRoom.cost,
        updatedBy: userId
      };

      // Add switch history if tracking is enabled
      if (switchData.trackHistory !== false) {
        const switchRecord = {
          fromRoom: currentRoomInfo.roomNumber || 'Unassigned',
          fromBed: currentRoomInfo.bedNumber || 'N/A',
          toRoom: newRoom.roomNumber,
          toBed: newBedNumber,
          switchDate: new Date(),
          reason: switchData.reason || 'Room switch',
          performedBy: userId
        };

        updateData.$push = { switchHistory: switchRecord };
      }

      // Update resident
      const updatedResident = await Resident.findByIdAndUpdate(
        residentId,
        updateData,
        { new: true }
      ).populate('roomId', 'roomNumber floorId');

      // Generate new allocation letter for the room switch
      try {
        const AllocationLetter = require('../models/allocationLetter.model');
        const newAllocationLetter = new AllocationLetter({
          residentId: residentId,
          fileName: `allocation_${resident.firstName}_${resident.lastName}_${newRoom.roomNumber}_${newBedNumber}_${Date.now()}.pdf`,
          filePath: `/uploads/allocation-letters/allocation_${resident.firstName}_${resident.lastName}_${newRoom.roomNumber}_${newBedNumber}_${Date.now()}.pdf`,
          allocationData: {
            resident: {
              firstName: resident.firstName,
              lastName: resident.lastName,
              phone: resident.phone,
              email: resident.email,
              _id: resident._id
            },
            sharingType: {
              id: newRoom.sharingType,
              name: newRoom.sharingType,
              cost: newRoom.cost
            },
            room: {
              _id: newRoom._id,
              roomNumber: newRoom.roomNumber,
              floor: {
                name: newRoom.floorId?.name || 'N/A'
              }
            },
            bedNumber: newBedNumber,
            onboardingDate: resident.checkInDate,
            allocationDate: new Date()
          },
          generatedBy: userId,
          status: 'active'
        });

        await newAllocationLetter.save();
        console.log('✅ New allocation letter generated for room switch');
      } catch (letterError) {
        console.error('⚠️ Error generating allocation letter for room switch:', letterError);
        // Don't fail the room switch if letter generation fails
      }

      const updated = await Resident.findById(residentId);
      try {
        await NotificationService.createNotification({
          pgId: updated.pgId,
          branchId: updated.branchId,
          roleScope: 'admin',
          type: 'resident.switched',
          title: 'Room switch completed',
          message: `${updated.firstName || 'Resident'} moved to Room ${updated.roomNumber}, Bed ${updated.bedNumber}`,
          data: { residentId: updated._id, newRoomId, newBedNumber, branchName: updated.branchName }
        });
      } catch (e) { console.error('Notif error (switch):', e.message); }
      console.log('✅ Resident switched successfully');
      console.log('📊 New room:', newRoom.roomNumber, 'New bed:', newBedNumber);

      return {
        success: true,
        data: {
          resident: updatedResident,
          switchDetails: {
            fromRoom: currentRoomInfo.roomNumber || 'Unassigned',
            fromBed: currentRoomInfo.bedNumber || 'N/A',
            toRoom: newRoom.roomNumber,
            toBed: newBedNumber,
            sharingType: newRoom.sharingType,
            cost: newRoom.cost,
            switchDate: new Date()
          }
        },
        message: 'Room switched successfully',
        statusCode: 200
      };

    } catch (error) {
      console.error('❌ ResidentService: Switch resident room error:', error);
      return {
        success: false,
        message: 'Failed to switch resident room',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get available rooms for switching
   * @param {string} pgId - PG ID
   * @param {string} currentRoomId - Current room ID (to exclude)
   * @param {string} sharingType - Filter by sharing type
   * @returns {Promise<Object>} - Available rooms
   */
  async getAvailableRoomsForSwitch(pgId, currentRoomId = null, sharingType = null) {
    try {
      console.log('🔍 ResidentService: Getting available rooms for switching');
      console.log('📊 PG ID:', pgId, 'Current Room ID:', currentRoomId, 'Sharing Type:', sharingType);

      const query = { 
        pgId, 
        isActive: true,
        'beds.isOccupied': false // Only rooms with available beds
      };

      // Exclude current room if provided
      if (currentRoomId) {
        query._id = { $ne: currentRoomId };
      }

      // Filter by sharing type if provided
      if (sharingType) {
        query.sharingType = sharingType;
      }

      console.log('🔍 Query:', JSON.stringify(query, null, 2));

      const rooms = await Room.find(query)
        .populate('floorId', 'name')
        .populate('branchId', 'name')
        .lean();

      // Process rooms to show available beds
      const processedRooms = rooms.map(room => {
        const availableBeds = room.beds.filter(bed => !bed.isOccupied);
        const occupiedBeds = room.beds.filter(bed => bed.isOccupied);
        
        return {
          ...room,
          availableBeds: availableBeds.map(bed => ({
            bedNumber: bed.bedNumber,
            isAvailable: true,
            bedId: bed._id
          })),
          occupiedBeds: occupiedBeds.map(bed => ({
            bedNumber: bed.bedNumber,
            isAvailable: false,
            occupiedBy: bed.occupiedBy
          })),
          availableBedCount: availableBeds.length,
          occupiedBedCount: occupiedBeds.length,
          occupancyRate: room.beds.length > 0 ? (occupiedBeds.length / room.beds.length) * 100 : 0
        };
      });

      // Sort by availability (most available first)
      processedRooms.sort((a, b) => b.availableBedCount - a.availableBedCount);

      console.log('✅ Found', processedRooms.length, 'available rooms for switching');

      return {
        success: true,
        data: processedRooms,
        message: `Found ${processedRooms.length} available rooms for switching`,
        statusCode: 200
      };

    } catch (error) {
      console.error('❌ ResidentService: Get available rooms error:', error);
      return {
        success: false,
        message: 'Failed to get available rooms for switching',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get room switching history for a resident
   * @param {string} residentId - Resident ID
   * @returns {Promise<Object>} - Switch history
   */
  async getResidentSwitchHistory(residentId) {
    try {
      console.log('📚 ResidentService: Getting switch history for resident:', residentId);

      const resident = await Resident.findById(residentId);
      if (!resident) {
        return {
          success: false,
          message: 'Resident not found',
          statusCode: 404
        };
      }

      // If switchHistory field exists, return it
      if (resident.switchHistory && resident.switchHistory.length > 0) {
        return {
          success: true,
          data: resident.switchHistory,
          message: `Found ${resident.switchHistory.length} switch records`,
          statusCode: 200
        };
      }

      // If no switch history field, return empty array
      return {
        success: true,
        data: [],
        message: 'No switch history found',
        statusCode: 200
      };

    } catch (error) {
      console.error('❌ ResidentService: Get switch history error:', error);
      return {
        success: false,
        message: 'Failed to get switch history',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Create Payment records for onboarding payments
   * @param {Object} resident - Resident object
   * @param {Object} onboardingData - Onboarding data with payment info
   * @param {string} userId - User ID who performed the onboarding
   * @returns {Promise<void>}
   */
  async createOnboardingPayments(resident, onboardingData, userId) {
    try {
      const Payment = require('../models/payment.model');
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
      const currentYear = currentDate.getFullYear();

      // Create advance payment record if advance payment exists
      if (onboardingData.advancePayment && onboardingData.advancePayment.amount > 0) {
        // Use the status from onboardingData, default to 'pending' if not provided
        const advanceStatus = onboardingData.advancePayment.status || 
                              (onboardingData.paymentStatus?.advance || 'pending');
        
        const advancePayment = new Payment({
          residentId: resident._id,
          roomId: resident.roomId,
          pgId: resident.pgId,
          branchId: resident.branchId,
          amount: onboardingData.advancePayment.amount,
          paymentDate: onboardingData.advancePayment.date || currentDate,
          paymentMethod: 'other', // Default for onboarding payments
          status: advanceStatus, // Use the actual status from onboarding data
          month: 'Advance', // Special month for advance payments
          year: currentYear,
          notes: `Advance payment - Receipt: ${onboardingData.advancePayment.receiptNumber || 'N/A'} - Status: ${advanceStatus}`,
          markedBy: userId,
          isActive: true
        });

        await advancePayment.save();
        console.log('✅ Advance payment record created:', advancePayment._id, 'Status:', advanceStatus);
      }

      // Create rent payment record if rent payment exists
      if (onboardingData.rentPayment && onboardingData.rentPayment.amount > 0) {
        // Use the status from onboardingData, default to 'pending' if not provided
        const rentStatus = onboardingData.rentPayment.status || 
                           (onboardingData.paymentStatus?.rent || 'pending');
        
        const rentPayment = new Payment({
          residentId: resident._id,
          roomId: resident.roomId,
          pgId: resident.pgId,
          branchId: resident.branchId,
          amount: onboardingData.rentPayment.amount,
          paymentDate: onboardingData.rentPayment.date || currentDate,
          paymentMethod: 'other', // Default for onboarding payments
          status: rentStatus, // Use the actual status from onboarding data
          month: currentMonth,
          year: currentYear,
          notes: `Rent payment - Receipt: ${onboardingData.rentPayment.receiptNumber || 'N/A'} - Status: ${rentStatus}`,
          markedBy: userId,
          isActive: true
        });

        await rentPayment.save();
        console.log('✅ Rent payment record created:', rentPayment._id, 'Status:', rentStatus);
      }

      console.log('✅ Onboarding payment records created successfully');
    } catch (error) {
      console.error('❌ Error creating onboarding payment records:', error);
      // Don't throw error as this shouldn't fail the onboarding process
    }
  }
}

module.exports = new ResidentService(); 