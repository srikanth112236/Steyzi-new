/**
 * Script to fix existing PGs created by sales users that don't have admin User accounts
 * This script will create User accounts for PGs that have an email but no corresponding User
 */

const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const PG = require('./src/models/pg.model');
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/steyzi';

async function fixPGAdminUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find all PGs
    const pgs = await PG.find({});
    console.log(`\n📊 Found ${pgs.length} PGs to check`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const pg of pgs) {
      try {
        // Check if PG has an email
        if (!pg.email) {
          console.log(`⚠️  PG "${pg.name}" (${pg._id}) has no email, skipping...`);
          skippedCount++;
          continue;
        }

        // Check if admin field exists and points to a User
        const adminUser = await User.findById(pg.admin);
        
        // If admin user exists and has the same email, skip
        if (adminUser && adminUser.email === pg.email) {
          console.log(`✅ PG "${pg.name}" already has correct admin user`);
          skippedCount++;
          continue;
        }

        // Check if a User with this email already exists
        let existingUser = await User.findOne({ email: pg.email.toLowerCase() });

        if (existingUser) {
          // Update existing user to admin role and associate with PG
          if (existingUser.role !== 'admin') {
            existingUser.role = 'admin';
            existingUser.isActive = true;
            existingUser.isEmailVerified = true;
          }
          existingUser.pgId = pg._id;
          
          // Update phone if not set
          if (!existingUser.phone && pg.phone) {
            existingUser.phone = pg.phone;
          }
          
          await existingUser.save();
          
          // Update PG admin reference
          pg.admin = existingUser._id;
          await pg.save();
          
          console.log(`✅ Updated existing User "${pg.email}" to admin role and associated with PG "${pg.name}"`);
          fixedCount++;
        } else {
          // Create new admin user
          const adminPassword = 'Admin@123'; // Default password
          const adminPhone = pg.phone || '0000000000';
          
          const newAdminUser = new User({
            firstName: pg.name || 'PG Admin',
            lastName: 'User',
            email: pg.email.toLowerCase(),
            password: adminPassword,
            phone: adminPhone,
            role: 'admin',
            isActive: true,
            isEmailVerified: true,
            pgId: pg._id
          });

          await newAdminUser.save();
          
          // Update PG admin reference
          pg.admin = newAdminUser._id;
          await pg.save();
          
          console.log(`✅ Created admin user "${pg.email}" for PG "${pg.name}" (default password: Admin@123)`);
          fixedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing PG "${pg.name}" (${pg._id}):`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   ✅ Fixed: ${fixedCount} PGs`);
    console.log(`   ⏭️  Skipped: ${skippedCount} PGs`);
    console.log(`   ❌ Errors: ${errorCount} PGs`);
    console.log('\n✅ Script completed!');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Script error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  fixPGAdminUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = fixPGAdminUsers;

