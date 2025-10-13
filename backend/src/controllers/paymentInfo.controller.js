const paymentInfoService = require('../services/paymentInfo.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const activityService = require('../services/activity.service');

/**
 * Get payment info for a branch
 */
const getPaymentInfo = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    if (!branchId) {
      return errorResponse(res, 'Branch ID is required', 400);
    }

    const paymentInfo = await paymentInfoService.getPaymentInfo(branchId);
    
    if (!paymentInfo) {
      return successResponse(res, 'No payment info found for this branch', null);
    }

    return successResponse(res, 'Payment info retrieved successfully', paymentInfo);
  } catch (error) {
    logger.error('Error in getPaymentInfo controller:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Create or update payment info
 */
const createOrUpdatePaymentInfo = async (req, res) => {
  try {
    console.log('🔍 PaymentInfo Controller - Create/Update Payment Info');
    console.log('User info:', {
      userExists: !!req.user,
      userId: req.user?._id,
      userRole: req.user?.role,
      userEmail: req.user?.email
    });
    console.log('Request params:', { branchId: req.params.branchId });
    console.log('Request body keys:', Object.keys(req.body));

    const { branchId } = req.params;
    const userId = req.user._id || req.user.id;
    const paymentData = req.body;

    // Validate required fields
    const requiredFields = ['upiId', 'upiName', 'accountHolderName'];
    const missingFields = requiredFields.filter(field => !paymentData[field]);
    
    if (missingFields.length > 0) {
      return errorResponse(res, `Missing required fields: ${missingFields.join(', ')}`, 400);
    }

    const paymentInfo = await paymentInfoService.createOrUpdatePaymentInfo(
      branchId, 
      paymentData, 
      userId
    );

    try {
      await activityService.recordActivity({
        type: 'payment_update',
        title: 'Payment Info Saved',
        description: `Payment info saved for branch ${branchId}`,
        userId: req.user?._id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        entityType: 'payment_info',
        entityId: paymentInfo?._id,
        category: 'payment',
        priority: 'normal',
        status: 'success'
      });
    } catch (_) {}

    return successResponse(res, 'Payment info saved successfully', paymentInfo);
  } catch (error) {
    logger.error('Error in createOrUpdatePaymentInfo controller:', error);
    
    if (error.message.includes('Branch not found')) {
      return errorResponse(res, 'Branch not found', 404);
    }
    
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Delete payment info
 */
const deletePaymentInfo = async (req, res) => {
  try {
    const { branchId } = req.params;
    const userId = req.user._id || req.user.id;

    const result = await paymentInfoService.deletePaymentInfo(branchId, userId);

    try {
      await activityService.recordActivity({
        type: 'payment_delete',
        title: 'Payment Info Deleted',
        description: `Payment info deleted for branch ${branchId}`,
        userId: req.user?._id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        entityType: 'payment_info',
        entityId: branchId,
        category: 'payment',
        priority: 'normal',
        status: 'success'
      });
    } catch (_) {}

    return successResponse(res, 'Payment info deleted successfully', result);
  } catch (error) {
    logger.error('Error in deletePaymentInfo controller:', error);
    
    if (error.message.includes('Payment info not found')) {
      return errorResponse(res, 'Payment info not found', 404);
    }
    
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get payment info by QR code (public access)
 */
const getPaymentInfoByQRCode = async (req, res) => {
  try {
    const { qrCode } = req.params;
    
    if (!qrCode) {
      return errorResponse(res, 'QR code is required', 400);
    }

    const result = await paymentInfoService.getPaymentInfoByQRCode(qrCode);
    
    if (!result.paymentInfo) {
      return successResponse(res, 'QR code found but no payment info configured', {
        qrData: result.qrData,
        paymentInfo: null
      });
    }

    return successResponse(res, 'Payment info retrieved successfully', result);
  } catch (error) {
    logger.error('Error in getPaymentInfoByQRCode controller:', error);
    
    // Handle specific error cases
    if (error.message.includes('QR code not found in database')) {
      return errorResponse(res, 'QR code not found in database', 404);
    }
    
    if (error.message.includes('QR code is inactive')) {
      return errorResponse(res, 'QR code is inactive', 404);
    }
    
    if (error.message.includes('QR code has no PG associated')) {
      return errorResponse(res, 'QR code has no PG associated', 500);
    }
    
    // Fallback for any other "Invalid QR code" errors
    if (error.message.includes('Invalid QR code')) {
      return errorResponse(res, 'Invalid QR code', 404);
    }
    
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get all payment info for admin
 */
const getAllPaymentInfo = async (req, res) => {
  try {
    const { pgId } = req.user;
    const filters = {};
    
    if (req.query.branchId) {
      filters.branchId = req.query.branchId;
    }

    const paymentInfos = await paymentInfoService.getAllPaymentInfo(pgId, filters);
    return successResponse(res, 'Payment info list retrieved successfully', paymentInfos);
  } catch (error) {
    logger.error('Error in getAllPaymentInfo controller:', error);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getPaymentInfo,
  createOrUpdatePaymentInfo,
  deletePaymentInfo,
  getPaymentInfoByQRCode,
  getAllPaymentInfo
}; 