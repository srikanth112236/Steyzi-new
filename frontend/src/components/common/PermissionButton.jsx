import React from 'react';
import { useSubscription } from '../../utils/subscriptionUtils';
import PermissionAction from './PermissionAction';
import PermissionTooltip from './PermissionTooltip';

/**
 * PermissionButton Component
 * A button that automatically handles permission checking and restrictions
 */
const PermissionButton = ({
  module,
  submodule,
  action,
  children,
  onClick,
  disabled: externalDisabled = false,
  className = '',
  variant = 'primary',
  size = 'md',
  tooltip = true,
  ...props
}) => {
  const { canPerformActionOnSubmodule } = useSubscription();

  const hasPermission = canPerformActionOnSubmodule(module, submodule, action);
  const isDisabled = externalDisabled || !hasPermission;

  const getVariantClasses = () => {
    if (isDisabled) {
      return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    }

    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'outline':
        return 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const tooltipMessage = `You don't have permission to ${action} ${submodule}. Please upgrade your subscription plan.`;

  const buttonElement = (
    <button
      className={`${getVariantClasses()} ${getSizeClasses()} rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 ${className}`.trim()}
      disabled={isDisabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );

  if (tooltip && isDisabled) {
    return (
      <PermissionTooltip message={tooltipMessage} disabled={isDisabled}>
        {buttonElement}
      </PermissionTooltip>
    );
  }

  return (
    <PermissionAction
      module={module}
      submodule={submodule}
      action={action}
      onClick={onClick}
      disabled={externalDisabled}
    >
      {buttonElement}
    </PermissionAction>
  );
};

export default PermissionButton;
