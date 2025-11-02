const mongoose = require('mongoose');
const Branch = require('./src/models/branch.model');
const PG = require('./src/models/pg.model');

async function createTestBranches() {
  try {
    await mongoose.connect('mongodb://localhost:27017/steyzi');

    // Find the test PG
    const pg = await PG.findById('68ec6cd2d7765bf384c68a42');
    if (!pg) {
      console.log('Test PG not found. Please run create-test-pg.js first.');
      return;
    }

    console.log('Found PG:', pg.name);

    // Check if branches already exist
    const existingBranches = await Branch.find({ pgId: pg._id });
    if (existingBranches.length > 0) {
      console.log('Branches already exist:');
      existingBranches.forEach(branch => {
        console.log(`- ${branch.name} (${branch._id})`);
      });
      return;
    }

    // Create test branches
    const branches = [
      {
        name: 'Main Building',
        description: 'Main accommodation building',
        address: {
          street: '123 Main Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456'
        },
        capacity: 50,
        status: 'active',
        pgId: pg._id
      },
      {
        name: 'Annex Building',
        description: 'Additional accommodation building',
        address: {
          street: '456 Annex Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456'
        },
        capacity: 30,
        status: 'active',
        pgId: pg._id
      },
      {
        name: 'Premium Block',
        description: 'Premium accommodation with better facilities',
        address: {
          street: '789 Premium Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456'
        },
        capacity: 25,
        status: 'active',
        pgId: pg._id
      }
    ];

    const createdBranches = [];
    for (const branchData of branches) {
      const branch = new Branch(branchData);
      const savedBranch = await branch.save();
      createdBranches.push(savedBranch);
      console.log(`Created branch: ${savedBranch.name} (${savedBranch._id})`);
    }

    console.log(`\nSuccessfully created ${createdBranches.length} test branches for PG: ${pg.name}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating test branches:', error);
  }
}

createTestBranches();
