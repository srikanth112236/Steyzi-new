const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const logger = require('../utils/logger');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pg_maintenance';

async function createSuperadmin(userData) {
  try {
    logger.log('info', '🚀 Creating superadmin user...');
    
    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Check if a superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      logger.log('info', 'Superadmin already exists. Skipping creation.');
      await mongoose.disconnect();
      return { 
        success: true, 
        message: 'Superadmin already exists. Skipping creation.' 
      };
    }

    // Generate a secure password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', salt);

    // Create superadmin user
    const superAdmin = new User({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'superadmin@pgmaintenance.com',
      password: hashedPassword,
      role: 'superadmin',
      isActive: true,
      pgId: null, // No PG associated with superadmin
      phoneNumber: '+1234567890'
    });

    // Save the superadmin user
    await superAdmin.save();

    logger.log('info', '✅ Superadmin user created successfully');
    return { 
      success: true, 
      message: 'Superadmin user created successfully' 
    };
  } catch (error) {
    logger.log('error', '❌ Error creating superadmin user:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// If script is run directly
if (require.main === module) {
  createSuperadmin()
    .then((result) => {
      if (result.success) {
        logger.log('info', '✅ Superadmin creation script completed');
        process.exit(0);
      } else {
        logger.log('error', '❌ Superadmin creation script failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.log('error', '❌ Superadmin creation script failed:', error);
      process.exit(1);
    });
}

module.exports = { createSuperadmin };
