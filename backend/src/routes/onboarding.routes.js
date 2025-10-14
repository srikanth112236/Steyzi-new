const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const OnboardingService = require('../services/onboarding.service');

/**
 * @route   GET /api/onboarding/status
 * @desc    Get current onboarding status
 * @access  Private
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const result = await OnboardingService.getCurrentOnboardingStatus(req.user._id);
    
    if (result.success) {
      return res.status(200).json(result);
    }
    
    return res.status(400).json(result);
  } catch (error) {
    console.error('Onboarding Status Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve onboarding status',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/onboarding/pg-creation
 * @desc    Progress PG Creation Step
 * @access  Private
 */
router.post('/pg-creation', authenticate, async (req, res) => {
  try {
    const result = await OnboardingService.validateAndProgressPGCreation(
      req.user._id, 
      req.body
    );
    
    if (result.success) {
      return res.status(200).json(result);
    }
    
    return res.status(400).json(result);
  } catch (error) {
    console.error('PG Creation Onboarding Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete PG creation step',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/onboarding/branch-setup
 * @desc    Progress Branch Setup Step
 * @access  Private
 */
router.post('/branch-setup', authenticate, async (req, res) => {
  try {
    const result = await OnboardingService.validateAndProgressBranchSetup(
      req.user._id, 
      req.body
    );
    
    if (result.success) {
      return res.status(200).json(result);
    }
    
    return res.status(400).json(result);
  } catch (error) {
    console.error('Branch Setup Onboarding Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete branch setup step',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/onboarding/pg-configuration
 * @desc    Progress PG Configuration Step
 * @access  Private
 */
router.post('/pg-configuration', authenticate, async (req, res) => {
  try {
    const result = await OnboardingService.validateAndProgressPGConfiguration(
      req.user._id, 
      req.body
    );
    
    if (result.success) {
      return res.status(200).json(result);
    }
    
    return res.status(400).json(result);
  } catch (error) {
    console.error('PG Configuration Onboarding Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete PG configuration step',
      error: error.message
    });
  }
});

module.exports = router;
