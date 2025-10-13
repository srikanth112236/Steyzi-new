const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pg_maintenance';

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Check if a superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('Superadmin already exists. Skipping creation.');
      await mongoose.disconnect();
      return;
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

    console.log('Superadmin user created successfully:');
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Role: ${superAdmin.role}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating superadmin:', error);
    process.exit(1);
  }
}

// Run the script
createSuperAdmin();
