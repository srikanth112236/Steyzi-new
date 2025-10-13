const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI;

    // If no MongoDB URI is provided, try to use a default local connection
    if (!mongoURI) {
      logger.warn('No MongoDB URI provided, using default local connection');
      mongoURI = 'mongodb://localhost:27017/pg_maintenance';
    }

    logger.info('Attempting to connect to MongoDB...');
    logger.info(`MongoDB URI: ${mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000,
      // Add retry logic
      retryWrites: true,
      w: 'majority',
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    
    // If local MongoDB fails, provide helpful error message
    if (error.message.includes('ECONNREFUSED') || error.message.includes('localhost')) {
      logger.error('❌ Local MongoDB is not running. Please:');
      logger.error('1. Install MongoDB locally, or');
      logger.error('2. Use MongoDB Atlas (cloud), or');
      logger.error('3. Start MongoDB service with: sudo systemctl start mongod');
      logger.error('4. Or install MongoDB with Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest');
    }
    
    logger.error('Full error:', error);
    
    // In development, don't exit the process, just log the error
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Continuing without database connection in development mode');
      return;
    }
    
    process.exit(1);
  }
};

module.exports = connectDB; 