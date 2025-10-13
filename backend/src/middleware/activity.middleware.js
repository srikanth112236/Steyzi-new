const activityService = require('../services/activity.service');

const activityTypes = {
  GET: 'view',
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete'
};

const getEntityTypeFromPath = (path) => {
  // Extract entity type from path, e.g., /api/pg/rooms -> rooms
  const parts = path.split('/');
  return parts[parts.length - 1].replace(/\W/g, '');
};

const getActivityTitle = (req, entityType) => {
  const method = req.method;
  const action = activityTypes[method];
  
  switch (method) {
    case 'GET':
      return `Viewed ${entityType} information`;
    case 'POST':
      return `Created new ${entityType}`;
    case 'PUT':
    case 'PATCH':
      return `Updated ${entityType} information`;
    case 'DELETE':
      return `Deleted ${entityType}`;
    default:
      return `Performed action on ${entityType}`;
  }
};

const trackActivity = (options = {}) => {
  return async (req, res, next) => {
    // Store the original send/json methods
    const originalSend = res.send;
    const originalJson = res.json;
    
    try {
      // Override send
      res.send = function (data) {
        recordActivity(req, res, data, options);
        return originalSend.apply(res, arguments);
      };

      // Override json
      res.json = function (data) {
        recordActivity(req, res, data, options);
        return originalJson.apply(res, arguments);
      };

      next();
    } catch (error) {
      console.error('Error in activity tracking middleware:', error);
      next();
    }
  };
};

const recordActivity = async (req, res, data, options = {}) => {
  try {
    // Only track activities for successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const user = req.user;
      if (!user) return;

      const entityType = options.entityType || getEntityTypeFromPath(req.path);
      let entityId = null;

      // Try to get entity ID from various sources
      if (options.entityId) {
        entityId = typeof options.entityId === 'function' 
          ? options.entityId(req, data)
          : options.entityId;
      } else if (req.params.id) {
        entityId = req.params.id;
      } else if (data?._id) {
        entityId = data._id;
      }

      const activityData = {
        type: options.type || activityTypes[req.method],
        title: options.title || getActivityTitle(req, entityType),
        description: options.description || \`\${user.firstName} \${user.lastName} performed \${activityTypes[req.method]} operation on \${entityType}\`,
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        branchId: user.branchId || (req.body?.branchId || req.query?.branchId),
        entityType,
        entityId,
        entityName: options.entityName || data?.name || data?.title || entityId,
        category: options.category || 'general',
        priority: options.priority || 'normal',
        status: options.status || 'completed',
        metadata: {
          method: req.method,
          path: req.path,
          query: req.query,
          params: req.params,
          body: options.includeBody ? req.body : undefined,
          response: options.includeResponse ? data : undefined,
          userAgent: req.headers['user-agent'],
          ip: req.ip
        }
      };

      await activityService.recordActivity(activityData);
    }
  } catch (error) {
    console.error('Error recording activity:', error);
  }
};

module.exports = {
  trackActivity
};