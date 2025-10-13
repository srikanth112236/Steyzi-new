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

      if (user.role === 'sales_manager') {
        // Get sub-sales staff under this manager
        const hierarchy = await SalesHierarchy.find({
          salesPerson: user._id,
          status: 'active'
        }).populate('subSalesPerson');

        const subSalesIds = hierarchy.map(h => h.subSalesPerson?._id).filter(Boolean);

        // PGs added by team this month
        const teamPGsThisMonth = await PG.countDocuments({
          addedBy: { $in: [user._id, ...subSalesIds] },
          createdAt: { $gte: monthStart }
        });

        // PGs added by team last month
        const teamPGsLastMonth = await PG.countDocuments({
          addedBy: { $in: [user._id, ...subSalesIds] },
          createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
        });

        // PGs added by team this year
        const teamPGsThisYear = await PG.countDocuments({
          addedBy: { $in: [user._id, ...subSalesIds] },
          createdAt: { $gte: yearStart }
        });

        // Monthly trend data
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(currentYear, currentMonth - i, 1);
          const nextMonth = new Date(currentYear, currentMonth - i + 1, 1);

          const pgCount = await PG.countDocuments({
            addedBy: { $in: [user._id, ...subSalesIds] },
            createdAt: { $gte: monthDate, $lt: nextMonth }
          });

          monthlyData.push({
            month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            pgs: pgCount,
            commission: pgCount * (user.commissionRate || 10) // Based on manager's commission rate
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

            const staffPGsThisYear = await PG.countDocuments({
              addedBy: staff._id,
              createdAt: { $gte: yearStart }
            });

            return {
              name: `${staff.firstName} ${staff.lastName}`,
              pgsThisMonth: staffPGsThisMonth,
              pgsThisYear: staffPGsThisYear,
              commission: staffPGsThisYear * (user.commissionRate || 10), // Use manager's commission rate
              uniqueId: staff.salesUniqueId
            };
          })
        );

        performanceData = {
          summary: {
            teamSize: subSalesIds.length,
            pgsThisMonth: teamPGsThisMonth,
            pgsLastMonth: teamPGsLastMonth,
            pgsThisYear: teamPGsThisYear,
            growthRate: teamPGsLastMonth > 0 ? ((teamPGsThisMonth - teamPGsLastMonth) / teamPGsLastMonth * 100).toFixed(1) : 0,
            totalCommission: teamPGsThisYear * 100
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

        // Monthly trend data
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(currentYear, currentMonth - i, 1);
          const nextMonth = new Date(currentYear, currentMonth - i + 1, 1);

          const pgCount = await PG.countDocuments({
            addedBy: user._id,
            createdAt: { $gte: monthDate, $lt: nextMonth }
          });

          monthlyData.push({
            month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            pgs: pgCount,
            commission: pgCount * (user.salesCommissionRate || 10)
          });
        }

        performanceData = {
          summary: {
            pgsThisMonth: pgsThisMonth,
            pgsLastMonth: pgsLastMonth,
            pgsThisYear: pgsThisYear,
            growthRate: pgsLastMonth > 0 ? ((pgsThisMonth - pgsLastMonth) / pgsLastMonth * 100).toFixed(1) : 0,
            totalCommission: pgsThisYear * (user.salesCommissionRate || 10),
            commissionRate: user.salesCommissionRate || 10
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
                  target: monthlyTarget,
                  achievement: Math.min((staffPGsThisMonth / monthlyTarget) * 100, 100),
                  commission: staffPGsThisMonth * (user.commissionRate || 10)
                },
                lastMonth: {
                  pgs: staffPGsLastMonth,
                  target: monthlyTarget,
                  achievement: Math.min((staffPGsLastMonth / monthlyTarget) * 100, 100),
                  commission: staffPGsLastMonth * (user.commissionRate || 10)
                },
                thisQuarter: {
                  pgs: staffPGsThisQuarter,
                  target: quarterlyTarget,
                  achievement: Math.min((staffPGsThisQuarter / quarterlyTarget) * 100, 100),
                  commission: staffPGsThisQuarter * (user.commissionRate || 10)
                },
                thisYear: {
                  pgs: staffPGsThisYear,
                  target: yearlyTarget,
                  achievement: Math.min((staffPGsThisYear / yearlyTarget) * 100, 100),
                  commission: staffPGsThisYear * (user.commissionRate || 10)
                }
              },
              status: staffPGsThisMonth >= monthlyTarget ? 'on-target' : 'below-target',
              createdAt: staff.createdAt
            };
          })
        );

        // Monthly Trends (Last 12 months)
        const monthlyTrends = [];
        for (let i = 11; i >= 0; i--) {
          const monthDate = new Date(currentYear, currentMonth - i, 1);
          const nextMonth = new Date(currentYear, currentMonth - i + 1, 1);

          const monthPGs = await PG.countDocuments({
            addedBy: { $in: [user._id, ...subSalesIds] },
            createdAt: { $gte: monthDate, $lt: nextMonth }
          });

          monthlyTrends.push({
            month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            teamPGs: monthPGs,
            commission: monthPGs * (user.commissionRate || 10),
            target: 80 // Manager's monthly target
          });
        }

        // Top Performers
        const topPerformers = staffReports
          .filter(Boolean)
          .sort((a, b) => b.performance.thisMonth.pgs - a.performance.thisMonth.pgs)
          .slice(0, 5);

        reportsData = {
          summary: {
            teamSize: subSalesIds.length,
            totalPGsThisMonth: teamPGsThisMonth,
            totalPGsThisQuarter: teamPGsThisQuarter,
            totalPGsThisYear: teamPGsThisYear,
            monthlyGrowth: teamPGsLastMonth > 0 ? ((teamPGsThisMonth - teamPGsLastMonth) / teamPGsLastMonth * 100).toFixed(1) : 0,
            totalCommission: teamPGsThisYear * (user.commissionRate || 10),
            commissionRate: user.commissionRate || 10,
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

        // Monthly Trends (Last 12 months)
        const monthlyTrends = [];
        for (let i = 11; i >= 0; i--) {
          const monthDate = new Date(currentYear, currentMonth - i, 1);
          const nextMonth = new Date(currentYear, currentMonth - i + 1, 1);

          const monthPGs = await PG.countDocuments({
            addedBy: user._id,
            createdAt: { $gte: monthDate, $lt: nextMonth }
          });

          monthlyTrends.push({
            month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            pgs: monthPGs,
            commission: monthPGs * (user.salesCommissionRate || 10),
            target: 30 // Sub-sales monthly target
          });
        }

        reportsData = {
          summary: {
            pgsThisMonth: pgsThisMonth,
            pgsThisQuarter: pgsThisQuarter,
            pgsThisYear: pgsThisYear,
            monthlyGrowth: pgsLastMonth > 0 ? ((pgsThisMonth - pgsLastMonth) / pgsLastMonth * 100).toFixed(1) : 0,
            totalCommission: pgsThisYear * (user.salesCommissionRate || 10),
            commissionRate: user.salesCommissionRate || 10,
            monthlyTarget: 30,
            yearlyTarget: 360
          },
          monthlyTrends: monthlyTrends,
          performance: {
            thisMonth: {
              pgs: pgsThisMonth,
              target: 30,
              achievement: Math.min((pgsThisMonth / 30) * 100, 100),
              commission: pgsThisMonth * (user.salesCommissionRate || 10)
            },
            thisQuarter: {
              pgs: pgsThisQuarter,
              target: 90,
              achievement: Math.min((pgsThisQuarter / 90) * 100, 100),
              commission: pgsThisQuarter * (user.salesCommissionRate || 10)
            },
            thisYear: {
              pgs: pgsThisYear,
              target: 360,
              achievement: Math.min((pgsThisYear / 360) * 100, 100),
              commission: pgsThisYear * (user.salesCommissionRate || 10)
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

    // Update user's performance metrics
    const currentPGs = user.salesPerformanceMetrics?.totalPGsAdded || 0;
    const commissionRate = user.salesCommissionRate || 10;
    const newCommission = (currentPGs + 1) * commissionRate;

    await User.findByIdAndUpdate(user._id, {
      $set: {
        'salesPerformanceMetrics.totalPGsAdded': currentPGs + 1,
        'salesPerformanceMetrics.totalCommissionEarned': newCommission,
        'salesPerformanceMetrics.lastPGAddedDate': new Date()
      }
    });

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

        // Get all PGs created by manager and their sub-sales
        const totalPGs = await PG.countDocuments({
          $or: [
            { addedBy: user._id }, // Manager's PGs
            { addedBy: { $in: subSalesIds } } // Sub-sales PGs
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

        // Calculate total commission based on sales manager's commission rate
        const totalCommissionEarned = totalPGs * (user.commissionRate || 10);

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
          totalPGsAdded: totalPGs,
          totalCommissionEarned: totalCommissionEarned,
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
          totalPGsAdded: totalPGs,
          totalCommissionEarned: totalCommissionEarned,
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
}

module.exports = new SalesService();
