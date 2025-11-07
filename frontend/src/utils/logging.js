import axios from 'axios';

// Logging configuration
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  constructor() {
    // Use environment variables or fallback to default values
    this.logLevel = (
      (typeof window !== 'undefined' && window.REACT_APP_LOG_LEVEL) || 
      (typeof process !== 'undefined' && process.env.REACT_APP_LOG_LEVEL) || 
      LOG_LEVELS.INFO
    );
    
    // Determine environment
    this.isProduction = (
      (typeof window !== 'undefined' && window.NODE_ENV === 'production') || 
      (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') || 
      false
    );
  }

  // Local logging method
  _log(level, message, metadata = {}) {
    // Only log if current log level allows
    const logLevels = [
      LOG_LEVELS.ERROR, 
      LOG_LEVELS.WARN, 
      LOG_LEVELS.INFO, 
      LOG_LEVELS.DEBUG
    ];
    const currentLevelIndex = logLevels.indexOf(this.logLevel);
    const messageLevelIndex = logLevels.indexOf(level);

    if (messageLevelIndex <= currentLevelIndex) {
      // Use console methods safely
      const consoleMethod = console[level] || console.log;
      consoleMethod(`[${level.toUpperCase()}] ${message}`, metadata);
    }
  }

  // Remote logging method
  async _logToServer(eventType, data, level = LOG_LEVELS.INFO) {
    try {
      // Only log to server in production
      if (!this.isProduction) return;

      const { getApiBaseUrl } = await import('./apiUrl');
      const apiBase = getApiBaseUrl();
      await axios.post(`${apiBase}/logs`, {
        eventType,
        level,
        timestamp: new Date().toISOString(),
        data
      });
    } catch (error) {
      // Fallback error logging
      console.error('Failed to log event to server', error);
    }
  }

  // Public logging methods
  error(message, metadata = {}) {
    this._log(LOG_LEVELS.ERROR, message, metadata);
    this._logToServer(message, metadata, LOG_LEVELS.ERROR);
  }

  warn(message, metadata = {}) {
    this._log(LOG_LEVELS.WARN, message, metadata);
    this._logToServer(message, metadata, LOG_LEVELS.WARN);
  }

  info(message, metadata = {}) {
    this._log(LOG_LEVELS.INFO, message, metadata);
    this._logToServer(message, metadata, LOG_LEVELS.INFO);
  }

  debug(message, metadata = {}) {
    this._log(LOG_LEVELS.DEBUG, message, metadata);
    this._logToServer(message, metadata, LOG_LEVELS.DEBUG);
  }

  // Specific logging function for onboarding events
  onboardingEvent(eventName, eventData = {}) {
    this.info(`Onboarding Event: ${eventName}`, {
      category: 'onboarding',
      ...eventData
    });
  }
}

// Create a singleton logger instance
const logger = new Logger();

export const logOnboardingEvent = (eventName, eventData = {}) => {
  logger.onboardingEvent(eventName, eventData);
};

// Export logger for general use
export default logger;
