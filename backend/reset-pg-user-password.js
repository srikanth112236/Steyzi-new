const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/user.model');

async function resetPGUserPassword() {
  try {
    // Detailed connection logging
    console.log('🔍 Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI || 'No URI provided');

    // Robust connection options
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000
    };

    // Attempt connection with comprehensive error handling
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/pg_maintenance', 
      connectionOptions
    );

    console.log('✅ MongoDB Connection Successful');

    // Find the PG user with more detailed logging
    const user = await User.findOne({ email: 'testpgonee@gmail.com' });

    if (!user) {
      console.log('❌ No user found with email: testpgonee@gmail.com');
      return;
    }

    // Set a new password and hash it
    const newPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Password reset successful');
    console.log('Email:', user.email);
    console.log('User ID:', user._id);
    console.log('Role:', user.role);

  } catch (error) {
    console.error('❌ Detailed Error Information:');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    
    // Specific MongoDB connection error handling
    if (error.name === 'MongooseServerSelectionError') {
      console.error('🚨 MongoDB Connection Failed. Possible reasons:');
      console.error('1. MongoDB server not running');
      console.error('2. Incorrect connection string');
      console.error('3. Network issues');
      console.error('4. Firewall blocking connection');
    }

    // Additional context about the error
    console.error('Full Error Object:', JSON.stringify(error, null, 2));

  } finally {
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error('Error during disconnection:', disconnectError);
    }
  }
}

resetPGUserPassword();
