const mongoose = require('mongoose');
const User = require('../models/user.model');
const PG = require('../models/pg.model');
const Branch = require('../models/branch.model');

class OnboardingService {
  /**
   * Validate and progress PG creation
   * @param {string} userId - User ID
   * @param {Object} pgData - PG creation data
   * @returns {Promise<Object>} - PG creation result with onboarding status
   */
  async validateAndProgressPGCreation(userId, pgData) {
    try {
      const PGService = require('./pg.service');

      // Validate and create PG
      const pgCreationResult = await PGService.createPG(pgData, userId);
      
      if (!pgCreationResult.success) {
        throw new Error('PG Creation Failed: ' + pgCreationResult.message);
      }

      // Update user onboarding status
      const user = await User.findByIdAndUpdate(
        userId, 
        {
          'onboarding.pgCreation.status': 'completed',
          'onboarding.pgCreation.pgId': pgCreationResult.data._id,
          'onboarding.pgCreation.completedAt': new Date(),
          'onboarding.currentOnboardingStep': 'branch_setup',
          'pgId': pgCreationResult.data._id  // Also update main pgId field
        }, 
        { new: true }
      );

      return {
        success: true,
        pgCreationResult,
        onboardingStatus: user.onboarding
      };
    } catch (error) {
      console.error('PG Creation Error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Validate and progress Branch Setup
   * @param {string} userId - User ID
   * @param {Object} branchData - Branch creation data
   * @returns {Promise<Object>} - Branch creation result with onboarding status
   */
  async validateAndProgressBranchSetup(userId, branchData) {
    try {
      // Fetch user's PG ID
      const user = await User.findById(userId);
      if (!user || !user.pgId) {
        throw new Error('No PG associated with user');
      }

      // Create branch with PG association
      const branchCreationResult = await Branch.create({
        ...branchData,
        pgId: user.pgId,
        isDefault: true,
        createdBy: userId
      });

      // Update user onboarding status
      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        {
          'onboarding.branchSetup.status': 'completed',
          'onboarding.branchSetup.defaultBranchId': branchCreationResult._id,
          'onboarding.branchSetup.completedAt': new Date(),
          'onboarding.currentOnboardingStep': 'pg_configuration',
          'branchId': branchCreationResult._id  // Update main branchId field
        }, 
        { new: true }
      );

      return {
        success: true,
        branchCreationResult,
        onboardingStatus: updatedUser.onboarding
      };
    } catch (error) {
      console.error('Branch Setup Error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Validate and progress PG Configuration
   * @param {string} userId - User ID
   * @param {Array} sharingTypesData - Sharing types configuration data
   * @returns {Promise<Object>} - Configuration result with onboarding status
   */
  async validateAndProgressPGConfiguration(userId, sharingTypesData) {
    try {
      // Fetch user's PG ID
      const user = await User.findById(userId);
      if (!user || !user.pgId) {
        throw new Error('No PG associated with user');
      }

      const PGService = require('./pg.service');

      // Configure PG sharing types
      const configurationResult = await PGService.configureSharingTypes(
        user.pgId, 
        sharingTypesData, 
        user
      );

      if (!configurationResult.success) {
        throw new Error('PG Configuration Failed: ' + configurationResult.message);
      }

      // Update user onboarding status
      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        {
          'onboarding.pgConfiguration.status': 'completed',
          'onboarding.pgConfiguration.sharingTypesConfigured': true,
          'onboarding.pgConfiguration.completedAt': new Date(),
          'onboarding.currentOnboardingStep': 'completed',
          'pgConfigured': true  // Update main pgConfigured field
        }, 
        { new: true }
      );

      return {
        success: true,
        configurationResult,
        onboardingStatus: updatedUser.onboarding
      };
    } catch (error) {
      console.error('PG Configuration Error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get current onboarding status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Current onboarding status
   */
  async getCurrentOnboardingStatus(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        onboardingStatus: user.onboarding
      };
    } catch (error) {
      console.error('Get Onboarding Status Error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new OnboardingService();
