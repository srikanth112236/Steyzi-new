const User = require('../models/user.model');

/**
 * Role-Based Access Control Middleware
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 * @returns {Function} Express middleware function
 */
const rbacMiddleware = (allowedRoles = []) => {
  console.log('RBAC Middleware Called', {
    allowedRoles,
    middlewareType: typeof rbacMiddleware,
    functionExists: typeof rbacMiddleware === 'function'
  });

  return async (req, res, next) => {
    console.log('RBAC Middleware Inner Function Called', {
      user: req.user,
      allowedRoles
    });

    try {
      // Check if user is authenticated
      if (!req.user) {
        console.log('RBAC: No user in request');
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        console.log('RBAC: Role not allowed', {
          userRole: req.user.role,
          allowedRoles
        });
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
          requiredRoles: allowedRoles,
          userRole: req.user.role
        });
      }

      // User has required role, proceed to next middleware
      console.log('RBAC: Access granted');
      next();
    } catch (error) {
      console.error('RBAC Middleware Error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during role verification'
      });
    }
  };
};

module.exports = { rbacMiddleware };