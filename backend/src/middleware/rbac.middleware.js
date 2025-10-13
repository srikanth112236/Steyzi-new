const { authorize } = require('./auth.middleware');

/**
 * RBAC (Role-Based Access Control) middleware
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} - Middleware function
 */
const rbacMiddleware = (roles) => {
  if (Array.isArray(roles)) {
    return authorize(...roles);
  }
  return authorize(roles);
};

/**
 * Check specific permission for a resource
 * @param {string} resource - Resource name
 * @param {string} action - Action type (read, write, update, delete)
 * @param {string} permission - Permission type
 * @returns {Function} - Middleware function
 */
rbacMiddleware.checkPermission = (resource, action, permission) => {
  return async (req, res, next) => {
    try {
      // If no user, deny access
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: No user found'
        });
      }

      // Check user's role and permissions
      const userRole = req.user.role;
      const hasPermission = checkUserPermission(userRole, resource, action, permission);

      if (hasPermission) {
        next();
      } else {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Insufficient permissions for ${resource} ${action}`
        });
      }
    } catch (error) {
      console.error('Permission Check Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during permission check'
      });
    }
  };
};

/**
 * Utility function to check user permissions
 * @param {string} userRole - User's role
 * @param {string} resource - Resource name
 * @param {string} action - Action type
 * @param {string} permission - Permission type
 * @returns {boolean} - Whether user has permission
 */
function checkUserPermission(userRole, resource, action, permission) {
  // Define role-based permissions
  const rolePermissions = {
    'superadmin': {
      sales: { 
        analytics: ['read', 'write', 'update', 'delete'] 
      }
    },
    'sales_manager': {
      sales: { 
        analytics: ['read'] 
      }
    },
    'sub_sales': {
      sales: { 
        analytics: [] 
      }
    }
  };

  // Check if role exists and has the specific permission
  const resourcePermissions = rolePermissions[userRole]?.[resource]?.[action] || [];
  return resourcePermissions.includes(permission);
}

module.exports = rbacMiddleware;