const mongoose = require('mongoose');
const PG = require('./src/models/pg.model');
const User = require('./src/models/user.model');

async function createTestPG() {
  try {
    await mongoose.connect('mongodb://localhost:27017/steyzi');

    // Check if PG already exists
    const existingPG = await PG.findById('68ec6cd2d7765bf384c68a42');
    if (existingPG) {
      console.log('PG already exists:', existingPG._id);
      return;
    }

    // Get the user to associate as admin
    const user = await User.findById('68ec8a1a6530853cd6dd23ee');
    if (!user) {
      console.log('User not found');
      return;
    }

    // Create test PG
    const testPG = new PG({
      _id: '68ec6cd2d7765bf384c68a42', // Use the expected ID
      name: 'Test PG',
      description: 'Test PG for development',
      address: {
        street: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      phone: user.phone || '9876543210',
      email: user.email,
      admin: user._id,
      createdBy: user._id, // Assuming user is superadmin
      isActive: true,
      status: 'active',
      isConfigured: false // Will be set to true during configuration
    });

    const savedPG = await testPG.save();
    console.log('Test PG created successfully:', savedPG._id);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating test PG:', error);
  }
}

createTestPG();
