const Activity = require('../models/activity.model');

class ActivityService {
  async recordActivity(activityData) {
    try {
      console.log('🔍 ActivityService.recordActivity - Input data:', activityData);
      
      const activity = new Activity({
        ...activityData,
        timestamp: new Date()
      });
      
      console.log('🔍 ActivityService.recordActivity - Activity object:', {
        type: activity.type,
        title: activity.title,
        userId: activity.userId,
        userEmail: activity.userEmail,
        userRole: activity.userRole,
        branchId: activity.branchId,
        timestamp: activity.timestamp
      });
      
      const savedActivity = await activity.save();
      console.log('✅ ActivityService.recordActivity - Activity saved successfully:', savedActivity._id);
      
      return savedActivity;
    } catch (error) {
      console.error('❌ ActivityService.recordActivity - Error saving activity:', error);
      throw error;
    }
  }

  async getRecentActivities(filters = {}) {
    const {
      limit = 10,
      page = 1,
      userId,
      branchId,
      type,
      category,
      priority,
      startDate,
      endDate,
      userRole,
      status,
      q,
      sort = '-timestamp'
    } = filters;

    const query = {};
    if (userId) query.userId = userId;
    if (branchId) query.branchId = branchId;
    if (type) query.type = type;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (userRole) query.userRole = userRole;
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Text search across common fields
    if (q && String(q).trim().length > 0) {
      const regex = new RegExp(String(q).trim(), 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { entityName: regex },
        { userEmail: regex },
        { type: regex },
        { category: regex }
      ];
    }

    const numericLimit = Math.min(parseInt(limit) || 10, 100);
    const numericPage = parseInt(page) || 1;

    console.log('🔍 ActivityService.getRecentActivities - Query:', query);
    console.log('🔍 ActivityService.getRecentActivities - Sort:', sort);
    console.log('🔍 ActivityService.getRecentActivities - Limit:', numericLimit, 'Page:', numericPage);

    const activities = await Activity.find(query)
      .sort(sort)
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit)
      .lean();

    const total = await Activity.countDocuments(query);

    console.log('🔍 ActivityService.getRecentActivities - Database Result:', {
      activitiesFound: activities.length,
      totalInDB: total,
      firstActivity: activities[0] ? {
        id: activities[0]._id,
        title: activities[0].title,
        userEmail: activities[0].userEmail,
        userRole: activities[0].userRole,
        branchId: activities[0].branchId,
        timestamp: activities[0].timestamp
      } : null
    });

    return {
      activities,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    };
  }

  async getStats(timeRange = '24h') {
    const since = new Date();
    if (timeRange === '7d') since.setDate(since.getDate() - 7);
    else if (timeRange === '30d') since.setDate(since.getDate() - 30);
    else since.setHours(since.getHours() - 24);

    const pipeline = [
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: { type: '$type', category: '$category', status: '$status' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ];

    const data = await Activity.aggregate(pipeline);
    return data;
  }

  async getUserActivities(userId, options = {}) {
    const { limit = 20, page = 1 } = options;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      Activity.find({ userId })
        .populate('branchId', 'name')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments({ userId })
    ]);

    return {
      activities,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async getBranchActivities(branchId, options = {}) {
    const { limit = 20, page = 1 } = options;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      Activity.find({ branchId })
        .populate('userId', 'firstName lastName email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments({ branchId })
    ]);

    return {
      activities,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async getEntityTimeline(entityType, entityId) {
    return Activity.find({ entityType, entityId })
      .populate('userId', 'firstName lastName email role')
      .populate('branchId', 'name')
      .sort({ timestamp: 1 });
  }

  async cleanOldActivities(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const result = await Activity.deleteMany({ timestamp: { $lt: cutoffDate } });
    return { deletedCount: result.deletedCount, cutoffDate };
  }

  // Role-specific activity methods
  async getAdminActivities(filters = {}, currentUser = null) {
    console.log('🔍 ActivityService.getAdminActivities - Input:', {
      filters,
      currentUser: currentUser ? {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        branchId: currentUser.branchId
      } : null
    });

    const adminFilters = {
      ...filters
    };
    
    // Get branchId for admin user
    let branchId = currentUser?.branchId;
    
    // If admin user doesn't have branchId, try to get default branch from their PG
    if (!branchId && currentUser?.role === 'admin') {
      try {
        const User = require('../models/user.model');
        const Branch = require('../models/branch.model');
        
        const user = await User.findById(currentUser.id);
        if (user?.pgId) {
          const defaultBranch = await Branch.findOne({ pgId: user.pgId, isDefault: true });
          if (defaultBranch) {
            branchId = defaultBranch._id;
            console.log('🔍 Found default branch for admin:', { branchId, branchName: defaultBranch.name });
          }
        }
      } catch (error) {
        console.error('❌ Error getting default branch for admin:', error);
      }
    }
    
    // Apply filters
    if (branchId) {
      // First try: activities from admin's branch
      adminFilters.branchId = branchId;
      console.log('🔍 Using branchId filter:', branchId);
    } else if (currentUser?.id) {
      // Second try: activities by admin user ID
      adminFilters.userId = currentUser.id;
      console.log('🔍 Using userId filter:', currentUser.id);
    } else {
      // Third try: show all activities for debugging
      console.log('⚠️ No branchId or userId found for admin, showing all activities');
    }
    
    console.log('🔍 ActivityService.getAdminActivities - Final Filters:', adminFilters);
    
    const result = await this.getRecentActivities(adminFilters);
    
    console.log('🔍 ActivityService.getAdminActivities - Result:', {
      activitiesCount: result.activities?.length || 0,
      pagination: result.pagination
    });
    
    // If no activities found with filters, try without any filters for debugging
    if (result.activities.length === 0) {
      console.log('🔍 No activities found with filters, trying without filters...');
      const allActivities = await this.getRecentActivities({});
      console.log('🔍 All activities in database:', {
        total: allActivities.pagination.total,
        firstFew: allActivities.activities.slice(0, 3).map(a => ({
          title: a.title,
          userEmail: a.userEmail,
          userRole: a.userRole,
          branchId: a.branchId
        }))
      });
    }
    
    return result;
  }

  async getSuperadminActivities(filters = {}, currentUser = null) {
    const superadminFilters = {
      ...filters,
      // Superadmin can see all activities (superadmin + support + admin)
      userRole: { $in: ['superadmin', 'support', 'admin'] }
    };
    return this.getRecentActivities(superadminFilters);
  }

  async getSupportActivities(filters = {}, currentUser = null) {
    const supportFilters = {
      ...filters,
      // Support can only see support-related activities
      userRole: 'support'
    };
    return this.getRecentActivities(supportFilters);
  }

  async getRoleSpecificStats(userRole, timeRange = '24h', currentUser = null) {
    const since = new Date();
    if (timeRange === '7d') since.setDate(since.getDate() - 7);
    else if (timeRange === '30d') since.setDate(since.getDate() - 30);
    else since.setHours(since.getHours() - 24);

    const matchQuery = { timestamp: { $gte: since } };
    
    // Add role-specific filtering
    if (userRole === 'admin') {
      matchQuery.userRole = 'admin';
      // Admin can only see stats from their branch
      if (currentUser?.branchId) {
        matchQuery.branchId = currentUser.branchId;
      }
    } else if (userRole === 'superadmin') {
      // Superadmin can see all activities (superadmin + support + admin)
      matchQuery.userRole = { $in: ['superadmin', 'support', 'admin'] };
    } else if (userRole === 'support') {
      matchQuery.userRole = 'support';
    }

    const pipeline = [
      { $match: matchQuery },
      { $group: { _id: { type: '$type', category: '$category', status: '$status' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ];

    const data = await Activity.aggregate(pipeline);
    return data;
  }

  async getRoleSpecificUserActivities(userId, userRole, options = {}, currentUser = null) {
    const { limit = 20, page = 1 } = options;
    const skip = (page - 1) * limit;

    const query = { userId };
    
    // Add role-specific filtering for related activities
    if (userRole === 'admin') {
      // Admin can only see admin activities from their branch
      query.userRole = 'admin';
      if (currentUser?.branchId) {
        query.branchId = currentUser.branchId;
      }
    } else if (userRole === 'superadmin') {
      // Superadmin can see all activities (superadmin + support + admin)
      query.userRole = { $in: ['superadmin', 'support', 'admin'] };
    } else if (userRole === 'support') {
      // Support can only see support activities
      query.userRole = 'support';
    }

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .populate('branchId', 'name')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments(query)
    ]);

    return {
      activities,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async getRoleSpecificBranchActivities(branchId, userRole, options = {}, currentUser = null) {
    const { limit = 20, page = 1 } = options;
    const skip = (page - 1) * limit;

    const query = { branchId };
    
    // Add role-specific filtering
    if (userRole === 'admin') {
      // Admin can only see admin activities from their branch
      query.userRole = 'admin';
      // Ensure admin can only access their own branch
      if (currentUser?.branchId && currentUser.branchId !== branchId) {
        throw new Error('Access denied: Admin can only access activities from their assigned branch');
      }
    } else if (userRole === 'superadmin') {
      // Superadmin can see all activities (superadmin + support + admin) from any branch
      query.userRole = { $in: ['superadmin', 'support', 'admin'] };
    } else if (userRole === 'support') {
      // Support can only see support activities from any branch
      query.userRole = 'support';
    }

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .populate('userId', 'firstName lastName email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments(query)
    ]);

    return {
      activities,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }
}

module.exports = new ActivityService(); 