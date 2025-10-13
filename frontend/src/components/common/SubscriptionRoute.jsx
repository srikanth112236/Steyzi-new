import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '../../utils/subscriptionUtils';

/**
 * SubscriptionRoute Component
 * Protects routes based on subscription restrictions
 */
const SubscriptionRoute = ({
  children,
  requiredModules = [],
  requiredFeatures = [],
  allowMultipleBranches = false,
  fallbackRoute = '/admin'
}) => {
  const { canAccessRoute, hasModule, hasFeature, allowsMultipleBranches: userAllowsMultipleBranches } = useSubscription();
  const location = useLocation();

  // Check if user can access this route
  const canAccess = canAccessRoute(location.pathname);

  // Additional checks for specific requirements
  const hasRequiredModules = requiredModules.length === 0 || requiredModules.every(module => hasModule(module));
  const hasRequiredFeatures = requiredFeatures.length === 0 || requiredFeatures.every(feature => hasFeature(feature));
  const hasBranchAccess = !allowMultipleBranches || userAllowsMultipleBranches();

  const hasAccess = canAccess && hasRequiredModules && hasRequiredFeatures && hasBranchAccess;

  if (!hasAccess) {
    // Redirect to fallback route with current location state
    return <Navigate to={fallbackRoute} state={{ from: location }} replace />;
  }

  return children;
};

export default SubscriptionRoute;
