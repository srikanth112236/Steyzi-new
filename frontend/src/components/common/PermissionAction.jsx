import React, { useState } from 'react';
import { useSubscription } from '../../utils/subscriptionUtils';
import PermissionModal from './PermissionModal';

/**
 * PermissionAction Component
 * Wraps action buttons to check permissions and show restrictions
 */
const PermissionAction = ({
  module,
  submodule,
  action,
  children,
  onClick,
  showTooltip = true,
  tooltipMessage,
  disabled: externalDisabled = false,
  className = '',
  ...props
}) => {
  const { canPerformActionOnSubmodule } = useSubscription();
  const [showModal, setShowModal] = useState(false);

  const hasPermission = canPerformActionOnSubmodule(module, submodule, action);
  const isDisabled = externalDisabled || !hasPermission;

  const defaultTooltipMessage = `You don't have permission to ${action} ${submodule}. Please upgrade your subscription plan.`;

  const handleClick = (e) => {
    if (isDisabled) {
      e.preventDefault();
      setShowModal(true);
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  const getTooltipMessage = () => {
    if (tooltipMessage) return tooltipMessage;
    return defaultTooltipMessage;
  };

  // Clone children and add disabled state and click handler
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const originalOnClick = child.props.onClick;
      return React.cloneElement(child, {
        disabled: isDisabled,
        onClick: (e) => {
          handleClick(e);
          if (!isDisabled && originalOnClick) {
            originalOnClick(e);
          }
        },
        className: `${child.props.className || ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`.trim(),
        title: isDisabled && showTooltip ? getTooltipMessage() : child.props.title,
        ...props
      });
    }
    return child;
  });

  return (
    <>
      {enhancedChildren}
      <PermissionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        module={module}
        submodule={submodule}
        action={action}
      />
    </>
  );
};

export default PermissionAction;
