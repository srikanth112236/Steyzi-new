import React, { useState, useEffect, useCallback } from 'react';
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
  Calculator
} from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import TokenExpiryModal from '../components/common/TokenExpiryModal';
import { useTokenExpiry } from '../hooks/useTokenExpiry';
import BranchSelector from '../components/common/BranchSelector';
import { selectSelectedBranch } from '../store/slices/branch.slice';
import HeaderNotifications from '../components/common/HeaderNotifications';
// import SubscriptionStatusBanner from '../components/common/SubscriptionStatusBanner';
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
  const { user, subscription } = useSelector((state) => state.auth);
  const selectedBranch = useSelector(selectSelectedBranch);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasModule, allowsMultipleBranches, canPerformActionOnSubmodule } = useSubscription();

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
        const now = new Date();
        const trialStart = new Date(subscription.startDate);
        const trialEnd = new Date(subscription.trialEndDate);
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
      name: 'Resident Management',
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
      name: 'Usage Dashboard',
      href: '/admin/usage-dashboard',
      icon: BarChart3
    },
    {
      name: 'Self-Service Portal',
      href: '/admin/self-service',
      icon: Shield
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings
    }
  ];

  // Filter navigation items based on subscription restrictions
  const getFilteredNavigationItems = () => {
    // During trial period, show ALL navigation items
    if (subscription?.billingCycle === 'trial' || subscription?.isTrialActive) {
      console.log('🎉 Trial period active - showing all navigation items');
      return navigationItems;
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

        return item;
      })
      .filter(item => {
        // Remove Resident Management if no dropdown items remain
        if (item.name === 'Resident Management' && item.hasDropdown) {
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
    return expandedDropdowns.has(itemName);
  };

  const isAnyDropdownItemActive = (dropdownItems) => {
    return dropdownItems?.some(item => isActiveRoute(item.href));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-100 transition-all duration-300 ease-in-out flex flex-col ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center w-full' : 'space-x-2'}`}>
            {!sidebarCollapsed && (
              <>
                <div className="text-xl font-bold tracking-tight text-gray-800">PG Admin</div>
                <button 
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </>
            )}
            {sidebarCollapsed && (
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

       
        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto custom-scrollbar px-2 py-4 ${
          sidebarCollapsed ? 'scrollbar-hide' : ''
        }`}>
          <div className="space-y-1">
            {getFilteredNavigationItems().map((item) => {
              const isActive = item.hasDropdown
                ? isAnyDropdownItemActive(item.dropdownItems)
                : isActiveRoute(item.href);
              
              return (
                <div key={item.name} className="group">
                  {item.hasDropdown ? (
                    // Dropdown Item
                    <div>
                      <button
                        onClick={() => toggleDropdown(item.name)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 mr-3 ${
                            isActive ? 'text-blue-600' : 'text-gray-500'
                          }`}
                        />
                        {!sidebarCollapsed && (
                          <>
                            <div className="flex-1 text-left">{item.name}</div>
                            {isDropdownExpanded(item.name) ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </>
                        )}
                      </button>
                      
                      {/* Dropdown Content */}
                      {!sidebarCollapsed && isDropdownExpanded(item.name) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.dropdownItems.map((dropdownItem) => {
                            const isDropdownItemActive = isActiveRoute(dropdownItem.href);
                            return (
                              <Link
                                key={dropdownItem.name}
                                to={dropdownItem.href}
                                className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                  isDropdownItemActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                <dropdownItem.icon
                                  className={`h-4 w-4 mr-3 ${
                                    isDropdownItemActive ? 'text-blue-600' : 'text-gray-500'
                                  }`}
                                />
                                <div>{dropdownItem.name}</div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Regular Item
                    <Link
                      to={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 mr-3 ${
                          isActive ? 'text-blue-600' : 'text-gray-500'
                        }`}
                      />
                      {!sidebarCollapsed && <div>{item.name}</div>}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

       
        {/* User Profile */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <img 
                src={user?.profilePicture || 'https://via.placeholder.com/40'} 
                alt="User" 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user?.email}
                </div>
                <div className="text-xs font-medium text-blue-600 capitalize">
                  {user?.role}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {getFilteredNavigationItems().find(item =>
                    item.hasDropdown
                      ? isAnyDropdownItemActive(item.dropdownItems)
                      : isActiveRoute(item.href)
                  )?.name || 'Dashboard'}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Free Trial Activation Button - Desktop */}
              {!trialTimeLeft && !trialInfo && !hasActivePaidSubscription && (
                <button
                  onClick={() => setShowTrialModal(true)}
                  className="hidden sm:flex items-center space-x-3 px-4 py-2.5 rounded-xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-100 text-green-800 shadow-lg shadow-green-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  title="Activate Free Trial"
                >
                  <Package className="h-5 w-5" />
                  <span className="font-bold text-sm">🎉 Free Trial</span>
                </button>
              )}

              {/* Trial Already Used - Desktop */}
              {trialTimeLeft?.expired && trialInfo && !hasActivePaidSubscription && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="hidden sm:flex items-center space-x-3 px-4 py-2.5 rounded-xl border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-slate-100 text-gray-700 shadow-lg shadow-gray-100"
                  title="Trial Previously Used"
                >
                  <Package className="h-5 w-5" />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">Trial Used</span>
                    <span className="text-xs opacity-75">
                      Ended {new Date(trialInfo.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Trial Active Indicator - Desktop */}
              {trialTimeLeft && !trialTimeLeft.expired && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="hidden sm:flex items-center space-x-3 px-4 py-2.5 rounded-xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-100 text-green-800 shadow-lg shadow-green-100"
                >
                  <div className="w-3 h-3 rounded-full animate-pulse shadow-sm bg-green-500"></div>
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm">🎉 Free Trial Active</span>
                      <span className="text-xs bg-white bg-opacity-50 px-2 py-0.5 rounded-full font-semibold">
                        {trialTimeLeft.days}d {trialTimeLeft.hours}h left
                      </span>
                    </div>
                    {trialInfo && (
                      <span className="text-xs opacity-75">
                        Expires: {trialInfo.endDate.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Trial Expired Indicator - Desktop */}
              {trialTimeLeft?.expired && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="hidden sm:flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl text-red-800 shadow-lg shadow-red-100"
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm shadow-red-300"></div>
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm">⚠️ Trial Ended</span>
                      <span className="text-xs bg-white bg-opacity-50 px-2 py-0.5 rounded-full font-semibold">
                        Action Required
                      </span>
                    </div>
                    <span className="text-xs font-medium mt-1">
                      Upgrade now to continue using all features
                    </span>
                  </div>
                  <button
                    onClick={() => navigate('/admin/subscription-selection')}
                    className="ml-2 px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                  >
                    Upgrade
                  </button>
                </motion.div>
              )}

              {/* Free Trial Activation Button - Mobile */}
              {!trialTimeLeft && !trialInfo && !hasActivePaidSubscription && (
                <button
                  onClick={() => setShowTrialModal(true)}
                  className="flex sm:hidden items-center space-x-2 px-3 py-1.5 rounded-lg border border-green-300 bg-gradient-to-r from-green-50 to-emerald-100 text-green-800 shadow-md hover:shadow-lg transition-all duration-200"
                  title="Activate Free Trial"
                >
                  <Package className="h-4 w-4" />
                  <span className="font-semibold text-sm">🎉 Trial</span>
                </button>
              )}

              {/* Trial Already Used - Mobile */}
              {trialTimeLeft?.expired && trialInfo && !hasActivePaidSubscription && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex sm:hidden items-center space-x-2 px-3 py-1.5 rounded-lg border border-gray-300 bg-gradient-to-r from-gray-50 to-slate-100 text-gray-700 shadow-md"
                  title="Trial Previously Used"
                >
                  <Package className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">Used</span>
                    <span className="text-xs opacity-75">Trial</span>
                  </div>
                </motion.div>
              )}

              {/* Trial Active Indicator - Mobile */}
              {trialTimeLeft && !trialTimeLeft.expired && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex sm:hidden items-center space-x-2 px-3 py-1.5 rounded-lg border border-green-300 bg-gradient-to-r from-green-50 to-emerald-100 text-green-800 shadow-md"
                >
                  <div className="w-2.5 h-2.5 rounded-full animate-pulse bg-green-500"></div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">🎉 Trial Active</span>
                    <span className="text-xs opacity-75">
                      {trialTimeLeft.days}d {trialTimeLeft.hours}h left
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Enhanced Trial Expired Indicator - Mobile */}
              {trialTimeLeft?.expired && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex sm:hidden items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-red-50 to-red-100 border border-red-300 rounded-lg text-red-800 shadow-md shadow-red-100"
                >
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">⚠️ Trial Ended</span>
                    <button
                      onClick={() => navigate('/admin/subscription-selection')}
                      className="text-xs bg-red-600 text-white px-2 py-0.5 rounded mt-0.5 hover:bg-red-700 transition-colors"
                    >
                      Upgrade
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Global Branch Selector (compact) */}
              <div className="hidden sm:block w-64">
                <BranchSelector />
              </div>

              {/* Notifications */}
              <HeaderNotifications />

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{user?.firstName}</span>
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

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-full mx-auto px-6">
              {/* Subscription Status Banner */}
              {/* <SubscriptionStatusBanner /> */}
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
    </div>
  );
};

export default AdminLayout; 