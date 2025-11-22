import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  Home,
  FileText,
  HelpCircle,
  Shield,
  BarChart3,
  Calendar,
  MessageSquare,
  QrCode,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  UserMinus,
  Users2,
  CreditCard as PaymentIcon,
  FileBarChart,
  QrCode as QrIcon,
  ArrowUpDown,
  LayoutGrid,
  Info,
  Calculator,
  DollarSign,
  Receipt,
  ChevronUp
} from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import TokenExpiryModal from '../components/common/TokenExpiryModal';
import { useTokenExpiry } from '../hooks/useTokenExpiry';
import BranchSelector from '../components/common/BranchSelector';
import { selectSelectedBranch } from '../store/slices/branch.slice';
import HeaderNotifications from '../components/common/HeaderNotifications';
import SubscriptionStatusIndicator from '../components/common/SubscriptionStatusIndicator';
import { useSubscription } from '../utils/subscriptionUtils';
import { selectUser, selectSubscription, updateAuthState, selectPgConfigured, selectDefaultBranch, selectPgId } from '../store/slices/authSlice';
import FreeTrialModal from '../components/common/FreeTrialModal';
import { Package } from 'lucide-react';
import PGConfigurationModal from '../components/admin/PGConfigurationModal';
import DefaultBranchModal from '../components/admin/DefaultBranchModal';
import PaymentHistory from '../components/admin/PaymentHistory';

// Module to submodule mapping for navigation filtering
const MODULE_NAV_MAPPING = {
  resident_management: ['residents', 'onboarding', 'offboarding', 'room_switching', 'moved_out'],
  payment_tracking: ['payments'],
  room_allocation: ['room_availability'],
  qr_code_payments: ['qr-management'],
  ticket_system: ['tickets'],
  analytics_reports: ['reports'],
  admin_management: ['admin_routes', 'user_management', 'system_settings', 'subscription_management'],
  security_management: ['audit_logs', 'security_settings', 'access_control'],
  bulk_upload: ['file_upload', 'data_validation', 'bulk_import'],
  email_notifications: ['email_templates', 'email_sending', 'email_history'],
  sms_notifications: ['sms_templates', 'sms_sending', 'sms_history'],
  multi_branch: ['branch_management', 'branch_switching', 'branch_reports'],
  custom_reports: ['report_builder', 'custom_queries', 'report_scheduling']
};

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [expandedDropdowns, setExpandedDropdowns] = useState(new Set());
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, isDropdown: false, dropdownItems: null });
  const [showTrialInfoPopup, setShowTrialInfoPopup] = useState(false);
  const buttonRefs = useRef({});
  const { user, subscription } = useSelector((state) => state.auth);
  const selectedBranch = useSelector(selectSelectedBranch);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasModule, allowsMultipleBranches, canPerformActionOnSubmodule } = useSubscription();
  const hoverTimeoutRef = useRef(null);

  // Free trial countdown timer
  const [trialTimeLeft, setTrialTimeLeft] = useState(null);
  const [trialInfo, setTrialInfo] = useState(null);

  // Free trial modal state
  const [showTrialModal, setShowTrialModal] = useState(false);

  // State for configuration modals - now controlled by individual pages
  const [showDefaultBranchModal, setShowDefaultBranchModal] = useState(false);
  const [showPGConfigModal, setShowPGConfigModal] = useState(false);

  // Get configuration status from Redux with default values
  const pgConfigured = useSelector(selectPgConfigured) || false;
  const defaultBranch = useSelector(selectDefaultBranch) || false;
  const pgId = useSelector(selectPgId);

  // Check if user has active paid subscription with fallback
  const hasActivePaidSubscription = 
    (subscription?.status === 'active' && 
     subscription?.billingCycle !== 'trial') || false;

  // Debug logging for subscription status - Only log when subscription changes significantly
  useEffect(() => {
    if (subscription) {
      console.log('🔍 Subscription Status Debug:', {
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        hasActivePaidSubscription
      });
    }
  }, [subscription?.status, subscription?.billingCycle, hasActivePaidSubscription]);

  // Debug logging for configuration status - Only log when user config changes
  useEffect(() => {
    if (user) {
      console.log('🔍 Configuration Status Debug:', {
        user: {
          default_branch: user?.default_branch,
          pg_configured: user?.pg_configured
        },
        reduxState: {
          defaultBranch,
          pgConfigured
        }
      });
    }
  }, [user?.default_branch, user?.pg_configured, defaultBranch, pgConfigured, pgId]);

  // Configuration modals are now handled by individual pages (like Dashboard)
  // Removed automatic modal showing on page load

  // Callback for branch creation
  const handleBranchCreated = (branchData) => {
    // Update Redux state to mark default branch as set
    dispatch(updateAuthState({
      default_branch: true,
      defaultBranchId: branchData?.branch?._id || branchData?._id
    }));

    // If branch is created, proceed to PG Configuration
    setShowDefaultBranchModal(false);
    setShowPGConfigModal(true);
  };

  // Callback for PG configuration
  const handlePGConfigured = (configData) => {
    // Update Redux state to mark PG as configured and onboarding as completed
    dispatch(updateAuthState({
      pg_configured: true,
      pgConfigured: true,
      onboarding_completed: true
    }));

    // Close the modal after state update
    setShowPGConfigModal(false);

    // Show success message
    toast.success('PG Configuration completed successfully! You can now start managing your PG.');
  };

  // Calculate trial time left and info
  useEffect(() => {
    if ((subscription?.billingCycle === 'trial' || subscription?.isTrialActive) && subscription?.trialEndDate) {
      console.log('✅ Setting up trial countdown');
      let countdownInterval;

      const updateCountdown = () => {
        try {
          // Safely parse dates with fallback
          const now = new Date();
          const trialStart = subscription.startDate ? new Date(subscription.startDate) : now;
          const trialEnd = subscription.trialEndDate ? new Date(subscription.trialEndDate) : now;

          // Validate dates
          if (isNaN(trialStart.getTime()) || isNaN(trialEnd.getTime())) {
            console.error('❌ Invalid trial dates:', {
              startDate: subscription.startDate,
              trialEndDate: subscription.trialEndDate
            });
            setTrialTimeLeft(null);
            setTrialInfo(null);
            return;
          }

          const trialPeriodDays = Math.ceil((trialEnd - trialStart) / (1000 * 60 * 60 * 24));
          const diffMs = trialEnd - now;

          console.log('⏰ Trial countdown update:', {
            now: now.toISOString(),
            trialStart: trialStart.toISOString(),
            trialEnd: trialEnd.toISOString(),
            diffMs,
            trialPeriodDays
          });

          if (diffMs > 0) {
            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            console.log('📅 Setting active trial:', { days, hours, minutes });
            setTrialTimeLeft({ days, hours, minutes, expired: false });
            setTrialInfo({
              trialPeriod: trialPeriodDays,
              daysUsed: trialPeriodDays - days,
              daysRemaining: days,
              startDate: trialStart,
              endDate: trialEnd
            });
          } else {
            console.log('❌ Trial expired');
            setTrialTimeLeft({ days: 0, hours: 0, minutes: 0, expired: true });
            setTrialInfo({
              trialPeriod: trialPeriodDays,
              daysUsed: trialPeriodDays,
              daysRemaining: 0,
              startDate: trialStart,
              endDate: trialEnd,
              expired: true
            });
          }
        } catch (error) {
          console.error('❌ Error in trial countdown:', error);
          setTrialTimeLeft(null);
          setTrialInfo(null);
        }
      };

      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 60000); // Update every minute

      return () => {
        if (countdownInterval) {
          clearInterval(countdownInterval);
        }
      };
    } else {
      setTrialTimeLeft(null);
      setTrialInfo(null);
    }
  }, [subscription?.trialEndDate, subscription?.startDate]); // Only depend on trial dates

  // Check for trial modal flag on component mount
  useEffect(() => {
    const shouldShowTrialModal = sessionStorage.getItem('showTrialModal');
    const shouldShowTrialModalAfterOnboarding = sessionStorage.getItem('showTrialModalAfterOnboarding');

    if ((shouldShowTrialModal === 'true' || shouldShowTrialModalAfterOnboarding === 'true') && !hasActivePaidSubscription) {
      // Clear the flags to prevent showing on refresh
      sessionStorage.removeItem('showTrialModal');
      sessionStorage.removeItem('showTrialModalAfterOnboarding');
      // Show the modal only if user doesn't have active paid subscription
      setShowTrialModal(true);
    }
  }, [subscription]); // Depend on subscription status

  // Token expiry handling
  const {
    showExpiryModal,
    closeExpiryModal,
    handleRefreshToken,
  } = useTokenExpiry();

  console.log('🏢 AdminLayout rendering:', {
    user: !!user,
    subscription: subscription ? {
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      isTrialActive: subscription.isTrialActive
    } : null,
    hasActivePaidSubscription,
    trialTimeLeft: trialTimeLeft ? 'active' : null,
    location: location.pathname
  });

  // Navigation items with dropdowns
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutGrid
    },
    {
      name: 'My PG',
      href: '/admin/pg-management',
      icon: Building2
    },
    {
      name: 'Resident ',
      icon: Users2,
      hasDropdown: true,
      dropdownItems: [
        {
          name: 'All Residents',
          href: '/admin/residents',
          icon: Users
        },
        {
          name: 'Onboarding',
          href: '/admin/onboarding',
          icon: UserPlus
        },
        {
          name: 'Offboarding',
          href: '/admin/offboarding',
          icon: UserMinus
        },
        {
          name: 'Room Switching',
          href: '/admin/room-switching',
          icon: ArrowUpDown
        },
        {
          name: 'Moved Out',
          href: '/admin/moved-out',
          icon: LogOut
        }
      ]
    },
    {
      name: 'Payments',
      icon: PaymentIcon,
      hasDropdown: true,
      dropdownItems: [
        {
          name: 'Manage Payments',
          href: '/admin/payments',
          icon: PaymentIcon
        },
        {
          name: 'Payment History',
          href: '/admin/payment-history',
          icon: CreditCard
        }
      ]
    },
    {
      name: 'Tickets',
      href: '/admin/tickets',
      icon: MessageSquare
    },
    {
      name: 'All Activities',
      href: '/admin/activities',
      icon: Info
    },
    {
      name: 'Branch Activities',
      href: '/admin/branch-activities',
      icon: Building2
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: FileBarChart
    },
    {
      name: 'Finance',
      icon: DollarSign,
      hasDropdown: true,
      dropdownItems: [
        {
          name: 'Expenses',
          href: '/admin/finance/expenses',
          icon: Receipt
        },
        {
          name: 'Salaries',
          href: '/admin/finance/salaries',
          icon: Users
        }
      ]
    },
    {
      name: 'QR Codes',
      href: '/admin/qr-management',
      icon: QrIcon
    },
    {
      name: 'Room Availability',
      href: '/admin/room-availability',
      icon: Building2
    },
    {
      name: 'Cost Calculator',
      href: '/admin/cost-calculator',
      icon: Calculator
    },
    {
      name: 'Subscription',
      href: '/admin/subscription-history',
      icon: Package
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings
    }
  ];

  // Filter navigation items based on subscription restrictions and user role
  const getFilteredNavigationItems = () => {
    // During trial period, show ALL navigation items
    if (subscription?.billingCycle === 'trial' || subscription?.isTrialActive) {
      console.log('🎉 Trial period active - showing all navigation items');
      return navigationItems;
    }

    // Maintainers have access to most admin features
    if (user?.role === 'maintainer') {
      return navigationItems.filter(item => {
        // Maintainers can access:
        // - Dashboard (for overview)
        // - My PG (limited view of their assigned branches)
        // - Resident Management
        // - Payments
        // - Tickets
        // - Reports (for their assigned branches)
        // - Settings (basic profile settings)
        // - Usage Dashboard
        return !['Branch Activities', 'QR Codes', 'Room Availability', 'Cost Calculator'].includes(item.name);
      });
    }

    return navigationItems
      .filter(item => {
        // Always show Dashboard and Settings
        if (['Dashboard', 'Settings'].includes(item.name)) {
          return true;
        }

        // My PG - always show for basic functionality
        if (item.name === 'My PG') {
          return true;
        }

        // Resident Management - requires resident_management module and at least one submodule permission
        if (item.name === 'Resident Management') {
          if (!hasModule('resident_management')) return false;
          // Check if user has read permission for at least one submodule
          const submodules = MODULE_NAV_MAPPING.resident_management || [];
          return submodules.some(submodule => canPerformActionOnSubmodule('resident_management', submodule, 'read'));
        }

        // Payments - requires payment_tracking module and payments read permission
        if (item.name === 'Payments') {
          return hasModule('payment_tracking') && canPerformActionOnSubmodule('payment_tracking', 'payments', 'read');
        }

        // Tickets - requires ticket_system module and tickets read permission
        if (item.name === 'Tickets') {
          return hasModule('ticket_system') && canPerformActionOnSubmodule('ticket_system', 'tickets', 'read');
        }

        // Reports - requires analytics_reports module and reports read permission
        if (item.name === 'Reports') {
          return hasModule('analytics_reports') && canPerformActionOnSubmodule('analytics_reports', 'reports', 'read');
        }

        // Finance - requires finance_management module and at least one submodule permission
        if (item.name === 'Finance') {
          if (!hasModule('finance_management')) return false;
          // Check if user has read permission for at least one submodule
          const submodules = ['expenses', 'salaries'];
          return submodules.some(submodule => canPerformActionOnSubmodule('finance_management', submodule, 'read'));
        }

        // QR Codes - requires qr_code_payments module and qr-management read permission
        if (item.name === 'QR Codes') {
          return hasModule('qr_code_payments') && canPerformActionOnSubmodule('qr_code_payments', 'qr-management', 'read');
        }

        // Room Availability - requires room_allocation module and room_availability read permission
        if (item.name === 'Room Availability') {
          return hasModule('room_allocation') && canPerformActionOnSubmodule('room_allocation', 'room_availability', 'read');
        }

        // Branch Activities - only show if multiple branches allowed
        if (item.name === 'Branch Activities') {
          return allowsMultipleBranches();
        }

        // All Activities - always show
        if (item.name === 'All Activities') {
          return true;
        }

        // Subscription - always show for all users
        if (item.name === 'Subscription') {
          return true;
        }

        // Default to show if no specific rule
        return true;
      })
      .map(item => {
        // During trial period, show all dropdown items
        if ((subscription?.billingCycle === 'trial' || subscription?.isTrialActive) && item.name === 'Resident Management' && item.hasDropdown && item.dropdownItems) {
          console.log('🎉 Trial period - showing all Resident Management dropdown items');
          return item; // Return all items without filtering
        }

        // Filter dropdown items for Resident Management
        if (item.name === 'Resident Management' && item.hasDropdown && item.dropdownItems) {
          const filteredDropdownItems = item.dropdownItems.filter(dropdownItem => {
            // All Residents - requires residents read permission
            if (dropdownItem.name === 'All Residents') {
              return canPerformActionOnSubmodule('resident_management', 'residents', 'read');
            }
            // Onboarding - requires onboarding read permission
            if (dropdownItem.name === 'Onboarding') {
              return canPerformActionOnSubmodule('resident_management', 'onboarding', 'read');
            }
            // Offboarding - requires offboarding read permission
            if (dropdownItem.name === 'Offboarding') {
              return canPerformActionOnSubmodule('resident_management', 'offboarding', 'read');
            }
            // Room Switching - requires room_switching read permission
            if (dropdownItem.name === 'Room Switching') {
              return canPerformActionOnSubmodule('resident_management', 'room_switching', 'read');
            }
            // Moved Out - requires moved_out read permission
            if (dropdownItem.name === 'Moved Out') {
              return canPerformActionOnSubmodule('resident_management', 'moved_out', 'read');
            }
            return true;
          });

          return {
            ...item,
            dropdownItems: filteredDropdownItems
          };
        }

        // Filter dropdown items for Finance
        if (item.name === 'Finance' && item.hasDropdown && item.dropdownItems) {
          const filteredDropdownItems = item.dropdownItems.filter(dropdownItem => {
            // Expenses - requires expenses read permission
            if (dropdownItem.name === 'Expenses') {
              return canPerformActionOnSubmodule('finance_management', 'expenses', 'read');
            }
            // Salaries - requires salaries read permission
            if (dropdownItem.name === 'Salaries') {
              return canPerformActionOnSubmodule('finance_management', 'salaries', 'read');
            }
            return true;
          });

          return {
            ...item,
            dropdownItems: filteredDropdownItems
          };
        }

        return item;
      })
      .filter(item => {
        // Remove Resident Management if no dropdown items remain
        if (item.name === 'Resident Management' && item.hasDropdown) {
          return item.dropdownItems && item.dropdownItems.length > 0;
        }

        // Remove Finance if no dropdown items remain
        if (item.name === 'Finance' && item.hasDropdown) {
          return item.dropdownItems && item.dropdownItems.length > 0;
        }
        return true;
      });
  };

  const handleLogout = useCallback(async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Logged out successfully');
      navigate('/admin/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  }, [dispatch, navigate]);

  const handleTrialActivated = async () => {
    // Close modal
    setShowTrialModal(false);

    // Refresh user data to get updated subscription info
    try {
      // Force a page reload to refresh all subscription data
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing after trial activation:', error);
      // Fallback to reload
      window.location.reload();
    }
  };

  const isActiveRoute = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const toggleDropdown = (itemName) => {
    const newExpanded = new Set(expandedDropdowns);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedDropdowns(newExpanded);
  };

  const isDropdownExpanded = (itemName) => {
    // Auto-expand if any child is active
    const filteredItems = getFilteredNavigationItems();
    const item = filteredItems.find(i => i.name === itemName);
    if (item?.hasDropdown && isAnyDropdownItemActive(item.dropdownItems)) {
      return true;
    }
    return expandedDropdowns.has(itemName);
  };

  const isAnyDropdownItemActive = (dropdownItems) => {
    return dropdownItems?.some(item => isActiveRoute(item.href));
  };

  const getActiveSubTabs = () => {
    const filteredItems = getFilteredNavigationItems();
    const activeItem = filteredItems.find(item =>
      item.hasDropdown
        ? isAnyDropdownItemActive(item.dropdownItems)
        : isActiveRoute(item.href)
    );
    
    if (activeItem?.hasDropdown) {
      return activeItem.dropdownItems.filter(item => isActiveRoute(item.href));
    }
    return [];
  };

  const handleMouseEnter = (itemName, event, isDropdown = false, dropdownItems = null) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      const buttonElement = buttonRefs.current[itemName];
      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        // Use getBoundingClientRect directly for fixed positioning (relative to viewport)
        setTooltipPosition({
          top: rect.top,
          left: rect.right + 8,
          isDropdown,
          dropdownItems
        });
      }
      setHoveredItem(itemName);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 200);
  };

  // Update tooltip position on scroll or resize
  useEffect(() => {
    if (hoveredItem && buttonRefs.current[hoveredItem]) {
      const updatePosition = () => {
        const buttonElement = buttonRefs.current[hoveredItem];
        if (buttonElement) {
          const rect = buttonElement.getBoundingClientRect();
          setTooltipPosition({
            top: rect.top,
            left: rect.right + 8
          });
        }
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [hoveredItem]);

  // Get company name or default
  const companyName = user?.companyName || selectedBranch?.name || 'Company Name';

  // Separate navigation items for Apps section
  const getMainNavItems = () => {
    const filtered = getFilteredNavigationItems();
    return filtered.filter(item =>
      !['Settings', 'Subscription', 'QR Codes', 'Room Availability', 'Cost Calculator'].includes(item.name)
    );
  };

  const getAppItems = () => {
    const filtered = getFilteredNavigationItems();
    return filtered.filter(item =>
      ['QR Codes', 'Room Availability', 'Cost Calculator'].includes(item.name)
    );
  };

  const getBottomNavItems = () => {
    const filtered = getFilteredNavigationItems();
    return filtered.filter(item =>
      ['Subscription'].includes(item.name)
    );
  };

  return (
    <div className="min-h-screen bg-blue-50/30">
      {/* Sidebar - Fixed position, doesn't scroll with content */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col shadow-xl ${
        sidebarCollapsed ? 'w-16 overflow-visible' : 'w-64'
      }`}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center border-b border-gray-200 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className={`flex items-center w-full ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
            {/* Logo */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white text-xl font-bold">P</span>
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold tracking-tight text-gray-900 truncate">
                    PG Admin
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5 font-medium">Management System</div>
                  <div className="text-xs text-gray-500 mt-1 truncate">{companyName}</div>
                </div>
                <button 
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all p-1.5 rounded-lg hover:shadow-sm"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </>
            )}
            {sidebarCollapsed && (
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all p-1.5 rounded-lg hover:shadow-sm"
                title="Expand sidebar"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

       
        {/* Navigation */}
        <nav className={`flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden ${
          sidebarCollapsed ? 'scrollbar-hide' : 'custom-scrollbar'
        }`}>
          <div className="space-y-1">
            {/* Main Navigation Items */}
            {getMainNavItems().map((item) => {
              const isActive = item.hasDropdown
                ? isAnyDropdownItemActive(item.dropdownItems)
                : isActiveRoute(item.href);
              
              return (
                <div 
                  key={item.name} 
                  className="relative group"
                  onMouseEnter={(e) => sidebarCollapsed && handleMouseEnter(item.name, e, item.hasDropdown, item.dropdownItems)}
                  onMouseLeave={handleMouseLeave}
                >
                  {item.hasDropdown ? (
                    // Dropdown Item
                    <div>
                      {sidebarCollapsed ? (
                        // Collapsed state with hover tooltip
                        <>
                          <button
                            ref={(el) => (buttonRefs.current[item.name] = el)}
                            onClick={() => toggleDropdown(item.name)}
                            className={`w-full flex items-center justify-center px-3 py-3 rounded-lg transition-all duration-200 relative z-10 group-hover:bg-gray-50 shadow-sm ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-md'
                                : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                            }`}
                          >
                            <item.icon
                              className={`h-5 w-5 transition-colors ${
                                isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                              }`}
                            />
                          </button>
                          
                          {/* Hover Tooltip/Popup - Positioned outside sidebar */}
                          <AnimatePresence>
                            {hoveredItem === item.name && item.hasDropdown && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-[9999] min-w-[180px] pointer-events-auto"
                                style={{
                                  top: `${tooltipPosition.top}px`,
                                  left: `${tooltipPosition.left}px`
                                }}
                                onMouseEnter={() => setHoveredItem(item.name)}
                                onMouseLeave={handleMouseLeave}
                              >
                                {item.dropdownItems.map((dropdownItem) => {
                                  const isDropdownItemActive = isActiveRoute(dropdownItem.href);
                                  return (
                                    <Link
                                      key={dropdownItem.name}
                                      to={dropdownItem.href}
                                      className={`flex items-center px-4 py-2 text-sm transition-all duration-200 hover:bg-gray-50 cursor-pointer rounded-md mx-1 ${
                                        isDropdownItemActive
                                          ? 'text-blue-700 font-medium bg-blue-50'
                                          : 'text-gray-600'
                                      }`}
                                      onClick={() => setHoveredItem(null)}
                                    >
                                      {dropdownItem.name}
                                    </Link>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        // Expanded state
                        <>
                          <button
                            onClick={() => toggleDropdown(item.name)}
                            className={`w-full flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <item.icon
                              className={`h-5 w-5 mr-3 flex-shrink-0 ${
                                isActive ? 'text-blue-600' : 'text-gray-500'
                              }`}
                            />
                            <div className="flex-1 text-left">{item.name}</div>
                            {isDropdownExpanded(item.name) ? (
                              <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            )}
                          </button>
                          
                          {/* Dropdown Content with vertical line */}
                          {isDropdownExpanded(item.name) && (
                            <div className="ml-6 mt-1 space-y-0.5 relative">
                              {/* Vertical line connector */}
                              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                              {item.dropdownItems.map((dropdownItem, index) => {
                                const isDropdownItemActive = isActiveRoute(dropdownItem.href);
                                return (
                                  <Link
                                    key={dropdownItem.name}
                                    to={dropdownItem.href}
                              className={`relative flex items-center pl-6 pr-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                                isDropdownItemActive
                                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold shadow-sm'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                                  >
                                    {/* Dot indicator on vertical line */}
                                    <div className={`absolute left-0 w-2 h-2 rounded-full -translate-x-1/2 ${
                                      isDropdownItemActive ? 'bg-blue-600' : 'bg-gray-300'
                                    }`} style={{ left: '8px' }}></div>
                                    <div>{dropdownItem.name}</div>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    // Regular Item
                    <>
                      {sidebarCollapsed ? (
                        <>
                          <Link
                            ref={(el) => (buttonRefs.current[item.name] = el)}
                            to={item.href}
                            className={`flex items-center justify-center px-3 py-3 rounded-lg transition-all duration-200 relative z-10 group-hover:bg-gray-50 shadow-sm ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-md'
                                : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                            }`}
                          >
                            <item.icon
                              className={`h-5 w-5 transition-colors ${
                                isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                              }`}
                            />
                          </Link>
                          
                          {/* Hover Tooltip for Regular Items */}
                          <AnimatePresence>
                            {hoveredItem === item.name && !item.hasDropdown && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="fixed bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg px-3 py-2 text-sm font-medium z-[9999] pointer-events-none whitespace-nowrap shadow-lg"
                                style={{
                                  top: `${tooltipPosition.top}px`,
                                  left: `${tooltipPosition.left}px`
                                }}
                              >
                                {item.name}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gradient-to-r from-cyan-400 to-cyan-500 rotate-45"></div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link
                          to={item.href}
                          className={`flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <item.icon
                            className={`h-5 w-5 mr-3 flex-shrink-0 ${
                              isActive ? 'text-blue-600' : 'text-gray-500'
                            }`}
                          />
                          <div>{item.name}</div>
                        </Link>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {/* Separator */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Apps Section */}
            {!sidebarCollapsed && (
              <div className="px-3 py-2 mb-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Apps
                </div>
              </div>
            )}

            {/* App Items */}
            {getAppItems().map((item) => {
              const isActive = isActiveRoute(item.href);
              return (
                <div 
                  key={item.name}
                  className="relative group"
                  onMouseEnter={(e) => sidebarCollapsed && handleMouseEnter(item.name, e, false, null)}
                  onMouseLeave={handleMouseLeave}
                >
                  {sidebarCollapsed ? (
                    <>
                      <Link
                        ref={(el) => (buttonRefs.current[item.name] = el)}
                        to={item.href}
                        className={`flex items-center justify-center px-3 py-3 rounded-lg transition-all duration-200 relative z-10 group-hover:bg-gray-50 shadow-sm ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-md'
                            : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 transition-colors ${
                            isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                          }`}
                        />
                      </Link>
                      
                      {/* Hover Tooltip for App Items */}
                      <AnimatePresence>
                        {hoveredItem === item.name && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="fixed bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg px-3 py-2 text-sm font-medium z-[9999] pointer-events-none whitespace-nowrap shadow-lg"
                            style={{
                              top: `${tooltipPosition.top}px`,
                              left: `${tooltipPosition.left}px`
                            }}
                          >
                            {item.name}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gradient-to-r from-cyan-400 to-cyan-500 rotate-45"></div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      to={item.href}
                      className={`flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 mr-3 flex-shrink-0 ${
                          isActive ? 'text-blue-600' : 'text-gray-500'
                        }`}
                      />
                      <div>{item.name}</div>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </nav>


        {/* Bottom Section - Subscription, Settings, Collapse */}
        <div className="border-t border-gray-200 px-3 py-3 space-y-1 bg-gradient-to-t from-gray-50 to-white">
          {/* Subscription */}
          {getBottomNavItems().map((item) => {
            const isActive = isActiveRoute(item.href);
            return (
              <div
                key={item.name}
                className="relative group"
                onMouseEnter={(e) => sidebarCollapsed && handleMouseEnter(item.name, e, false, null)}
                onMouseLeave={handleMouseLeave}
              >
                {sidebarCollapsed ? (
                  <>
                    <Link
                      ref={(el) => (buttonRefs.current[item.name] = el)}
                      to={item.href}
                      className={`flex items-center justify-center px-3 py-3 rounded-lg transition-all duration-200 relative z-10 group-hover:bg-gray-50 shadow-sm ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-md'
                          : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 transition-colors ${
                        isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                      }`} />
                    </Link>

                    <AnimatePresence>
                      {hoveredItem === item.name && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="fixed bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg px-3 py-2 text-sm font-medium z-[9999] pointer-events-none whitespace-nowrap shadow-lg"
                          style={{
                            top: `${tooltipPosition.top}px`,
                            left: `${tooltipPosition.left}px`
                          }}
                        >
                          {item.name}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gradient-to-r from-cyan-400 to-cyan-500 rotate-45"></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    to={item.href}
                    className={`flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    <div>{item.name}</div>
                  </Link>
                )}
              </div>
            );
          })}

          {/* Settings */}
          <div 
            className="relative group"
            onMouseEnter={(e) => sidebarCollapsed && handleMouseEnter('Settings', e, false, null)}
            onMouseLeave={handleMouseLeave}
          >
            {sidebarCollapsed ? (
              <>
                <Link
                  ref={(el) => (buttonRefs.current['Settings'] = el)}
                  to="/admin/settings"
                  className={`flex items-center justify-center px-3 py-3 rounded-lg transition-all duration-200 relative z-10 group-hover:bg-gray-50 shadow-sm ${
                    isActiveRoute('/admin/settings')
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-md'
                      : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                >
                  <Settings className={`h-5 w-5 transition-colors ${
                    isActiveRoute('/admin/settings') ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                </Link>
                
                {/* Hover Tooltip */}
                <AnimatePresence>
                  {hoveredItem === 'Settings' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="fixed bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg px-3 py-2 text-sm font-medium z-[9999] pointer-events-none whitespace-nowrap shadow-lg"
                      style={{
                        top: `${tooltipPosition.top}px`,
                        left: `${tooltipPosition.left}px`
                      }}
                    >
                      Settings
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gradient-to-r from-cyan-400 to-cyan-500 rotate-45"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link
                to="/admin/settings"
                className={`flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  isActiveRoute('/admin/settings')
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Settings className={`h-5 w-5 mr-3 flex-shrink-0 ${
                  isActiveRoute('/admin/settings') ? 'text-blue-600' : 'text-gray-500'
                }`} />
                <div>Settings</div>
              </Link>
            )}
          </div>

     

          {/* Separator */}
          <div className="border-t border-gray-200 my-3"></div>

          {/* Collapse/Expand Button */}
          <div 
            className="relative group"
            onMouseEnter={(e) => sidebarCollapsed && handleMouseEnter('Collapse', e, false, null)}
            onMouseLeave={handleMouseLeave}
          >
            {sidebarCollapsed ? (
              <>
                <button
                  ref={(el) => (buttonRefs.current['Collapse'] = el)}
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="w-full flex items-center justify-center px-3 py-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-50 group-hover:bg-gray-50 relative z-10 shadow-sm hover:shadow-md"
                >
                  <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
                </button>
                
                {/* Hover Tooltip */}
                <AnimatePresence>
                  {hoveredItem === 'Collapse' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="fixed bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg px-3 py-2 text-sm font-medium z-[9999] pointer-events-none whitespace-nowrap shadow-lg"
                      style={{
                        top: `${tooltipPosition.top}px`,
                        left: `${tooltipPosition.left}px`
                      }}
                    >
                      Expand
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gradient-to-r from-cyan-400 to-cyan-500 rotate-45"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-full flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md"
              >
                <ChevronLeft className="h-5 w-5 mr-3 flex-shrink-0 text-gray-500" />
                <div>Collapse</div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content - Expands to fill available space */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header - Compact Modern Design */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between h-14 px-8">
            {/* Left Side - Page Title */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {getFilteredNavigationItems().find(item =>
                  item.hasDropdown
                    ? isAnyDropdownItemActive(item.dropdownItems)
                    : isActiveRoute(item.href)
                )?.name || 'Dashboard'}
              </h1>
            </div>
            
            {/* Right Side - Actions & User */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Free Trial Activation Button - Desktop */}
              {!trialTimeLeft && !trialInfo && !hasActivePaidSubscription && (
                <button
                  onClick={() => setShowTrialModal(true)}
                  className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:from-green-100 hover:to-emerald-100 transition-all duration-200"
                  title="Activate Free Trial"
                >
                  <Package className="h-4 w-4" />
                  <span className="font-semibold text-xs">Free Trial</span>
                </button>
              )}

              {/* Trial Already Used - Desktop */}
              {trialTimeLeft?.expired && trialInfo && !hasActivePaidSubscription && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-600"
                  title="Trial Previously Used"
                >
                  <Package className="h-4 w-4" />
                  <span className="font-semibold text-xs">Trial Used</span>
                </motion.div>
              )}

              {/* Trial Active Indicator - Desktop */}
              {trialTimeLeft && !trialTimeLeft.expired && (
                <motion.button
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => setShowTrialInfoPopup(true)}
                  className="hidden sm:flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="w-2 h-2 rounded-full animate-pulse bg-green-500"></div>
                  <span className="font-semibold text-xs whitespace-nowrap">
                    {trialTimeLeft.days}d {trialTimeLeft.hours}h left
                  </span>
                </motion.button>
              )}

              {/* Trial Expired Indicator - Desktop */}
              {trialTimeLeft?.expired && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="hidden sm:flex items-center space-x-2 px-2.5 py-1.5 bg-gradient-to-r from-red-50 to-red-100 border border-red-300 rounded-lg text-red-700"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="font-semibold text-xs whitespace-nowrap">Trial Ended</span>
                  <button
                    onClick={() => navigate('/admin/subscription-selection')}
                    className="ml-1 px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition-colors"
                  >
                    Upgrade
                  </button>
                </motion.div>
              )}


              {/* Global Branch Selector (compact) */}
              <div className="hidden lg:block w-48">
                <BranchSelector />
              </div>

              {/* Notifications */}
              <div className="flex items-center">
                <HeaderNotifications />
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-2 py-1.5 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-sm">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{user?.firstName}</span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <Link
                        to="/admin/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4 mr-3 text-gray-400" />
                        Profile
                      </Link>
                      <Link
                        to="/admin/settings"
                        className="flex items-center px-4 py-2 text-sm transition-colors text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="h-4 w-4 mr-3 text-gray-400" />
                        Settings
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area - Scrollable independently */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="py-6">
            <div className="max-w-full mx-auto px-6">
              {/* Subscription Status Indicator */}
              <SubscriptionStatusIndicator />
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Token Expiry Modal */}
      <TokenExpiryModal
        isOpen={showExpiryModal}
        onClose={closeExpiryModal}
        onRefresh={handleRefreshToken}
      />

      {/* Free Trial Modal */}
      <FreeTrialModal
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        onTrialActivated={handleTrialActivated}
      />

      {/* Default Branch Modal */}
      <DefaultBranchModal
        isOpen={showDefaultBranchModal}
        onClose={() => setShowDefaultBranchModal(false)}
        onBranchCreated={handleBranchCreated}
        pgId={pgId}
      />

      {/* PG Configuration Modal */}
      <PGConfigurationModal 
        isOpen={showPGConfigModal} 
        onClose={() => setShowPGConfigModal(false)}
        onConfigured={handlePGConfigured}
      />

      {/* Free Trial Info Popup */}
      <AnimatePresence>
        {showTrialInfoPopup && trialTimeLeft && !trialTimeLeft.expired && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTrialInfoPopup(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
            />
            
            {/* Popup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full animate-pulse bg-white"></div>
                    <h3 className="font-bold text-lg">Free Trial Active</h3>
                  </div>
                  <button
                    onClick={() => setShowTrialInfoPopup(false)}
                    className="text-white/90 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                {/* Time Remaining */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Time Remaining</span>
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-green-700">
                      {trialTimeLeft.days}
                    </span>
                    <span className="text-lg font-semibold text-green-600">days</span>
                    <span className="text-3xl font-bold text-green-700">
                      {trialTimeLeft.hours}
                    </span>
                    <span className="text-lg font-semibold text-green-600">hours</span>
                  </div>
                  {trialTimeLeft.minutes > 0 && (
                    <div className="mt-1 text-sm text-gray-600">
                      {trialTimeLeft.minutes} minutes
                    </div>
                  )}
                </div>

                {/* Trial Details */}
                {trialInfo && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Trial Period</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {trialInfo.trialPeriod} days
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Days Used</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {trialInfo.daysUsed} days
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Days Remaining</span>
                      <span className="text-sm font-semibold text-green-600">
                        {trialInfo.daysRemaining} days
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">Expires On</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(trialInfo.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                {trialInfo && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Trial Progress</span>
                      <span className="font-semibold">
                        {Math.round((trialInfo.daysUsed / trialInfo.trialPeriod) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((trialInfo.daysUsed / trialInfo.trialPeriod) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => {
                    setShowTrialInfoPopup(false);
                    navigate('/admin/subscription-selection');
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Upgrade Now
                </button>

                {/* Info Text */}
                <p className="text-xs text-center text-gray-500">
                  Upgrade before trial ends to continue using all features
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLayout; 