import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  MessageSquare, 
  User, 
  LogOut,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Home,
  Activity,
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import TokenExpiryModal from '../components/common/TokenExpiryModal';
import { useTokenExpiry } from '../hooks/useTokenExpiry';

const SupportLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [expandedDropdowns, setExpandedDropdowns] = useState(new Set());

  // Token expiry handling
  const {
    showExpiryModal,
    closeExpiryModal,
    handleRefreshToken,
  } = useTokenExpiry();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/support/dashboard',
      icon: Home
    },
    {
      name: 'Tickets',
      icon: MessageSquare,
      hasDropdown: true,
      dropdownItems: [
        {
          name: 'All Tickets',
          href: '/support/tickets',
          icon: FileText
        },
        {
          name: 'My Assigned',
          href: '/support/tickets/assigned',
          icon: Activity
        },
        {
          name: 'Ticket Analytics',
          href: '/support/tickets/analytics',
          icon: BarChart3
        }
      ]
    },
    {
      name: 'Settings',
      href: '/support/settings',
      icon: Settings
    },
    {
      name: 'Profile',
      href: '/support/profile',
      icon: User
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/support-login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActiveRoute = (href) => {
    return location.pathname === href;
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
    return dropdownItems.some(item => isActiveRoute(item.href));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarCollapsed(true)}
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-2xl border-r border-gray-200 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between px-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="ml-3">
                  <span className="text-lg font-bold text-white">Support</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:hidden p-1 rounded text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.hasDropdown 
                ? isAnyDropdownItemActive(item.dropdownItems)
                : isActiveRoute(item.href);

              return (
                <div key={item.name}>
                  {item.hasDropdown ? (
                    // Dropdown Item
                    <div>
                      <button
                        onClick={() => toggleDropdown(item.name)}
                        className={`w-full group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 transition-all duration-200 ${
                            isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                          }`}
                        />
                        {!sidebarCollapsed && (
                          <>
                            <div className="flex-1 ml-3 text-left">
                              <div className="font-medium">{item.name}</div>
                            </div>
                            {isDropdownExpanded(item.name) ? (
                              <ChevronDown className="h-4 w-4 text-gray-400 transition-transform duration-200" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400 transition-transform duration-200" />
                            )}
                          </>
                        )}
                      </button>
                      
                      {/* Dropdown Content */}
                      {!sidebarCollapsed && isDropdownExpanded(item.name) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-6 mt-2 space-y-1"
                        >
                          {item.dropdownItems.map((dropdownItem) => {
                            const isDropdownItemActive = isActiveRoute(dropdownItem.href);
                            return (
                              <Link
                                key={dropdownItem.name}
                                to={dropdownItem.href}
                                className={`group flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                                  isDropdownItemActive
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                              >
                                <dropdownItem.icon
                                  className={`h-4 w-4 transition-all duration-200 ${
                                    isDropdownItemActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                                  }`}
                                />
                                <div className="ml-3">
                                  <div className="font-medium">{dropdownItem.name}</div>
                                </div>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    // Regular Item
                    <Link
                      to={item.href}
                      className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 transition-all duration-200 ${
                          isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                        }`}
                      />
                      {!sidebarCollapsed && (
                        <div className="flex-1 ml-3">
                          <div className="font-medium">{item.name}</div>
                        </div>
                      )}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User info at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <p className="text-xs text-blue-600 font-medium capitalize">
                    Support Staff
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-0' : 'ml-0'
      }`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-all duration-200"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {navigation.find(item => 
                    item.hasDropdown 
                      ? isAnyDropdownItemActive(item.dropdownItems)
                      : isActiveRoute(item.href)
                  )?.name || 'Dashboard'}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
              </button>

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
                        to="/support/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4 mr-3 text-gray-400" />
                        Profile
                      </Link>
                      <Link
                        to="/support/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
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
    </div>
  );
};

export default SupportLayout; 