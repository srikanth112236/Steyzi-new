const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const PG = require('../src/models/pg.model');
const Branch = require('../src/models/branch.model');

async function migrateOnboardingStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/steyzi', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Starting onboarding migration...');

    // Find all users
    const users = await User.find({});

    for (const user of users) {
      try {
        // Determine PG creation status
        const pgCreationStatus = user.pgId ? 'completed' : 'not_started';
        
        // Determine branch setup status
        const branchSetupStatus = user.branchId ? 'completed' : 'not_started';
        
        // Determine PG configuration status
        const pgConfigurationStatus = user.pgConfigured ? 'completed' : 'not_started';

        // Determine current step
        let currentOnboardingStep = 'pg_creation';
        if (pgCreationStatus === 'completed') {
          currentOnboardingStep = branchSetupStatus === 'completed' 
            ? (pgConfigurationStatus === 'completed' ? 'completed' : 'pg_configuration')
            : 'branch_setup';
        }

        // Update user's onboarding status
        user.onboarding = {
          pgCreation: {
            status: pgCreationStatus,
            pgId: user.pgId || null,
            completedAt: pgCreationStatus === 'completed' ? new Date() : null
          },
          branchSetup: {
            status: branchSetupStatus,
            defaultBranchId: user.branchId || null,
            completedAt: branchSetupStatus === 'completed' ? new Date() : null
          },
          pgConfiguration: {
            status: pgConfigurationStatus,
            sharingTypesConfigured: user.pgConfigured || false,
            completedAt: pgConfigurationStatus === 'completed' ? new Date() : null
          },
          currentOnboardingStep
        };

        await user.save();

        console.log(`Migrated user ${user._id}: ${currentOnboardingStep}`);
      } catch (userMigrationError) {
        console.error(`Error migrating user ${user._id}:`, userMigrationError);
      }
    }

    console.log('Onboarding migration completed successfully.');
  } catch (error) {
    console.error('Onboarding migration failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the migration
migrateOnboardingStatus();
