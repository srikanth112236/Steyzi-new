const Payment = require('../models/payment.model');
const Resident = require('../models/resident.model');
const Room = require('../models/room.model');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const NotificationService = require('./notification.service');

class PaymentService {
  // Initialize payment service and clean up any problematic data
  async initialize() {
    try {
      console.log('🔧 Initializing Payment Service...');
      
      // Clean up any existing paymentId fields
      await Payment.cleanupPaymentIdFields();
      
      // Drop problematic indexes
      await Payment.dropProblematicIndexes();
      
      console.log('✅ Payment Service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Payment Service:', error);
      // Don't throw error, continue with normal operation
    }
  }

  // Mark payment as completed
  async markPaymentAsCompleted(residentId, paymentData, markedBy) {
    try {
      // Get resident details
      const resident = await Resident.findById(residentId);
      if (!resident) {
        throw new Error('Resident not found');
      }

      // Get room details
      const room = await Room.findById(resident.roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // Handle image upload
      let receiptImage = null;
      if (paymentData.paymentImage) {
        const uploadDir = path.join(__dirname, '../uploads/payments');
        await fs.mkdir(uploadDir, { recursive: true });

        const fileExtension = path.extname(paymentData.paymentImage.originalname);
        const fileName = `payment_${residentId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);

        await fs.writeFile(filePath, paymentData.paymentImage.buffer);

        receiptImage = {
          fileName: fileName,
          originalName: paymentData.paymentImage.originalname,
          filePath: filePath,
          fileSize: paymentData.paymentImage.size,
          mimeType: paymentData.paymentImage.mimetype
        };
      }

      // Extract month and year from payment date
      const paymentDate = new Date(paymentData.paymentDate);
      const month = paymentDate.toLocaleString('en-US', { month: 'long' });
      const year = paymentDate.getFullYear();

      // Check for existing payment for the same resident, month, and year
      const existingPayment = await Payment.findOne({
        residentId: residentId,
        month: month,
        year: year,
        isActive: true
      });

      if (existingPayment) {
        throw new Error(`Payment for ${month} ${year} already exists for this resident`);
      }

      // Create payment record with explicit field validation
      const paymentDataToSave = {
        residentId: residentId,
        roomId: resident.roomId,
        pgId: resident.pgId,
        branchId: resident.branchId,
        amount: resident.rentAmount || 8000,
        paymentDate: paymentDate,
        paymentMethod: paymentData.paymentMethod || 'other',
        receiptImage: receiptImage,
        status: 'paid',
        month: month,
        year: year,
        notes: paymentData.notes,
        markedBy: markedBy,
        isActive: true
      };

      // Ensure no paymentId field is included
      if (paymentDataToSave.paymentId !== undefined) {
        delete paymentDataToSave.paymentId;
      }

      const payment = new Payment(paymentDataToSave);

      // Validate the payment before saving
      await payment.validate();

      await payment.save();

      // Update resident payment status
      await Resident.findByIdAndUpdate(residentId, {
        paymentStatus: 'paid',
        lastPaymentDate: new Date(paymentData.paymentDate)
      });

      // After saving payment, emit notification
      try {
        await NotificationService.createNotification({
          pgId: payment.pgId,
          branchId: payment.branchId,
          roleScope: 'admin',
          type: 'payment.created',
          title: 'Payment recorded',
          message: `Payment added for room ${payment.roomNumber || ''}`.trim(),
          data: { paymentId: payment._id, amount: payment.amount }
        });
      } catch (e) {
        console.error('Failed to create notification for payment:', e.message);
      }

      return payment;
    } catch (error) {
      console.error('Error marking payment as completed:', error);
      
      // If it's a duplicate key error, try to clean up and retry
      if (error.code === 11000 && error.keyPattern && error.keyPattern.paymentId) {
        console.log('🔄 Detected duplicate key error, attempting cleanup...');
        
        try {
          // Clean up any existing paymentId fields
          await Payment.cleanupPaymentIdFields();
          
          // Drop problematic indexes
          await Payment.dropProblematicIndexes();
          
          // Retry the payment creation
          console.log('🔄 Retrying payment creation after cleanup...');
          return await this.markPaymentAsCompleted(residentId, paymentData, markedBy);
        } catch (retryError) {
          console.error('❌ Retry failed:', retryError);
          throw new Error('Failed to create payment after cleanup. Please try again.');
        }
      }
      
      throw error;
    }
  }

  // Get payments by resident
  async getPaymentsByResident(residentId) {
    try {
      return await Payment.find({ residentId, isActive: true })
        .populate('markedBy', 'firstName lastName')
        .sort({ paymentDate: -1 });
    } catch (error) {
      throw error;
    }
  }

  // Get payments by room
  async getPaymentsByRoom(roomId) {
    try {
      return await Payment.find({ roomId, isActive: true })
        .populate('residentId', 'firstName lastName phone')
        .populate('markedBy', 'firstName lastName')
        .sort({ paymentDate: -1 });
    } catch (error) {
      throw error;
    }
  }

  // Get payment statistics
  async getPaymentStats(pgId) {
    try {
      return await Payment.getPaymentStats(pgId);
    } catch (error) {
      throw error;
    }
  }

  // Get monthly payments
  async getMonthlyPayments(pgId, year, month) {
    try {
      return await Payment.getMonthlyPayments(pgId, year, month);
    } catch (error) {
      throw error;
    }
  }

  // Get all payments with filters
  async getPayments(filters = {}) {
    try {
      const query = { isActive: true };

      if (filters.pgId) {
        query.pgId = filters.pgId;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.residentId) {
        query.residentId = filters.residentId;
      }

      if (filters.roomId) {
        query.roomId = filters.roomId;
      }

      if (filters.startDate && filters.endDate) {
        query.paymentDate = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      return await Payment.find(query)
        .populate('residentId', 'firstName lastName phone email')
        .populate('roomId', 'roomNumber sharingType')
        .populate('markedBy', 'firstName lastName')
        .sort({ paymentDate: -1 });
    } catch (error) {
      throw error;
    }
  }

  // Get payment by ID
  async getPaymentById(paymentId) {
    try {
      return await Payment.findById(paymentId)
        .populate('residentId', 'firstName lastName phone email')
        .populate('roomId', 'roomNumber sharingType')
        .populate('markedBy', 'firstName lastName');
    } catch (error) {
      throw error;
    }
  }

  // Update payment
  async updatePayment(paymentId, updateData) {
    try {
      // Ensure no paymentId field is included in update
      if (updateData.paymentId !== undefined) {
        delete updateData.paymentId;
      }

      return await Payment.findByIdAndUpdate(paymentId, updateData, { new: true });
    } catch (error) {
      throw error;
    }
  }

  // Delete payment (soft delete)
  async deletePayment(paymentId) {
    try {
      return await Payment.findByIdAndUpdate(paymentId, { isActive: false }, { new: true });
    } catch (error) {
      throw error;
    }
  }

  // Get residents by room
  async getResidentsByRoom(roomId) {
    try {
      const residents = await Resident.find({ roomId, isActive: true })
        .select('firstName lastName phone email rentAmount paymentStatus lastPaymentDate')
        .sort({ firstName: 1 });

      // Get current month and year
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
      const currentYear = currentDate.getFullYear();

      // Check for existing payments for current month for each resident
      const residentsWithPaymentStatus = await Promise.all(
        residents.map(async (resident) => {
          // Check if there's already a payment for current month
          const existingPayment = await Payment.findOne({
            residentId: resident._id,
            month: currentMonth,
            year: currentYear,
            isActive: true
          });

          // Convert to plain object and add payment status
          const residentObj = resident.toObject();
          residentObj.hasCurrentMonthPayment = !!existingPayment;
          
          return residentObj;
        })
      );

      return residentsWithPaymentStatus;
    } catch (error) {
      throw error;
    }
  }

  // Get payment receipt
  async getPaymentReceipt(paymentId) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment || !payment.receiptImage) {
        throw new Error('Receipt not found');
      }

      return payment.receiptImage;
    } catch (error) {
      throw error;
    }
  }

  // Generate payment report
  async generatePaymentReport(pgId, startDate, endDate) {
    try {
      const payments = await Payment.find({
        pgId: pgId,
        paymentDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        isActive: true
      }).populate('residentId', 'firstName lastName')
        .populate('roomId', 'roomNumber')
        .populate('markedBy', 'firstName lastName')
        .sort({ paymentDate: -1 });

      return payments;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PaymentService(); 