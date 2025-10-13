const express = require('express');
const router = express.Router();
const QRCodeService = require('../services/qrCode.service');
const ResidentService = require('../services/resident.service');
const paymentInfoController = require('../controllers/paymentInfo.controller');
const { validateResident } = require('../middleware/validation.middleware');

// Get QR code information (Public)
router.get('/qr/:qrCode', async (req, res) => {
  try {
    const result = await QRCodeService.getQRCodeByCode(req.params.qrCode);
    return res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error getting QR code info:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get QR code information',
      error: error.message
    });
  }
});

// Get payment info by QR code (Public)
router.get('/qr/:qrCode/payment-info', paymentInfoController.getPaymentInfoByQRCode);

// Add new resident through QR code (Public)
router.post('/qr/:qrCode/resident', validateResident, async (req, res) => {
  try {
    // First get QR code information
    const qrResult = await QRCodeService.getQRCodeByCode(req.params.qrCode);
    if (!qrResult.success) {
      return res.status(qrResult.statusCode).json(qrResult);
    }

    const pgId = qrResult.data.pgId;
    
    // Get the default branch for the PG
    const Branch = require('../models/branch.model');
    const defaultBranch = await Branch.findOne({ pgId, isActive: true }).sort({ createdAt: 1 });
    
    if (!defaultBranch) {
      return res.status(400).json({
        success: false,
        message: 'No active branch found for this PG',
        statusCode: 400
      });
    }
    
    // Add PG ID and Branch ID to resident data
    const residentData = {
      ...req.body,
      pgId,
      branchId: defaultBranch._id,
      status: 'pending', // New residents start as pending
      paymentStatus: 'pending'
    };

    // Create resident using the service
    const result = await ResidentService.createResident(residentData, qrResult.data.createdBy._id);
    
    if (result.success) {
      return res.status(201).json({
        success: true,
        data: {
          resident: result.data,
          pgName: qrResult.data.pgName,
          message: 'Resident added successfully. Please contact the PG admin for room assignment.'
        },
        message: 'Resident added successfully',
        statusCode: 201
      });
    } else {
      return res.status(result.statusCode).json(result);
    }
  } catch (error) {
    console.error('Error adding resident through QR code:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add resident',
      error: error.message
    });
  }
});

// Get PG information for QR code (Public)
router.get('/pg/:pgId/info', async (req, res) => {
  try {
    const PG = require('../models/pg.model');
    const pg = await PG.findById(req.params.pgId).select('name address contactNumber email');
    
    if (!pg) {
      return res.status(404).json({
        success: false,
        message: 'PG not found',
        statusCode: 404
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        pgId: pg._id,
        name: pg.name,
        address: pg.address,
        contactNumber: pg.contactNumber,
        email: pg.email
      },
      message: 'PG information retrieved successfully',
      statusCode: 200
    });
  } catch (error) {
    console.error('Error getting PG info:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get PG information',
      error: error.message
    });
  }
});

module.exports = router; 