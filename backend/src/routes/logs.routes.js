const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

/**
 * @route   POST /api/logs
 * @desc    Log frontend events
 * @access  Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      eventType, 
      level = 'info', 
      timestamp, 
      data 
    } = req.body;

    // Validate input
    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: 'Event type is required'
      });
    }

    // Log the event with additional context
    logger.log(level, eventType, {
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      timestamp: timestamp || new Date().toISOString(),
      ...data
    });

    return res.status(200).json({
      success: true,
      message: 'Event logged successfully'
    });
  } catch (error) {
    console.error('Frontend logging error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to log event',
      error: error.message
    });
  }
});

module.exports = router;
