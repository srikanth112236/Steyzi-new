const { User, SalesHierarchy, PG, Subscription } = require('../models');
const { generateUniqueId } = require('../utils/uniqueIdGenerator');
const emailService = require('./email.service');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Generate a secure temporary password
 * @returns {string} Temporary password
 */
function generateTemporaryPassword() {
  // Generate a random 12-character password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  const passwordLength = 12;
  let password = '';
  
  for (let i = 0; i < passwordLength; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    password += chars[randomIndex];
  }
  
  return password;
}

class SalesService {
  /**
   * Generate a secure temporary password
   * @returns {string} Temporary password
   */
  generateTemporaryPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const passwordLength = 12;
    let password = '';
    
    for (let i = 0; i < passwordLength; i++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      password += chars[randomIndex];
    }
    
    return password;
  }

  /**
   * Create a new sales staff member with comprehensive validation and email notification
   * @param {Object} userData - User data for sales staff
   * @param {Object} createdBy - User creating the staff member
   * @returns {Object} Created user
   */
  async createSalesStaff(userData, createdBy) {
    // Validate creator's role - allow both superadmin and sales_manager
    if (createdBy.role !== 'superadmin' && createdBy.role !== 'sales_manager') {
      throw new Error('Unauthorized: Only superadmin or sales managers can create sales staff');
    }

    // Validate input data
    if (!userData.email || !userData.firstName || !userData.lastName) {
      throw new Error('Email, first name, and last name are required');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    // Generate unique sales ID
    const uniqueSalesId = await generateUniqueId('SALES');

    // Generate temporary password
    const rawPassword = this.generateTemporaryPassword();

    // Determine hierarchy level and parent
    let parentSalesPerson;
    if (createdBy.role === 'superadmin') {
      // Superadmin creates staff at level 1, can set any parent or no parent
      parentSalesPerson = createdBy._id; // Default to superadmin, but could be overridden
    } else if (createdBy.role === 'sales_manager') {
      // Sales managers create sub-sales staff under themselves
      parentSalesPerson = createdBy._id;
    }

    // Create new user
    const newUser = new User({
      ...userData,
      role: 'user', // Regular user role
      salesRole: 'sub_sales', // Sales-specific role
      salesUniqueId: uniqueSalesId,
      password: rawPassword, // Raw password - pre-save middleware will hash it
      parentSalesPerson: parentSalesPerson,
      salesCommissionRate: userData.commissionRate || 10, // Default commission rate
      isActive: true,
      isEmailVerified: true,
      forcePasswordChange: true, // Force password change on first login
      passwordChanged: false // Password hasn't been changed yet
    });

    // Save user
    await newUser.save();

    // Create hierarchy relationship if this is a sales manager creating sub-sales staff
    if (createdBy.role === 'sales_manager') {
      await SalesHierarchy.create({
        salesPerson: createdBy._id,
        subSalesPerson: newUser._id
      });
    }

    // Send welcome email with credentials
    try {
      await emailService.sendSalesStaffWelcomeEmail({
        ...newUser.toObject(),
        tempPassword: rawPassword
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Log email failure but don't block user creation
    }

    return newUser;
  }

  /**
   * Get all sales staff with optional filtering
   * @param {Object} requestingUser - User requesting the list
   * @param {Object} filters - Optional filters for querying sales staff
   * @returns {Array} List of sales staff
   */
  async getAllSalesStaff(requestingUser, filters = {}) {
    let query;

    if (requestingUser.role === 'superadmin') {
      // Superadmin can see all sales staff
      query = {
        $or: [{ salesRole: 'sales' }, { salesRole: 'sub_sales' }],
        ...filters
      };
    } else if (requestingUser.role === 'sales_manager') {
      // Sales managers can only see their sub-sales staff
      query = {
        salesRole: 'sub_sales',
        parentSalesPerson: requestingUser._id,
        ...filters
      };
    } else {
      throw new Error('Unauthorized: Only superadmin or sales managers can view sales staff');
    }

    return await User.find(query)
      .select('-password -__v');
  }

  /**
   * Get specific sales staff details
   * @param {string} staffId - ID of the staff member
   * @param {Object} requestingUser - User requesting the details
   * @returns {Object} Sales staff details
   */
  async getSalesStaffDetails(staffId, requestingUser) {
    // Ensure only superadmin can access details
    if (requestingUser.role !== 'superadmin') {
      throw new Error('Unauthorized: Only superadmin can view sales staff details');
    }

    const staff = await User.findById(staffId)
      .select('-password -__v');
    
    if (!staff) {
      throw new Error('Sales staff not found');
    }

    return staff;
  }

  /**
   * Update sales staff details
   * @param {string} staffId - ID of the staff member
   * @param {Object} updateData - Data to update
   * @param {Object} requestingUser - User requesting the update
   * @returns {Object} Updated staff details
   */
  async updateSalesStaff(staffId, updateData, requestingUser) {
    // Validate permissions
    if (requestingUser.role !== 'superadmin' && requestingUser.role !== 'sales_manager') {
      throw new Error('Unauthorized: Only superadmin or sales managers can update sales staff');
    }

    // Find the staff member first to check permissions
    const staff = await User.findById(staffId);
    if (!staff) {
      throw new Error('Sales staff not found');
    }

    // If requesting user is a sales manager, ensure they can only update their own sub-sales staff
    if (requestingUser.role === 'sales_manager') {
      if (staff.parentSalesPerson?.toString() !== requestingUser._id.toString()) {
        throw new Error('Unauthorized: You can only update your own sub-sales staff');
      }
    }

    // Prevent role changes and sensitive field modifications
    delete updateData.role;
    delete updateData.uniqueSalesId;
    delete updateData.password;

    // Find and update staff
    const updatedStaff = await User.findByIdAndUpdate(
      staffId, 
      { $set: updateData }, 
      { 
        new: true, 
        runValidators: true,
        select: '-password -__v' 
      }
    );

    if (!updatedStaff) {
      throw new Error('Sales staff not found');
    }

    // Optional: Send update notification email
    try {
      await emailService.sendSalesStaffUpdateNotification(updatedStaff);
    } catch (emailError) {
      console.error('Failed to send update notification:', emailError);
    }

    return updatedStaff;
  }

  /**
   * Delete sales staff
   * @param {string} staffId - ID of the staff member
   * @param {Object} requestingUser - User requesting the deletion
   */
  async deleteSalesStaff(staffId, requestingUser) {
    // Validate permissions
    if (requestingUser.role !== 'superadmin' && requestingUser.role !== 'sales_manager') {
      throw new Error('Unauthorized: Only superadmin or sales managers can delete sales staff');
    }

    const staff = await User.findById(staffId);

    if (!staff) {
      throw new Error('Sales staff not found');
    }

    // If requesting user is a sales manager, ensure they can only delete their own sub-sales staff
    if (requestingUser.role === 'sales_manager') {
      if (staff.parentSalesPerson?.toString() !== requestingUser._id.toString()) {
        throw new Error('Unauthorized: You can only delete your own sub-sales staff');
      }
    }

    // Send deletion notification email before deletion
    try {
      await emailService.sendSalesStaffDeletionNotification(staff);
    } catch (emailError) {
      console.error('Failed to send deletion notification:', emailError);
    }

    // Remove from SalesHierarchy if this is a sub-sales staff
    if (staff.parentSalesPerson) {
      await SalesHierarchy.findOneAndDelete({
        salesPerson: staff.parentSalesPerson,
        subSalesPerson: staffId
      });
    }

    // Delete the staff member
    await User.findByIdAndDelete(staffId);
  }

  /**
   * Check if a staff member is in a sales manager's hierarchy
   * @param {string} staffId - ID of the staff member
   * @param {string} managerId - ID of the sales manager
   * @returns {boolean} Whether the staff is in the hierarchy
   */
  async isStaffInHierarchy(staffId, managerId) {
    const staff = await User.findById(staffId);

    if (!staff) return false;

    // Check if this staff member is directly under the manager
    const hierarchy = await SalesHierarchy.findOne({
      salesPerson: managerId,
      subSalesPerson: staffId,
      status: 'active'
    });

    return !!hierarchy;
  }

  /**
   * Get sales staff hierarchy
   * @param {Object} user - User requesting hierarchy
   * @returns {Object} Hierarchy details
   */
  async getSalesHierarchy(user) {
    if (user.role !== 'superadmin' && user.role !== 'sales_manager') {
      throw new Error('Unauthorized access to sales hierarchy');
    }

    const hierarchy = await SalesHierarchy.find({
      salesPerson: user._id,
      status: 'active'
    }).populate('subSalesPerson', 'firstName lastName email salesUniqueId salesCommissionRate');

    return {
      subSalesStaff: hierarchy.map(h => h.subSalesPerson).filter(Boolean)
    };
  }

  /**
   * Get PGs for a sales team
   * @param {Object} user - User requesting PGs
   * @returns {Array} List of PGs
   */
  async getTeamPGs(user) {
    if (user.role !== 'superadmin' && user.role !== 'sales_manager') {
      throw new Error('Unauthorized access to team PGs');
    }

    // Get all sub-sales staff under this manager
    const hierarchy = await SalesHierarchy.find({
      salesPerson: user._id,
      status: 'active'
    });

    const subSalesIds = hierarchy.map(h => h.subSalesPerson);
    const teamUserIds = [user._id, ...subSalesIds];

    // Find PGs added by team members
    return await PG.find({
      addedBy: { $in: teamUserIds }
    }).populate('addedBy', 'firstName lastName salesUniqueId');
  }

  /**
   * Get financial data for sales team
   * @param {Object} user - User requesting financial data
   * @returns {Object} Financial summary
   */
  async getTeamFinancials(user) {
    if (user.role !== 'superadmin' && user.role !== 'sales_manager') {
      throw new Error('Unauthorized access to team financials');
    }

    // Get manager's own stats
    const managerPGs = await PG.countDocuments({ addedBy: user._id });
    const managerCommission = managerPGs * (user.salesCommissionRate || 10);

    // Get sub-sales staff and their stats
    const hierarchy = await SalesHierarchy.find({
      salesPerson: user._id,
      status: 'active'
    }).populate('subSalesPerson', 'firstName lastName email salesUniqueId salesCommissionRate salesPerformanceMetrics');

    let totalPGs = managerPGs;
    let totalCommission = managerCommission;
    const subSalesStaff = [];

    for (const h of hierarchy) {
      const staff = h.subSalesPerson;
      if (staff) {
        const staffPGs = staff.salesPerformanceMetrics?.totalPGsAdded || 0;
        const staffCommission = staff.salesPerformanceMetrics?.totalCommissionEarned || 0;

        totalPGs += staffPGs;
        totalCommission += staffCommission;

        subSalesStaff.push({
          _id: staff._id,
          firstName: staff.firstName,
          lastName: staff.lastName,
          email: staff.email,
          salesUniqueId: staff.salesUniqueId,
          salesCommissionRate: staff.salesCommissionRate,
          financials: {
            totalPGsAdded: staffPGs,
            totalCommissionEarned: staffCommission
          }
        });
      }
    }

    return {
      totalPGsAdded: totalPGs,
      totalCommissionEarned: totalCommission,
      subSalesStaff: subSalesStaff
    };
  }

  /**
   * Get PGs added by the current sub-sales staff
   * @param {Object} user - Authenticated user
   * @returns {Array} List of PGs
   */
  async getMyPGs(user) {
    if (user.salesRole !== 'sub_sales') {
      throw new Error('Unauthorized: Only sub-sales staff can access their PGs');
    }

    const pgs = await PG.find({
      addedBy: user._id
    }).select('-__v');

    // Add the user's name to each PG for display purposes
    return pgs.map(pg => ({
      ...pg.toObject(),
      addedBy: {
        firstName: user.firstName,
        lastName: user.lastName,
        salesUniqueId: user.salesUniqueId,
        name: `${user.firstName} ${user.lastName}`
      }
    }));
  }

  /**
   * Get financial data for the current sub-sales staff
   * @param {Object} user - Authenticated user
   * @returns {Object} Financial data
   */
  async getMyFinancials(user) {
    if (user.salesRole !== 'sub_sales') {
      throw new Error('Unauthorized: Only sub-sales staff can access their financials');
    }

    // Fetch financial data specific to the sub-sales staff
    const totalPGs = user.salesPerformanceMetrics?.totalPGsAdded || 0;
    const commissionRate = user.salesCommissionRate || 10; // Default 10%
    const totalCommissionEarned = user.salesPerformanceMetrics?.totalCommissionEarned || 0;

    return {
      totalPGs,
      totalCommission: totalCommissionEarned,
      commissionRate,
      performanceScore: 0, // We'll calculate this later if needed
      commissionEarned: totalCommissionEarned,
      pendingCommissions: 0, // We'll calculate this later if needed
      nextPayoutDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };
  }

  /**
   * Get performance analytics for sales users
   * @param {Object} user - Authenticated user
   * @returns {Object} Performance data
   */
  /**
   * Calculate phased commission rate based on subscription duration
   * Phased Commission Structure:
   * - First 6 months: 20% commission per month
   * - 6-12 months: 15% commission per month
   * - 1-3 years: 10% commission per month
   * - After 3 years: 0% (closed)
   * @param {Date} subscriptionStartDate - When the subscription started
   * @param {Date} asOfDate - Date to calculate as of (default: now)
   * @returns {Object} Commission details with rate and phase
   */
  calculatePhasedCommission(subscriptionStartDate, asOfDate = null) {
    if (!subscriptionStartDate) {
      return { rate: 0, phase: 'inactive', months: 0, days: 0 };
    }

    const now = asOfDate || new Date();
    const startDate = new Date(subscriptionStartDate);
    const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const monthsSinceStart = Math.floor(daysSinceStart / 30);
    const yearsSinceStart = monthsSinceStart / 12;

    let rate = 0;
    let phase = 'inactive';

    if (monthsSinceStart < 6) {
      // First 6 months: 20%
      rate = 20;
      phase = 'phase1_0-6months';
    } else if (monthsSinceStart < 12) {
      // 6-12 months: 15%
      rate = 15;
      phase = 'phase2_6-12months';
    } else if (yearsSinceStart < 3) {
      // 1-3 years: 10%
      rate = 10;
      phase = 'phase3_1-3years';
    } else {
      // After 3 years: 0% (closed)
      rate = 0;
      phase = 'phase4_closed';
    }

    return {
      rate,
      phase,
      months: monthsSinceStart,
      days: daysSinceStart,
      years: Math.floor(yearsSinceStart)
    };
  }

  /**
   * Calculate monthly recurring commission for a PG
   * Commission is calculated per month based on subscription age
   * @param {Object} pg - PG document with subscription info
   * @param {Date} forMonth - Month to calculate for (default: current month)
   * @returns {Object} Monthly commission details
   */
  async calculateMonthlyRecurringCommission(pg, forMonth = null) {
    try {
      const User = require('../models/user.model');
      const UserSubscription = require('../models/userSubscription.model');
      
      if (!pg || !pg.admin) {
        return {
          hasActiveSubscription: false,
          monthlyCommission: 0,
          rate: 0,
          phase: 'inactive'
        };
      }

      const adminUser = await User.findById(pg.admin);
      if (!adminUser) {
        return {
          hasActiveSubscription: false,
          monthlyCommission: 0,
          rate: 0,
          phase: 'inactive'
        };
      }

      // Get the earliest active subscription start date for this PG
      const activeSubscription = await UserSubscription.findOne({
        userId: adminUser._id,
        status: { $in: ['active', 'trial'] },
        endDate: { $gt: new Date() }
      }).sort({ startDate: 1 });

      if (!activeSubscription) {
        return {
          hasActiveSubscription: false,
          monthlyCommission: 0,
          rate: 0,
          phase: 'inactive'
        };
      }

      // Calculate commission for the specific month
      const monthToCalculate = forMonth || new Date();
      const subscriptionStartDate = activeSubscription.startDate;
      
      // Calculate phase based on subscription start date as of the month we're calculating
      const commissionDetails = this.calculatePhasedCommission(subscriptionStartDate, monthToCalculate);
      
      // Monthly commission is the rate percentage (already per month)
      // In this case, commission rate is per PG per month
      const monthlyCommission = commissionDetails.rate;

      return {
        hasActiveSubscription: true,
        subscriptionStartDate: subscriptionStartDate,
        subscriptionEndDate: activeSubscription.endDate,
        monthlyCommission: monthlyCommission,
        rate: commissionDetails.rate,
        phase: commissionDetails.phase,
        monthsSubscribed: commissionDetails.months,
        daysSubscribed: commissionDetails.days,
        yearsSubscribed: commissionDetails.years,
        calculatedForMonth: monthToCalculate
      };
    } catch (error) {
      console.error('Error calculating monthly recurring commission:', error);
      return {
        hasActiveSubscription: false,
        monthlyCommission: 0,
        rate: 0,
        phase: 'inactive'
      };
    }
  }

  /**
   * Calculate total recurring commission for PGs over a time period
   * @param {Array} pgs - Array of PG documents
   * @param {Date} startDate - Start date of period
   * @param {Date} endDate - End date of period
   * @returns {Object} Total recurring commission breakdown
   */
  async calculateRecurringCommissionForPeriod(pgs, startDate, endDate) {
    try {
      let totalCommission = 0;
      const breakdown = {
        phase1_0_6months: { count: 0, commission: 0, rate: 20 },
        phase2_6_12months: { count: 0, commission: 0, rate: 15 },
        phase3_1_3years: { count: 0, commission: 0, rate: 10 },
        phase4_closed: { count: 0, commission: 0, rate: 0 },
        inactive: { count: 0, commission: 0, rate: 0 }
      };

      // Calculate months in the period
      const monthsInPeriod = [];
      let currentMonth = new Date(startDate);
      currentMonth.setDate(1); // Start of month
      
      while (currentMonth <= endDate) {
        monthsInPeriod.push(new Date(currentMonth));
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }

      // For each month in the period, calculate commission for each PG
      for (const pg of pgs) {
        const pgMonthlyCommissions = [];
        
        for (const month of monthsInPeriod) {
          const monthlyCommission = await this.calculateMonthlyRecurringCommission(pg, month);
          
          if (monthlyCommission.hasActiveSubscription) {
            pgMonthlyCommissions.push(monthlyCommission.monthlyCommission);
            
            // Update breakdown for this month
            const phase = monthlyCommission.phase;
            if (breakdown[phase]) {
              breakdown[phase].count += 1;
              breakdown[phase].commission += monthlyCommission.monthlyCommission;
            }
          }
        }
        
        // Add total commission for this PG across all months
        totalCommission += pgMonthlyCommissions.reduce((sum, commission) => sum + commission, 0);
      }

      return {
        totalCommission,
        totalMonths: monthsInPeriod.length,
        breakdown,
        monthlyAverage: totalCommission / monthsInPeriod.length,
        activePGs: pgs.filter(pg => {
          // This will be checked per month, but we return active count for reference
          return true; // We'll check actual active status in monthly calculation
        }).length
      };
    } catch (error) {
      console.error('Error calculating recurring commission for period:', error);
      return {
        totalCommission: 0,
        totalMonths: 0,
        breakdown: {},
        monthlyAverage: 0,
        activePGs: 0
      };
    }
  }

  /**
   * Get detailed PG commission information with phased rates
   * This returns current month's recurring commission details
   * @param {Object} pg - PG document
   * @param {Date} forMonth - Month to calculate for (default: current month)
   * @returns {Object} Commission details
   */
  async getPGCommissionDetails(pg, forMonth = null) {
    try {
      // Use the monthly recurring commission calculation
      const monthlyCommissionDetails = await this.calculateMonthlyRecurringCommission(pg, forMonth);
      
      return {
        hasActiveSubscription: monthlyCommissionDetails.hasActiveSubscription,
        subscriptionStartDate: monthlyCommissionDetails.subscriptionStartDate,
        subscriptionEndDate: monthlyCommissionDetails.subscriptionEndDate,
        commission: monthlyCommissionDetails.monthlyCommission,
        monthlyCommission: monthlyCommissionDetails.monthlyCommission,
        rate: monthlyCommissionDetails.rate,
        phase: monthlyCommissionDetails.phase,
        monthsSubscribed: monthlyCommissionDetails.monthsSubscribed,
        daysSubscribed: monthlyCommissionDetails.daysSubscribed,
        yearsSubscribed: monthlyCommissionDetails.yearsSubscribed,
        calculatedForMonth: monthlyCommissionDetails.calculatedForMonth
      };
    } catch (error) {
      console.error('Error getting PG commission details:', error);
      return {
        hasActiveSubscription: false,
        commission: 0,
        monthlyCommission: 0,
        rate: 0,
        phase: 'inactive'
      };
    }
  }

  /**
   * Calculate total recurring monthly commission for PGs with phased rates
   * This calculates the current month's recurring commission for all active PGs
   * @param {Object} query - MongoDB query to find PGs
   * @param {boolean} includeBreakdown - Whether to include phase breakdown
   * @param {Date} forMonth - Month to calculate for (default: current month)
   * @returns {Object} Commission details
   */
  async calculatePhasedCommissionForPGs(query, includeBreakdown = false, forMonth = null) {
    try {
      const PG = require('../models/pg.model');
      
      // Get all PGs matching the query
      const pgs = await PG.find(query).select('admin _id name createdAt subscriptionStartDate');
      
      if (!pgs || pgs.length === 0) {
        return {
          totalPGs: 0,
          activeSubscriptionPGs: 0,
          totalCommission: 0,
          monthlyCommission: 0,
          breakdown: includeBreakdown ? {
            phase1_0_6months: { count: 0, commission: 0 },
            phase2_6_12months: { count: 0, commission: 0 },
            phase3_1_3years: { count: 0, commission: 0 },
            phase4_closed: { count: 0, commission: 0 }
          } : undefined
        };
      }

      const monthToCalculate = forMonth || new Date();
      let totalMonthlyCommission = 0;
      let activeCount = 0;
      const breakdown = {
        phase1_0_6months: { count: 0, commission: 0, rate: 20 },
        phase2_6_12months: { count: 0, commission: 0, rate: 15 },
        phase3_1_3years: { count: 0, commission: 0, rate: 10 },
        phase4_closed: { count: 0, commission: 0, rate: 0 },
        inactive: { count: 0, commission: 0, rate: 0 }
      };

      // Process each PG - calculate recurring monthly commission
      for (const pg of pgs) {
        const monthlyCommissionDetails = await this.calculateMonthlyRecurringCommission(pg, monthToCalculate);
        
        if (monthlyCommissionDetails.hasActiveSubscription) {
          activeCount++;
          const pgMonthlyCommission = monthlyCommissionDetails.monthlyCommission;
          totalMonthlyCommission += pgMonthlyCommission;

          if (includeBreakdown) {
            const phase = monthlyCommissionDetails.phase;
            if (breakdown[phase]) {
              breakdown[phase].count++;
              breakdown[phase].commission += pgMonthlyCommission;
            }
          }
        } else {
          if (includeBreakdown) {
            breakdown.inactive.count++;
          }
        }
      }

      return {
        totalPGs: pgs.length,
        activeSubscriptionPGs: activeCount,
        totalCommission: totalMonthlyCommission, // Monthly recurring commission
        monthlyCommission: totalMonthlyCommission, // Same for clarity
        breakdown: includeBreakdown ? breakdown : undefined,
        calculatedForMonth: monthToCalculate
      };
    } catch (error) {
      console.error('Error calculating phased commission:', error);
      return {
        totalPGs: 0,
        activeSubscriptionPGs: 0,
        totalCommission: 0,
        monthlyCommission: 0,
        breakdown: undefined
      };
    }
  }

  /**
   * Helper function to count PGs with active subscriptions
   * @param {Object} query - MongoDB query to find PGs
   * @returns {number} Count of PGs with active subscriptions
   */
  async countPGsWithActiveSubscriptions(query) {
    try {
      const PG = require('../models/pg.model');
      const User = require('../models/user.model');
      const UserSubscription = require('../models/userSubscription.model');
      
      // Get all PGs matching the query
      const pgs = await PG.find(query).select('admin _id');
      
      if (!pgs || pgs.length === 0) return 0;
      
      // Check each PG's admin for active subscription
      let activeCount = 0;
      for (const pg of pgs) {
        if (pg.admin) {
          const adminUser = await User.findById(pg.admin);
          if (adminUser) {
            const activeSubscription = await UserSubscription.findOne({
              userId: adminUser._id,
              status: { $in: ['active', 'trial'] },
              endDate: { $gt: new Date() }
            });
            
            if (activeSubscription) {
              activeCount++;
            }
          }
        }
      }
      
      return activeCount;
    } catch (error) {
      console.error('Error counting PGs with active subscriptions:', error);
      return 0;
    }
  }

  async getPerformanceAnalytics(user) {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Date ranges for analytics
      const monthStart = new Date(currentYear, currentMonth, 1);
      const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const lastMonthEnd = new Date(currentYear, currentMonth, 1);
      const yearStart = new Date(currentYear, 0, 1);

      let performanceData = {};
      const UserSubscription = require('../models/userSubscription.model');

      if (user.role === 'sales_manager') {
        // Get sub-sales staff under this manager
        const hierarchy = await SalesHierarchy.find({
          salesPerson: user._id,
          status: 'active'
        }).populate('subSalesPerson');

        const subSalesIds = hierarchy.map(h => h.subSalesPerson?._id).filter(Boolean);

        // PGs added by team this month (Revenue Generated)
        const teamPGsThisMonth = await PG.countDocuments({
          addedBy: { $in: [user._id, ...subSalesIds] },
          createdAt: { $gte: monthStart }
        });

        // PGs with active subscriptions this month (Commission Earned)
        const activePGsThisMonth = await this.countPGsWithActiveSubscriptions({
          addedBy: { $in: [user._id, ...subSalesIds] },
          createdAt: { $gte: monthStart }
        });

        // PGs added by team last month (Revenue Generated)
        const teamPGsLastMonth = await PG.countDocuments({
          addedBy: { $in: [user._id, ...subSalesIds] },
          createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
        });

        // PGs with active subscriptions last month (Commission Earned)
        const activePGsLastMonth = await this.countPGsWithActiveSubscriptions({
          addedBy: { $in: [user._id, ...subSalesIds] },
          createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
        });

        // PGs added by team this year (Revenue Generated)
        const teamPGsThisYear = await PG.countDocuments({
          addedBy: { $in: [user._id, ...subSalesIds] },
          createdAt: { $gte: yearStart }
        });

        // PGs with active subscriptions this year (Commission Earned)
        const activePGsThisYear = await this.countPGsWithActiveSubscriptions({
          addedBy: { $in: [user._id, ...subSalesIds] },
          createdAt: { $gte: yearStart }
        });

        // Monthly trend data with revenue and commission separation
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(currentYear, currentMonth - i, 1);
          const nextMonth = new Date(currentYear, currentMonth - i + 1, 1);

          // Total PGs added (Revenue Generated)
          const pgCount = await PG.countDocuments({
            addedBy: { $in: [user._id, ...subSalesIds] },
            createdAt: { $gte: monthDate, $lt: nextMonth }
          });

          // PGs with active subscriptions (Commission Earned)
          const activePGCount = await this.countPGsWithActiveSubscriptions({
            addedBy: { $in: [user._id, ...subSalesIds] },
            createdAt: { $gte: monthDate, $lt: nextMonth }
          });

          // Calculate phased commission for this month's PGs
          const monthPGs = await PG.find({
            addedBy: { $in: [user._id, ...subSalesIds] },
            createdAt: { $gte: monthDate, $lt: nextMonth }
          });
          
          let monthCommission = 0;
          const monthBreakdown = {
            phase1_0_6months: { count: 0, commission: 0 },
            phase2_6_12months: { count: 0, commission: 0 },
            phase3_1_3years: { count: 0, commission: 0 },
            phase4_closed: { count: 0, commission: 0 }
          };

          for (const pg of monthPGs) {
            const pgCommission = await this.getPGCommissionDetails(pg);
            if (pgCommission.hasActiveSubscription) {
              const phase = pgCommission.phase;
              monthCommission += pgCommission.rate;
              if (monthBreakdown[phase]) {
                monthBreakdown[phase].count++;
                monthBreakdown[phase].commission += pgCommission.rate;
              }
            }
          }
          
          monthlyData.push({
            month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            pgs: pgCount,
            revenueGenerated: pgCount, // All PGs added
            activeSubscriptionPGs: activePGCount, // PGs with active subscriptions
            commission: monthCommission, // Phased commission for active subscriptions
            commissionBreakdown: monthBreakdown
          });
        }

        // Individual staff performance
        const staffPerformance = await Promise.all(
          hierarchy.map(async (h) => {
            const staff = h.subSalesPerson;
            if (!staff) return null;

            const staffPGsThisMonth = await PG.countDocuments({
              addedBy: staff._id,
              createdAt: { $gte: monthStart }
            });

            const staffActivePGsThisMonth = await this.countPGsWithActiveSubscriptions({
              addedBy: staff._id,
              createdAt: { $gte: monthStart }
            });

            const staffPGsThisYear = await PG.countDocuments({
              addedBy: staff._id,
              createdAt: { $gte: yearStart }
            });

            const staffActivePGsThisYear = await this.countPGsWithActiveSubscriptions({
              addedBy: staff._id,
              createdAt: { $gte: yearStart }
            });

            // Calculate phased commission for this staff member's PGs
            const staffPhasedCommission = await this.calculatePhasedCommissionForPGs({
              addedBy: staff._id,
              createdAt: { $gte: yearStart }
            }, true);

            return {
              name: `${staff.firstName} ${staff.lastName}`,
              pgsThisMonth: staffPGsThisMonth,
              activePGsThisMonth: staffActivePGsThisMonth,
              pgsThisYear: staffPGsThisYear,
              activePGsThisYear: staffActivePGsThisYear,
              revenueGenerated: staffPGsThisYear,
              commission: staffPhasedCommission.totalCommission, // Phased commission for active subscriptions
              commissionBreakdown: staffPhasedCommission.breakdown,
              uniqueId: staff.salesUniqueId
            };
          })
        );

        // Calculate phased commission for all PGs this year
        const phasedCommission = await this.calculatePhasedCommissionForPGs({
          addedBy: { $in: [user._id, ...subSalesIds] },
          createdAt: { $gte: yearStart }
        }, true); // Include breakdown

        performanceData = {
          summary: {
            teamSize: subSalesIds.length,
            pgsThisMonth: teamPGsThisMonth, // Revenue generated
            activePGsThisMonth: activePGsThisMonth, // PGs with active subscriptions
            pgsLastMonth: teamPGsLastMonth,
            activePGsLastMonth: activePGsLastMonth,
            pgsThisYear: teamPGsThisYear, // Total revenue generated
            activePGsThisYear: activePGsThisYear, // Total with active subscriptions
            revenueGenerated: teamPGsThisYear, // All PGs added
            commissionEarned: phasedCommission.totalCommission, // Phased commission for active subscriptions
            growthRate: teamPGsLastMonth > 0 ? ((teamPGsThisMonth - teamPGsLastMonth) / teamPGsLastMonth * 100).toFixed(1) : '0.0',
            totalCommission: phasedCommission.totalCommission, // Phased commission
            commissionBreakdown: phasedCommission.breakdown // Phase breakdown
          },
          monthlyTrend: monthlyData,
          staffPerformance: staffPerformance.filter(Boolean),
          targets: {
            monthlyTarget: 80, // Sales manager monthly target
            yearlyTarget: 960, // 80 * 12
            currentProgress: (teamPGsThisYear / 960 * 100).toFixed(1)
          }
        };

      } else if (user.salesRole === 'sub_sales') {
        // Individual performance for sub-sales staff
        
        // Total PGs added (Revenue Generated)
        const pgsThisMonth = await PG.countDocuments({
          addedBy: user._id,
          createdAt: { $gte: monthStart }
        });

        const pgsLastMonth = await PG.countDocuments({
          addedBy: user._id,
          createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
        });

        const pgsThisYear = await PG.countDocuments({
          addedBy: user._id,
          createdAt: { $gte: yearStart }
        });

        // PGs with active subscriptions (Commission Earned)
        const activePGsThisMonth = await this.countPGsWithActiveSubscriptions({
          addedBy: user._id,
          createdAt: { $gte: monthStart }
        });

        const activePGsLastMonth = await this.countPGsWithActiveSubscriptions({
          addedBy: user._id,
          createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
        });

        const activePGsThisYear = await this.countPGsWithActiveSubscriptions({
          addedBy: user._id,
          createdAt: { $gte: yearStart }
        });

        // Monthly trend data with revenue and commission separation
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(currentYear, currentMonth - i, 1);
          const nextMonth = new Date(currentYear, currentMonth - i + 1, 1);

          // Total PGs added (Revenue Generated)
          const pgCount = await PG.countDocuments({
            addedBy: user._id,
            createdAt: { $gte: monthDate, $lt: nextMonth }
          });

          // PGs with active subscriptions (Commission Earned)
          const activePGCount = await this.countPGsWithActiveSubscriptions({
            addedBy: user._id,
            createdAt: { $gte: monthDate, $lt: nextMonth }
          });

          const commissionRate = user.salesCommissionRate || 10;

          monthlyData.push({
            month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            pgs: pgCount,
            revenueGenerated: pgCount, // All PGs added
            activeSubscriptionPGs: activePGCount, // PGs with active subscriptions
            commission: activePGCount * commissionRate // Commission only for active subscriptions
          });
        }

        const commissionRate = user.salesCommissionRate || 10;

        performanceData = {
          summary: {
            pgsThisMonth: pgsThisMonth, // Revenue generated
            activePGsThisMonth: activePGsThisMonth, // PGs with active subscriptions
            pgsLastMonth: pgsLastMonth,
            activePGsLastMonth: activePGsLastMonth,
            pgsThisYear: pgsThisYear, // Total revenue generated
            activePGsThisYear: activePGsThisYear, // Total with active subscriptions
            revenueGenerated: pgsThisYear, // All PGs added
            commissionEarned: activePGsThisYear * commissionRate, // Commission only for active subscriptions
            growthRate: pgsLastMonth > 0 ? ((pgsThisMonth - pgsLastMonth) / pgsLastMonth * 100).toFixed(1) : '0.0',
            totalCommission: activePGsThisYear * commissionRate, // Only active subscriptions
            commissionRate: commissionRate
          },
          monthlyTrend: monthlyData,
          targets: {
            monthlyTarget: 30, // Sub-sales monthly target
            yearlyTarget: 360, // 30 * 12
            currentProgress: (pgsThisYear / 360 * 100).toFixed(1)
          }
        };
      }

      return performanceData;
    } catch (error) {
      console.error('Error getting performance analytics:', error);
      throw new Error('Failed to get performance analytics');
    }
  }

  /**
   * Get detailed reports for sales managers
   * @param {Object} user - Authenticated sales manager
   * @returns {Object} Detailed reports data
   */
  async getSalesReports(user) {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Date ranges
      const monthStart = new Date(currentYear, currentMonth, 1);
      const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const lastMonthEnd = new Date(currentYear, currentMonth, 1);
      const yearStart = new Date(currentYear, 0, 1);
      const quarterStart = new Date(currentYear, Math.floor(currentMonth / 3) * 3, 1);

      let reportsData = {};

      if (user.role === 'sales_manager') {
        // Get sub-sales staff under this manager
        const hierarchy = await SalesHierarchy.find({
          salesPerson: user._id,
          status: 'active'
        }).populate('subSalesPerson');

        const subSalesIds = hierarchy.map(h => h.subSalesPerson?._id).filter(Boolean);

        // Team Performance Summary
        const teamPGsThisMonth = await PG.countDocuments({
          addedBy: { $in: [user._id, ...subSalesIds] },
          createdAt: { $gte: monthStart }
        });

        const teamPGsLastMonth = await PG.countDocuments({
          addedBy: { $in: [user._id, ...subSalesIds] },
          createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
        });

        const teamPGsThisYear = await PG.countDocuments({
          addedBy: { $in: [user._id, ...subSalesIds] },
          createdAt: { $gte: yearStart }
        });

        const teamPGsThisQuarter = await PG.countDocuments({
          addedBy: { $in: [user._id, ...subSalesIds] },
          createdAt: { $gte: quarterStart }
        });

        // Individual Staff Reports
        const staffReports = await Promise.all(
          hierarchy.map(async (h) => {
            const staff = h.subSalesPerson;
            if (!staff) return null;

            const staffPGsThisMonth = await PG.countDocuments({
              addedBy: staff._id,
              createdAt: { $gte: monthStart }
            });

            const staffPGsLastMonth = await PG.countDocuments({
              addedBy: staff._id,
              createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
            });

            const staffPGsThisYear = await PG.countDocuments({
              addedBy: staff._id,
              createdAt: { $gte: yearStart }
            });

            const staffPGsThisQuarter = await PG.countDocuments({
              addedBy: staff._id,
              createdAt: { $gte: quarterStart }
            });

            const monthlyTarget = 30; // Sub-sales monthly target
            const yearlyTarget = 360; // 30 * 12
            const quarterlyTarget = 90; // 30 * 3

            return {
              id: staff._id,
              name: `${staff.firstName} ${staff.lastName}`,
              email: staff.email,
              uniqueId: staff.salesUniqueId,
              commissionRate: staff.salesCommissionRate || 10,
              performance: {
                thisMonth: {
                  pgs: staffPGsThisMonth,
                  activePGs: await this.countPGsWithActiveSubscriptions({
                    addedBy: staff._id,
                    createdAt: { $gte: monthStart }
                  }),
                  target: monthlyTarget,
                  achievement: Math.min((staffPGsThisMonth / monthlyTarget) * 100, 100),
                  revenueGenerated: staffPGsThisMonth,
                  commission: (await this.calculatePhasedCommissionForPGs({
                    addedBy: staff._id,
                    createdAt: { $gte: monthStart }
                  })).totalCommission
                },
                lastMonth: {
                  pgs: staffPGsLastMonth,
                  activePGs: await this.countPGsWithActiveSubscriptions({
                    addedBy: staff._id,
                    createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
                  }),
                  target: monthlyTarget,
                  achievement: Math.min((staffPGsLastMonth / monthlyTarget) * 100, 100),
                  revenueGenerated: staffPGsLastMonth,
                  commission: (await this.calculatePhasedCommissionForPGs({
                    addedBy: staff._id,
                    createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
                  })).totalCommission
                },
                thisQuarter: {
                  pgs: staffPGsThisQuarter,
                  activePGs: await this.countPGsWithActiveSubscriptions({
                    addedBy: staff._id,
                    createdAt: { $gte: quarterStart }
                  }),
                  target: quarterlyTarget,
                  achievement: Math.min((staffPGsThisQuarter / quarterlyTarget) * 100, 100),
                  revenueGenerated: staffPGsThisQuarter,
                  commission: (await this.calculatePhasedCommissionForPGs({
                    addedBy: staff._id,
                    createdAt: { $gte: quarterStart }
                  })).totalCommission
                },
                thisYear: {
                  pgs: staffPGsThisYear,
                  activePGs: await this.countPGsWithActiveSubscriptions({
                    addedBy: staff._id,
                    createdAt: { $gte: yearStart }
                  }),
                  target: yearlyTarget,
                  achievement: Math.min((staffPGsThisYear / yearlyTarget) * 100, 100),
                  revenueGenerated: staffPGsThisYear,
                  commission: (await this.calculatePhasedCommissionForPGs({
                    addedBy: staff._id,
                    createdAt: { $gte: yearStart }
                  })).totalCommission
                }
              },
              status: staffPGsThisMonth >= monthlyTarget ? 'on-target' : 'below-target',
              createdAt: staff.createdAt
            };
          })
        );

        // Monthly Trends (Last 12 months) with revenue and commission separation
        const monthlyTrends = [];
        for (let i = 11; i >= 0; i--) {
          const monthDate = new Date(currentYear, currentMonth - i, 1);
          const nextMonth = new Date(currentYear, currentMonth - i + 1, 1);

          // Total PGs added (Revenue Generated)
          const monthPGs = await PG.countDocuments({
            addedBy: { $in: [user._id, ...subSalesIds] },
            createdAt: { $gte: monthDate, $lt: nextMonth }
          });

          // PGs with active subscriptions (Commission Earned)
          const activeMonthPGs = await this.countPGsWithActiveSubscriptions({
            addedBy: { $in: [user._id, ...subSalesIds] },
            createdAt: { $gte: monthDate, $lt: nextMonth }
          });

          // Calculate phased commission for this month's PGs
          const monthPGsList = await PG.find({
            addedBy: { $in: [user._id, ...subSalesIds] },
            createdAt: { $gte: monthDate, $lt: nextMonth }
          });
          
          let monthCommission = 0;
          const monthBreakdown = {
            phase1_0_6months: { count: 0, commission: 0 },
            phase2_6_12months: { count: 0, commission: 0 },
            phase3_1_3years: { count: 0, commission: 0 },
            phase4_closed: { count: 0, commission: 0 }
          };

          for (const pg of monthPGsList) {
            const pgCommission = await this.getPGCommissionDetails(pg);
            if (pgCommission.hasActiveSubscription) {
              const phase = pgCommission.phase;
              monthCommission += pgCommission.rate;
              if (monthBreakdown[phase]) {
                monthBreakdown[phase].count++;
                monthBreakdown[phase].commission += pgCommission.rate;
              }
            }
          }

          monthlyTrends.push({
            month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            teamPGs: monthPGs,
            revenueGenerated: monthPGs,
            activeSubscriptionPGs: activeMonthPGs,
            commission: monthCommission, // Phased commission for active subscriptions
            commissionBreakdown: monthBreakdown,
            target: 80 // Manager's monthly target
          });
        }

        // Top Performers
        const topPerformers = staffReports
          .filter(Boolean)
          .sort((a, b) => b.performance.thisMonth.pgs - a.performance.thisMonth.pgs)
          .slice(0, 5);

        // Calculate phased commission for all PGs
        const phasedCommission = await this.calculatePhasedCommissionForPGs({
          addedBy: { $in: [user._id, ...subSalesIds] },
          createdAt: { $gte: yearStart }
        }, true); // Include breakdown

        const monthlyPhasedCommission = await this.calculatePhasedCommissionForPGs({
          addedBy: { $in: [user._id, ...subSalesIds] },
          createdAt: { $gte: monthStart }
        }, true);

        reportsData = {
          summary: {
            teamSize: subSalesIds.length,
            totalPGsThisMonth: teamPGsThisMonth,
            activePGsThisMonth: monthlyPhasedCommission.activeSubscriptionPGs,
            totalPGsThisQuarter: teamPGsThisQuarter,
            totalPGsThisYear: teamPGsThisYear,
            activePGsThisYear: phasedCommission.activeSubscriptionPGs,
            revenueGenerated: teamPGsThisYear, // All PGs added
            commissionEarned: phasedCommission.totalCommission, // Phased commission for active subscriptions
            monthlyGrowth: teamPGsLastMonth > 0 ? ((teamPGsThisMonth - teamPGsLastMonth) / teamPGsLastMonth * 100).toFixed(1) : 0,
            totalCommission: phasedCommission.totalCommission, // Phased commission
            commissionBreakdown: phasedCommission.breakdown, // Phase breakdown
            monthlyTarget: 80,
            yearlyTarget: 960
          },
          staffReports: staffReports.filter(Boolean),
          monthlyTrends: monthlyTrends,
          topPerformers: topPerformers,
          generatedAt: new Date()
        };

      } else if (user.salesRole === 'sub_sales') {
        // Individual reports for sub-sales staff
        const pgsThisMonth = await PG.countDocuments({
          addedBy: user._id,
          createdAt: { $gte: monthStart }
        });

        const pgsLastMonth = await PG.countDocuments({
          addedBy: user._id,
          createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
        });

        const pgsThisYear = await PG.countDocuments({
          addedBy: user._id,
          createdAt: { $gte: yearStart }
        });

        const pgsThisQuarter = await PG.countDocuments({
          addedBy: user._id,
          createdAt: { $gte: quarterStart }
        });

        // Monthly Trends (Last 12 months) with revenue and commission separation
        const monthlyTrends = [];
        for (let i = 11; i >= 0; i--) {
          const monthDate = new Date(currentYear, currentMonth - i, 1);
          const nextMonth = new Date(currentYear, currentMonth - i + 1, 1);

          // Total PGs added (Revenue Generated)
          const monthPGs = await PG.countDocuments({
            addedBy: user._id,
            createdAt: { $gte: monthDate, $lt: nextMonth }
          });

          // PGs with active subscriptions (Commission Earned)
          const activeMonthPGs = await this.countPGsWithActiveSubscriptions({
            addedBy: user._id,
            createdAt: { $gte: monthDate, $lt: nextMonth }
          });

          const commissionRate = user.salesCommissionRate || 10;

          monthlyTrends.push({
            month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            pgs: monthPGs,
            revenueGenerated: monthPGs,
            activeSubscriptionPGs: activeMonthPGs,
            commission: activeMonthPGs * commissionRate, // Commission only for active subscriptions
            target: 30 // Sub-sales monthly target
          });
        }

        // Calculate active subscription PGs for commission
        const activePGsThisYear = await this.countPGsWithActiveSubscriptions({
          addedBy: user._id,
          createdAt: { $gte: yearStart }
        });

        const activePGsThisMonth = await this.countPGsWithActiveSubscriptions({
          addedBy: user._id,
          createdAt: { $gte: monthStart }
        });

        const activePGsThisQuarter = await this.countPGsWithActiveSubscriptions({
          addedBy: user._id,
          createdAt: { $gte: quarterStart }
        });

        const commissionRate = user.salesCommissionRate || 10;

        reportsData = {
          summary: {
            pgsThisMonth: pgsThisMonth,
            activePGsThisMonth: activePGsThisMonth,
            pgsThisQuarter: pgsThisQuarter,
            activePGsThisQuarter: activePGsThisQuarter,
            pgsThisYear: pgsThisYear,
            activePGsThisYear: activePGsThisYear,
            revenueGenerated: pgsThisYear, // All PGs added
            commissionEarned: activePGsThisYear * commissionRate, // Commission only for active subscriptions
            monthlyGrowth: pgsLastMonth > 0 ? ((pgsThisMonth - pgsLastMonth) / pgsLastMonth * 100).toFixed(1) : 0,
            totalCommission: activePGsThisYear * commissionRate, // Only active subscriptions
            commissionRate: commissionRate,
            monthlyTarget: 30,
            yearlyTarget: 360
          },
          monthlyTrends: monthlyTrends,
          performance: {
            thisMonth: {
              pgs: pgsThisMonth,
              activePGs: activePGsThisMonth,
              target: 30,
              achievement: Math.min((pgsThisMonth / 30) * 100, 100),
              revenueGenerated: pgsThisMonth,
              commission: activePGsThisMonth * commissionRate
            },
            thisQuarter: {
              pgs: pgsThisQuarter,
              activePGs: activePGsThisQuarter,
              target: 90,
              achievement: Math.min((pgsThisQuarter / 90) * 100, 100),
              revenueGenerated: pgsThisQuarter,
              commission: activePGsThisQuarter * commissionRate
            },
            thisYear: {
              pgs: pgsThisYear,
              activePGs: activePGsThisYear,
              target: 360,
              achievement: Math.min((pgsThisYear / 360) * 100, 100),
              revenueGenerated: pgsThisYear,
              commission: activePGsThisYear * commissionRate
            }
          },
          generatedAt: new Date()
        };
      }

      return reportsData;
    } catch (error) {
      console.error('Error getting sales reports:', error);
      throw new Error('Failed to get sales reports');
    }
  }

  /**
   * Change password for sales users
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @param {string} userType - Type of user (sales_manager or sub_sales)
   * @returns {Object} Success message
   */
  async changePassword(userId, currentPassword, newPassword, userType) {
    try {
      let user;

      // Find the user based on type
      if (userType === 'sales_manager') {
        user = await User.findById(userId).select('+password');
      } else if (userType === 'sub_sales') {
        user = await User.findById(userId).select('+password');
      } else {
        throw new Error('Invalid user type');
      }

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.correctPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password (raw password - pre-save middleware will hash it)
      user.password = newPassword;

      // For sales users (both managers and sub-sales), set forcePasswordChange to false
      if (userType === 'sales_manager' || userType === 'sub_sales') {
        user.forcePasswordChange = false;
        user.passwordChanged = true;
      }

      await user.save();

      return {
        message: 'Password changed successfully',
        passwordChangedAt: user.passwordChangedAt
      };

    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Add a new PG for the current sub-sales staff
   * @param {Object} pgData - PG details
   * @param {Object} user - Authenticated user
   * @returns {Object} Added PG
   */
  async addPG(pgData, user) {
    if (user.salesRole !== 'sub_sales') {
      throw new Error('Unauthorized: Only sub-sales staff can add PGs');
    }

    // Generate unique branch ID
    const branchId = await generateUniqueId('PG');

    // Create new PG with added_by tracking
    const newPG = new PG({
      ...pgData,
      branchId,
      addedBy: user._id
    });

    await newPG.save();

    // Update user's total PGs added count (but not commission - commission awarded only on active subscription)
    const currentPGs = user.salesPerformanceMetrics?.totalPGsAdded || 0;

    await User.findByIdAndUpdate(user._id, {
      $inc: {
        'salesPerformanceMetrics.totalPGsAdded': 1
      },
      $set: {
        'salesPerformanceMetrics.lastPGAddedDate': new Date()
      }
    });

    console.log('Note: Commission will be awarded when PG admin subscribes to an active plan');

    return newPG;
  }

  /**
   * Get dashboard data for sales users
   * @param {Object} user - The authenticated user
   * @returns {Object} Dashboard statistics
   */
  async getDashboardData(user) {
    try {
      let dashboardData = {};

      if (user.role === 'sales_manager') {
        // For sales managers: show team performance
        const subSalesStaff = await User.find({
          parentSalesPerson: user._id,
          salesRole: 'sub_sales'
        }).sort({ createdAt: -1 }); // Most recent first

        const subSalesIds = subSalesStaff.map(staff => staff._id);

        // Get all PGs created by manager and their sub-sales (Revenue Generated)
        const totalPGs = await PG.countDocuments({
          $or: [
            { addedBy: user._id }, // Manager's PGs
            { addedBy: { $in: subSalesIds } } // Sub-sales PGs
          ]
        });

        // Get PGs with active subscriptions (Commission Earned)
        const activeSubscriptionPGs = await this.countPGsWithActiveSubscriptions({
          $or: [
            { addedBy: user._id },
            { addedBy: { $in: subSalesIds } }
          ]
        });

        // Get recent PGs (last 5)
        const recentPGs = await PG.find({
          $or: [
            { addedBy: user._id },
            { addedBy: { $in: subSalesIds } }
          ]
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('addedBy', 'firstName lastName salesUniqueId')
        .select('name createdAt addedBy salesManager salesStaff');

        // Calculate total commission using phased rates for sales managers
        const phasedCommission = await this.calculatePhasedCommissionForPGs({
          $or: [
            { addedBy: user._id },
            { addedBy: { $in: subSalesIds } }
          ]
        }, true); // Include breakdown

        const totalCommissionEarned = phasedCommission.totalCommission;

        // Performance rate based on team size and PG creation
        const teamSize = subSalesStaff.length;
        const performanceRate = teamSize > 0 ? Math.min((totalPGs / (teamSize * 2)) * 100, 100) : 0;

        // Get recent sub-sales staff (last 5)
        const recentSubSalesStaff = subSalesStaff.slice(0, 5).map(staff => ({
          _id: staff._id,
          firstName: staff.firstName,
          lastName: staff.lastName,
          email: staff.email,
          salesUniqueId: staff.salesUniqueId,
          createdAt: staff.createdAt,
          pgsAdded: staff.salesPerformanceMetrics?.totalPGsAdded || 0
        }));

        // Performance trends (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentPGsCount = await PG.countDocuments({
          $or: [
            { addedBy: user._id },
            { addedBy: { $in: subSalesIds } }
          ],
          createdAt: { $gte: sevenDaysAgo }
        });

        // Motivational messages based on performance
        const motivationalMessage = this.getMotivationalMessage(totalPGs, teamSize, performanceRate);

        dashboardData = {
          totalSubSalesStaff: teamSize,
          totalPGsAdded: totalPGs, // Revenue Generated - All PGs added
          activeSubscriptionPGs: phasedCommission.activeSubscriptionPGs, // PGs with active subscriptions
          revenueGenerated: totalPGs, // All PGs added
          commissionEarned: totalCommissionEarned, // Phased commission for active subscriptions
          totalCommissionEarned: totalCommissionEarned, // For backward compatibility
          commissionBreakdown: phasedCommission.breakdown, // Phase breakdown (20%, 15%, 10%, 0%)
          performanceRate: Math.round(performanceRate),
          recentSubSalesStaff,
          recentPGs,
          recentActivity: recentPGsCount,
          motivationalMessage,
          role: 'sales_manager'
        };

      } else if (user.salesRole === 'sub_sales') {
        // For sub-sales staff: show individual performance from stored metrics
        const totalPGs = user.salesPerformanceMetrics?.totalPGsAdded || 0;
        const totalCommissionEarned = user.salesPerformanceMetrics?.totalCommissionEarned || 0;

        // Get recent PGs added by this user
        const recentPGs = await PG.find({ addedBy: user._id })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name createdAt salesManager salesStaff');

        // Performance rate based on PG creation (target: 30 PGs per month)
        const performanceRate = Math.min((totalPGs / 30) * 100, 100);

        // Performance trends (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentPGsCount = await PG.countDocuments({
          addedBy: user._id,
          createdAt: { $gte: sevenDaysAgo }
        });

        // Get manager info
        const managerInfo = user.parentSalesPerson ?
          await User.findById(user.parentSalesPerson).select('firstName lastName salesUniqueId') : null;

        // Motivational messages based on performance
        const motivationalMessage = this.getMotivationalMessage(totalPGs, 1, performanceRate, true);

        dashboardData = {
          totalSubSalesStaff: 0, // Sub-sales don't have staff
          totalPGsAdded: totalPGs, // Revenue Generated - All PGs added
          activeSubscriptionPGs: activeSubscriptionPGs, // PGs with active subscriptions
          revenueGenerated: totalPGs, // All PGs added
          commissionEarned: totalCommissionEarned, // Commission only for active subscriptions
          totalCommissionEarned: totalCommissionEarned, // For backward compatibility
          performanceRate: Math.round(performanceRate),
          recentPGs,
          recentActivity: recentPGsCount,
          managerInfo,
          motivationalMessage,
          role: 'sub_sales'
        };
      }

      return dashboardData;
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw new Error('Failed to fetch dashboard data');
    }
  }

  /**
   * Get motivational message based on performance
   * @param {number} totalPGs - Total PGs added
   * @param {number} teamSize - Team size (for managers)
   * @param {number} performanceRate - Performance rate percentage
   * @param {boolean} isSubSales - Whether this is for sub-sales staff
   * @returns {string} Motivational message
   */
  getMotivationalMessage(totalPGs, teamSize, performanceRate, isSubSales = false) {
    const messages = {
      excellent: [
        "🚀 Outstanding! You're a sales superstar!",
        "🌟 Phenomenal performance! Keep crushing it!",
        "💪 Elite level! You're setting the standard!"
      ],
      good: [
        "👍 Great work! You're on fire!",
        "🎯 Well done! Keep up the momentum!",
        "⭐ Solid performance! You're doing amazing!"
      ],
      improving: [
        "📈 Good progress! Keep pushing forward!",
        "🎪 Steady improvement! You're getting there!",
        "💡 Keep going! Every step counts!"
      ],
      needsWork: [
        "🌱 Time to ramp up! Let's turn it around!",
        "🎯 Focus and action! You've got this!",
        "💪 Let's get moving! Time for action!"
      ]
    };

    let performanceLevel = 'needsWork';

    if (performanceRate >= 90) {
      performanceLevel = 'excellent';
    } else if (performanceRate >= 70) {
      performanceLevel = 'good';
    } else if (performanceRate >= 40) {
      performanceLevel = 'improving';
    }

    const randomMessage = messages[performanceLevel][Math.floor(Math.random() * messages[performanceLevel].length)];

    if (isSubSales) {
      return `${randomMessage} You've added ${totalPGs} PG${totalPGs !== 1 ? 's' : ''} this month. Keep expanding your network!`;
    } else {
      return `${randomMessage} Your team has added ${totalPGs} PG${totalPGs !== 1 ? 's' : ''} with ${teamSize} team member${teamSize !== 1 ? 's' : ''}.`;
    }
  }

  /**
   * Get profile for a sales user
   * @param {Object} user - User object
   * @returns {Object} User profile data
   */
  async getProfile(user) {
    try {
      console.log('🔍 Getting profile for user:', user._id);

      const userProfile = await User.findById(user._id)
        .select('firstName lastName email phone address salesUniqueId uniqueSalesId role salesRole isActive createdAt updatedAt')
        .lean();

      if (!userProfile) {
        throw new Error('User not found');
      }

      console.log('✅ Profile retrieved successfully');
      return userProfile;
    } catch (error) {
      console.error('❌ Error getting profile:', error);
      throw error;
    }
  }

  /**
   * Update profile for a sales user
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @param {Object} requestingUser - User making the request (for authorization)
   * @returns {Object} Updated user profile
   */
  async updateProfile(userId, updateData, requestingUser) {
    try {
      console.log('🚀 Updating profile for user:', userId);

      // Ensure user can only update their own profile
      if (userId !== requestingUser._id) {
        throw new Error('Unauthorized: Can only update your own profile');
      }

      // Validate update data
      const allowedFields = ['firstName', 'lastName', 'phone', 'address'];
      const filteredUpdateData = {};

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          if (key === 'address' && typeof value === 'object') {
            // Validate address structure
            filteredUpdateData.address = {
              street: value.street || '',
              city: value.city || '',
              state: value.state || '',
              pincode: value.pincode || '',
              country: value.country || 'India'
            };
          } else {
            filteredUpdateData[key] = value;
          }
        }
      }

      // Validate required fields
      if (filteredUpdateData.firstName && filteredUpdateData.firstName.trim().length < 2) {
        throw new Error('First name must be at least 2 characters long');
      }

      if (filteredUpdateData.lastName && filteredUpdateData.lastName.trim().length < 1) {
        throw new Error('Last name is required');
      }

      if (filteredUpdateData.phone && !/^[6-9]\d{9}$/.test(filteredUpdateData.phone)) {
        throw new Error('Please enter a valid 10-digit mobile number');
      }

      if (filteredUpdateData.address?.pincode && !/^\d{6}$/.test(filteredUpdateData.address.pincode)) {
        throw new Error('Please enter a valid 6-digit pincode');
      }

      // Update user profile
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          ...filteredUpdateData,
          updatedAt: new Date()
        },
        {
          new: true,
          runValidators: true,
          select: 'firstName lastName email phone address salesUniqueId uniqueSalesId role salesRole isActive createdAt updatedAt'
        }
      );

      if (!updatedUser) {
        throw new Error('User not found');
      }

      console.log('✅ Profile updated successfully');
      return updatedUser;
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }
  }

  async getSalesAnalytics(period = 'monthly', filters = {}) {
    try {
      // Aggregate sales data across different time periods and dimensions
      const periodMap = {
        'weekly': { extract: '$week', field: 'week' },
        'monthly': { extract: '$month', field: 'month' },
        'yearly': { extract: '$year', field: 'year' }
      };

      const periodField = periodMap[period] || periodMap['monthly'];

      const pipeline = [
        // Match stage with optional filters
        { 
          $match: {
            ...filters,
            createdAt: {
              $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
              $lte: new Date()
            }
          }
        },
        
        // Group by period and calculate metrics
        {
          $group: {
            _id: { 
              period: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                week: { $week: '$createdAt' }
              },
              salesManager: '$salesManagerId',
              branch: '$branchId'
            },
            totalPGs: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            averageRevenue: { $avg: '$totalAmount' },
            completedPGs: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] 
              } 
            }
          }
        },

        // Lookup sales manager details
        {
          $lookup: {
            from: 'users',
            localField: '_id.salesManager',
            foreignField: '_id',
            as: 'salesManagerDetails'
          }
        },

        // Lookup branch details
        {
          $lookup: {
            from: 'branches',
            localField: '_id.branch',
            foreignField: '_id',
            as: 'branchDetails'
          }
        },

        // Project final shape
        {
          $project: {
            _id: 0,
            period: '$_id.period',
            salesManager: { 
              $arrayElemAt: ['$salesManagerDetails', 0] 
            },
            branch: { 
              $arrayElemAt: ['$branchDetails', 0] 
            },
            totalPGs: 1,
            totalRevenue: 1,
            averageRevenue: 1,
            completedPGs: 1
          }
        },

        // Sort by period
        { $sort: { 'period.year': 1, 'period.month': 1 } }
      ];

      const salesAnalytics = await PG.aggregate(pipeline);

      // Additional aggregations for overall insights
      const overallInsights = await PG.aggregate([
        { 
          $match: {
            createdAt: {
              $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
              $lte: new Date()
            }
          }
        },
        {
          $group: {
            _id: null,
            totalPGs: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            completedPGs: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] 
              } 
            },
            topSalesManagers: { 
              $push: { 
                salesManagerId: '$salesManagerId', 
                revenue: '$totalAmount' 
              } 
            }
          }
        }
      ]);

      // Subscription-related analytics
      const subscriptionAnalytics = await Subscription.aggregate([
        {
          $group: {
            _id: null,
            totalSubscriptions: { $sum: 1 },
            activeSubscriptions: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'active'] }, 1, 0] 
              } 
            },
            totalSubscriptionRevenue: { $sum: '$price' },
            subscriptionsByPlan: { 
              $push: { 
                planName: '$planName', 
                count: 1 
              } 
            }
          }
        }
      ]);

      return {
        success: true,
        data: {
          salesAnalytics,
          overallInsights: overallInsights[0] || {},
          subscriptionAnalytics: subscriptionAnalytics[0] || {}
        }
      };
    } catch (error) {
      console.error('Error in getSalesAnalytics:', error);
      return {
        success: false,
        message: 'Failed to retrieve sales analytics',
        error: error.message
      };
    }
  }

  /**
   * Award commission when a PG gets active subscription
   * Uses phased commission rates based on subscription duration
   * @param {string} pgId - PG ID that got subscription (or userId to find PG)
   * @param {Object} pgAdminUser - Admin user who subscribed
   * @param {Date} subscriptionStartDate - When subscription started
   * @returns {Object} Commission award result
   */
  async awardCommissionForActiveSubscription(pgId, pgAdminUser, subscriptionStartDate = null) {
    try {
      let pg;
      
      // If pgId is actually a user ID (when called from subscription), find PG by admin
      if (pgAdminUser && typeof pgId === 'string' && pgId.toString().length === 24) {
        // Try to find by userId first (in case pgId is actually userId)
        const testPG = await PG.findById(pgId);
        if (testPG) {
          pg = testPG;
        } else {
          // Find PG where this user is the admin
          pg = await PG.findOne({ admin: pgAdminUser._id || pgAdminUser }).populate('addedBy');
        }
      } else {
        // Normal case: pgId is actual PG ID
        pg = await PG.findById(pgId).populate('addedBy');
      }
      
      if (!pg || !pg.addedBy) {
        console.log(`PG not found or no sales person added it for user ${pgAdminUser?._id || pgAdminUser}`);
        return { success: false, message: 'PG not found or no sales person' };
      }

      const salesPersonId = pg.addedBy._id || pg.addedBy;
      const salesPerson = await User.findById(salesPersonId);

      if (!salesPerson || salesPerson.salesRole !== 'sub_sales') {
        console.log(`Sales person ${salesPersonId} not found or not sub_sales`);
        return { success: false, message: 'Sales person not found' };
      }

      // Check if commission already awarded for this PG
      const existingCommission = pg.commissionAwarded || false;
      if (existingCommission) {
        console.log(`Commission already awarded for PG ${pgId}`);
        return { success: false, message: 'Commission already awarded for this PG' };
      }

      // Calculate phased commission rate for sales manager
      // Note: Sub-sales staff still use fixed rate, but sales manager uses phased rate
      let managerCommissionRate = 0;
      if (subscriptionStartDate) {
        const phasedCommission = this.calculatePhasedCommission(subscriptionStartDate);
        managerCommissionRate = phasedCommission.rate;
      } else {
        // Default to phase 1 (first 6 months) if no date provided
        managerCommissionRate = 20;
      }

      // Sub-sales staff uses fixed commission rate
      const subSalesCommissionRate = salesPerson.salesCommissionRate || 10;

      // Award commission to sub-sales staff (fixed rate)
      await User.findByIdAndUpdate(salesPersonId, {
        $inc: {
          'salesPerformanceMetrics.activeSubscriptionPGs': 1,
          'salesPerformanceMetrics.totalCommissionEarned': subSalesCommissionRate
        },
        $set: {
          'salesPerformanceMetrics.lastPGAddedDate': new Date()
        }
      });

      // Award phased commission to parent sales manager
      const parentSalesManagerId = salesPerson.parentSalesPerson;
      if (parentSalesManagerId) {
        const SalesManager = require('../models/salesManager.model');
        const parentManager = await SalesManager.findById(parentSalesManagerId);
        
        if (parentManager) {
          await SalesManager.findByIdAndUpdate(parentSalesManagerId, {
            $inc: {
              'performanceMetrics.activeSubscriptionPGs': 1,
              'performanceMetrics.totalCommissionGenerated': managerCommissionRate
            }
          });
          console.log(`Awarded phased commission ₹${managerCommissionRate} (phase: ${this.calculatePhasedCommission(subscriptionStartDate || new Date()).phase}) to sales manager ${parentSalesManagerId}`);
        }
      }

      // Mark PG as commission awarded and store subscription start date
      await PG.findByIdAndUpdate(pg._id, {
        $set: {
          commissionAwarded: true,
          commissionAwardedDate: new Date(),
          subscriptionStartDate: subscriptionStartDate || new Date()
        }
      });

      console.log(`Awarded commission ₹${subSalesCommissionRate} to sub-sales staff ${salesPersonId} for PG ${pg._id}`);
      
      return {
        success: true,
        message: 'Commission awarded successfully',
        commissionAmount: subSalesCommissionRate,
        managerCommissionAmount: managerCommissionRate,
        salesPersonId: salesPersonId,
        parentManagerId: parentSalesManagerId,
        commissionPhase: this.calculatePhasedCommission(subscriptionStartDate || new Date()).phase
      };
    } catch (error) {
      console.error('Error awarding commission for active subscription:', error);
      return {
        success: false,
        message: 'Failed to award commission',
        error: error.message
      };
    }
  }

  /**
   * Recalculate commissions based on active subscriptions only
   * This resets and recalculates all commissions based on current subscription status
   * @returns {Object} Recalculation result
   */
  async recalculateCommissionsBasedOnActiveSubscriptions() {
    try {
      console.log('Starting commission recalculation based on active subscriptions...');

      // Get all PGs added by sales staff
      const salesPGs = await PG.find({ addedBy: { $exists: true, $ne: null } })
        .populate('addedBy', 'salesRole parentSalesPerson salesCommissionRate')
        .populate('admin', 'subscription');

      let recalculatedCount = 0;
      const SalesManager = require('../models/salesManager.model');
      const UserSubscription = require('../models/userSubscription.model');

      // Reset all commission metrics first
      await User.updateMany(
        { salesRole: 'sub_sales' },
        {
          $set: {
            'salesPerformanceMetrics.activeSubscriptionPGs': 0,
            'salesPerformanceMetrics.totalCommissionEarned': 0
          }
        }
      );

      await SalesManager.updateMany(
        {},
        {
          $set: {
            'performanceMetrics.activeSubscriptionPGs': 0,
            'performanceMetrics.totalCommissionGenerated': 0
          }
        }
      );

      // Process each PG
      for (const pg of salesPGs) {
        if (!pg.addedBy || !pg.admin) continue;

        const salesPerson = await User.findById(pg.addedBy._id || pg.addedBy);
        if (!salesPerson || salesPerson.salesRole !== 'sub_sales') continue;

        // Check if PG's admin has active subscription
        const adminUser = await User.findById(pg.admin._id || pg.admin);
        if (!adminUser) continue;

        // Check active subscription
        const activeSubscription = await UserSubscription.findOne({
          userId: adminUser._id,
          status: { $in: ['active', 'trial'] },
          endDate: { $gt: new Date() }
        });

        if (!activeSubscription) {
          // No active subscription - mark PG as no commission
          await PG.findByIdAndUpdate(pg._id, {
            $set: {
              commissionAwarded: false,
              commissionAwardedDate: null
            }
          });
          continue;
        }

        // Award commission for this PG
        const subSalesCommissionRate = salesPerson.salesCommissionRate || 10;

        // Update sub-sales staff
        await User.findByIdAndUpdate(salesPerson._id, {
          $inc: {
            'salesPerformanceMetrics.activeSubscriptionPGs': 1,
            'salesPerformanceMetrics.totalCommissionEarned': subSalesCommissionRate
          }
        });

        // Update parent sales manager
        const parentSalesManagerId = salesPerson.parentSalesPerson;
        if (parentSalesManagerId) {
          const parentManager = await SalesManager.findById(parentSalesManagerId);
          if (parentManager) {
            const managerCommissionRate = parentManager.commissionRate || 10;
            await SalesManager.findByIdAndUpdate(parentSalesManagerId, {
              $inc: {
                'performanceMetrics.activeSubscriptionPGs': 1,
                'performanceMetrics.totalCommissionGenerated': managerCommissionRate
              }
            });
          }
        }

        // Mark PG as commission awarded
        await PG.findByIdAndUpdate(pg._id, {
          $set: {
            commissionAwarded: true,
            commissionAwardedDate: new Date()
          }
        });

        recalculatedCount++;
      }

      console.log(`Recalculation completed. ${recalculatedCount} PGs with active subscriptions processed.`);

      return {
        success: true,
        message: 'Commissions recalculated successfully',
        processedPGs: recalculatedCount,
        totalPGsChecked: salesPGs.length
      };
    } catch (error) {
      console.error('Error recalculating commissions:', error);
      return {
        success: false,
        message: 'Failed to recalculate commissions',
        error: error.message
      };
    }
  }

  /**
   * Get commission statistics with active subscription breakdown
   * @param {Object} user - The authenticated user
   * @returns {Object} Commission statistics with active subscription breakdown
   */
  async getCommissionStatistics(user) {
    try {
      let stats = {};

      if (user.role === 'sales_manager') {
        const SalesManager = require('../models/salesManager.model');
        const salesManager = await SalesManager.findById(user._id);
        
        if (!salesManager) {
          throw new Error('Sales manager not found');
        }

        // Get sub-sales staff
        const subSalesStaff = await User.find({
          parentSalesPerson: user._id,
          salesRole: 'sub_sales'
        });

        const subSalesIds = subSalesStaff.map(staff => staff._id);

        // Get all PGs added by team
        const allTeamPGs = await PG.find({
          addedBy: { $in: subSalesIds }
        });

        // Count PGs with active subscriptions
        const UserSubscription = require('../models/userSubscription.model');
        let activeSubscriptionPGs = 0;
        let totalCommissionForActive = 0;

        for (const pg of allTeamPGs) {
          if (pg.admin) {
            const adminUser = await User.findById(pg.admin);
            if (adminUser) {
              const activeSubscription = await UserSubscription.findOne({
                userId: adminUser._id,
                status: { $in: ['active', 'trial'] },
                endDate: { $gt: new Date() }
              });

              if (activeSubscription) {
                activeSubscriptionPGs++;
              }
            }
          }
        }

        totalCommissionForActive = activeSubscriptionPGs * (salesManager.commissionRate || 10);

        stats = {
          totalPGsAdded: allTeamPGs.length,
          activeSubscriptionPGs: activeSubscriptionPGs,
          inactiveSubscriptionPGs: allTeamPGs.length - activeSubscriptionPGs,
          totalCommission: salesManager.performanceMetrics?.totalCommissionGenerated || 0,
          activeSubscriptionCommission: totalCommissionForActive,
          commissionRate: salesManager.commissionRate || 10
        };
      } else if (user.salesRole === 'sub_sales') {
        // Get all PGs added by this sub-sales staff
        const allPGs = await PG.find({ addedBy: user._id });

        // Count PGs with active subscriptions
        const UserSubscription = require('../models/userSubscription.model');
        let activeSubscriptionPGs = 0;

        for (const pg of allPGs) {
          if (pg.admin) {
            const adminUser = await User.findById(pg.admin);
            if (adminUser) {
              const activeSubscription = await UserSubscription.findOne({
                userId: adminUser._id,
                status: { $in: ['active', 'trial'] },
                endDate: { $gt: new Date() }
              });

              if (activeSubscription) {
                activeSubscriptionPGs++;
              }
            }
          }
        }

        const activeCommission = activeSubscriptionPGs * (user.salesCommissionRate || 10);

        stats = {
          totalPGsAdded: allPGs.length,
          activeSubscriptionPGs: activeSubscriptionPGs,
          inactiveSubscriptionPGs: allPGs.length - activeSubscriptionPGs,
          totalCommission: user.salesPerformanceMetrics?.totalCommissionEarned || 0,
          activeSubscriptionCommission: activeCommission,
          commissionRate: user.salesCommissionRate || 10
        };
      }

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error getting commission statistics:', error);
      return {
        success: false,
        message: 'Failed to get commission statistics',
        error: error.message
      };
    }
  }

  /**
   * Get detailed commission management data for superadmin
   * Includes all sales managers with their phased commissions, PGs, and progress
   * @returns {Object} Commission management data
   */
  async getCommissionManagementForSuperadmin(filters = {}) {
    try {
      const SalesManager = require('../models/salesManager.model');
      const SalesHierarchy = require('../models/salesHierarchy.model');
      const PG = require('../models/pg.model');
      const User = require('../models/user.model');

      const { startDate, endDate, salesManagerId } = filters;
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Build query for sales managers
      let salesManagerQuery = {};
      if (salesManagerId) {
        salesManagerQuery._id = salesManagerId;
      }

      // Get all sales managers
      const salesManagers = await SalesManager.find(salesManagerQuery)
        .select('firstName lastName email salesUniqueId commissionRate createdAt performanceMetrics')
        .sort({ createdAt: -1 });

      // Process each sales manager
      const managersData = await Promise.all(
        salesManagers.map(async (manager) => {
          // Get sub-sales staff under this manager
          const hierarchy = await SalesHierarchy.find({
            salesPerson: manager._id,
            status: 'active'
          }).populate('subSalesPerson', 'firstName lastName email salesUniqueId salesPerformanceMetrics');

          const subSalesIds = hierarchy.map(h => h.subSalesPerson?._id).filter(Boolean);

          // Get PGs added by manager and their team
          const pgQuery = {
            $or: [
              { addedBy: manager._id },
              { addedBy: { $in: subSalesIds } }
            ]
          };

          if (startDate || endDate) {
            pgQuery.createdAt = {};
            if (startDate) pgQuery.createdAt.$gte = new Date(startDate);
            if (endDate) pgQuery.createdAt.$lte = new Date(endDate);
          }

          // Calculate phased commission with breakdown
          const phasedCommission = await this.calculatePhasedCommissionForPGs(
            pgQuery,
            true // Include breakdown
          );

          // Get PGs with details
          const pgs = await PG.find(pgQuery)
            .populate('admin', 'firstName lastName email')
            .populate('addedBy', 'firstName lastName salesUniqueId')
            .select('name admin addedBy createdAt commissionAwarded subscriptionStartDate')
            .sort({ createdAt: -1 });

          // Get detailed PG commission information
          const pgsWithCommission = await Promise.all(
            pgs.map(async (pg) => {
              const commissionDetails = await this.getPGCommissionDetails(pg);
              return {
                _id: pg._id,
                name: pg.name,
                admin: pg.admin ? {
                  _id: pg.admin._id,
                  name: `${pg.admin.firstName} ${pg.admin.lastName}`,
                  email: pg.admin.email
                } : null,
                addedBy: pg.addedBy ? {
                  _id: pg.addedBy._id,
                  name: `${pg.addedBy.firstName} ${pg.addedBy.lastName}`,
                  uniqueId: pg.addedBy.salesUniqueId
                } : null,
                createdAt: pg.createdAt,
                commissionAwarded: pg.commissionAwarded,
                subscriptionStartDate: pg.subscriptionStartDate,
                commission: {
                  rate: commissionDetails.rate,
                  phase: commissionDetails.phase,
                  monthsSubscribed: commissionDetails.monthsSubscribed,
                  yearsSubscribed: commissionDetails.yearsSubscribed,
                  hasActiveSubscription: commissionDetails.hasActiveSubscription
                }
              };
            })
          );

          // Calculate totals
          const totalPGs = pgs.length;
          const activePGs = phasedCommission.activeSubscriptionPGs;
          const totalCommission = phasedCommission.totalCommission;

          // Calculate team performance
          const teamPerformance = {
            totalSubSalesStaff: hierarchy.length,
            activeSubSalesStaff: hierarchy.filter(h => 
              h.subSalesPerson?.salesPerformanceMetrics?.totalPGsAdded > 0
            ).length
          };

          // Get monthly recurring commission trends for last 12 months
          const monthlyTrends = [];
          const allPGsForManager = await PG.find(pgQuery).select('admin _id name createdAt subscriptionStartDate');
          
          for (let i = 11; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            // Count PGs added in this month (for revenue tracking)
            const monthPGs = await PG.countDocuments({
              ...pgQuery,
              createdAt: { $gte: monthDate, $lt: nextMonth }
            });

            // Calculate recurring commission for this month (for all PGs active in this month)
            const monthPhasedCommission = await this.calculatePhasedCommissionForPGs(
              pgQuery, // All PGs for this manager
              true, // Include breakdown
              monthDate // Calculate for this specific month
            );

            monthlyTrends.push({
              month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
              totalPGs: monthPGs, // New PGs added this month
              activePGs: monthPhasedCommission.activeSubscriptionPGs, // Active PGs generating commission
              commission: monthPhasedCommission.monthlyCommission, // Recurring monthly commission
              monthlyCommission: monthPhasedCommission.monthlyCommission,
              breakdown: monthPhasedCommission.breakdown
            });
          }

          // Calculate upcoming 6 months of recurring commissions
          const upcomingMonths = [];
          for (let i = 1; i <= 6; i++) {
            const futureMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const futureCommission = await this.calculatePhasedCommissionForPGs(
              pgQuery,
              true,
              futureMonth
            );
            
            upcomingMonths.push({
              month: futureMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
              projectedActivePGs: futureCommission.activeSubscriptionPGs,
              projectedCommission: futureCommission.monthlyCommission,
              breakdown: futureCommission.breakdown
            });
          }

          // Calculate current month recurring commission
          const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
          const currentMonthCommission = await this.calculatePhasedCommissionForPGs(
            pgQuery,
            true,
            currentMonthDate
          );

          // Calculate last month recurring commission
          const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthCommission = await this.calculatePhasedCommissionForPGs(
            pgQuery,
            true,
            lastMonthDate
          );

          return {
            manager: {
              _id: manager._id,
              name: `${manager.firstName} ${manager.lastName}`,
              email: manager.email,
              salesUniqueId: manager.salesUniqueId,
              commissionRate: manager.commissionRate,
              createdAt: manager.createdAt
            },
            team: {
              totalSubSalesStaff: teamPerformance.totalSubSalesStaff,
              activeSubSalesStaff: teamPerformance.activeSubSalesStaff,
              subSalesStaff: hierarchy.map(h => ({
                _id: h.subSalesPerson._id,
                name: `${h.subSalesPerson.firstName} ${h.subSalesPerson.lastName}`,
                email: h.subSalesPerson.email,
                uniqueId: h.subSalesPerson.salesUniqueId,
                pgsAdded: h.subSalesPerson.salesPerformanceMetrics?.totalPGsAdded || 0,
                activePGs: h.subSalesPerson.salesPerformanceMetrics?.activeSubscriptionPGs || 0,
                commissionEarned: h.subSalesPerson.salesPerformanceMetrics?.totalCommissionEarned || 0
              }))
            },
            performance: {
              totalPGs: totalPGs,
              activePGs: activePGs,
              currentMonthCommission: currentMonthCommission.monthlyCommission, // Recurring commission this month
              lastMonthCommission: lastMonthCommission.monthlyCommission, // Recurring commission last month
              totalCommission: totalCommission, // Legacy: total historical commission
              commissionBreakdown: phasedCommission.breakdown,
              revenueGenerated: totalPGs // All PGs added
            },
            pgs: pgsWithCommission,
            monthlyTrends: monthlyTrends,
            upcomingMonths: upcomingMonths // Next 6 months projected recurring commissions
          };
        })
      );

      // Calculate overall summary with recurring commissions
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      // Calculate overall current month recurring commission
      const allPGsQuery = {
        $or: managersData.flatMap(data => {
          const managerIds = data.team.subSalesStaff.map(s => s._id);
          return [
            { addedBy: data.manager._id },
            { addedBy: { $in: managerIds } }
          ];
        })
      };
      
      const overallCurrentMonthCommission = await this.calculatePhasedCommissionForPGs(
        allPGsQuery,
        true,
        currentMonth
      );
      
      const overallLastMonthCommission = await this.calculatePhasedCommissionForPGs(
        allPGsQuery,
        true,
        lastMonth
      );

      const overallSummary = {
        totalSalesManagers: salesManagers.length,
        totalSubSalesStaff: 0,
        totalPGs: 0,
        activePGs: 0,
        currentMonthRecurringCommission: overallCurrentMonthCommission.monthlyCommission,
        lastMonthRecurringCommission: overallLastMonthCommission.monthlyCommission,
        totalCommission: 0, // Legacy: total historical commission
        overallBreakdown: overallCurrentMonthCommission.breakdown || {
          phase1_0_6months: { count: 0, commission: 0 },
          phase2_6_12months: { count: 0, commission: 0 },
          phase3_1_3years: { count: 0, commission: 0 },
          phase4_closed: { count: 0, commission: 0 },
          inactive: { count: 0, commission: 0 }
        }
      };

      managersData.forEach((data) => {
        overallSummary.totalSubSalesStaff += data.team.totalSubSalesStaff;
        overallSummary.totalPGs += data.performance.totalPGs;
        overallSummary.activePGs += data.performance.activePGs;
        overallSummary.totalCommission += data.performance.totalCommission || 0;
      });

      return {
        success: true,
        summary: overallSummary,
        managers: managersData,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting commission management data:', error);
      return {
        success: false,
        message: 'Failed to get commission management data',
        error: error.message
      };
    }
  }
}

module.exports = new SalesService();
