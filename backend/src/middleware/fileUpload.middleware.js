const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Configure multer storage for file uploads
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads');
    const pgImagesDir = path.join(uploadDir, 'pg-images');
    
    // Create directories if they don't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    if (!fs.existsSync(pgImagesDir)) {
      fs.mkdirSync(pgImagesDir, { recursive: true });
    }
    
    cb(null, pgImagesDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `pg-${req.params.pgId}-${uniqueSuffix}${ext}`);
  }
});

/**
 * Configure multer storage for ticket attachments
 */
const ticketStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads');
    const ticketAttachmentsDir = path.join(uploadDir, 'ticket-attachments');
    
    // Create directories if they don't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    if (!fs.existsSync(ticketAttachmentsDir)) {
      fs.mkdirSync(ticketAttachmentsDir, { recursive: true });
    }
    
    cb(null, ticketAttachmentsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `ticket-${req.params.id}-${uniqueSuffix}${ext}`);
  }
});

/**
 * File filter function to validate uploaded files
 */
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

/**
 * File filter function for ticket attachments (allows more file types)
 */
const ticketFileFilter = (req, file, cb) => {
  // Check file type - allow images, PDFs, and common document types
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and common document types are allowed.'), false);
  }
};

/**
 * Configure multer for PG image uploads
 */
const uploadPGImages = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files per upload
  }
}).array('images', 10); // 'images' is the field name, max 10 files

/**
 * Configure multer for ticket attachments
 */
const uploadTicketAttachments = multer({
  storage: ticketStorage,
  fileFilter: ticketFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for attachments
    files: 5 // Maximum 5 files per upload
  }
}).array('attachments', 5); // 'attachments' is the field name, max 5 files

/**
 * Configure multer for Excel file uploads (bulk upload)
 */
const uploadExcelFile = multer({
  storage: multer.memoryStorage(), // Store in memory for processing
  fileFilter: (req, file, cb) => {
    // Allow Excel files and CSV
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv' // .csv
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only 1 file per upload
  }
}).single('file'); // 'file' is the field name

/**
 * Error handling middleware for multer
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum file size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  // Handle other errors
  console.error('File upload error:', error);
  return res.status(500).json({
    success: false,
    message: 'File upload failed'
  });
};

/**
 * Error handling middleware specifically for Excel uploads
 */
const handleExcelUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Excel file too large. Maximum file size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one Excel file allowed.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  // Handle other errors
  console.error('Excel upload error:', error);
  return res.status(500).json({
    success: false,
    message: 'Excel file upload failed'
  });
};

/**
 * Middleware to validate uploaded files after upload
 */
const validateUploadedFiles = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }
  
  // Validate each uploaded file
  for (const file of req.files) {
    // Check if file was actually saved
    if (!file.filename) {
      return res.status(400).json({
        success: false,
        message: 'File upload failed'
      });
    }
    
    // Check file size (additional validation)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: `File ${file.originalname} is too large. Maximum size is 5MB.`
      });
    }
  }
  
  next();
};

/**
 * Middleware to clean up uploaded files on error
 */
const cleanupUploadedFiles = (req, res, next) => {
  // Store original files for cleanup
  const originalFiles = req.files ? [...req.files] : [];
  
  // Override res.json to cleanup files on error
  const originalJson = res.json;
  res.json = function(data) {
    if (!data.success && originalFiles.length > 0) {
      // Clean up uploaded files on error
      originalFiles.forEach(file => {
        const filePath = path.join(__dirname, '../../uploads/pg-images', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  uploadPGImages,
  handleUploadError,
  validateUploadedFiles,
  cleanupUploadedFiles,
  uploadTicketAttachments,
  uploadExcelFile,
  handleExcelUploadError
}; 