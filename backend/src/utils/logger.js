const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);


// Create the winston logger instance
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),

    // File transport for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // File transport for combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Custom logging methods
class CustomLogger {
  constructor() {
    this.winstonLogger = winstonLogger;
  }

  /**
   * Log an event with context
   * @param {string} level - Log level (error, warn, info, debug)
   * @param {string} message - Log message
   * @param {Object} [metadata={}] - Additional context for the log
   */
  log(level, message, metadata = {}) {
    // Sanitize metadata to prevent circular references
    const sanitizedMetadata = this._sanitizeMetadata(metadata);

    // Log the event
    this.winstonLogger[level](message, sanitizedMetadata);
  }

  /**
   * Log an error event
   * @param {string} message - Error message
   * @param {Object} [error] - Error object
   * @param {Object} [metadata={}] - Additional context
   */
  error(message, error = null, metadata = {}) {
    const logData = {
      ...metadata,
      ...(error && { errorStack: error.stack })
    };

    this.log('error', message, logData);
  }

  /**
   * Log an onboarding event
   * @param {string} eventName - Name of the onboarding event
   * @param {Object} [eventData={}] - Event details
   */
  onboardingEvent(eventName, eventData = {}) {
    this.log('info', `Onboarding Event: ${eventName}`, {
      category: 'onboarding',
      ...eventData
    });
  }

  // Delegate winston logger methods
  info(message, ...args) {
    return this.winstonLogger.info(message, ...args);
  }

  warn(message, ...args) {
    return this.winstonLogger.warn(message, ...args);
  }

  debug(message, ...args) {
    return this.winstonLogger.debug(message, ...args);
  }

  /**
   * Sanitize metadata to prevent circular references
   * @param {Object} metadata - Metadata to sanitize
   * @returns {Object} Sanitized metadata
   */
  _sanitizeMetadata(metadata) {
    try {
      return JSON.parse(JSON.stringify(metadata, this._replacer()));
    } catch (error) {
      return {
        error: 'Failed to sanitize metadata',
        originalMetadata: metadata.toString()
      };
    }
  }

  /**
   * Custom replacer for JSON.stringify to handle circular references
   * @returns {Function} Replacer function
   */
  _replacer() {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    };
  }
}

// Export a singleton logger instance
module.exports = new CustomLogger(); 