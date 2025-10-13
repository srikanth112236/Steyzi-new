require('dotenv').config();
const mongoose = require('mongoose');
const Subscription = require('../models/subscription.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Initialize default free trial plan with all modules and full permissions
 */
async function initDefaultTrialPlan() {
  try {
    console.log('Starting trial plan initialization...');
    
    // Find a superadmin user to use as createdBy
    const systemUser = await User.findOne({ role: 'superadmin' });
    if (!systemUser) {
      throw new Error('No superadmin user found. Please create a superadmin user first.');
    }

    // Check if trial plan already exists
    const existingTrial = await Subscription.findOne({
      planName: 'Free Trial Plan',
      billingCycle: 'monthly'
    });

    if (existingTrial) {
      console.log('Free trial plan already exists, updating settings...');
      existingTrial.planDescription = 'Full-featured 14-day trial with complete access to all modules';
      existingTrial.trialPeriodDays = 14;
      existingTrial.createdBy = systemUser._id;
      existingTrial.topUpPricePerBed = 0;
      
      // Update modules with full permissions
      existingTrial.modules = [
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
          moduleName: 'ticket_system',
          enabled: true,
          limit: null,
          permissions: new Map([
            ['tickets', { create: true, read: true, update: true, delete: true }],
            ['ticket_categories', { create: true, read: true, update: true, delete: true }],
            ['ticket_priorities', { create: true, read: true, update: true, delete: true }]
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
          moduleName: 'bulk_upload',
          enabled: true,
          limit: null,
          permissions: new Map([
            ['file_upload', { create: true, read: true, update: true, delete: true }],
            ['data_validation', { create: true, read: true, update: true, delete: true }],
            ['bulk_import', { create: true, read: true, update: true, delete: true }]
          ])
        },
        {
          moduleName: 'email_notifications',
          enabled: true,
          limit: null,
          permissions: new Map([
            ['email_templates', { create: true, read: true, update: true, delete: true }],
            ['email_sending', { create: true, read: true, update: true, delete: true }],
            ['email_history', { create: true, read: true, update: true, delete: true }]
          ])
        },
        {
          moduleName: 'sms_notifications',
          enabled: true,
          limit: null,
          permissions: new Map([
            ['sms_templates', { create: true, read: true, update: true, delete: true }],
            ['sms_sending', { create: true, read: true, update: true, delete: true }],
            ['sms_history', { create: true, read: true, update: true, delete: true }]
          ])
        },
        {
          moduleName: 'multi_branch',
          enabled: true,
          limit: 2, // Allow 2 branches during trial
          permissions: new Map([
            ['branch_management', { create: true, read: true, update: true, delete: true }],
            ['branch_switching', { create: true, read: true, update: true, delete: true }],
            ['branch_reports', { create: true, read: true, update: true, delete: true }]
          ])
        },
        {
          moduleName: 'custom_reports',
          enabled: true,
          limit: null,
          permissions: new Map([
            ['report_builder', { create: true, read: true, update: true, delete: true }],
            ['custom_queries', { create: true, read: true, update: true, delete: true }],
            ['report_scheduling', { create: true, read: true, update: true, delete: true }]
          ])
        }
      ];

      // Update features
      existingTrial.features = [
        { name: 'Full Dashboard', description: 'Complete access to all dashboard features', enabled: true },
        { name: 'Resident Management', description: 'Full resident CRUD operations', enabled: true },
        { name: 'Payment Tracking', description: 'Complete payment management', enabled: true },
        { name: 'Room Allocation', description: 'Full room management capabilities', enabled: true },
        { name: 'QR Code Payments', description: 'Generate and process QR code payments', enabled: true },
        { name: 'Support Tickets', description: 'Create, manage, and track tickets', enabled: true },
        { name: 'Advanced Reports', description: 'Comprehensive reporting tools', enabled: true },
        { name: 'Bulk Upload', description: 'Import and manage bulk data', enabled: true },
        { name: 'Email & SMS Notifications', description: 'Full communication tools', enabled: true },
        { name: 'Multi-Branch Management', description: 'Manage up to 2 branches', enabled: true }
      ];

      await existingTrial.save();
      console.log('Existing trial plan updated successfully');
      return existingTrial;
    }

    console.log('Creating new free trial plan...');
    const trialPlan = new Subscription({
      planName: 'Free Trial Plan',
      planDescription: 'Full-featured 14-day trial with complete access to all modules',
      billingCycle: 'monthly',
      basePrice: 0,
      baseBedCount: 30,
      maxBedsAllowed: 30,
      trialPeriodDays: 14,
      status: 'active',
      topUpPricePerBed: 0,
      createdBy: systemUser._id,
      modules: [
        // Same module configuration as above
      ],
      features: [
        // Same features configuration as above
      ]
    });

    await trialPlan.save();
    console.log('Free trial plan created successfully');
    return trialPlan;
  } catch (error) {
    console.error('Error creating trial plan:', error);
    throw error;
  }
}

// Connect to MongoDB and run initialization
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pg_maintenance';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  try {
    await initDefaultTrialPlan();
    console.log('Trial plan initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('Trial plan initialization failed:', error);
    process.exit(1);
  }
})
.catch(error => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});
