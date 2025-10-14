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
    logger.log('info', '🚀 Initializing default trial plan...');
    
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
      logger.log('info', 'Free trial plan already exists, updating settings...');
      existingTrial.planDescription = 'Full-featured 14-day trial with complete access to all modules';
      existingTrial.trialPeriodDays = 14;
      existingTrial.createdBy = systemUser._id;
      existingTrial.topUpPricePerBed = 0;
      
      // Update modules with COMPLETE access to ALL features and admin routes
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
          limit: 10, // Allow 10 branches during trial (increased from 2)
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
        },
        {
          moduleName: 'admin_management',
          enabled: true,
          limit: null,
          permissions: new Map([
            ['admin_routes', { create: true, read: true, update: true, delete: true }],
            ['user_management', { create: true, read: true, update: true, delete: true }],
            ['settings', { create: true, read: true, update: true, delete: true }],
            ['subscription_management', { create: true, read: true, update: true, delete: true }]
          ])
        },
        {
          moduleName: 'security_management',
          enabled: true,
          limit: null,
          permissions: new Map([
            ['audit_logs', { create: true, read: true, update: true, delete: true }],
            ['security_settings', { create: true, read: true, update: true, delete: true }],
            ['access_control', { create: true, read: true, update: true, delete: true }]
          ])
        }
      ];

      // Update features with COMPLETE access to ALL admin features
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
        { name: 'Multi-Branch Management', description: 'Manage up to 10 branches', enabled: true },
        { name: 'Admin Management', description: 'Full administrative access and user management', enabled: true },
        { name: 'Security Management', description: 'Complete security settings and audit logs', enabled: true },
        { name: 'Custom Reports', description: 'Build custom reports and queries', enabled: true },
        { name: 'Settings', description: 'Access to all system configuration', enabled: true },
        { name: 'Subscription Management', description: 'Manage subscriptions and billing', enabled: true }
      ];

      await existingTrial.save();
      logger.log('info', 'Existing trial plan updated successfully');
      return { success: true };
    }

    logger.log('info', 'Creating new free trial plan...');
    const trialPlan = new Subscription({
      planName: 'Free Trial Plan',
      planDescription: 'Full-featured 14-day trial with complete access to all modules and admin features',
      billingCycle: 'monthly',
      basePrice: 0,
      baseBedCount: 30,
      maxBedsAllowed: 30,
      trialPeriodDays: 14,
      status: 'active',
      topUpPricePerBed: 0,
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
          limit: 10, // Allow 10 branches during trial
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
        },
        {
          moduleName: 'admin_management',
          enabled: true,
          limit: null,
          permissions: new Map([
            ['admin_routes', { create: true, read: true, update: true, delete: true }],
            ['user_management', { create: true, read: true, update: true, delete: true }],
            ['settings', { create: true, read: true, update: true, delete: true }],
            ['subscription_management', { create: true, read: true, update: true, delete: true }]
          ])
        },
        {
          moduleName: 'security_management',
          enabled: true,
          limit: null,
          permissions: new Map([
            ['audit_logs', { create: true, read: true, update: true, delete: true }],
            ['security_settings', { create: true, read: true, update: true, delete: true }],
            ['access_control', { create: true, read: true, update: true, delete: true }]
          ])
        }
      ],
      features: [
        { name: 'Full Dashboard', description: 'Complete access to all dashboard features', enabled: true },
        { name: 'Resident Management', description: 'Full resident CRUD operations', enabled: true },
        { name: 'Payment Tracking', description: 'Complete payment management', enabled: true },
        { name: 'Room Allocation', description: 'Full room management capabilities', enabled: true },
        { name: 'QR Code Payments', description: 'Generate and process QR code payments', enabled: true },
        { name: 'Support Tickets', description: 'Create, manage, and track tickets', enabled: true },
        { name: 'Advanced Reports', description: 'Comprehensive reporting tools', enabled: true },
        { name: 'Bulk Upload', description: 'Import and manage bulk data', enabled: true },
        { name: 'Email & SMS Notifications', description: 'Full communication tools', enabled: true },
        { name: 'Multi-Branch Management', description: 'Manage up to 10 branches', enabled: true },
        { name: 'Admin Management', description: 'Full administrative access and user management', enabled: true },
        { name: 'Security Management', description: 'Complete security settings and audit logs', enabled: true },
        { name: 'Custom Reports', description: 'Build custom reports and queries', enabled: true },
        { name: 'Settings', description: 'Access to all system configuration', enabled: true },
        { name: 'Subscription Management', description: 'Manage subscriptions and billing', enabled: true }
      ]
    });

    await trialPlan.save();
    logger.log('info', 'Free trial plan created successfully');
    return { success: true };
  } catch (error) {
    logger.log('error', '❌ Error creating trial plan:', error);
    return { success: false, error: error.message };
  }
}

// Connect to MongoDB and run initialization
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pg_maintenance';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  logger.log('info', 'Connected to MongoDB');
  try {
    await initDefaultTrialPlan();
    logger.log('info', 'Trial plan initialization complete');
    process.exit(0);
  } catch (error) {
    logger.log('error', 'Trial plan initialization failed:', error);
    process.exit(1);
  }
})
.catch(error => {
  logger.log('error', 'MongoDB connection error:', error);
  process.exit(1);
});

// If script is run directly
if (require.main === module) {
  initDefaultTrialPlan()
    .then(() => {
      logger.log('info', '✅ Default trial plan script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.log('error', '❌ Default trial plan script failed:', error);
      process.exit(1);
    });
}

module.exports = { initDefaultTrialPlan };
