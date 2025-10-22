const User = require('../models/user.model');
const { SalesManager } = require('../models');
const EmailService = require('./email.service');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthService {
  /**
   * Register new superadmin
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Registration result
   */
  async registerSuperadmin(userData) {
    try {
      console.log('Registering superadmin with data:', {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'superadmin'
      });

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists',
          statusCode: 400
        };
      }

      // Create new user
      const user = new User({
        ...userData,
        role: 'superadmin',
        isEmailVerified: true, // Superadmin accounts are verified by default
        isActive: true
      });

      console.log('User object before save:', {
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified
      });

      // Store plain password temporarily for email
      user.plainPassword = userData.password;

      // Save user
      const savedUser = await user.save();
      
      console.log('User saved successfully:', {
        id: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
        isActive: savedUser.isActive,
        isEmailVerified: savedUser.isEmailVerified
      });

      // Send welcome email with credentials
      await EmailService.sendWelcomeEmail(user);

      return {
        success: true,
        message: 'Registration successful. Please check your email for login credentials.',
        statusCode: 201
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Register new support staff
   * @param {Object} userData - Support staff registration data
   * @returns {Promise<Object>} - Registration result
   */
  async registerSupportStaff(userData) {
    try {
      console.log('Registering support staff with data:', {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'support'
      });

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return {
          success: false,
          message: 'Support staff with this email already exists',
          statusCode: 400
        };
      }

      // Create new support staff user
      const user = new User({
        ...userData,
        role: 'support',
        isEmailVerified: true, // Support staff accounts are verified by default
        isActive: true
      });

      console.log('Support staff user object before save:', {
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified
      });

      // Store plain password temporarily for email
      user.plainPassword = userData.password;

      // Save user
      const savedUser = await user.save();
      
      console.log('Support staff user saved successfully:', {
        id: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
        isActive: savedUser.isActive,
        isEmailVerified: savedUser.isEmailVerified
      });

      // Send welcome email with credentials
      await EmailService.sendSupportWelcomeEmail(user);

      return {
        success: true,
        message: 'Support staff registration successful. Please check your email for login credentials.',
        statusCode: 201
      };
    } catch (error) {
      console.error('Support staff registration error:', error);
      return {
        success: false,
        message: 'Support staff registration failed',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {Object} loginInfo - Login information (IP, user agent, etc.)
   * @returns {Promise<Object>} - Login result with onboarding status
   */
  async login(credentials, loginInfo = {}) {
    try {
      console.log('🔍 AuthService: Starting login...');
      console.log('📧 Email:', credentials.email);
      console.log('🌐 Login info:', loginInfo);

      // Find user by email and include password field for comparison
      const user = await User.findOne({ email: credentials.email.toLowerCase() }).select('+password');
      
      if (!user) {
        console.log('❌ AuthService: User not found');
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      // Check if account is locked
      if (user.lockUntil && user.lockUntil > Date.now()) {
        console.log('🔒 AuthService: Account is locked');
        return {
          success: false,
          message: 'Account is locked due to multiple failed login attempts. Please contact the administrator.',
          statusCode: 423
        };
      }

      // Check if account is deactivated
      if (!user.isActive) {
        console.log('❌ AuthService: Account is deactivated');
        return {
          success: false,
          message: 'User account is deactivated',
          statusCode: 403
        };
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(credentials.password);
      
      if (!isPasswordValid) {
        console.log('❌ AuthService: Invalid password', {
          inputPassword: credentials.password,
          storedPasswordHash: user.password ? 'HASH_EXISTS' : 'NO_PASSWORD',
          userEmail: user.email,
          userId: user._id
        });

        // Additional debugging: log the actual comparison result
        try {
          const bcrypt = require('bcryptjs');
          const directCompareResult = await bcrypt.compare(credentials.password, user.password);
          console.log('Direct Bcrypt Comparison:', directCompareResult);
        } catch (compareError) {
          console.error('Bcrypt Comparison Error:', compareError);
        }

        // Increment login attempts
        user.loginAttempts += 1;

        // Lock account after 5 failed attempts
        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          await user.save();

          return {
            success: false,
            message: 'Account is locked due to multiple failed login attempts. Please try again in 30 minutes.',
            statusCode: 423
          };
        }

        await user.save();

        return {
          success: false,
          message: 'Invalid credentials',
          statusCode: 401
        };
      }

      // Reset login attempts on successful login
      user.loginAttempts = 0;
      user.lockUntil = null;
      user.lastLoginAt = new Date();
      // Save without validation to avoid salesRole validation issues
      await user.save({ validateBeforeSave: false });

      // Generate tokens
      const accessToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { id: user._id, tokenVersion: user.tokenVersion },
        process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-jwt-key-change-this-in-production',
        { expiresIn: '7d' }
      );

      // Check onboarding status
      const onboardingStatus = await this.checkOnboardingStatus(user._id);
      
      // Check default branch
      let defaultBranch = false;
      let defaultBranchId = null;
      if (user.pgId) {
        const Branch = require('../models/branch.model');
        const defaultBranchData = await Branch.findOne({ pgId: user.pgId, isDefault: true });
        defaultBranch = !!defaultBranchData;
        if (defaultBranchData) {
          defaultBranchId = defaultBranchData._id;
        }
      }

      // Check PG configuration
      const PG = require('../models/pg.model');
      const pgConfigured = await PG.findById(user.pgId).select('isConfigured');
      const pg_configured = pgConfigured ? pgConfigured.isConfigured : false;

      // Add PG configuration status to the response
      let additionalUserInfo = {
        onboarding_completed: onboardingStatus.completed,
        default_branch: defaultBranch,
        default_branch_id: defaultBranchId,
        pg_configured: pg_configured,
        pgConfigured: user.pgConfigured || pg_configured, // Ensure both are included
        pgId: user.pgId // Include the user's PG ID
      };

      // Inside login method, add maintainer-specific logic
      if (user.role === 'maintainer') {
        // Fetch maintainer profile
        const Maintainer = require('../models/maintainer.model');
        const maintainer = await Maintainer.findById(user.maintainerProfile)
          .populate('branches');

        // Add maintainer-specific data to response
        additionalUserInfo = {
          ...additionalUserInfo,
          role: 'maintainer',
          assignedBranches: maintainer.branches.map(branch => branch._id),
          specialization: maintainer.specialization,
          maintainerStatus: maintainer.status
        };
      }

      // Get PG information for admin users
      let pgInfo = null;
      if (user.role === 'admin' && user.pgId) {
        try {
          const PG = require('../models/pg.model');
          const pg = await PG.findById(user.pgId).select('name address');
          if (pg) {
            pgInfo = {
              pgId: pg._id,
              pgName: pg.name,
              pgAddress: pg.address
            };
          }
        } catch (error) {
          console.error('❌ AuthService: Error getting PG info:', error);
          // Don't fail login if PG info fails
        }
      }

      // Get subscription information for admin users
      let subscriptionInfo = null;
      if (user.role === 'admin') {
        try {
          const SubscriptionManagementService = require('./subscriptionManagement.service');
          const UserSubscription = require('../models/userSubscription.model');

          // First check if user has an active subscription
          const activeSubscription = await UserSubscription.findOne({
            userId: user._id,
            status: { $in: ['active', 'trial'] },
            endDate: { $gt: new Date() }
          }).populate('subscriptionPlanId');

          if (!activeSubscription) {
            // No active subscription - automatically activate free trial
            console.log('🔄 AuthService: No active subscription found, activating free trial for user:', user._id);
            try {
              const trialResult = await SubscriptionManagementService.activateFreeTrial(user._id, user._id);

              if (trialResult.success) {
                // Trial activated successfully - get the subscription info
                const newSubscription = await UserSubscription.findOne({
                  userId: user._id,
                  status: 'trial'
                }).populate('subscriptionPlanId');

                if (newSubscription) {
                  const plan = newSubscription.subscriptionPlanId;
                  const maxBeds = newSubscription.totalBeds ||
                                  plan.maxBedsAllowed ||
                                  plan.baseBedCount;

                  const processedModules = (plan.modules || []).map(module => ({
                    ...module.toObject(),
                    permissions: module.permissions instanceof Map
                      ? Object.fromEntries(module.permissions)
                      : module.permissions || {}
                  }));

                  subscriptionInfo = {
                    plan: {
                      ...plan.toObject(),
                      modules: processedModules
                    },
                    planId: plan._id,
                    status: newSubscription.status,
                    billingCycle: newSubscription.billingCycle,
                    usage: {
                      bedsUsed: newSubscription.currentBedUsage || 0,
                      branchesUsed: newSubscription.currentBranchUsage || 1
                    },
                    startDate: newSubscription.startDate,
                    endDate: newSubscription.endDate,
                    trialEndDate: newSubscription.trialEndDate,
                    autoRenew: newSubscription.autoRenew,
                    totalBeds: newSubscription.totalBeds,
                    totalBranches: newSubscription.totalBranches,
                    daysRemaining: newSubscription.daysRemaining,
                    trialDaysRemaining: newSubscription.trialDaysRemaining,
                    isExpiringSoon: newSubscription.isExpiringSoon,
                    isTrialActive: newSubscription.isTrialActive,
                    isTrialExpired: false,
                    notifications: {
                      trialExpired: false,
                      trialExpiringSoon: false,
                      trialDaysRemaining: newSubscription.trialDaysRemaining || 0
                    },
                    restrictions: {
                      maxBeds: maxBeds,
                      maxBranches: newSubscription.totalBranches || (plan.allowMultipleBranches ? plan.branchCount : 1),
                      modules: processedModules,
                      features: plan.features || []
                    }
                  };
                }
              } else {
                // Trial activation failed - return free plan
                console.log('❌ AuthService: Free trial activation failed:', trialResult.message);
                subscriptionInfo = {
                  status: 'free',
                  planId: null,
                  startDate: null,
                  endDate: null,
                  trialEndDate: null,
                  autoRenew: false,
                  totalBeds: 5,
                  totalBranches: 1,
                  currentBedUsage: 0,
                  currentBranchUsage: 0,
                  daysRemaining: null,
                  trialDaysRemaining: null,
                  isExpiringSoon: false,
                  isTrialActive: false,
                  restrictions: {
                    maxBeds: 5,
                    maxBranches: 1,
                    modules: [],
                    features: []
                  }
                };
              }
            } catch (trialError) {
              console.error('❌ AuthService: Error activating free trial:', trialError);
              subscriptionInfo = {
                status: 'free',
                planId: null,
                startDate: null,
                endDate: null,
                trialEndDate: null,
                autoRenew: false,
                totalBeds: 5,
                totalBranches: 1,
                currentBedUsage: 0,
                currentBranchUsage: 0,
                daysRemaining: null,
                trialDaysRemaining: null,
                isExpiringSoon: false,
                isTrialActive: false,
                restrictions: {
                  maxBeds: 5,
                  maxBranches: 1,
                  modules: [],
                  features: []
                }
              };
            }
          } else {
            // Existing active subscription
            const plan = activeSubscription.subscriptionPlanId;
            const maxBeds = activeSubscription.totalBeds ||
                            plan.maxBedsAllowed ||
                            plan.baseBedCount;

            const processedModules = (plan.modules || []).map(module => ({
              ...module.toObject(),
              permissions: module.permissions instanceof Map
                ? Object.fromEntries(module.permissions)
                : module.permissions || {}
            }));

            subscriptionInfo = {
              plan: {
                ...plan.toObject(),
                modules: processedModules
              },
              planId: plan._id,
              status: activeSubscription.status,
              billingCycle: activeSubscription.billingCycle,
              usage: {
                bedsUsed: activeSubscription.currentBedUsage || 0,
                branchesUsed: activeSubscription.currentBranchUsage || 1
              },
              startDate: activeSubscription.startDate,
              endDate: activeSubscription.endDate,
              trialEndDate: activeSubscription.trialEndDate,
              autoRenew: activeSubscription.autoRenew,
              totalBeds: activeSubscription.totalBeds,
              totalBranches: activeSubscription.totalBranches,
              daysRemaining: activeSubscription.daysRemaining,
              trialDaysRemaining: activeSubscription.trialDaysRemaining,
              isExpiringSoon: activeSubscription.isExpiringSoon,
              isTrialActive: activeSubscription.isTrialActive,
              isTrialExpired: activeSubscription.billingCycle === 'trial' &&
                              activeSubscription.trialEndDate &&
                              new Date() > new Date(activeSubscription.trialEndDate),
              notifications: {
                trialExpired: activeSubscription.billingCycle === 'trial' &&
                              activeSubscription.trialEndDate &&
                              new Date() > new Date(activeSubscription.trialEndDate),
                trialExpiringSoon: activeSubscription.billingCycle === 'trial' &&
                                  activeSubscription.trialEndDate &&
                                  activeSubscription.daysRemaining <= 2,
                trialDaysRemaining: activeSubscription.trialDaysRemaining || 0
              },
              restrictions: {
                maxBeds: maxBeds,
                maxBranches: activeSubscription.totalBranches || (plan.allowMultipleBranches ? plan.branchCount : 1),
                modules: processedModules,
                features: plan.features || []
              }
            };
          }
        } catch (error) {
          console.error('❌ AuthService: Error getting subscription info:', error);
          // Set default free plan if subscription fetch fails
          subscriptionInfo = {
            status: 'free',
            planId: null,
            startDate: null,
            endDate: null,
            trialEndDate: null,
            autoRenew: false,
            totalBeds: 5,
            totalBranches: 1,
            currentBedUsage: 0,
            currentBranchUsage: 0,
            daysRemaining: null,
            trialDaysRemaining: null,
            isExpiringSoon: false,
            isTrialActive: false,
            restrictions: {
              maxBeds: 5,
              maxBranches: 1,
              modules: [],
              features: []
            }
          };
        }
      }

      console.log('✅ AuthService: Login successful');
      console.log('👤 User role:', user.role);
      console.log('🏢 PG Info:', pgInfo);
      console.log('🔄 Onboarding: Removed');

      // Log login attempt
      await this.logLoginAttempt(user._id, true, loginInfo);

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            pgId: user.pgId,
            ...pgInfo, // Include PG info if available
            subscription: subscriptionInfo, // Include subscription info in response
            ...additionalUserInfo // Include additional user info
          },
          tokens: {
            accessToken,
            refreshToken
          }
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ AuthService: Login error:', error);
      return {
        success: false,
        message: 'Login failed',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Login support staff
   * @param {Object} credentials - Login credentials
   * @param {Object} loginInfo - Login information (IP, user agent, etc.)
   * @returns {Promise<Object>} - Login result
   */
  async supportLogin(credentials, loginInfo = {}) {
    try {
      console.log('🔍 AuthService: Starting support login...');
      console.log('📧 Email:', credentials.email);
      console.log('🌐 Login info:', loginInfo);

      // Find user by email and include password field for comparison
      const user = await User.findOne({ 
        email: credentials.email.toLowerCase(),
        role: 'support'
      }).select('+password');
      
      if (!user) {
        console.log('❌ AuthService: Support user not found');
        return {
          success: false,
          message: 'Support user not found',
          statusCode: 404
        };
      }

      // Check if account is locked
      if (user.lockUntil && user.lockUntil > Date.now()) {
        console.log('🔒 AuthService: Support account is locked');
        return {
          success: false,
          message: 'Account is locked due to multiple failed login attempts. Please contact the administrator.',
          statusCode: 423
        };
      }

      // Check if account is deactivated
      if (!user.isActive) {
        console.log('❌ AuthService: Support account is deactivated');
        return {
          success: false,
          message: 'Support account is deactivated',
          statusCode: 403
        };
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(credentials.password);
      
      if (!isPasswordValid) {
        console.log('❌ AuthService: Invalid password for support user');
        
        // Increment login attempts
        user.loginAttempts += 1;
        
        // Lock account after 5 failed attempts
        if (user.loginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          await user.save();
          
          return {
            success: false,
            message: 'Account is locked due to multiple failed login attempts. Please try again in 30 minutes.',
            statusCode: 423
          };
        }
        
        await user.save();

        return {
          success: false,
          message: 'Invalid credentials',
          statusCode: 401
        };
      }

      // Reset login attempts on successful login
      user.loginAttempts = 0;
      user.lockUntil = null;
      user.lastLoginAt = new Date();
      // Save without validation to avoid salesRole validation issues
      await user.save({ validateBeforeSave: false });

      // Generate tokens
      const accessToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { id: user._id, tokenVersion: user.tokenVersion },
        process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-jwt-key-change-this-in-production',
        { expiresIn: '7d' }
      );

      console.log('✅ AuthService: Support login successful');
      console.log('👤 Support user role:', user.role);

      // Log login attempt
      await this.logLoginAttempt(user._id, true, loginInfo);

      return {
        success: true,
        message: 'Support login successful',
        data: {
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isActive: user.isActive
          },
          tokens: {
            accessToken,
            refreshToken
          }
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ AuthService: Support login error:', error);
      return {
        success: false,
        message: 'Support login failed',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} - Token refresh result
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-jwt-key-change-this-in-production');
      
      if (decoded.type !== 'refresh') {
        return {
          success: false,
          message: 'Invalid refresh token',
          statusCode: 401
        };
      }

      // Find user
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        return {
          success: false,
          message: 'User not found or inactive',
          statusCode: 401
        };
      }

      // Generate new access token
      const newAccessToken = user.generateAuthToken();

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        message: 'Token refresh failed',
        error: error.message,
        statusCode: 401
      };
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<Object>} - Password reset result
   */
  async forgotPassword(email) {
    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        // Don't reveal if user exists or not for security
        return {
          success: true,
          message: 'If an account with this email exists, a password reset link has been sent.',
          statusCode: 200
        };
      }

      // Generate password reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // Send password reset email
      await EmailService.sendPasswordResetEmail(user, resetToken);

      return {
        success: true,
        message: 'Password reset link sent to your email',
        statusCode: 200
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Failed to send password reset email',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Password reset result
   */
  async resetPassword(token, newPassword) {
    try {
      // Hash the token to compare with stored hash
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with valid reset token
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
          statusCode: 400
        };
      }

      // Update password
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      user.passwordChangedAt = Date.now() - 1000;
      await user.save();

      return {
        success: true,
        message: 'Password reset successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Password reset failed',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Verify email with token
   * @param {string} token - Email verification token
   * @returns {Promise<Object>} - Email verification result
   */
  async verifyEmail(token) {
    try {
      // Hash the token to compare with stored hash
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with valid verification token
      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired verification token',
          statusCode: 400
        };
      }

      // Mark email as verified
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      return {
        success: true,
        message: 'Email verified successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        message: 'Email verification failed',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Verify email with credentials
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} firstName - User first name
   * @param {string} lastName - User last name
   * @returns {Promise<Object>} - Email verification result
   */
  async verifyEmailWithCredentials(email, password, firstName, lastName) {
    try {
      // Find user with matching credentials
      const user = await User.findOne({ 
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: 'superadmin'
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found with provided credentials',
          statusCode: 404
        };
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid credentials provided',
          statusCode: 400
        };
      }

      // Check if already verified
      if (user.isEmailVerified) {
        return {
          success: false,
          message: 'Email is already verified',
          statusCode: 400
        };
      }

      // Mark email as verified
      user.isEmailVerified = true;
      await user.save();

      return {
        success: true,
        message: 'Email verified successfully. You can now log in to your account.',
        statusCode: 200
      };
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        message: 'Email verification failed',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Resend email verification
   * @param {string} email - User email
   * @returns {Promise<Object>} - Resend verification result
   */
  async resendEmailVerification(email) {
    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      if (user.isEmailVerified) {
        return {
          success: false,
          message: 'Email is already verified',
          statusCode: 400
        };
      }

      // Generate new verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      await EmailService.sendEmailVerificationEmail(user, verificationToken);

      return {
        success: true,
        message: 'Email verification link sent',
        statusCode: 200
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      return {
        success: false,
        message: 'Failed to send verification email',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Logout user
   * @returns {Promise<Object>} - Logout result
   */
  async logout() {
    try {
      // In a production environment, you might want to blacklist the token
      // For now, we'll just return success as the client should remove the token
      return {
        success: true,
        message: 'Logged out successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Log login attempt
   * @param {string} userId - User ID
   * @param {boolean} success - Whether login was successful
   * @param {Object} loginInfo - Login information
   * @returns {Promise<void>}
   */
  async logLoginAttempt(userId, success, loginInfo = {}) {
    try {
      // Update user's last login if successful
      if (success) {
        await User.findByIdAndUpdate(userId, {
          lastLogin: new Date()
        });
      }
      
      // In a production environment, you might want to log this to a separate collection
      console.log(`Login attempt for user ${userId}: ${success ? 'SUCCESS' : 'FAILED'}`, {
        timestamp: new Date(),
        ipAddress: loginInfo.ipAddress,
        userAgent: loginInfo.userAgent
      });
    } catch (error) {
      console.error('Error logging login attempt:', error);
    }
  }

  /**
   * Get current user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User profile
   */
  async getProfile(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            avatar: user.avatar,
            language: user.language,
            theme: user.theme,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
          }
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        message: 'Failed to get profile',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Profile update data
   * @returns {Promise<Object>} - Update result
   */
  async updateProfile(userId, updateData) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      // Update allowed fields
      const allowedFields = ['firstName', 'lastName', 'phone', 'language', 'theme', 'pgId'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          user[field] = updateData[field];
        }
      });

      await user.save();

      return {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            pgId: user.pgId,
            isEmailVerified: user.isEmailVerified,
            avatar: user.avatar,
            language: user.language,
            theme: user.theme
          }
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Failed to update profile',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Unlock user account (superadmin only)
   * @param {string} userId - User ID to unlock
   * @returns {Promise<Object>} - Unlock result
   */
  async unlockUserAccount(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      // Reset login attempts and unlock account
      await User.findByIdAndUpdate(userId, {
        loginAttempts: 0,
        lockUntil: null
      });

      return {
        success: true,
        message: 'User account unlocked successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Unlock user account error:', error);
      return {
        success: false,
        message: 'Failed to unlock user account',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get all users with lock status (superadmin only)
   * @returns {Promise<Object>} - Users list with lock status
   */
  async getUsersWithLockStatus() {
    try {
      const users = await User.find({}).select('firstName lastName email role isActive loginAttempts lockUntil createdAt');
      
      const usersWithLockStatus = users.map(user => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        loginAttempts: user.loginAttempts,
        isLocked: user.lockUntil && user.lockUntil > Date.now(),
        lockUntil: user.lockUntil,
        createdAt: user.createdAt
      }));

      return {
        success: true,
        data: {
          users: usersWithLockStatus
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Get users with lock status error:', error);
      return {
        success: false,
        message: 'Failed to get users',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get current user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User data
   */
  async getCurrentUser(userId) {
    try {
      const user = await User.findById(userId).select('-password');

      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: {
          user
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        message: 'Failed to get current user',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get all support staff members
   * @returns {Promise<Object>} - Support staff list
   */
  async getSupportStaff() {
    try {
      const supportStaff = await User.find({ role: 'support' })
        .select('firstName lastName email phone isActive lastLogin createdAt')
        .sort({ createdAt: -1 });

      return {
        success: true,
        data: supportStaff,
        statusCode: 200
      };
    } catch (error) {
      console.error('Get support staff error:', error);
      return {
        success: false,
        message: 'Failed to get support staff',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Delete a user (superadmin only)
   * @param {string} userId - User ID to delete
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteUser(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      // Prevent deletion of superadmin accounts
      if (user.role === 'superadmin') {
        return {
          success: false,
          message: 'Cannot delete superadmin accounts',
          statusCode: 403
        };
      }

      await User.findByIdAndDelete(userId);

      return {
        success: true,
        message: 'User deleted successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        message: 'Failed to delete user',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Update user status (activate/deactivate)
   * @param {string} userId - User ID to update
   * @param {boolean} isActive - New status
   * @returns {Promise<Object>} - Update result
   */
  async updateUserStatus(userId, isActive) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          statusCode: 404
        };
      }

      // Prevent deactivation of superadmin accounts
      if (user.role === 'superadmin' && !isActive) {
        return {
          success: false,
          message: 'Cannot deactivate superadmin accounts',
          statusCode: 403
        };
      }

      user.isActive = isActive;
      await user.save();

      return {
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        statusCode: 200
      };
    } catch (error) {
      console.error('Update user status error:', error);
      return {
        success: false,
        message: 'Failed to update user status',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Sales Manager & Sub-Sales Staff Login
   * @param {Object} credentials - Login credentials (identifier can be email or unique ID)
   * @param {Object} loginInfo - Login information (IP, user agent, etc.)
   * @returns {Promise<Object>} - Login result
   */
  async salesManagerLogin(credentials, loginInfo = {}) {
    try {
      console.log('🔍 AuthService: Starting sales login (manager/staff)...');
      console.log('📧 Identifier:', credentials.identifier);
      console.log('🔑 Password provided:', credentials.password ? '***' + credentials.password.slice(-3) : 'undefined');

      // Determine if identifier looks like an email
      const isEmail = credentials.identifier.includes('@');
      console.log('📧 Identifier type:', isEmail ? 'email' : 'unique ID');

      let query;
      if (isEmail) {
        query = { email: credentials.identifier.toLowerCase() };
        console.log('🔍 Searching by email:', credentials.identifier.toLowerCase());
      } else {
        query = { salesUniqueId: credentials.identifier.toUpperCase() };
        console.log('🔍 Searching by unique ID:', credentials.identifier.toUpperCase());
      }

      let user = null;
      let userType = '';
      let userModel = '';

      console.log('🔍 Starting user lookup with query:', query);

      // First try to find in SalesManager model (for sales managers)
      const salesManager = await SalesManager.findOne(query).select('+password');
      console.log('🔍 SalesManager query result:', !!salesManager);

      if (salesManager) {
        user = salesManager;
        userType = 'sales_manager';
        userModel = 'SalesManager';
        console.log('✅ Found sales manager:', {
          id: salesManager._id,
          email: salesManager.email,
          salesUniqueId: salesManager.salesUniqueId,
          hasPassword: !!salesManager.password,
          forcePasswordChange: salesManager.forcePasswordChange
        });
      } else {
        // If not found in SalesManager, try User model (for sub_sales staff)
        console.log('🔄 Sales manager not found, trying User model for sub_sales...');
        const subSalesQuery = {
          ...query,
          salesRole: 'sub_sales'
        };
        console.log('🔍 Sub-sales query:', subSalesQuery);

        const subSalesUser = await User.findOne(subSalesQuery).select('+password');
        console.log('🔍 User model query result:', !!subSalesUser);

        if (subSalesUser) {
          user = subSalesUser;
          userType = 'sub_sales';
          userModel = 'User';
          console.log('✅ Found sub-sales staff:', {
            id: subSalesUser._id,
            email: subSalesUser.email,
            salesUniqueId: subSalesUser.salesUniqueId,
            salesRole: subSalesUser.salesRole,
            hasPassword: !!subSalesUser.password,
            forcePasswordChange: subSalesUser.forcePasswordChange
          });
        } else {
          console.log('❌ No sub_sales user found either');
        }
      }

      if (!user) {
        console.log('❌ AuthService: No sales user found');
        const errorMessage = isEmail ? 'Email not found' : 'Invalid unique ID';
        return {
          success: false,
          message: errorMessage,
          statusCode: 401
        };
      }

      // Check if account is locked (different field names for different models)
      const isLocked = userModel === 'SalesManager' ? user.isLocked : user.isLocked;
      if (isLocked) {
        console.log('🔒 AuthService: Account is locked');
        return {
          success: false,
          message: 'Account is locked. Please contact the administrator.',
          statusCode: 423
        };
      }

      // Check if account is suspended/active (different field names for different models)
      const isSuspended = userModel === 'SalesManager' ? user.status === 'suspended' : user.isActive === false;
      if (isSuspended) {
        console.log('❌ AuthService: Account is suspended/inactive');
        return {
          success: false,
          message: 'Account is suspended. Please contact the administrator.',
          statusCode: 403
        };
      }

      // Verify password
      console.log('🔐 Checking password for sales user:', {
        providedPassword: credentials.password,
        storedPasswordLength: user.password ? user.password.length : 'undefined',
        userType: userType,
        userModel: userModel,
        userId: user._id
      });

      let isPasswordValid;
      try {
        // Verify password (both models have correctPassword method)
        isPasswordValid = await user.correctPassword(credentials.password, user.password);
        console.log('🔐 Password validation result:', isPasswordValid);
      } catch (error) {
        console.log('🔐 Password validation error:', error);
        isPasswordValid = false;
      }

      if (!isPasswordValid) {
        console.log('❌ AuthService: Invalid password for sales user');

        // Increment login attempts (handle different field names)
        if (userModel === 'SalesManager') {
          user.loginAttempts = (user.loginAttempts || 0) + 1;
        } else {
          user.loginAttempts = (user.loginAttempts || 0) + 1;
        }

        // Lock account after 5 failed attempts
        if (user.loginAttempts >= 5) {
          user.isLocked = true;
          user.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
          console.log('🔒 AuthService: Account locked due to failed attempts');
        }

        await user.save();

        // Log failed login attempt
        await this.logLoginAttempt(user._id, false, loginInfo);

        console.log('🚫 AuthService: Returning 401 Invalid credentials');
        return {
          success: false,
          message: 'Invalid credentials',
          statusCode: 401
        };
      }

      console.log('✅ AuthService: Password validation passed, proceeding with login');

      // Reset login attempts on successful login
      user.loginAttempts = 0;
      user.isLocked = false;
      user.lockUntil = undefined;
      if (userModel === 'SalesManager') {
        user.lastLogin = new Date();
      } else {
        user.lastLoginAt = new Date();
      }

      await user.save();

      // Generate tokens with appropriate role
      const jwtPayload = {
        id: user._id,
        email: user.email,
        role: userType, // 'sales_manager' or 'sub_sales'
        forcePasswordChange: user.forcePasswordChange
      };

      // Only include salesRole and salesUniqueId for actual sales users
      if (userType === 'sub_sales' || userType === 'sales_manager') {
        jwtPayload.salesRole = userType === 'sub_sales' ? 'sub_sales' : user.salesRole || userType;
        jwtPayload.salesUniqueId = user.salesUniqueId;
      }

      const accessToken = jwt.sign(
        jwtPayload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      // Log successful login attempt
      await this.logLoginAttempt(user._id, true, loginInfo);

      console.log('✅ AuthService: Sales login successful for', userType);

      // Return user data with appropriate fields based on model
      const userData = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: userType,
        salesUniqueId: user.salesUniqueId,
        forcePasswordChange: user.forcePasswordChange,
        passwordChanged: user.passwordChanged || user.passwordChanged,
      };

      // Add model-specific fields
      if (userModel === 'SalesManager') {
        userData.status = user.status;
        userData.isLocked = user.isLocked;
      } else {
        userData.salesRole = user.salesRole;
        userData.isActive = user.isActive;

        // Populate parent sales person information for sub_sales users
        if (user.parentSalesPerson) {
          const { SalesManager } = require('../models');
          const parentManager = await SalesManager.findById(user.parentSalesPerson).select('firstName lastName email salesUniqueId');
          if (parentManager) {
            userData.parentSalesPerson = {
              _id: parentManager._id,
              firstName: parentManager.firstName,
              lastName: parentManager.lastName,
              email: parentManager.email,
              salesUniqueId: parentManager.salesUniqueId,
              fullName: `${parentManager.firstName} ${parentManager.lastName}`
            };
          } else {
            userData.parentSalesPerson = user.parentSalesPerson; // Fallback to ObjectId
          }
        } else {
          userData.parentSalesPerson = user.parentSalesPerson;
        }
      }

      return {
        success: true,
        message: `${userType === 'sales_manager' ? 'Sales Manager' : 'Sub-Sales Staff'} login successful`,
        data: {
          user: userData,
          tokens: {
            accessToken,
            refreshToken
          }
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ AuthService: Sales login error:', error);
      return {
        success: false,
        message: 'Sales login failed',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Check user's onboarding status
   * @param {string} userId - User ID to check onboarding status for
   * @returns {Promise<Object>} - Onboarding status details
   */
  async checkOnboardingStatus(userId) {
    try {
      const User = require('../models/user.model');

      // Get user with PG association and configuration status
      const user = await User.findById(userId);

      if (!user) {
        return {
          completed: false,
          currentStep: null,
          steps: []
        };
      }

      // Consider onboarding completed if user has PG and it's configured
      const hasPg = !!user.pgId;
      const pgConfigured = user.pgConfigured || false;

      // Also check if PG exists and is configured
      let pgExistsAndConfigured = false;
      if (hasPg) {
        try {
          const PG = require('../models/pg.model');
          const pg = await PG.findById(user.pgId).select('isConfigured');
          pgExistsAndConfigured = pg && pg.isConfigured;
        } catch (error) {
          console.error('Error checking PG configuration:', error);
        }
      }

      const completed = hasPg && (pgConfigured || pgExistsAndConfigured);

      return {
        completed: completed,
        currentStep: completed ? 'completed' : (hasPg ? 'pg_config' : 'branch_setup'),
        steps: completed ? ['branch_created', 'pg_configured'] : (hasPg ? ['branch_created'] : [])
      };
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return {
        completed: false,
        currentStep: null,
        steps: []
      };
    }
  }
}

module.exports = new AuthService(); 