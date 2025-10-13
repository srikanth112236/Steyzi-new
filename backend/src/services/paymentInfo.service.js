const PaymentInfo = require('../models/paymentInfo.model');
const PG = require('../models/pg.model');
const Branch = require('../models/branch.model');
const logger = require('../utils/logger');

/**
 * Get payment info for a branch
 */
const getPaymentInfo = async (branchId) => {
  try {
    const paymentInfo = await PaymentInfo.findOne({ 
      branchId, 
      isActive: true 
    })
    .populate('pgId', 'name')
    .populate('branchId', 'name')
    .populate('createdBy', 'firstName lastName')
    .populate('updatedBy', 'firstName lastName');

    return paymentInfo;
  } catch (error) {
    logger.error('Error getting payment info:', error);
    throw error;
  }
};

/**
 * Create or update payment info
 */
const createOrUpdatePaymentInfo = async (branchId, paymentData, userId) => {
  try {
    // Verify branch exists and user has access
    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw new Error('Branch not found');
    }

    // Check if payment info already exists for this branch
    let paymentInfo = await PaymentInfo.findOne({ 
      branchId, 
      isActive: true 
    });

    if (paymentInfo) {
      // Update existing payment info
      Object.assign(paymentInfo, {
        ...paymentData,
        updatedBy: userId,
        updatedAt: new Date()
      });
      
      await paymentInfo.save();
      logger.info(`Payment info updated for branch: ${branchId}`);
    } else {
      // Create new payment info
      paymentInfo = new PaymentInfo({
        ...paymentData,
        branchId,
        pgId: branch.pgId,
        createdBy: userId
      });
      
      await paymentInfo.save();
      logger.info(`Payment info created for branch: ${branchId}`);
    }

    // Populate and return
    await paymentInfo.populate([
      { path: 'pgId', select: 'name' },
      { path: 'branchId', select: 'name' },
      { path: 'createdBy', select: 'firstName lastName' },
      { path: 'updatedBy', select: 'firstName lastName' }
    ]);

    return paymentInfo;
  } catch (error) {
    logger.error('Error creating/updating payment info:', error);
    throw error;
  }
};

/**
 * Delete payment info
 */
const deletePaymentInfo = async (branchId, userId) => {
  try {
    const paymentInfo = await PaymentInfo.findOne({ 
      branchId, 
      isActive: true 
    });

    if (!paymentInfo) {
      throw new Error('Payment info not found');
    }

    paymentInfo.isActive = false;
    paymentInfo.updatedBy = userId;
    await paymentInfo.save();

    logger.info(`Payment info deleted for branch: ${branchId}`);
    return { message: 'Payment info deleted successfully' };
  } catch (error) {
    logger.error('Error deleting payment info:', error);
    throw error;
  }
};

/**
 * Get payment info by QR code (for public access)
 */
const getPaymentInfoByQRCode = async (qrCode) => {
  try {
    logger.info(`Getting payment info for QR code: ${qrCode}`);
    
    // First find the QR code to get branch info
    const QRCode = require('../models/qrCode.model');
    
    // Check if QR code exists at all (active or inactive)
    const qrExists = await QRCode.findOne({ qrCode: qrCode }).populate('pgId');
    
    if (!qrExists) {
      logger.error(`QR code not found in database: ${qrCode}`);
      throw new Error('QR code not found in database');
    }
    
    if (!qrExists.isActive) {
      logger.error(`QR code is inactive: ${qrCode}`);
      throw new Error('QR code is inactive');
    }
    
    logger.info(`QR code found - PG: ${qrExists.pgId?.name}`);
    
    // Get payment info for any branch in this PG (since QR codes are PG-level)
    const paymentInfo = await PaymentInfo.findOne({ 
      pgId: qrExists.pgId._id, 
      isActive: true 
    })
    .populate('pgId', 'name')
    .populate('branchId', 'name');

    if (!paymentInfo) {
      logger.warn(`No payment info configured for PG: ${qrExists.pgId?.name} (${qrExists.pgId._id})`);
    } else {
      logger.info(`Payment info found for PG: ${qrExists.pgId?.name} - Branch: ${paymentInfo.branchId?.name}`);
    }

    return {
      qrData: qrExists,
      paymentInfo
    };
  } catch (error) {
    logger.error('Error getting payment info by QR code:', error);
    throw error;
  }
};

/**
 * Get all payment info for admin
 */
const getAllPaymentInfo = async (pgId, filters = {}) => {
  try {
    const query = { pgId, isActive: true };
    
    if (filters.branchId) {
      query.branchId = filters.branchId;
    }

    const paymentInfos = await PaymentInfo.find(query)
      .populate('pgId', 'name')
      .populate('branchId', 'name')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    return paymentInfos;
  } catch (error) {
    logger.error('Error getting all payment info:', error);
    throw error;
  }
};

module.exports = {
  getPaymentInfo,
  createOrUpdatePaymentInfo,
  deletePaymentInfo,
  getPaymentInfoByQRCode,
  getAllPaymentInfo
}; 