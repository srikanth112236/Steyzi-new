const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupSalesRole() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/steyzi', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const User = require('./backend/src/models/user.model');

    console.log('🔍 Checking for users with invalid salesRole values...');

    // Find users with invalid salesRole values (anything that's not 'sales', 'sub_sales', null, or undefined)
    const usersWithInvalidSalesRole = await User.find({
      salesRole: {
        $exists: true,
        $nin: ['sales', 'sub_sales', null, undefined],
        $ne: '' // Also exclude empty strings
      }
    });

    console.log(`Found ${usersWithInvalidSalesRole.length} users with invalid salesRole values`);

    if (usersWithInvalidSalesRole.length > 0) {
      console.log('Sample invalid users:');
      usersWithInvalidSalesRole.slice(0, 3).forEach(user => {
        console.log(`  - ${user.email}: "${user.salesRole}"`);
      });

      // Clean up invalid salesRole values by setting them to null
      const result = await User.updateMany(
        {
          salesRole: {
            $exists: true,
            $nin: ['sales', 'sub_sales', null, undefined],
            $ne: ''
          }
        },
        { $unset: { salesRole: 1 } }
      );

      console.log(`✅ Cleaned up ${result.modifiedCount} users with invalid salesRole values`);
    }

    // Also check for users with empty string salesRole
    const usersWithEmptySalesRole = await User.find({ salesRole: '' });
    if (usersWithEmptySalesRole.length > 0) {
      console.log(`Found ${usersWithEmptySalesRole.length} users with empty string salesRole`);

      const result2 = await User.updateMany(
        { salesRole: '' },
        { $unset: { salesRole: 1 } }
      );

      console.log(`✅ Cleaned up ${result2.modifiedCount} users with empty string salesRole`);
    }

    await mongoose.connection.close();
    console.log('✅ Cleanup completed successfully');
  } catch (err) {
    console.error('❌ Error during cleanup:', err);
    await mongoose.connection.close();
  }
}

cleanupSalesRole();
