const Document = require('../models/document.model');
const Resident = require('../models/resident.model');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class DocumentService {
  /**
   * Upload a document for a resident
   */
  async uploadDocument(residentId, fileData, documentType, metadata, uploadedBy, branchId) {
    try {
      // Validate resident exists
      const resident = await Resident.findById(residentId);
      if (!resident) {
        throw new Error('Resident not found');
      }

      // Generate unique filename
      const fileExtension = path.extname(fileData.originalname);
      const uniqueFileName = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
      
      // Create upload directory if it doesn't exist
      const uploadDir = path.join(__dirname, '../../uploads/documents');
      await fs.mkdir(uploadDir, { recursive: true });
      
      // Save file to disk
      const filePath = path.join(uploadDir, uniqueFileName);
      await fs.writeFile(filePath, fileData.buffer);

      // Generate preview if possible
      let previewData = null;
      let isPreviewAvailable = false;
      
      if (fileData.mimetype.startsWith('image/')) {
        // For images, create base64 preview
        previewData = fileData.buffer.toString('base64');
        isPreviewAvailable = true;
      } else if (fileData.mimetype === 'application/pdf') {
        // For PDFs, we could generate a thumbnail
        // For now, just mark as preview available
        isPreviewAvailable = true;
      }

      // Create document record
      const document = new Document({
        residentId,
        documentType,
        fileName: uniqueFileName,
        originalName: fileData.originalname,
        filePath: uniqueFileName, // Store relative path
        fileSize: fileData.size,
        mimeType: fileData.mimetype,
        previewData,
        isPreviewAvailable,
        uploadedBy,
        branchId,
        metadata: {
          description: metadata.description || '',
          tags: metadata.tags || [],
          expiryDate: metadata.expiryDate || null,
          verificationStatus: 'pending',
          verificationNotes: ''
        }
      });

      await document.save();
      return document;
    } catch (error) {
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }

  /**
   * Get documents by resident ID
   */
  async getDocumentsByResident(residentId, options = {}) {
    try {
      const query = { residentId, isActive: true };
      
      if (options.documentType) {
        query.documentType = options.documentType;
      }

      const documents = await Document.find(query)
        .populate('uploadedBy', 'firstName lastName email')
        .sort({ createdAt: -1 });

      return documents;
    } catch (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId) {
    try {
      const document = await Document.findById(documentId)
        .populate('uploadedBy', 'firstName lastName email')
        .populate('residentId', 'firstName lastName');

      if (!document) {
        throw new Error('Document not found');
      }

      return document;
    } catch (error) {
      throw new Error(`Failed to fetch document: ${error.message}`);
    }
  }

  /**
   * Download document
   */
  async downloadDocument(documentId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Increment download count
      await document.incrementDownloadCount();

      // Read file from disk
      const filePath = path.join(__dirname, '../../uploads/documents', document.fileName);
      const fileBuffer = await fs.readFile(filePath);

      return {
        fileBuffer,
        fileName: document.originalName,
        mimeType: document.mimeType
      };
    } catch (error) {
      throw new Error(`Failed to download document: ${error.message}`);
    }
  }

  /**
   * Get document preview
   */
  async getDocumentPreview(documentId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      if (!document.isPreviewAvailable) {
        throw new Error('Preview not available for this document');
      }

      return {
        previewData: document.previewData,
        mimeType: document.mimeType,
        fileName: document.originalName
      };
    } catch (error) {
      throw new Error(`Failed to get document preview: ${error.message}`);
    }
  }

  /**
   * Update document metadata
   */
  async updateDocumentMetadata(documentId, metadata) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Update metadata fields
      if (metadata.description !== undefined) {
        document.metadata.description = metadata.description;
      }
      if (metadata.tags !== undefined) {
        document.metadata.tags = metadata.tags;
      }
      if (metadata.expiryDate !== undefined) {
        document.metadata.expiryDate = metadata.expiryDate;
      }
      if (metadata.verificationStatus !== undefined) {
        document.metadata.verificationStatus = metadata.verificationStatus;
      }
      if (metadata.verificationNotes !== undefined) {
        document.metadata.verificationNotes = metadata.verificationNotes;
      }

      await document.save();
      return document;
    } catch (error) {
      throw new Error(`Failed to update document metadata: ${error.message}`);
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Delete file from disk
      const filePath = path.join(__dirname, '../../uploads/documents', document.fileName);
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        console.warn(`File not found for deletion: ${filePath}`);
      }

      // Soft delete document
      document.isActive = false;
      await document.save();

      return { success: true, message: 'Document deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Get document statistics for a resident
   */
  async getDocumentStats(residentId) {
    try {
      const stats = await Document.aggregate([
        { $match: { residentId: new require('mongoose').Types.ObjectId(residentId), isActive: true } },
        {
          $group: {
            _id: '$documentType',
            count: { $sum: 1 },
            totalSize: { $sum: '$fileSize' },
            totalDownloads: { $sum: '$downloadCount' }
          }
        }
      ]);

      // Get total documents count
      const totalDocuments = await Document.countDocuments({ 
        residentId, 
        isActive: true 
      });

      // Get total size
      const totalSize = await Document.aggregate([
        { $match: { residentId: new require('mongoose').Types.ObjectId(residentId), isActive: true } },
        { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
      ]);

      return {
        stats,
        totalDocuments,
        totalSize: totalSize[0]?.totalSize || 0
      };
    } catch (error) {
      throw new Error(`Failed to get document stats: ${error.message}`);
    }
  }

  /**
   * Get document types with counts
   */
  async getDocumentTypesWithCounts(residentId) {
    try {
      const typeCounts = await Document.aggregate([
        { $match: { residentId: new require('mongoose').Types.ObjectId(residentId), isActive: true } },
        {
          $group: {
            _id: '$documentType',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return typeCounts;
    } catch (error) {
      throw new Error(`Failed to get document type counts: ${error.message}`);
    }
  }

  /**
   * Verify document
   */
  async verifyDocument(documentId, verificationStatus, verificationNotes) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      document.metadata.verificationStatus = verificationStatus;
      document.metadata.verificationNotes = verificationNotes;

      await document.save();
      return document;
    } catch (error) {
      throw new Error(`Failed to verify document: ${error.message}`);
    }
  }
}

module.exports = new DocumentService(); 