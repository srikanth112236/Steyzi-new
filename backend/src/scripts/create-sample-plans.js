require('dotenv').config();
const mongoose = require('mongoose');
const Subscription = require('../models/subscription.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Create sample subscription plans for testing
 */
async function createSamplePlans() {
  try {
    logger.log('info', '🚀 Creating sample subscription plans...');

    // Find a superadmin user to use as createdBy
    const systemUser = await User.findOne({ role: 'superadmin' });
    if (!systemUser) {
      throw new Error('No superadmin user found. Please create a superadmin user first.');
    }

    // Create sample plans
    const samplePlans = [
      {
        planName: 'Basic Plan',
        planDescription: 'Perfect for small PGs with basic features',
        billingCycle: 'monthly',
        basePrice: 999,
        baseBedCount: 10,
        topUpPricePerBed: 50,
        maxBedsAllowed: 50,
        allowMultipleBranches: false,
        branchCount: 1,
        costPerBranch: 0,
        status: 'active',
        isPopular: false,
        isCustomPlan: false,
        createdBy: systemUser._id,
        modules: [
          {
            moduleName: 'resident_management',
            enabled: true,
            limit: null,
            permissions: new Map([
              ['residents', { create: true, read: true, update: true, delete: true }],
              ['onboarding', { create: true, read: true, update: true, delete: true }]
            ])
          },
          {
            moduleName: 'payment_tracking',
            enabled: true,
            limit: null,
            permissions: new Map([
              ['payments', { create: true, read: true, update: true, delete: true }],
              ['payment_history', { create: true, read: true, update: true, delete: true }]
            ])
          },
          {
            moduleName: 'room_allocation',
            enabled: true,
            limit: null,
            permissions: new Map([
              ['rooms', { create: true, read: true, update: true, delete: true }],
              ['room_availability', { create: true, read: true, update: true, delete: true }]
            ])
          }
        ],
        features: [
          { name: 'Resident Management', description: 'Basic resident management', enabled: true },
          { name: 'Payment Tracking', description: 'Track payments', enabled: true },
          { name: 'Room Allocation', description: 'Manage rooms', enabled: true }
        ]
      },
      {
        planName: 'Professional Plan',
        planDescription: 'Advanced features for growing PGs',
        billingCycle: 'monthly',
        basePrice: 1999,
        baseBedCount: 25,
        topUpPricePerBed: 40,
        maxBedsAllowed: 100,
        allowMultipleBranches: true,
        branchCount: 3,
        costPerBranch: 300,
        status: 'active',
        isPopular: true,
        isCustomPlan: false,
        createdBy: systemUser._id,
        modules: [
          {
            moduleName: 'resident_management',
            enabled: true,
            limit: null,
            permissions: new Map([
              ['residents', { create: true, read: true, update: true, delete: true }],
              ['onboarding', { create: true, read: true, update: true, delete: true }],
              ['offboarding', { create: true, read: true, update: true, delete: true }]
            ])
          },
          {
            moduleName: 'payment_tracking',
            enabled: true,
            limit: null,
            permissions: new Map([
              ['payments', { create: true, read: true, update: true, delete: true }],
              ['payment_history', { create: true, read: true, update: true, delete: true }],
              ['payment_reports', { create: true, read: true, update: true, delete: true }]
            ])
          },
          {
            moduleName: 'room_allocation',
            enabled: true,
            limit: null,
            permissions: new Map([
              ['rooms', { create: true, read: true, update: true, delete: true }],
              ['room_availability', { create: true, read: true, update: true, delete: true }],
              ['room_assignments', { create: true, read: true, update: true, delete: true }]
            ])
          },
          {
            moduleName: 'analytics_reports',
            enabled: true,
            limit: null,
            permissions: new Map([
              ['dashboard', { create: true, read: true, update: true, delete: true }],
              ['reports', { create: true, read: true, update: true, delete: true }]
            ])
          },
          {
            moduleName: 'multi_branch',
            enabled: true,
            limit: 3,
            permissions: new Map([
              ['branch_management', { create: true, read: true, update: true, delete: true }],
              ['branch_switching', { create: true, read: true, update: true, delete: true }]
            ])
          }
        ],
        features: [
          { name: 'Advanced Resident Management', description: 'Complete resident lifecycle management', enabled: true },
          { name: 'Payment Reports', description: 'Detailed payment analytics', enabled: true },
          { name: 'Multi-Branch Support', description: 'Manage up to 3 branches', enabled: true },
          { name: 'Analytics Dashboard', description: 'Basic reporting and charts', enabled: true }
        ]
      },
      {
        planName: 'Enterprise Plan',
        planDescription: 'Complete solution for large PG networks',
        billingCycle: 'monthly',
        basePrice: 4999,
        baseBedCount: 50,
        topUpPricePerBed: 30,
        maxBedsAllowed: 500,
        allowMultipleBranches: true,
        branchCount: 10,
        costPerBranch: 200,
        status: 'active',
        isPopular: false,
        isCustomPlan: false,
        createdBy: systemUser._id,
        modules: [
          {
            moduleName: 'resident_management',
            enabled: true,
            limit: null,
            permissions: new Map([
              ['residents', { create: true, read: true, update: true, delete: true }],
              ['onboarding', { create: true, read: true, update: true, delete: true }],
              ['offboarding', { create: true, read: true, update: true, delete: true }],
              ['room_switching', { create: true, read: true, update: true, delete: true }],
              ['moved_out', { create: true, read: true, update: true, delete: true }]
            ])
          },
          {
            moduleName: 'payment_tracking',
            enabled: true,
            limit: null,
            permissions: new Map([
              ['payments', { create: true, read: true, update: true, delete: true }],
              ['payment_history', { create: true, read: true, update: true, delete: true }],
              ['payment_reports', { create: true, read: true, update: true, delete: true }]
            ])
          },
          {
            moduleName: 'room_allocation',
            enabled: true,
            limit: null,
            permissions: new Map([
              ['rooms', { create: true, read: true, update: true, delete: true }],
              ['room_availability', { create: true, read: true, update: true, delete: true }],
              ['room_assignments', { create: true, read: true, update: true, delete: true }]
            ])
          },
          {
            moduleName: 'qr_code_payments',
            enabled: true,
            limit: null,
            permissions: new Map([
              ['qr_generation', { create: true, read: true, update: true, delete: true }],
              ['qr_scanning', { create: true, read: true, update: true, delete: true }],
              ['payment_processing', { create: true, read: true, update: true, delete: true }]
            ])
          },
          {
            moduleName: 'analytics_reports',
            enabled: true,
            limit: null,
            permissions: new Map([
              ['dashboard', { create: true, read: true, update: true, delete: true }],
              ['reports', { create: true, read: true, update: true, delete: true }],
              ['charts', { create: true, read: true, update: true, delete: true }],
              ['exports', { create: true, read: true, update: true, delete: true }]
            ])
          },
          {
            moduleName: 'multi_branch',
            enabled: true,
            limit: 10,
            permissions: new Map([
              ['branch_management', { create: true, read: true, update: true, delete: true }],
              ['branch_switching', { create: true, read: true, update: true, delete: true }],
              ['branch_reports', { create: true, read: true, update: true, delete: true }]
            ])
          },
          {
            moduleName: 'bulk_upload',
            enabled: true,
            limit: null,
            permissions: new Map([
              ['file_upload', { create: true, read: true, update: true, delete: true }],
              ['data_validation', { create: true, read: true, update: true, delete: true }],
              ['bulk_import', { create: true, read: true, update: true, delete: true }]
            ])
          }
        ],
        features: [
          { name: 'Complete Resident Management', description: 'Full resident lifecycle management', enabled: true },
          { name: 'QR Code Payments', description: 'Generate and process QR payments', enabled: true },
          { name: 'Advanced Analytics', description: 'Comprehensive reporting and insights', enabled: true },
          { name: 'Bulk Upload', description: 'Import and manage bulk data', enabled: true },
          { name: 'Multi-Branch Management', description: 'Manage up to 10 branches', enabled: true }
        ]
      }
    ];

    // Create or update plans
    for (const planData of samplePlans) {
      const existingPlan = await Subscription.findOne({
        planName: planData.planName,
        billingCycle: planData.billingCycle
      });

      if (existingPlan) {
        console.log(`Updating existing plan: ${planData.planName}`);
        Object.assign(existingPlan, planData);
        await existingPlan.save();
      } else {
        console.log(`Creating new plan: ${planData.planName}`);
        const plan = new Subscription(planData);
        await plan.save();
      }
    }

    console.log('✅ Sample plans created successfully');
    return { success: true };

  } catch (error) {
    logger.log('error', '❌ Error creating sample plans:', error);
    return { success: false, error: error.message };
  }
}

// Connect to MongoDB and run initialization
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/steyzi';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  logger.log('info', 'Connected to MongoDB');
  try {
    await createSamplePlans();
    logger.log('info', 'Sample plans creation complete');
    process.exit(0);
  } catch (error) {
    logger.log('error', 'Sample plans creation failed:', error);
    process.exit(1);
  }
})
.catch(error => {
  logger.log('error', 'MongoDB connection error:', error);
  process.exit(1);
});

module.exports = { createSamplePlans };
