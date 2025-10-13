const express = require('express');
const router = express.Router();
const QRCodeService = require('../services/qrCode.service');
const { authenticate, adminOrSuperadmin } = require('../middleware/auth.middleware');
const activityService = require('../services/activity.service');

// Generate QR code for PG (Admin only)
router.post('/generate/:pgId', authenticate, adminOrSuperadmin, async (req, res) => {
  try {
    console.log('🔍 QR Routes: Generating QR code for PG:', req.params.pgId);
    console.log('👤 User:', req.user._id, req.user.email);
    
    if (!req.params.pgId) {
      return res.status(400).json({
        success: false,
        message: 'PG ID is required',
        statusCode: 400
      });
    }

    const result = await QRCodeService.generateQRCode(req.params.pgId, req.user._id);
    console.log('📱 QR Routes: Generation result:', result);
    try {
      if (result?.success) {
        await activityService.recordActivity({
          type: 'qr_generate',
          title: 'QR Code Generated',
          description: `QR generated for PG ${req.params.pgId}`,
          userId: req.user?._id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          entityType: 'qr',
          entityId: req.params.pgId,
          category: 'system',
          priority: 'normal',
          status: 'success'
        });
      }
    } catch (_) {}
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('❌ QR Routes: Error generating QR code:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
      error: error.message
    });
  }
});

// Get QR code for PG (Admin only)
router.get('/pg/:pgId', authenticate, adminOrSuperadmin, async (req, res) => {
  try {
    const result = await QRCodeService.getQRCodeByPG(req.params.pgId);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error getting QR code:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get QR code',
      error: error.message
    });
  }
});

// Get QR code by code (Public - for QR code scanning)
router.get('/code/:qrCode', async (req, res) => {
  try {
    const result = await QRCodeService.getQRCodeByCode(req.params.qrCode);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error getting QR code by code:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get QR code',
      error: error.message
    });
  }
});

// Deactivate QR code (Admin only)
router.put('/deactivate/:pgId', authenticate, adminOrSuperadmin, async (req, res) => {
  try {
    const result = await QRCodeService.deactivateQRCode(req.params.pgId);
    try {
      if (result?.success) {
        await activityService.recordActivity({
          type: 'qr_deactivate',
          title: 'QR Code Deactivated',
          description: `QR deactivated for PG ${req.params.pgId}`,
          userId: req.user?._id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          entityType: 'qr',
          entityId: req.params.pgId,
          category: 'system',
          priority: 'normal',
          status: 'success'
        });
      }
    } catch (_) {}
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error deactivating QR code:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate QR code',
      error: error.message
    });
  }
});

// Get QR code statistics (Admin only)
router.get('/stats/:pgId', authenticate, adminOrSuperadmin, async (req, res) => {
  try {
    const result = await QRCodeService.getQRCodeStats(req.params.pgId);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error getting QR code stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get QR code statistics',
      error: error.message
    });
  }
});

module.exports = router; 