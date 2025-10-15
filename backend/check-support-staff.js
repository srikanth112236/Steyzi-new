const mongoose = require('mongoose');
const User = require('./src/models/user.model');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/steyzi');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Check and create support staff
const checkSupportStaff = async () => {
  try {
    console.log('Checking for support staff users...');

    const supportStaff = await User.find({
      role: 'support',
      isActive: true
    });

    console.log(`Found ${supportStaff.length} active support staff users:`);
    supportStaff.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
    });

    if (supportStaff.length === 0) {
      console.log('No support staff found. Creating test support staff...');

      const testSupportStaff = [
        {
          firstName: 'John',
          lastName: 'Support',
          email: 'john.support@steyzi.com',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password123
          role: 'support',
          isActive: true
        },
        {
          firstName: 'Jane',
          lastName: 'Helpdesk',
          email: 'jane.helpdesk@steyzi.com',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password123
          role: 'support',
          isActive: true
        }
      ];

      for (const staff of testSupportStaff) {
        const existingUser = await User.findOne({ email: staff.email });
        if (!existingUser) {
          await User.create(staff);
          console.log(`Created support staff: ${staff.firstName} ${staff.lastName}`);
        } else {
          console.log(`Support staff already exists: ${staff.firstName} ${staff.lastName}`);
        }
      }
    }

    console.log('Support staff check completed.');
  } catch (error) {
    console.error('Error checking support staff:', error);
  }
};

// Run the check
const run = async () => {
  await connectDB();
  await checkSupportStaff();
  process.exit(0);
};

run();
