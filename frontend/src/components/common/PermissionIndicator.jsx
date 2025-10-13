import React from 'react';
import { useSubscription } from '../../utils/subscriptionUtils';
import { Lock, Unlock } from 'lucide-react';

/**
 * PermissionIndicator Component
 * Shows permission status for different actions on a submodule
 */
const PermissionIndicator = ({
  module,
  submodule,
  actions = ['create', 'read', 'update', 'delete'],
  showLabels = false,
  size = 'sm'
}) => {
  const { getSubmodulePermissions } = useSubscription();
  const permissions = getSubmodulePermissions(module, submodule);

  if (!permissions) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'w-3 h-3';
      case 'sm':
        return 'w-4 h-4';
      case 'md':
        return 'w-5 h-5';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-4 h-4';
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      create: 'Create',
      read: 'Read',
      update: 'Update',
      delete: 'Delete'
    };
    return labels[action] || action;
  };

  return (
    <div className="flex items-center space-x-1">
      {actions.map(action => {
        const hasPermission = permissions[action];
        const IconComponent = hasPermission ? Unlock : Lock;
        const iconColor = hasPermission ? 'text-green-600' : 'text-red-600';

        return (
          <div key={action} className="flex items-center space-x-1">
            <IconComponent className={`${getSizeClasses()} ${iconColor}`} />
            {showLabels && (
              <span className={`text-xs ${hasPermission ? 'text-green-700' : 'text-red-700'}`}>
                {getActionLabel(action)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PermissionIndicator;
