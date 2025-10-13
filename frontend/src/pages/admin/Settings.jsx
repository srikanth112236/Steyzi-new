import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Bell, Building2, Save, Eye, EyeOff, Mail, Phone, MapPin, Globe, Palette, Settings as SettingsIcon, CheckCircle, AlertCircle, CreditCard, Lock, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import BranchManagement from '../../components/admin/BranchManagement';
import PaymentInfoForm from '../../components/admin/PaymentInfoForm';
import PaymentSummary from '../../components/admin/PaymentSummary';
import SubscriptionSelection from '../../components/admin/SubscriptionSelection';
import { selectSelectedBranch } from '../../store/slices/branch.slice';

const Settings = () => {
  const { user } = useSelector((state) => state.auth);
  const selectedBranch = useSelector(selectSelectedBranch);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    language: 'en',
    theme: 'light'
  });
  const [pgData, setPgData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    paymentReminders: true,
    maintenanceUpdates: true,
    newResidentAlerts: true,
    systemUpdates: true
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [hasPG, setHasPG] = useState(false);

  const tabs = [
    {
      id: 'profile',
      name: 'Profile',
      icon: User
    },
    {
      id: 'security',
      name: 'Security',
      icon: Shield
    },
    {
      id: 'subscription',
      name: 'Subscription',
      icon: Package
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell
    },

    {
      id: 'branches',
      name: 'PG Branches',
      icon: Building2
    },
    ...(hasPG ? [{
      id: 'payment-info',
      name: 'Payment Info',
      icon: CreditCard
    }] : [])
  ];

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      navigate('/admin/login');
      return;
    }

    if (user?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/login');
      return;
    }

    // Load settings data
    loadProfileData();
    loadPGData();
    loadPaymentData();
  }, [user, navigate, selectedBranch]);

  const loadPGData = async () => {
    try {
      const response = await api.get('/pg');
      if (response.data.success) {
        const pgData = response.data.data;
        setPgData({
          name: pgData.name || '',
          description: pgData.description || '',
          address: pgData.address || '',
          phone: pgData.phone || '',
          email: pgData.email || ''
        });
        setHasPG(true);
      }
    } catch (error) {
      console.error('Error loading PG data:', error);
    }
  };

  const loadPaymentData = async () => {
    try {
      if (selectedBranch) {
        const response = await api.get(`/payment-info/${selectedBranch._id}`);
        if (response.data.success && response.data.data) {
          const paymentData = response.data.data;
          // Pre-fill payment form with onboarding data
          setPgData(prev => ({
            ...prev,
            paymentInfo: {
              upiId: paymentData.upiId || '',
              upiName: paymentData.upiName || '',
              accountHolderName: paymentData.accountHolderName || '',
              bankName: paymentData.bankName || '',
              accountNumber: paymentData.accountNumber || '',
              ifscCode: paymentData.ifscCode || '',
              gpayNumber: paymentData.gpayNumber || '',
              paytmNumber: paymentData.paytmNumber || '',
              phonepeNumber: paymentData.phonepeNumber || '',
              paymentInstructions: paymentData.paymentInstructions || 'Please make payment and upload screenshot for verification.'
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
    }
  };

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Debug: Check if token exists
      const token = localStorage.getItem('accessToken');
      console.log('🔍 Debug: Token exists:', !!token);
      
      // Load user profile
      const response = await api.get('/users/profile');
      console.log('✅ Profile loaded:', response.data);
      
      if (response.data.success) {
        const { user: userData, pgInfo } = response.data.data;
        
        setProfileData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          language: userData.language || 'en',
          theme: userData.theme || 'light'
        });

       
        // Load notification preferences
        try {
          const notifResponse = await api.get('/users/notifications');
          console.log('✅ Notifications loaded:', notifResponse.data);
          if (notifResponse.data.success) {
            setNotificationPreferences(notifResponse.data.data.preferences);
          }
        } catch (notifError) {
          console.log('⚠️ Using default notification preferences:', notifError.message);
          // Keep default notification preferences
        }
      }
    } catch (error) {
      console.error('❌ Error loading profile data:', error);
      console.error('❌ Error response:', error.response?.data);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      const response = await api.put('/users/profile', profileData);
      
      if (response.data.success) {
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => toast.error(err));
      } else {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }

      setLoading(true);
      const response = await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      
      if (response.data.success) {
        toast.success('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => toast.error(err));
      } else {
        toast.error(error.response?.data?.message || 'Failed to change password');
      }
    } finally {
      setLoading(false);
    }
  };



  const handleNotificationUpdate = async () => {
    try {
      setLoading(true);
      const response = await api.put('/users/notifications', notificationPreferences);
      
      if (response.data.success) {
        toast.success('Notification preferences updated successfully');
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => toast.error(err));
      } else {
        toast.error(error.response?.data?.message || 'Failed to update notification preferences');
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Check if user is admin
  if (!user || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 leading-relaxed">Admin privileges required to access settings.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedBranch?.isDefault) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Settings available only for default branch</h2>
          <p className="text-gray-600 mb-4">Please select your default branch from the header branch selector to manage settings.</p>
          <div className="text-sm text-gray-500">Current branch: <span className="font-medium">{selectedBranch?.name || 'None'}</span></div>
        </div>
      </div>
    );
  }

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Compact Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
          <User className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Profile Settings</h3>
        <p className="text-gray-600 text-sm max-w-xl mx-auto">
          Manage your personal information and account details.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information - Compact */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Personal Information</h4>
              <p className="text-sm text-gray-600">Update your personal details</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="pg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="new"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="lkjoih@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="3214569874"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preferences - Compact */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
              <SettingsIcon className="h-5 w-5 text-white" />
            </div>
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Preferences</h4>
              <p className="text-sm text-gray-600">Customize your experience</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={profileData.language}
                  onChange={(e) => setProfileData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="hi">🇮🇳 Hindi</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Theme</label>
              <div className="relative">
                <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={profileData.theme}
                  onChange={(e) => setProfileData(prev => ({ ...prev, theme: e.target.value }))}
                  className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                >
                  <option value="light">☀️ Light</option>
                  <option value="dark">🌙 Dark</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Quick Settings - Compact */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <div>
                  <h5 className="text-sm font-semibold text-gray-900">Quick Settings</h5>
                  <p className="text-xs text-gray-600">Instant access to common preferences</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                  <div className="text-lg mb-1">🔔</div>
                  <p className="text-xs font-medium text-gray-700">Notifications</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                  <div className="text-lg mb-1">🔒</div>
                  <p className="text-xs font-medium text-gray-700">Privacy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Save Button */}
      <div className="flex justify-center">
        <button
          onClick={handleProfileUpdate}
          disabled={loading}
          className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Save className="h-5 w-5 mr-3" />
          <span>{loading ? 'Saving Changes...' : 'Save Changes'}</span>
          {loading && (
            <div className="ml-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-8">
      <div className="text-center sm:text-left">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Security Settings</h3>
        <p className="text-gray-600 text-lg">Manage your password and security preferences.</p>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h4 className="text-xl font-semibold text-gray-900">Change Password</h4>
              <p className="text-gray-600">Update your password to keep your account secure</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handlePasswordChange}
                disabled={loading}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Shield className="h-5 w-5 mr-3" />
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-8">
      <div className="text-center sm:text-left">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Notification Settings</h3>
        <p className="text-gray-600 text-lg">Configure your email and notification preferences.</p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
              <Bell className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h4 className="text-xl font-semibold text-gray-900">Notification Preferences</h4>
              <p className="text-gray-600">Choose how you want to receive notifications</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-200 bg-gray-50 hover:bg-white">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationPreferences.emailNotifications}
                  onChange={(e) => setNotificationPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-200 bg-gray-50 hover:bg-white">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Phone className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">SMS Notifications</h4>
                  <p className="text-sm text-gray-600">Receive notifications via SMS</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationPreferences.smsNotifications}
                  onChange={(e) => setNotificationPreferences(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-200 bg-gray-50 hover:bg-white">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Payment Reminders</h4>
                  <p className="text-sm text-gray-600">Get notified about payment due dates</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationPreferences.paymentReminders}
                  onChange={(e) => setNotificationPreferences(prev => ({ ...prev, paymentReminders: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-200 bg-gray-50 hover:bg-white">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Maintenance Updates</h4>
                  <p className="text-sm text-gray-600">Get notified about maintenance requests</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationPreferences.maintenanceUpdates}
                  onChange={(e) => setNotificationPreferences(prev => ({ ...prev, maintenanceUpdates: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-8">
            <button
              onClick={handleNotificationUpdate}
              disabled={loading}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Save className="h-5 w-5 mr-3" />
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

 

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'security':
        return renderSecurityTab();
      case 'subscription':
        return <SubscriptionSelection />;
      case 'notifications':
        return renderNotificationsTab();
      
      case 'branches':
        return <BranchManagement />;
      case 'payment-info':
        return (
          <div className="space-y-6">
            <PaymentInfoForm />
            <PaymentSummary />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading && activeTab === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
      
      <div className="relative w-full h-full">
        {/* Modern Header with Glass Effect */}
        <div className="backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <SettingsIcon className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-lg"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-gray-600 text-base font-medium">Manage your account settings and preferences</p>
              </div>
            </div>
            
            {/* User Avatar */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-100px)]">
          {/* Modern Sidebar with Glass Effect */}
          <div className="w-64 backdrop-blur-xl bg-white/70 border-r border-white/20 p-4 shadow-xl">
            <nav className="space-y-3" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group w-full flex items-center space-x-4 p-4 rounded-2xl font-medium text-sm transition-all duration-300 transform hover:scale-[1.02] ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-2xl shadow-blue-500/25 border border-blue-400/20'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-white/60 backdrop-blur-sm border border-transparent hover:border-white/30 hover:shadow-lg'
                    }`}
                  >
                    <div className={`p-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-white/20'
                        : 'bg-gray-100 group-hover:bg-white/80'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="font-semibold text-left">{tab.name}</div>
                  </button>
                );
              })}
            </nav>
            
            {/* Sidebar Footer */}
            <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">All Settings Saved</p>
                  <p className="text-xs text-gray-600">Your preferences are up to date</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area with Enhanced Design */}
          <div className="flex-1 overflow-auto">
            <div className="p-12 max-w-7xl mx-auto">
              <div className="max-w-6xl mx-auto">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 