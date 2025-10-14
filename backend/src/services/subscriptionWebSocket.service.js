const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');
const logger = require('../utils/logger');

/**
 * Subscription WebSocket Service
 * Handles real-time subscription updates and notifications
 */
class SubscriptionWebSocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSubscriptions = new Map(); // socketId -> userId
    this.setupWebSocketHandlers();
    this.startPeriodicChecks();
  }

  /**
   * Setup WebSocket event handlers
   */
  setupWebSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔌 New socket connection:', socket.id);

      // Handle subscription updates namespace
      socket.on('join-subscription-updates', async (data) => {
        try {
          const { token } = data;

          if (!token) {
            socket.emit('error', { message: 'No token provided' });
            return;
          }

          // Verify token and get user
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const userId = decoded.id;

          // Store connection
          this.connectedUsers.set(userId, socket.id);
          this.userSubscriptions.set(socket.id, userId);

          socket.join(`subscription-${userId}`);

          console.log(`📡 User ${userId} joined subscription updates (socket: ${socket.id})`);

          // Send current subscription status
          await this.sendSubscriptionUpdate(userId);

        } catch (error) {
          console.error('Error joining subscription updates:', error);
          socket.emit('error', { message: 'Invalid token' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        const userId = this.userSubscriptions.get(socket.id);
        if (userId) {
          this.connectedUsers.delete(userId);
          this.userSubscriptions.delete(socket.id);
          console.log(`📡 User ${userId} disconnected from subscription updates`);
        }
      });

      // Handle manual subscription refresh
      socket.on('refresh-subscription', async (data) => {
        try {
          const { token } = data;
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const userId = decoded.id;

          await this.sendSubscriptionUpdate(userId);
          socket.emit('subscription-refreshed', { success: true });

        } catch (error) {
          console.error('Error refreshing subscription:', error);
          socket.emit('error', { message: 'Failed to refresh subscription' });
        }
      });
    });
  }

  /**
   * Send subscription update to specific user
   */
  async sendSubscriptionUpdate(userId) {
    try {
      const socketId = this.connectedUsers.get(userId);
      if (!socketId) {
        return; // User not connected
      }

      // Get user's current subscription
      const user = await User.findById(userId).populate({
        path: 'subscription',
        populate: {
          path: 'plan',
          model: 'Subscription'
        }
      });

      if (!user || !user.subscription) {
        console.log(`No subscription found for user ${userId}`);
        return;
      }

      const subscription = user.subscription;

      // Emit subscription update
      this.io.to(`subscription-${userId}`).emit('subscription-update', {
        type: 'SUBSCRIPTION_UPDATED',
        payload: subscription,
        timestamp: new Date().toISOString()
      });

      console.log(`📤 Sent subscription update to user ${userId}`);

    } catch (error) {
      console.error('Error sending subscription update:', error);
    }
  }

  /**
   * Broadcast subscription update to all connected users (for superadmin)
   */
  async broadcastSubscriptionUpdate(subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId).populate('planId');

      if (subscription) {
        // Find all users with this subscription plan
        const users = await User.find({ 'subscription.planId': subscription._id }).populate('subscription.planId');

        for (const user of users) {
          await this.sendSubscriptionUpdate(user._id);
        }
      }
    } catch (error) {
      console.error('Error broadcasting subscription update:', error);
    }
  }

  /**
   * Send trial expiring notification
   */
  async sendTrialExpiringNotification(userId, daysRemaining) {
    try {
      const socketId = this.connectedUsers.get(userId);
      if (!socketId) return;

      const user = await User.findById(userId);
      if (!user) return;

      this.io.to(`subscription-${userId}`).emit('subscription-update', {
        type: 'TRIAL_EXPIRING',
        payload: {
          userId,
          userName: `${user.firstName} ${user.lastName}`,
          daysRemaining,
          message: `Your trial expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
        },
        timestamp: new Date().toISOString()
      });

      console.log(`⚠️ Sent trial expiring notification to user ${userId} (${daysRemaining} days)`);

    } catch (error) {
      console.error('Error sending trial expiring notification:', error);
    }
  }

  /**
   * Send trial expired notification
   */
  async sendTrialExpiredNotification(userId) {
    try {
      const socketId = this.connectedUsers.get(userId);
      if (!socketId) return;

      const user = await User.findById(userId);
      if (!user) return;

      this.io.to(`subscription-${userId}`).emit('subscription-update', {
        type: 'TRIAL_EXPIRED',
        payload: {
          userId,
          userName: `${user.firstName} ${user.lastName}`,
          message: 'Your trial has expired. Please upgrade to continue using the service.'
        },
        timestamp: new Date().toISOString()
      });

      console.log(`❌ Sent trial expired notification to user ${userId}`);

    } catch (error) {
      console.error('Error sending trial expired notification:', error);
    }
  }

  /**
   * Send usage limit warning
   */
  async sendUsageLimitWarning(userId, limitType, currentUsage, limit) {
    try {
      const socketId = this.connectedUsers.get(userId);
      if (!socketId) return;

      const user = await User.findById(userId);
      if (!user) return;

      this.io.to(`subscription-${userId}`).emit('subscription-update', {
        type: 'USAGE_LIMIT_WARNING',
        payload: {
          userId,
          userName: `${user.firstName} ${user.lastName}`,
          limitType, // 'beds' or 'branches'
          currentUsage,
          limit,
          percentage: Math.round((currentUsage / limit) * 100),
          message: `You're approaching your ${limitType} limit (${currentUsage}/${limit})`
        },
        timestamp: new Date().toISOString()
      });

      console.log(`⚠️ Sent ${limitType} limit warning to user ${userId} (${currentUsage}/${limit})`);

    } catch (error) {
      console.error('Error sending usage limit warning:', error);
    }
  }

  /**
   * Send subscription expired notification
   */
  async sendSubscriptionExpiredNotification(userId) {
    try {
      const socketId = this.connectedUsers.get(userId);
      if (!socketId) return;

      const user = await User.findById(userId);
      if (!user) return;

      this.io.to(`subscription-${userId}`).emit('subscription-update', {
        type: 'SUBSCRIPTION_EXPIRED',
        payload: {
          userId,
          userName: `${user.firstName} ${user.lastName}`,
          message: 'Your subscription has expired. Please renew to continue using the service.'
        },
        timestamp: new Date().toISOString()
      });

      console.log(`❌ Sent subscription expired notification to user ${userId}`);

    } catch (error) {
      console.error('Error sending subscription expired notification:', error);
    }
  }

  /**
   * Start periodic subscription checks and notifications
   */
  startPeriodicChecks() {
    // Check every 5 minutes
    setInterval(async () => {
      try {
        await this.performPeriodicChecks();
      } catch (error) {
        console.error('Error in periodic subscription checks:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    console.log('⏰ Started periodic subscription checks');
  }

  /**
   * Perform periodic subscription health checks
   */
  async performPeriodicChecks() {
    try {
      const now = new Date();

      // Find users with active trial subscriptions
      const trialUsers = await User.find({
        'subscription.status': 'active',
        'subscription.isTrialActive': true,
        'subscription.trialEndDate': { $exists: true }
      }).populate('subscription');

      for (const user of trialUsers) {
        const trialEndDate = new Date(user.subscription.trialEndDate);
        const daysUntilExpiry = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 0) {
          // Trial expired
          await this.sendTrialExpiredNotification(user._id);
        } else if (daysUntilExpiry <= 3) {
          // Trial expiring soon
          await this.sendTrialExpiringNotification(user._id, daysUntilExpiry);
        }
      }

      // Find users with expired subscriptions
      const expiredUsers = await User.find({
        'subscription.status': 'active',
        'subscription.endDate': { $lt: now }
      });

      for (const user of expiredUsers) {
        await this.sendSubscriptionExpiredNotification(user._id);
      }

      // Check usage limits
      const allUsers = await User.find({
        'subscription.status': 'active'
      }).populate('subscription');

      for (const user of allUsers) {
        const subscription = user.subscription;
        if (!subscription?.restrictions) continue;

        const { maxBeds, maxBranches } = subscription.restrictions;
        const { bedsUsed = 0, branchesUsed = 0 } = subscription.usage || {};

        // Check bed limit (90% threshold)
        if (maxBeds && bedsUsed >= maxBeds * 0.9) {
          await this.sendUsageLimitWarning(user._id, 'beds', bedsUsed, maxBeds);
        }

        // Check branch limit (90% threshold)
        if (maxBranches && branchesUsed >= maxBranches * 0.9) {
          await this.sendUsageLimitWarning(user._id, 'branches', branchesUsed, maxBranches);
        }
      }

    } catch (error) {
      console.error('Error in periodic subscription checks:', error);
    }
  }

  /**
   * Notify specific user about subscription changes
   */
  async notifyUser(userId, eventType, data) {
    try {
      const socketId = this.connectedUsers.get(userId);
      if (!socketId) return;

      this.io.to(`subscription-${userId}`).emit('subscription-update', {
        type: eventType,
        payload: data,
        timestamp: new Date().toISOString()
      });

      console.log(`📤 Sent ${eventType} notification to user ${userId}`);

    } catch (error) {
      console.error(`Error sending ${eventType} notification:`, error);
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Cleanup disconnected users
   */
  cleanup() {
    // This would be called on server shutdown
    this.connectedUsers.clear();
    this.userSubscriptions.clear();
    console.log('🧹 Cleaned up subscription WebSocket service');
  }
}

module.exports = SubscriptionWebSocketService;
