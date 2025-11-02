const activityService = require('../services/activity.service');

const ADMIN_ROLES = ['admin', 'superadmin'];
const PG_ADMIN_ROLES = ['admin']; // PG-specific admin roles

/**
 * Enhanced Admin Activity Tracking Middleware
 * Tracks all activities performed by admin/PG admin users across all modules
 */
const trackAdminActivity = (options = {}) => {
  return async (req, res, next) => {
    const user = req.user;

    // Only track admin activities
    if (!user || !ADMIN_ROLES.includes(user.role)) {
      return next();
    }

    // Store the original send/json methods
    const originalSend = res.send;
    const originalJson = res.json;

    try {
      // Override send
      res.send = function (data) {
        recordAdminActivity(req, res, data, options);
        return originalSend.apply(res, arguments);
      };

      // Override json
      res.json = function (data) {
        recordAdminActivity(req, res, data, options);
        return originalJson.apply(res, arguments);
      };

      next();
    } catch (error) {
      console.error('Error in admin activity tracking middleware:', error);
      next();
    }
  };
};

/**
 * Record comprehensive admin activity
 */
const recordAdminActivity = async (req, res, data, options = {}) => {
  try {
    // Only track activities for successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const user = req.user;
      if (!user) return;

      const activityData = buildAdminActivityData(req, res, data, options);
      if (activityData) {
        await activityService.recordActivity(activityData);
        console.log(`📊 Admin Activity Tracked: ${activityData.title} by ${user.email}`);
      }
    }
  } catch (error) {
    console.error('Error recording admin activity:', error);
  }
};

/**
 * Build comprehensive activity data for admin actions
 */
const buildAdminActivityData = (req, res, data, options = {}) => {
  const user = req.user;
  const method = req.method;
  const path = req.path;

  // Determine activity type and details
  const activityInfo = getAdminActivityInfo(req, data, options);

  // Skip certain paths that don't need tracking
  if (shouldSkipActivity(path, method)) {
    return null;
  }

  // Build activity data
  const activityData = {
    type: activityInfo.type,
    title: activityInfo.title,
    description: activityInfo.description,
    userId: user._id,
    userEmail: user.email,
    userRole: user.role,
    branchId: user.branchId || getBranchFromRequest(req),
    entityType: activityInfo.entityType,
    entityId: activityInfo.entityId,
    entityName: activityInfo.entityName,
    category: activityInfo.category,
    priority: activityInfo.priority,
    status: activityInfo.status,
    metadata: {
      method: req.method,
      path: req.path,
      query: req.query,
      params: req.params,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      timestamp: new Date(),
      module: getModuleFromPath(path),
      action: getActionFromMethod(method),
      responseStatus: res.statusCode,
      // Include request body for important operations (exclude sensitive data)
      body: options.includeBody ? sanitizeRequestBody(req.body) : undefined,
      // Include response data for create/update operations
      response: options.includeResponse ? sanitizeResponseData(data) : undefined
    }
  };

  return activityData;
};

/**
 * Get detailed activity information based on request
 */
const getAdminActivityInfo = (req, data, options = {}) => {
  const method = req.method;
  const path = req.path;
  const user = req.user;

  // Default activity info
  let activityInfo = {
    type: getTypeFromMethod(method),
    category: getCategoryFromPath(path),
    entityType: getEntityTypeFromPath(path),
    priority: 'normal',
    status: 'success'
  };

  // Get entity ID and name
  const entityInfo = getEntityInfo(req, data);
  activityInfo.entityId = entityInfo.id;
  activityInfo.entityName = entityInfo.name;

  // Customize based on specific actions and modules
  const moduleInfo = getModuleSpecificInfo(req, data, activityInfo);

  return {
    ...activityInfo,
    ...moduleInfo
  };
};

/**
 * Get activity type from HTTP method
 */
const getTypeFromMethod = (method) => {
  const typeMap = {
    'GET': 'view',
    'POST': 'create',
    'PUT': 'update',
    'PATCH': 'update',
    'DELETE': 'delete'
  };
  return typeMap[method] || 'other';
};

/**
 * Get category from request path
 */
const getCategoryFromPath = (path) => {
  const pathCategories = {
    '/users': 'user',
    '/branches': 'branch',
    '/rooms': 'room',
    '/residents': 'resident',
    '/payments': 'payment',
    '/tickets': 'ticket',
    '/documents': 'document',
    '/reports': 'report',
    '/notifications': 'notification',
    '/subscriptions': 'management',
    '/pg': 'management',
    '/sales': 'management',
    '/analytics': 'management',
    '/dashboard': 'navigation',
    '/settings': 'settings',
    '/auth': 'authentication'
  };

  for (const [route, category] of Object.entries(pathCategories)) {
    if (path.includes(route)) {
      return category;
    }
  }

  return 'management';
};

/**
 * Get entity type from request path
 */
const getEntityTypeFromPath = (path) => {
  const pathEntities = {
    '/users': 'user',
    '/branches': 'branch',
    '/rooms': 'room',
    '/beds': 'bed',
    '/residents': 'resident',
    '/payments': 'payment',
    '/tickets': 'ticket',
    '/documents': 'document',
    '/reports': 'report',
    '/notifications': 'notification',
    '/subscriptions': 'subscription',
    '/pg': 'pg',
    '/floors': 'floor',
    '/sales': 'sales',
    '/analytics': 'analytics',
    '/settings': 'settings'
  };

  for (const [route, entity] of Object.entries(pathEntities)) {
    if (path.includes(route)) {
      return entity;
    }
  }

  return 'other';
};

/**
 * Get module name from path
 */
const getModuleFromPath = (path) => {
  const parts = path.split('/').filter(p => p && p.length > 0);
  // For paths like /floors/123, we want 'floors'
  // For paths like /api/floors/123, we want 'floors'
  const moduleIndex = parts.findIndex(part => !part.match(/^\d+$/) && part !== 'api');
  return moduleIndex >= 0 ? parts[moduleIndex] : 'unknown';
};

/**
 * Get action from HTTP method
 */
const getActionFromMethod = (method) => {
  const actionMap = {
    'GET': 'viewed',
    'POST': 'created',
    'PUT': 'updated',
    'PATCH': 'updated',
    'DELETE': 'deleted'
  };
  return actionMap[method] || 'performed action on';
};

/**
 * Get entity ID and name from request/response
 */
const getEntityInfo = (req, data) => {
  let entityId = null;
  let entityName = null;

  // For creation operations, try to get from response data first
  if (data && typeof data === 'object') {
    // Check if data has nested data object (API response structure)
    if (data.data && typeof data.data === 'object') {
      const entity = data.data;
      if (entity._id) entityId = entity._id;
      if (entity.id) entityId = entity.id;

      // Try various name fields from nested data
      entityName = entity.name || entity.title || entity.email || entity.roomNumber ||
                  entity.branchName || entity.pgName || entity.planName ||
                  (entity.firstName && entity.lastName ? `${entity.firstName} ${entity.lastName}` : null) ||
                  entityId;
    } else {
      // Direct object (legacy support)
      if (data._id) entityId = data._id;
      if (data.id) entityId = data.id;

      // Try various name fields
      entityName = data.name || data.title || data.email || data.roomNumber ||
                  data.branchName || data.pgName || data.planName ||
                  (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : null) ||
                  entityId;
    }
  }

  // For delete operations, get entity ID from URL params
  if (!entityId) {
    // Try different param names that might contain the entity ID
    entityId = req.params.id || req.params.floorId || req.params.roomId ||
               req.params.residentId || req.params.paymentId || req.params.ticketId ||
               req.params.branchId || req.params.pgId || req.params.userId;
  }

  // For delete operations where we don't have the entity name in response,
  // we can use a generic name or try to construct one
  if (!entityName && entityId) {
    // For now, use the entityId as fallback. In a real implementation,
    // you might want to fetch the entity name from database before deletion
    entityName = entityId;
  }

  return { id: entityId, name: entityName };
};

/**
 * Get branch ID from request (for cross-branch operations)
 */
const getBranchFromRequest = (req) => {
  return req.body?.branchId || req.query?.branchId || req.params?.branchId || req.user?.branchId;
};

/**
 * Module-specific activity information
 */
const getModuleSpecificInfo = (req, data, baseInfo) => {
  const path = req.path;
  const method = req.method;
  const module = getModuleFromPath(path);

  const moduleConfigs = {
    // User Management
    users: {
      title: getUserActivityTitle(method, req.params.id, data),
      description: getUserActivityDescription(method, req.user, req.params.id, data),
      priority: method === 'DELETE' ? 'high' : 'normal'
    },

    // Branch Management
    branches: {
      title: getBranchActivityTitle(method, data),
      description: getBranchActivityDescription(method, req.user, data),
      priority: 'high'
    },

    // Room Management
    rooms: {
      title: getRoomActivityTitle(method, data),
      description: getRoomActivityDescription(method, req.user, data),
      priority: 'normal'
    },

    // Resident Management
    residents: {
      title: getResidentActivityTitle(method, data),
      description: getResidentActivityDescription(method, req.user, data),
      priority: method === 'POST' ? 'high' : 'normal'
    },

    // Payment Management
    payments: {
      title: getPaymentActivityTitle(method, data),
      description: getPaymentActivityDescription(method, req.user, data),
      priority: 'urgent'
    },

    // Ticket Management
    tickets: {
      title: getTicketActivityTitle(method, data),
      description: getTicketActivityDescription(method, req.user, data),
      priority: data?.priority === 'urgent' ? 'urgent' : 'normal'
    },

    // Subscription Management
    subscriptions: {
      title: getSubscriptionActivityTitle(method, data),
      description: getSubscriptionActivityDescription(method, req.user, data),
      priority: 'high'
    },

    // PG Management
    pg: {
      title: getPGActivityTitle(method, data),
      description: getPGActivityDescription(method, req.user, data),
      priority: 'high'
    },

    // Floor Management
    floors: {
      title: getFloorActivityTitle(method, data),
      description: getFloorActivityDescription(method, req.user, data),
      priority: 'normal'
    },

    // Settings
    settings: {
      title: getSettingsActivityTitle(method, data),
      description: getSettingsActivityDescription(method, req.user, data),
      priority: 'high'
    }
  };

  return moduleConfigs[module] || {
    title: `${req.user.firstName} ${req.user.lastName} ${getActionFromMethod(method)} ${baseInfo.entityType}`,
    description: `Admin ${req.user.email} performed ${getActionFromMethod(method)} operation on ${baseInfo.entityType}`
  };
};

// Activity title generators for different modules
const getUserActivityTitle = (method, userId, data) => {
  const userName = data?.firstName && data?.lastName ? `${data.firstName} ${data.lastName}` : (data?.email || userId);
  switch (method) {
    case 'POST': return `Created new user: ${userName}`;
    case 'PUT': return `Updated user: ${userName}`;
    case 'DELETE': return `Deleted user: ${userName}`;
    default: return `Viewed user: ${userName}`;
  }
};

const getBranchActivityTitle = (method, data) => {
  const branchName = data?.branchName || data?.name || data?.data?.branchName || 'Branch';
  switch (method) {
    case 'POST': return `Created new branch: ${branchName}`;
    case 'PUT': return `Updated branch: ${branchName}`;
    case 'DELETE': return `Deleted branch: ${branchName}`;
    default: return `Viewed branch: ${branchName}`;
  }
};

const getRoomActivityTitle = (method, data) => {
  const roomNumber = data?.roomNumber || data?.data?.roomNumber || 'Room';
  switch (method) {
    case 'POST': return `Created new room: ${roomNumber}`;
    case 'PUT': return `Updated room: ${roomNumber}`;
    case 'DELETE': return `Deleted room: ${roomNumber}`;
    default: return `Viewed room: ${roomNumber}`;
  }
};

const getResidentActivityTitle = (method, data) => {
  const residentName = data?.firstName && data?.lastName ? `${data.firstName} ${data.lastName}` : (data?.email || 'Resident');
  switch (method) {
    case 'POST': return `Onboarded new resident: ${residentName}`;
    case 'PUT': return `Updated resident: ${residentName}`;
    case 'DELETE': return `Removed resident: ${residentName}`;
    default: return `Viewed resident: ${residentName}`;
  }
};

const getPaymentActivityTitle = (method, data) => {
  const amount = data?.amount || data?.data?.amount || 'Payment';
  switch (method) {
    case 'POST': return `Processed payment: ₹${amount}`;
    case 'PUT': return `Updated payment: ₹${amount}`;
    case 'DELETE': return `Cancelled payment: ₹${amount}`;
    default: return `Viewed payment: ₹${amount}`;
  }
};

const getTicketActivityTitle = (method, data) => {
  const ticketId = data?.ticketId || data?.id || 'Ticket';
  switch (method) {
    case 'POST': return `Created new ticket: ${ticketId}`;
    case 'PUT': return `Updated ticket: ${ticketId}`;
    case 'DELETE': return `Deleted ticket: ${ticketId}`;
    default: return `Viewed ticket: ${ticketId}`;
  }
};

const getSubscriptionActivityTitle = (method, data) => {
  const planName = data?.planName || data?.name || 'Subscription';
  switch (method) {
    case 'POST': return `Created subscription plan: ${planName}`;
    case 'PUT': return `Updated subscription plan: ${planName}`;
    case 'DELETE': return `Deleted subscription plan: ${planName}`;
    default: return `Viewed subscription: ${planName}`;
  }
};

const getPGActivityTitle = (method, data) => {
  const pgName = data?.pgName || data?.name || 'PG';
  switch (method) {
    case 'POST': return `Created new PG: ${pgName}`;
    case 'PUT': return `Updated PG: ${pgName}`;
    case 'DELETE': return `Deleted PG: ${pgName}`;
    default: return `Viewed PG: ${pgName}`;
  }
};

const getFloorActivityTitle = (method, data) => {
  const floorName = data?.name || data?.data?.name || 'Floor';
  switch (method) {
    case 'POST': return `Created new floor: ${floorName}`;
    case 'PUT': return `Updated floor: ${floorName}`;
    case 'DELETE': return `Deleted floor: ${floorName}`;
    default: return `Viewed floor: ${floorName}`;
  }
};

const getSettingsActivityTitle = (method, data) => {
  const settingType = data?.settingType || data?.type || 'Settings';
  switch (method) {
    case 'PUT': return `Updated ${settingType} settings`;
    default: return `Viewed ${settingType} settings`;
  }
};

// Activity description generators
const getUserActivityDescription = (method, user, targetUserId, data) => {
  const adminName = `${user.firstName} ${user.lastName}`;
  const targetName = data?.firstName && data?.lastName ? `${data.firstName} ${data.lastName}` : (data?.email || targetUserId);

  switch (method) {
    case 'POST': return `${adminName} created a new user account for ${targetName}`;
    case 'PUT': return `${adminName} updated user information for ${targetName}`;
    case 'DELETE': return `${adminName} deleted user account for ${targetName}`;
    default: return `${adminName} viewed user information for ${targetName}`;
  }
};

const getBranchActivityDescription = (method, user, data) => {
  const adminName = `${user.firstName} ${user.lastName}`;
  const branchName = data?.branchName || data?.name || data?.data?.branchName || 'Branch';

  switch (method) {
    case 'POST': return `${adminName} created a new branch: ${branchName}`;
    case 'PUT': return `${adminName} updated branch settings for ${branchName}`;
    case 'DELETE': return `${adminName} deleted branch: ${branchName}`;
    default: return `${adminName} viewed branch information for ${branchName}`;
  }
};

const getRoomActivityDescription = (method, user, data) => {
  const adminName = `${user.firstName} ${user.lastName}`;
  const roomNumber = data?.roomNumber || data?.data?.roomNumber || 'Room';

  switch (method) {
    case 'POST': return `${adminName} created a new room: ${roomNumber}`;
    case 'PUT': return `${adminName} updated room configuration for ${roomNumber}`;
    case 'DELETE': return `${adminName} deleted room: ${roomNumber}`;
    default: return `${adminName} viewed room details for ${roomNumber}`;
  }
};

const getResidentActivityDescription = (method, user, data) => {
  const adminName = `${user.firstName} ${user.lastName}`;
  const residentName = data?.firstName && data?.lastName ? `${data.firstName} ${data.lastName}` : (data?.email || 'Resident');

  switch (method) {
    case 'POST': return `${adminName} onboarded new resident: ${residentName}`;
    case 'PUT': return `${adminName} updated resident information for ${residentName}`;
    case 'DELETE': return `${adminName} removed resident: ${residentName}`;
    default: return `${adminName} viewed resident profile for ${residentName}`;
  }
};

const getPaymentActivityDescription = (method, user, data) => {
  const adminName = `${user.firstName} ${user.lastName}`;
  const amount = data?.amount || data?.data?.amount || 'N/A';

  switch (method) {
    case 'POST': return `${adminName} processed a payment of ₹${amount}`;
    case 'PUT': return `${adminName} updated payment details for ₹${amount}`;
    case 'DELETE': return `${adminName} cancelled payment of ₹${amount}`;
    default: return `${adminName} viewed payment information for ₹${amount}`;
  }
};

const getTicketActivityDescription = (method, user, data) => {
  const adminName = `${user.firstName} ${user.lastName}`;
  const ticketId = data?.ticketId || data?.id || 'Ticket';

  switch (method) {
    case 'POST': return `${adminName} created a new support ticket: ${ticketId}`;
    case 'PUT': return `${adminName} updated ticket status/assignment for ${ticketId}`;
    case 'DELETE': return `${adminName} deleted ticket: ${ticketId}`;
    default: return `${adminName} viewed ticket details for ${ticketId}`;
  }
};

const getSubscriptionActivityDescription = (method, user, data) => {
  const adminName = `${user.firstName} ${user.lastName}`;
  const planName = data?.planName || data?.name || 'Subscription Plan';

  switch (method) {
    case 'POST': return `${adminName} created a new subscription plan: ${planName}`;
    case 'PUT': return `${adminName} updated subscription plan: ${planName}`;
    case 'DELETE': return `${adminName} deleted subscription plan: ${planName}`;
    default: return `${adminName} viewed subscription plan: ${planName}`;
  }
};

const getPGActivityDescription = (method, user, data) => {
  const adminName = `${user.firstName} ${user.lastName}`;
  const pgName = data?.pgName || data?.name || 'PG';

  switch (method) {
    case 'POST': return `${adminName} created a new PG property: ${pgName}`;
    case 'PUT': return `${adminName} updated PG configuration for ${pgName}`;
    case 'DELETE': return `${adminName} deleted PG property: ${pgName}`;
    default: return `${adminName} viewed PG information for ${pgName}`;
  }
};

const getFloorActivityDescription = (method, user, data) => {
  const adminName = `${user.firstName} ${user.lastName}`;
  const floorName = data?.name || data?.data?.name || 'Floor';

  switch (method) {
    case 'POST': return `${adminName} created a new floor: ${floorName}`;
    case 'PUT': return `${adminName} updated floor configuration for ${floorName}`;
    case 'DELETE': return `${adminName} deleted floor: ${floorName}`;
    default: return `${adminName} viewed floor information for ${floorName}`;
  }
};

const getSettingsActivityDescription = (method, user, data) => {
  const adminName = `${user.firstName} ${user.lastName}`;
  const settingType = data?.settingType || data?.type || 'System Settings';

  switch (method) {
    case 'PUT': return `${adminName} updated ${settingType} configuration`;
    default: return `${adminName} viewed ${settingType} settings`;
  }
};

/**
 * Check if activity should be skipped
 */
const shouldSkipActivity = (path, method) => {
  // Skip health checks, static files, and frequent API calls
  const skipPatterns = [
    '/health',
    '/metrics',
    '/favicon',
    '/static/',
    '/assets/',
    '/api/activities/stats', // Skip activity stats calls to avoid recursion
    '/api/activities/recent' // Skip activity listing calls
  ];

  return skipPatterns.some(pattern => path.includes(pattern));
};

/**
 * Sanitize request body to remove sensitive data
 */
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body;

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'private'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

/**
 * Sanitize response data to remove sensitive information
 */
const sanitizeResponseData = (data) => {
  if (!data || typeof data !== 'object') return data;

  // For arrays, sanitize each item
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponseData(item));
  }

  // For objects, remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'privateKey', 'accessToken'];
  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      delete sanitized[field];
    }
  }

  return sanitized;
};

module.exports = {
  trackAdminActivity,
  recordAdminActivity
};
