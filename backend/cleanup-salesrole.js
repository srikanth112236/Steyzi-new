const mongoose = require('mongoose');
const User = require('./src/models/user.model');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pg_maintenance');
    console.log('Connected to database');

    const result = await User.cleanupInvalidSalesRoles();
    console.log('Cleanup completed:', result);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanup();
