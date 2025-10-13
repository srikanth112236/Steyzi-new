const QRCode = require('../models/qrCode.model');
const PG = require('../models/pg.model');

class QRCodeService {
  /**
   * Generate QR code for a PG
   * @param {string} pgId - PG ID
   * @param {string} userId - User ID who created the QR code
   * @returns {Promise<Object>} - QR code creation result
   */
  async generateQRCode(pgId, userId) {
    try {
      console.log('📱 QRCodeService: Generating QR code for PG:', pgId);
      
      // Check if PG exists
      const pg = await PG.findById(pgId);
      if (!pg) {
        return {
          success: false,
          message: 'PG not found',
          statusCode: 404
        };
      }

      // Check if QR code already exists for this PG
      const existingQR = await QRCode.findOne({ pgId, isActive: true });
      if (existingQR) {
        return {
          success: false,
          message: 'QR code already exists for this PG',
          statusCode: 400
        };
      }

      // Generate unique QR code
      const qrCode = require('crypto').randomBytes(16).toString('hex');
      const publicUrl = `qr/${qrCode}`;

      // Create QR code record
      const qrCodeRecord = new QRCode({
        pgId,
        qrCode,
        publicUrl,
        createdBy: userId
      });

      await qrCodeRecord.save();

      console.log('✅ QRCodeService: QR code generated successfully');

      return {
        success: true,
        data: {
          qrCode,
          publicUrl,
          fullUrl: qrCodeRecord.fullUrl,
          pgName: pg.name
        },
        message: 'QR code generated successfully',
        statusCode: 201
      };
    } catch (error) {
      console.error('❌ QRCodeService: Generate QR code error:', error);
      return {
        success: false,
        message: 'Failed to generate QR code',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get QR code by code
   * @param {string} qrCode - QR code string
   * @returns {Promise<Object>} - QR code data
   */
  async getQRCodeByCode(qrCode) {
    try {
      console.log('📱 QRCodeService: Getting QR code by code:', qrCode);
      
      const qrCodeRecord = await QRCode.findOne({ qrCode, isActive: true })
        .populate('pgId', 'name address')
        .populate('createdBy', 'firstName lastName');

      if (!qrCodeRecord) {
        return {
          success: false,
          message: 'QR code not found or inactive',
          statusCode: 404
        };
      }

      // Increment usage count
      await qrCodeRecord.incrementUsage();

      console.log('✅ QRCodeService: QR code found');

      return {
        success: true,
        data: {
          qrCode: qrCodeRecord.qrCode,
          publicUrl: qrCodeRecord.publicUrl,
          fullUrl: qrCodeRecord.fullUrl,
          pgId: qrCodeRecord.pgId._id,
          pgName: qrCodeRecord.pgId.name,
          pgAddress: qrCodeRecord.pgId.address,
          createdBy: qrCodeRecord.createdBy,
          usageCount: qrCodeRecord.usageCount,
          lastUsed: qrCodeRecord.lastUsed
        },
        message: 'QR code retrieved successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ QRCodeService: Get QR code error:', error);
      return {
        success: false,
        message: 'Failed to get QR code',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get QR code for a PG
   * @param {string} pgId - PG ID
   * @returns {Promise<Object>} - QR code data
   */
  async getQRCodeByPG(pgId) {
    try {
      console.log('📱 QRCodeService: Getting QR code for PG:', pgId);
      
      const qrCodeRecord = await QRCode.findOne({ pgId, isActive: true })
        .populate('pgId', 'name address')
        .populate('createdBy', 'firstName lastName');

      if (!qrCodeRecord) {
        return {
          success: false,
          message: 'QR code not found for this PG',
          statusCode: 404
        };
      }

      console.log('✅ QRCodeService: QR code found for PG');

      return {
        success: true,
        data: {
          qrCode: qrCodeRecord.qrCode,
          publicUrl: qrCodeRecord.publicUrl,
          fullUrl: qrCodeRecord.fullUrl,
          pgId: qrCodeRecord.pgId._id,
          pgName: qrCodeRecord.pgId.name,
          pgAddress: qrCodeRecord.pgId.address,
          createdBy: qrCodeRecord.createdBy,
          usageCount: qrCodeRecord.usageCount,
          lastUsed: qrCodeRecord.lastUsed,
          createdAt: qrCodeRecord.createdAt
        },
        message: 'QR code retrieved successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ QRCodeService: Get QR code by PG error:', error);
      return {
        success: false,
        message: 'Failed to get QR code',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Deactivate QR code
   * @param {string} pgId - PG ID
   * @returns {Promise<Object>} - Deactivation result
   */
  async deactivateQRCode(pgId) {
    try {
      console.log('📱 QRCodeService: Deactivating QR code for PG:', pgId);
      
      const qrCodeRecord = await QRCode.findOne({ pgId, isActive: true });
      
      if (!qrCodeRecord) {
        return {
          success: false,
          message: 'QR code not found for this PG',
          statusCode: 404
        };
      }

      qrCodeRecord.isActive = false;
      await qrCodeRecord.save();

      console.log('✅ QRCodeService: QR code deactivated successfully');

      return {
        success: true,
        message: 'QR code deactivated successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ QRCodeService: Deactivate QR code error:', error);
      return {
        success: false,
        message: 'Failed to deactivate QR code',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get QR code statistics
   * @param {string} pgId - PG ID
   * @returns {Promise<Object>} - QR code statistics
   */
  async getQRCodeStats(pgId) {
    try {
      console.log('📱 QRCodeService: Getting QR code stats for PG:', pgId);
      
      const qrCodeRecord = await QRCode.findOne({ pgId, isActive: true });
      
      if (!qrCodeRecord) {
        return {
          success: false,
          message: 'QR code not found for this PG',
          statusCode: 404
        };
      }

      console.log('✅ QRCodeService: QR code stats retrieved');

      return {
        success: true,
        data: {
          usageCount: qrCodeRecord.usageCount,
          lastUsed: qrCodeRecord.lastUsed,
          createdAt: qrCodeRecord.createdAt,
          isActive: qrCodeRecord.isActive
        },
        message: 'QR code statistics retrieved successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ QRCodeService: Get QR code stats error:', error);
      return {
        success: false,
        message: 'Failed to get QR code statistics',
        error: error.message,
        statusCode: 500
      };
    }
  }
}

module.exports = new QRCodeService(); 