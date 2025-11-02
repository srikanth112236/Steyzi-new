// Migration script to add payments array to existing salary records
const mongoose = require('mongoose');
const Salary = require('./src/models/salary.model');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/steyzi');
    console.log('MongoDB connected for migration');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const migrateSalaries = async () => {
  try {
    console.log('Starting salary payments migration...');

    // Find all salaries that don't have a payments array
    const salariesWithoutPayments = await Salary.find({
      $or: [
        { payments: { $exists: false } },
        { payments: { $size: 0 } }
      ]
    });

    console.log(`Found ${salariesWithoutPayments.length} salaries to migrate`);

    let migratedCount = 0;

    for (const salary of salariesWithoutPayments) {
      // If salary has been paid, create a payment record from the existing data
      if (salary.paidAmount > 0 && salary.status !== 'pending') {
        const paymentRecord = {
          amount: salary.paidAmount,
          paymentMethod: salary.paymentMethod || 'cash',
          transactionId: salary.transactionId || undefined,
          paymentDate: salary.paymentDate || salary.paidAt || salary.updatedAt,
          notes: salary.notes || undefined,
          paidBy: salary.paidBy,
          paidAt: salary.paidAt || salary.updatedAt,
          receiptImage: salary.receiptImage || undefined
        };

        salary.payments = [paymentRecord];
        await salary.save();
        migratedCount++;
      } else {
        // Just initialize empty payments array
        salary.payments = [];
        await salary.save();
      }
    }

    console.log(`✅ Migration completed! Migrated ${migratedCount} salary records`);

    // Verify the migration
    const totalSalaries = await Salary.countDocuments();
    const salariesWithPayments = await Salary.countDocuments({
      payments: { $exists: true }
    });

    console.log(`Total salaries: ${totalSalaries}`);
    console.log(`Salaries with payments array: ${salariesWithPayments}`);

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run migration
if (require.main === module) {
  connectDB().then(() => {
    migrateSalaries();
  });
}

module.exports = { migrateSalaries };

