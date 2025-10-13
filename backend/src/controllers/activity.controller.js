const activityService = require('../services/activity.service');

const getRecentActivities = async (req, res) => {
  try {
    const userRole = req.user?.role;
    
    // Map req.user (Mongoose document) to the format expected by service
    const currentUser = {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.user.branchId,
      pgId: req.user.pgId
    };
    
    // Apply role-based filtering automatically
    let result;
    if (userRole === 'admin') {
      result = await activityService.getAdminActivities({
        limit: parseInt(req.query.limit) || 10,
        page: parseInt(req.query.page) || 1,
        userId: req.query.userId,
        branchId: req.query.branchId,
        type: req.query.type,
        category: req.query.category,
        priority: req.query.priority,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        status: req.query.status,
        q: req.query.q,
        sort: req.query.sort
      }, currentUser);
    } else if (userRole === 'superadmin') {
      result = await activityService.getSuperadminActivities({
        limit: parseInt(req.query.limit) || 10,
        page: parseInt(req.query.page) || 1,
        userId: req.query.userId,
        branchId: req.query.branchId,
        type: req.query.type,
        category: req.query.category,
        priority: req.query.priority,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        status: req.query.status,
        q: req.query.q,
        sort: req.query.sort
      }, currentUser);
    } else if (userRole === 'support') {
      result = await activityService.getSupportActivities({
        limit: parseInt(req.query.limit) || 10,
        page: parseInt(req.query.page) || 1,
        userId: req.query.userId,
        branchId: req.query.branchId,
        type: req.query.type,
        category: req.query.category,
        priority: req.query.priority,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        status: req.query.status,
        q: req.query.q,
        sort: req.query.sort
      }, currentUser);
    } else {
      // For other roles or no role, use general method
      result = await activityService.getRecentActivities({
        limit: parseInt(req.query.limit) || 10,
        page: parseInt(req.query.page) || 1,
        userId: req.query.userId,
        branchId: req.query.branchId,
        type: req.query.type,
        category: req.query.category,
        priority: req.query.priority,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        userRole: req.query.userRole,
        status: req.query.status,
        q: req.query.q,
        sort: req.query.sort
      });
    }

    res.status(200).json({
      success: true,
      message: 'Recent activities fetched successfully',
      data: result.activities,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch recent activities', error: error.message });
  }
};

const getActivityStats = async (req, res) => {
  try {
    const stats = await activityService.getStats(req.query.timeRange || '24h');
    res.status(200).json({ success: true, message: 'Activity statistics fetched successfully', data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch activity statistics', error: error.message });
  }
};

const getUserActivities = async (req, res) => {
  try {
    const result = await activityService.getRecentActivities({
      userId: req.params.userId,
      limit: parseInt(req.query.limit) || 20,
      page: parseInt(req.query.page) || 1,
      type: req.query.type,
      category: req.query.category,
      status: req.query.status,
      q: req.query.q
    });

    res.status(200).json({ success: true, message: 'User activities fetched successfully', data: result.activities, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user activities', error: error.message });
  }
};

const getBranchActivities = async (req, res) => {
  try {
    const result = await activityService.getRecentActivities({
      branchId: req.params.branchId,
      limit: parseInt(req.query.limit) || 20,
      page: parseInt(req.query.page) || 1,
      type: req.query.type,
      category: req.query.category,
      status: req.query.status,
      q: req.query.q
    });

    res.status(200).json({ success: true, message: 'Branch activities fetched successfully', data: result.activities, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch branch activities', error: error.message });
  }
};

const getEntityTimeline = async (req, res) => {
  try {
    const timeline = await activityService.getEntityTimeline(req.params.entityType, req.params.entityId);
    res.status(200).json({ success: true, message: 'Entity timeline fetched successfully', data: timeline });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch entity timeline', error: error.message });
  }
};

const recordActivity = async (req, res) => {
  try {
    const activity = await activityService.recordActivity({
      ...req.body,
      userId: req.user?.id || req.body.userId,
      userEmail: req.user?.email || req.body.userEmail,
      userRole: req.user?.role || req.body.userRole,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({ success: true, message: 'Activity recorded successfully', data: activity });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record activity', error: error.message });
  }
};

const cleanOldActivities = async (req, res) => {
  try {
    const result = await activityService.cleanOldActivities(req.body.daysToKeep || 90);
    res.status(200).json({ success: true, message: 'Old activities cleaned successfully', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to clean activities', error: error.message });
  }
};

// Export activities as CSV
const exportActivities = async (req, res) => {
  try {
    const result = await activityService.getRecentActivities({
      limit: parseInt(req.query.limit) || 1000,
      page: 1,
      userId: req.query.userId,
      branchId: req.query.branchId,
      type: req.query.type,
      category: req.query.category,
      priority: req.query.priority,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userRole: req.query.userRole,
      status: req.query.status,
      q: req.query.q,
      sort: req.query.sort || '-timestamp'
    });

    const rows = result.activities || [];
    const headers = ['timestamp','type','category','status','title','description','userEmail','userRole','branchName','entityType','entityId','entityName'];
    const csv = [headers.join(',')].concat(
      rows.map(r => ([
        new Date(r.timestamp).toISOString(),
        r.type || '',
        r.category || '',
        r.status || '',
        (r.title || '').replace(/,/g,' '),
        (r.description || '').replace(/,/g,' '),
        r.userEmail || '',
        r.userRole || '',
        r.branchName || '',
        r.entityType || '',
        r.entityId || '',
        (r.entityName || '').replace(/,/g,' ')
      ].join(',')))
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="activities.csv"');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export activities', error: error.message });
  }
};

// Role-specific activity endpoints
const getAdminActivities = async (req, res) => {
  try {
    // Map req.user (Mongoose document) to the format expected by service
    const currentUser = {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.user.branchId,
      pgId: req.user.pgId
    };
    
    console.log('🔍 getAdminActivities - Current User:', {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      branchId: currentUser.branchId,
      pgId: currentUser.pgId
    });
    
    console.log('🔍 getAdminActivities - Query Params:', req.query);
    
    const result = await activityService.getAdminActivities({
      limit: parseInt(req.query.limit) || 10,
      page: parseInt(req.query.page) || 1,
      branchId: req.query.branchId,
      type: req.query.type,
      category: req.query.category,
      priority: req.query.priority,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status,
      q: req.query.q,
      sort: req.query.sort
    }, currentUser); // Pass mapped user object

    console.log('🔍 getAdminActivities - Result:', {
      activitiesCount: result.activities?.length || 0,
      pagination: result.pagination
    });

    res.status(200).json({
      success: true,
      message: 'Admin activities fetched successfully',
      data: result.activities,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('❌ getAdminActivities Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin activities', error: error.message });
  }
};

const getSuperadminActivities = async (req, res) => {
  try {
    // Map req.user (Mongoose document) to the format expected by service
    const currentUser = {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.user.branchId,
      pgId: req.user.pgId
    };
    
    const result = await activityService.getSuperadminActivities({
      limit: parseInt(req.query.limit) || 10,
      page: parseInt(req.query.page) || 1,
      branchId: req.query.branchId,
      type: req.query.type,
      category: req.query.category,
      priority: req.query.priority,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status,
      q: req.query.q,
      sort: req.query.sort
    }, currentUser); // Pass mapped user object

    res.status(200).json({
      success: true,
      message: 'Superadmin activities fetched successfully',
      data: result.activities,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch superadmin activities', error: error.message });
  }
};

const getSupportActivities = async (req, res) => {
  try {
    // Map req.user (Mongoose document) to the format expected by service
    const currentUser = {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      branchId: req.user.branchId,
      pgId: req.user.pgId
    };
    
    const result = await activityService.getSupportActivities({
      limit: parseInt(req.query.limit) || 10,
      page: parseInt(req.query.page) || 1,
      branchId: req.query.branchId,
      type: req.query.type,
      category: req.query.category,
      priority: req.query.priority,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status,
      q: req.query.q,
      sort: req.query.sort
    }, currentUser); // Pass mapped user object

    res.status(200).json({
      success: true,
      message: 'Support activities fetched successfully',
      data: result.activities,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch support activities', error: error.message });
  }
};

const getRoleSpecificStats = async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(400).json({ success: false, message: 'User role not found' });
    }

    const stats = await activityService.getRoleSpecificStats(userRole, req.query.timeRange || '24h', req.user);
    res.status(200).json({ 
      success: true, 
      message: 'Role-specific activity statistics fetched successfully', 
      data: stats 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch role-specific statistics', error: error.message });
  }
};

const getRoleSpecificUserActivities = async (req, res) => {
  try {
    const userId = req.params.userId;
    const userRole = req.user?.role;
    
    if (!userRole) {
      return res.status(400).json({ success: false, message: 'User role not found' });
    }

    const result = await activityService.getRoleSpecificUserActivities(userId, userRole, {
      limit: parseInt(req.query.limit) || 20,
      page: parseInt(req.query.page) || 1,
      type: req.query.type,
      category: req.query.category,
      status: req.query.status,
      q: req.query.q
    }, req.user);

    res.status(200).json({ 
      success: true, 
      message: 'Role-specific user activities fetched successfully', 
      data: result.activities, 
      pagination: result.pagination 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch role-specific user activities', error: error.message });
  }
};

const getRoleSpecificBranchActivities = async (req, res) => {
  try {
    const branchId = req.params.branchId;
    const userRole = req.user?.role;
    
    if (!userRole) {
      return res.status(400).json({ success: false, message: 'User role not found' });
    }

    const result = await activityService.getRoleSpecificBranchActivities(branchId, userRole, {
      limit: parseInt(req.query.limit) || 20,
      page: parseInt(req.query.page) || 1,
      type: req.query.type,
      category: req.query.category,
      status: req.query.status,
      q: req.query.q
    }, req.user);

    res.status(200).json({ 
      success: true, 
      message: 'Role-specific branch activities fetched successfully', 
      data: result.activities, 
      pagination: result.pagination 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch role-specific branch activities', error: error.message });
  }
};

module.exports = {
  getRecentActivities,
  getActivityStats,
  getUserActivities,
  getBranchActivities,
  getEntityTimeline,
  recordActivity,
  cleanOldActivities,
  exportActivities,
  getAdminActivities,
  getSuperadminActivities,
  getSupportActivities,
  getRoleSpecificStats,
  getRoleSpecificUserActivities,
  getRoleSpecificBranchActivities
}; 