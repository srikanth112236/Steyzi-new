import React from 'react';
import { cn } from '../../lib/utils';
import PropTypes from 'prop-types';

/**
 * StatCard Component
 * @param {Object} props - Component props
 */
const StatCard = ({
  icon,
  title,
  value,
  subtitle,
  change,
  className
}) => {
  // Validate icon to ensure it's a valid React element
  const validIcon = React.isValidElement(icon) ? icon : null;

  return (
    <div 
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 transition-all duration-300 hover:shadow-md",
        className
      )}
    >
      <div className="flex justify-between items-center">
        <div className="text-gray-500">{validIcon}</div>
        {change && (
          <span 
            className={`text-xs font-medium ${
              change.startsWith('+') 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}
          >
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

// PropTypes for type checking
StatCard.propTypes = {
  icon: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.node
  ]),
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]).isRequired,
  subtitle: PropTypes.string,
  change: PropTypes.string,
  className: PropTypes.string
};

/**
 * StatCardGrid Component
 * @param {Object} props - Component props
 */
const StatCardGrid = ({ children, className }) => {
  return (
    <div 
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
        className
      )}
    >
      {React.Children.map(children, child => 
        React.isValidElement(child) ? child : null
      )}
    </div>
  );
};

// PropTypes for StatCardGrid
StatCardGrid.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

/**
 * StatCardGridSkeleton Component
 * Provides a loading state for the stat card grid
 */
const StatCardGridSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((_, index) => (
        <div 
          key={index} 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
        >
          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 w-36 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Combine components with properties
const EnhancedStatCard = Object.assign(StatCard, {
  Grid: StatCardGrid,
  GridSkeleton: StatCardGridSkeleton
});

export default EnhancedStatCard;
