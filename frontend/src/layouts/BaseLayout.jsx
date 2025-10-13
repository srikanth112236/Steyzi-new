import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, 
  Menu, 
  X, 
  Bell,
  User,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const BaseLayout = ({ 
  navigationItems = [], 
  brandConfig = {}, 
  userMenuItems = [],
  onLogout
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [expandedDropdowns, setExpandedDropdowns] = useState(new Set());
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const defaultBrandConfig = {
    icon: User,
    title: 'Dashboard',
    subtitle: 'Management Portal',
    iconBgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    activeColor: 'bg-blue-50 text-blue-700 border-blue-600',
    userBadgeColor: 'text-blue-600'
  };

  const brand = { ...defaultBrandConfig, ...brandConfig };

  const handleLogout = async () => {
    try {
      if (onLogout) {
        await onLogout();
      } else {
        await dispatch(logout()).unwrap();
        toast.success('Logged out successfully');
        navigate('/login');
      }
    } catch (error) {
      toast.error('Logout failed');
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

  const defaultUserMenuItems = [
    {
      name: 'Profile Settings',
      href: '/profile',
      icon: User
    },
    {
      name: 'Account Settings',
      href: '/settings',
      icon: Settings
    },
    {
      name: 'Help & Support',
      href: '/help',
      icon: HelpCircle
    }
  ];

  const finalUserMenuItems = userMenuItems.length > 0 ? userMenuItems : defaultUserMenuItems;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-2xl border-r border-gray-100 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 ${brand.iconBgColor.replace('bg-blue-100', 'bg-blue-600')} rounded-xl shadow-lg`}>
                <brand.icon className={`h-5 w-5 ${brand.iconColor.replace('text-blue-600', 'text-white')}`} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900">{brand.title}</h1>
                <p className="text-xs text-gray-600">{brand.subtitle}</p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="flex justify-center w-full">
              <div className={`p-2.5 ${brand.iconBgColor.replace('bg-blue-100', 'bg-blue-600')} rounded-xl shadow-lg`}>
                <brand.icon className={`h-5 w-5 ${brand.iconColor.replace('text-blue-600', 'text-white')}`} />
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-2">
            {navigationItems.map((item) => {
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
                            ? brand.activeColor + ' border border-blue-200 shadow-sm'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 transition-all duration-200 ${
                            isActive ? brand.iconColor : 'text-gray-500 group-hover:text-blue-600'
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
                          ? brand.activeColor + ' border border-blue-200 shadow-sm'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 transition-all duration-200 ${
                          isActive ? brand.iconColor : 'text-gray-500 group-hover:text-blue-600'
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
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 ${brand.iconBgColor.replace('bg-blue-100', 'bg-blue-600')} rounded-full flex items-center justify-center shadow-md`}>
                <brand.icon className={`h-4 w-4 ${brand.iconColor.replace('text-blue-600', 'text-white')}`} />
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <p className={`text-xs ${brand.userBadgeColor} font-medium capitalize`}>
                  {user?.role}
                </p>
              </div>
            )}
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
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {navigationItems.find(item => 
                    item.hasDropdown 
                      ? isAnyDropdownItemActive(item.dropdownItems)
                      : isActiveRoute(item.href)
                  )?.name || 'Dashboard'}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
                <Bell className="h-5 w-5" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  <div className={`w-8 h-8 ${brand.iconBgColor.replace('bg-blue-100', 'bg-blue-600')} rounded-full flex items-center justify-center shadow-md`}>
                    <brand.icon className={`h-4 w-4 ${brand.iconColor.replace('text-blue-600', 'text-white')}`} />
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
                      {finalUserMenuItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <item.icon className="h-4 w-4 mr-3 text-gray-400" />
                          {item.name}
                        </Link>
                      ))}
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
    </div>
  );
};

export default BaseLayout; 