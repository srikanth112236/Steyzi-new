import React, { useState, useEffect } from 'react';

const Dialog = ({ children, open, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(open || false);

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return React.Children.map(children, (child) =>
    React.cloneElement(child, {
      isOpen,
      setIsOpen: handleOpenChange
    })
  );
};

const DialogTrigger = ({ children, asChild = false, isOpen, setIsOpen }) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        setIsOpen(true);
      }
    });
  }

  return (
    <button onClick={() => setIsOpen(true)} className={children.props.className}>
      {children}
    </button>
  );
};

const DialogContent = ({ children, className = '', isOpen, setIsOpen }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
      />

      {/* Content */}
      <div className={`relative z-50 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg ${className}`}>
        {children}
      </div>
    </div>
  );
};

const DialogHeader = ({ children, className = '' }) => {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
};

const DialogTitle = ({ children, className = '' }) => {
  return (
    <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h2>
  );
};

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger };
