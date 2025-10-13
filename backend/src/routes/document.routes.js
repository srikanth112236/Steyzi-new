const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticate, adminOrSuperadmin } = require('../middleware/auth.middleware');
const { validateDocumentUpload, validateDocumentMetadata } = require('../middleware/validation.middleware');
const documentService = require('../services/document.service');
const activityService = require('../services/activity.service');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, images, and text files are allowed.'), false);
    }
  }
});

/**
 * @route   POST /api/documents/upload/:residentId
 * @desc    Upload a document for a resident
 * @access  Private (Admin/Superadmin)
 */
router.post('/upload/:residentId', 
  authenticate, 
  adminOrSuperadmin,
  upload.single('document'),
  validateDocumentUpload,
  async (req, res) => {
    try {
      const { residentId } = req.params;
      const { documentType, description, tags, expiryDate } = req.body;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const metadata = {
        description: description || '',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        expiryDate: expiryDate || null
      };

      const document = await documentService.uploadDocument(
        residentId,
        req.file,
        documentType,
        metadata,
        req.user._id,
        req.user.branchId
      );

      try {
        await activityService.recordActivity({
          type: 'document_upload',
          title: 'Document Uploaded',
          description: `${documentType || 'Document'} uploaded for resident ${residentId}`,
          userId: req.user?._id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          entityType: 'document',
          entityId: document?._id,
          category: 'document',
          priority: 'normal',
          status: 'success'
        });
      } catch (_) {}

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: document
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload document'
      });
    }
  }
);

/**
 * @route   GET /api/documents/resident/:residentId
 * @desc    Get all documents for a resident
 * @access  Private (Admin/Superadmin)
 */
router.get('/resident/:residentId', 
  authenticate, 
  adminOrSuperadmin,
  async (req, res) => {
    try {
      const { residentId } = req.params;
      const { documentType } = req.query;
      
      const options = {};
      if (documentType) {
        options.documentType = documentType;
      }

      const documents = await documentService.getDocumentsByResident(residentId, options);
      
      res.json({
        success: true,
        data: documents
      });
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch documents'
      });
    }
  }
);

/**
 * @route   GET /api/documents/resident/:residentId/stats
 * @desc    Get document statistics for a resident
 * @access  Private (Admin/Superadmin)
 */
router.get('/resident/:residentId/stats', 
  authenticate, 
  adminOrSuperadmin,
  async (req, res) => {
    try {
      const { residentId } = req.params;
      
      const stats = await documentService.getDocumentStats(residentId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get document stats error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch document statistics'
      });
    }
  }
);

/**
 * @route   GET /api/documents/resident/:residentId/types
 * @desc    Get document types with counts for a resident
 * @access  Private (Admin/Superadmin)
 */
router.get('/resident/:residentId/types', 
  authenticate, 
  adminOrSuperadmin,
  async (req, res) => {
    try {
      const { residentId } = req.params;
      
      const typeCounts = await documentService.getDocumentTypesWithCounts(residentId);
      
      res.json({
        success: true,
        data: typeCounts
      });
    } catch (error) {
      console.error('Get document types error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch document types'
      });
    }
  }
);

/**
 * @route   GET /api/documents/:documentId
 * @desc    Get document by ID
 * @access  Private (Admin/Superadmin)
 */
router.get('/:documentId', 
  authenticate, 
  adminOrSuperadmin,
  async (req, res) => {
    try {
      const { documentId } = req.params;
      
      const document = await documentService.getDocumentById(documentId);
      
      res.json({
        success: true,
        data: document
      });
    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch document'
      });
    }
  }
);

/**
 * @route   GET /api/documents/:documentId/download
 * @desc    Download a document
 * @access  Private (Admin/Superadmin)
 */
router.get('/:documentId/download', 
  authenticate, 
  adminOrSuperadmin,
  async (req, res) => {
    try {
      const { documentId } = req.params;
      
      const { fileBuffer, fileName, mimeType } = await documentService.downloadDocument(documentId);
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(fileBuffer);

      try {
        await activityService.recordActivity({
          type: 'document_download',
          title: 'Document Downloaded',
          description: `Document ${documentId} downloaded`,
          userId: req.user?._id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          entityType: 'document',
          entityId: documentId,
          category: 'document',
          priority: 'normal',
          status: 'success'
        });
      } catch (_) {}
    } catch (error) {
      console.error('Download document error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to download document'
      });
    }
  }
);

/**
 * @route   GET /api/documents/:documentId/preview
 * @desc    Get document preview
 * @access  Private (Admin/Superadmin)
 */
router.get('/:documentId/preview', 
  authenticate, 
  adminOrSuperadmin,
  async (req, res) => {
    try {
      const { documentId } = req.params;
      
      const preview = await documentService.getDocumentPreview(documentId);
      
      res.json({
        success: true,
        data: preview
      });
    } catch (error) {
      console.error('Get document preview error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get document preview'
      });
    }
  }
);

/**
 * @route   PUT /api/documents/:documentId/metadata
 * @desc    Update document metadata
 * @access  Private (Admin/Superadmin)
 */
router.put('/:documentId/metadata', 
  authenticate, 
  adminOrSuperadmin,
  validateDocumentMetadata,
  async (req, res) => {
    try {
      const { documentId } = req.params;
      const metadata = req.body;
      
      const document = await documentService.updateDocumentMetadata(documentId, metadata);
      
      res.json({
        success: true,
        message: 'Document metadata updated successfully',
        data: document
      });

      try {
        await activityService.recordActivity({
          type: 'document_update',
          title: 'Document Metadata Updated',
          description: `Metadata updated for document ${documentId}`,
          userId: req.user?._id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          entityType: 'document',
          entityId: documentId,
          category: 'document',
          priority: 'normal',
          status: 'success'
        });
      } catch (_) {}
    } catch (error) {
      console.error('Update document metadata error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update document metadata'
      });
    }
  }
);

/**
 * @route   DELETE /api/documents/:documentId
 * @desc    Delete a document
 * @access  Private (Admin/Superadmin)
 */
router.delete('/:documentId', 
  authenticate, 
  adminOrSuperadmin,
  async (req, res) => {
    try {
      const { documentId } = req.params;
      
      const result = await documentService.deleteDocument(documentId);
      
      res.json({
        success: true,
        message: result.message
      });

      try {
        await activityService.recordActivity({
          type: 'document_delete',
          title: 'Document Deleted',
          description: `Document ${documentId} deleted`,
          userId: req.user?._id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          entityType: 'document',
          entityId: documentId,
          category: 'document',
          priority: 'normal',
          status: 'success'
        });
      } catch (_) {}
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete document'
      });
    }
  }
);

/**
 * @route   POST /api/documents/:documentId/verify
 * @desc    Verify a document
 * @access  Private (Admin/Superadmin)
 */
router.post('/:documentId/verify', 
  authenticate, 
  adminOrSuperadmin,
  async (req, res) => {
    try {
      const { documentId } = req.params;
      const { verificationStatus, verificationNotes } = req.body;
      
      if (!['pending', 'verified', 'rejected'].includes(verificationStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification status'
        });
      }

      const document = await documentService.verifyDocument(
        documentId, 
        verificationStatus, 
        verificationNotes || ''
      );
      
      res.json({
        success: true,
        message: 'Document verification status updated successfully',
        data: document
      });

      try {
        await activityService.recordActivity({
          type: 'document_update',
          title: 'Document Verification Updated',
          description: `Verification set to ${verificationStatus} for document ${documentId}`,
          userId: req.user?._id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          entityType: 'document',
          entityId: documentId,
          category: 'document',
          priority: 'normal',
          status: 'success'
        });
      } catch (_) {}
    } catch (error) {
      console.error('Verify document error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to verify document'
      });
    }
  }
);

module.exports = router; 