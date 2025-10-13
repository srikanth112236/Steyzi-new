import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  HeadphonesIcon,
  UserPlus,
  Shield,
  Lock,
  Unlock,
  ChevronDown,
  Calendar,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import SupportStaffForm from '../../components/superadmin/SupportStaffForm';

// Modern Dropdown Component
const DropdownMenu = ({ trigger, children, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 ${
              align === 'left' ? 'left-0' : 'right-0'
            }`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DropdownItem = ({ icon: Icon, children, onClick, className = '', danger = false }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors ${
      danger 
        ? 'text-red-700 hover:bg-red-50' 
        : 'text-gray-700 hover:bg-gray-50'
    } ${className}`}
  >
    {Icon && <Icon className={`h-4 w-4 mr-3 ${danger ? 'text-red-500' : 'text-gray-500'}`} />}
    {children}
  </button>
);

// Enhanced Avatar Component
const UserAvatar = ({ name, size = 'md', status = 'active', className = '' }) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg'
  };

  const colors = [
    'from-blue-500 to-blue-600', 
    'from-purple-500 to-purple-600', 
    'from-green-500 to-green-600', 
    'from-red-500 to-red-600',
    'from-yellow-500 to-yellow-600', 
    'from-pink-500 to-pink-600', 
    'from-indigo-500 to-indigo-600', 
    'from-teal-500 to-teal-600'
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getColorFromName = (name) => {
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizes[size]} bg-gradient-to-br ${getColorFromName(name)} rounded-full flex items-center justify-center text-white font-semibold shadow-sm`}>
        {getInitials(name)}
      </div>
      {/* Status indicator */}
      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
        status === 'active' ? 'bg-green-400' : 
        status === 'locked' ? 'bg-red-400' : 
        'bg-gray-400'
      }`}></div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status, failedAttempts = 0 }) => {
  if (failedAttempts > 0) {
    return (
      <div className="flex items-center space-x-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          {failedAttempts} failed attempts
        </span>
      </div>
    );
  }

  const statusConfig = {
    active: {
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800',
      text: 'Active'
    },
    inactive: {
      icon: XCircle,
      className: 'bg-red-100 text-red-800',
      text: 'Inactive'
    },
    locked: {
      icon: Lock,
      className: 'bg-red-100 text-red-800',
      text: 'Locked'
    }
  };

  const config = statusConfig[status] || statusConfig.inactive;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.text}
    </span>
  );
};

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Enhanced mock data with realistic user information
  const users = [
    {
      id: 1,
      name: 'Srikanth Test',
      email: 'srikanth112236@gmail.com',
      phone: '+91 98765 43210',
      role: 'superadmin',
      status: 'active',
      pg: 'System Admin',
      lastLogin: '2 hours ago',
      failedAttempts: 2,
      createdAt: '2025-08-02T17:58:43Z',
      loginAttempts: '2 / 5'
    },
    {
      id: 2,
      name: 'Test User',
      email: 'test.srikanth112236@gmail.com',
      phone: '+91 98765 43211',
      role: 'admin',
      status: 'active',
      pg: 'Green Valley PG',
      lastLogin: '1 day ago',
      failedAttempts: 3,
      createdAt: '2025-08-02T20:29:51Z',
      loginAttempts: '3 / 5'
    },
    {
      id: 3,
      name: 'Test Test',
      email: 'test@gmail.com',
      phone: '+91 98765 43212',
      role: 'superadmin',
      status: 'active',
      pg: 'System Admin',
      lastLogin: '3 hours ago',
      failedAttempts: 0,
      createdAt: '2025-08-03T09:51:55Z',
      loginAttempts: '0 / 5'
    },
    {
      id: 4,
      name: 'Test PG',
      email: 'testpg@gmail.com',
      phone: '+91 98765 43213',
      role: 'admin',
      status: 'active',
      pg: 'Sunshine PG',
      lastLogin: '5 hours ago',
      failedAttempts: 0,
      createdAt: '2025-08-03T10:01:36Z',
      loginAttempts: '0 / 5'
    },
    {
      id: 5,
      name: 'TestPGOne User',
      email: 'testpgone@gmail.com',
      phone: '+91 98765 43214',
      role: 'admin',
      status: 'active',
      pg: 'Royal PG',
      lastLogin: '1 day ago',
      failedAttempts: 0,
      createdAt: '2025-08-03T10:32:05Z',
      loginAttempts: '0 / 5'
    },
    {
      id: 6,
      name: 'TestPGTwo User',
      email: 'testpgtwo@gmail.com',
      phone: '+91 98765 43215',
      role: 'admin',
      status: 'active',
      pg: 'Elite PG',
      lastLogin: '2 days ago',
      failedAttempts: 0,
      createdAt: '2025-08-03T11:32:18Z',
      loginAttempts: '0 / 5'
    }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user?.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role) => {
    const badges = {
      superadmin: { 
        className: 'bg-purple-100 text-purple-800 border-purple-200', 
        icon: Shield 
      },
      admin: { 
        className: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: UserPlus 
      },
      user: { 
        className: 'bg-green-100 text-green-800 border-green-200', 
        icon: Globe 
      },
      support: { 
        className: 'bg-orange-100 text-orange-800 border-orange-200', 
        icon: HeadphonesIcon 
      }
    };
    return badges[role] || { className: 'bg-gray-100 text-gray-800 border-gray-200', icon: Globe };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleUserAction = (action, user) => {
    console.log(`${action} action for user:`, user);
    // Implement user actions here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-600 text-lg">Manage user accounts and unlock locked accounts</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <button 
                onClick={() => setShowSupportForm(true)}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <HeadphonesIcon className="h-5 w-5 mr-2" />
                Add Support Staff
              </button>
              
              <button 
                onClick={() => setLoading(!loading)}
                className="inline-flex items-center justify-center px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Modern Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Role Filter */}
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="all">All Roles</option>
                  <option value="superadmin">Superadmin</option>
                  <option value="admin">Admin</option>
                  <option value="support">Support Staff</option>
                  <option value="user">User</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="locked">Locked</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Modern Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-gray-500" />
                Users ({filteredUsers.length})
              </h2>
            </div>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Login Attempts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <UserAvatar 
                          name={user.name} 
                          status={user.status}
                          size="md" 
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const badge = getRoleBadge(user?.role);
                        const Icon = badge.icon;
                        return (
                          <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium border ${badge.className}`}>
                            <Icon className="h-3 w-3 mr-1.5" />
                            {user?.role}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge 
                        status={user.status} 
                        failedAttempts={user.failedAttempts}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-mono">
                        {user.loginAttempts}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu
                        trigger={
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </button>
                        }
                      >
                        <DropdownItem
                          icon={Eye}
                          onClick={() => handleUserAction('view', user)}
                        >
                          View Details
                        </DropdownItem>
                        <DropdownItem
                          icon={Edit}
                          onClick={() => handleUserAction('edit', user)}
                        >
                          Edit User
                        </DropdownItem>
                        <DropdownItem
                          icon={Mail}
                          onClick={() => handleUserAction('email', user)}
                        >
                          Send Email
                        </DropdownItem>
                        {user.failedAttempts > 0 && (
                          <DropdownItem
                            icon={Unlock}
                            onClick={() => handleUserAction('unlock', user)}
                          >
                            Unlock Account
                          </DropdownItem>
                        )}
                        <DropdownItem
                          icon={Trash2}
                          onClick={() => handleUserAction('delete', user)}
                          danger
                        >
                          Delete User
                        </DropdownItem>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden">
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <UserAvatar 
                        name={user.name} 
                        status={user.status}
                        size="lg" 
                      />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu
                      trigger={
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="h-5 w-5 text-gray-500" />
                        </button>
                      }
                      align="left"
                    >
                      <DropdownItem
                        icon={Eye}
                        onClick={() => handleUserAction('view', user)}
                      >
                        View Details
                      </DropdownItem>
                      <DropdownItem
                        icon={Edit}
                        onClick={() => handleUserAction('edit', user)}
                      >
                        Edit User
                      </DropdownItem>
                      <DropdownItem
                        icon={Mail}
                        onClick={() => handleUserAction('email', user)}
                      >
                        Send Email
                      </DropdownItem>
                      {user.failedAttempts > 0 && (
                        <DropdownItem
                          icon={Unlock}
                          onClick={() => handleUserAction('unlock', user)}
                        >
                          Unlock Account
                        </DropdownItem>
                      )}
                      <DropdownItem
                        icon={Trash2}
                        onClick={() => handleUserAction('delete', user)}
                        danger
                      >
                        Delete User
                      </DropdownItem>
                    </DropdownMenu>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">Role</div>
                      {(() => {
                        const badge = getRoleBadge(user?.role);
                        const Icon = badge.icon;
                        return (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${badge.className}`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {user?.role}
                          </span>
                        );
                      })()}
                    </div>
                    
                    <div>
                      <div className="text-gray-500 mb-1">Status</div>
                      <StatusBadge 
                        status={user.status} 
                        failedAttempts={user.failedAttempts}
                      />
                    </div>
                    
                    <div>
                      <div className="text-gray-500 mb-1">Login Attempts</div>
                      <div className="font-mono text-gray-900">
                        {user.loginAttempts}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-500 mb-1">Created</div>
                      <div className="text-gray-900">
                        {formatDate(user.createdAt)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Support Staff Form Modal */}
        <SupportStaffForm
          isOpen={showSupportForm}
          onClose={() => setShowSupportForm(false)}
          onSuccess={() => {
            // Refresh user list or show success message
            console.log('Support staff added successfully');
          }}
        />
      </div>
    </div>
  );
};

export default Users; 