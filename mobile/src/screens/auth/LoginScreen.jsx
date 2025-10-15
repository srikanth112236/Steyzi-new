import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/authSlice';
import { useAppTheme } from '../../contexts/ThemeContext';
import { Button, Input } from '../../components/ui';
import NetInfo from '@react-native-community/netinfo';

const ALLOWED_ROLES = [
  'admin', 
  'superadmin', 
  'support', 
  'sales_manager', 
  'pg_manager'
];

const LoginScreen = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [loginStatus, setLoginStatus] = useState(null);

  const router = useRouter();
  const dispatch = useDispatch();
  const { error, loading, user, isAuthenticated } = useSelector((state) => state.auth);
  const { theme } = useAppTheme();

  // Refs to manage focus
  const passwordInputRef = useRef(null);

  // Effect to handle authentication changes
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Authentication successful:', user);
      setLoginStatus('success');
      
      // Redirect based on user role
      if (ALLOWED_ROLES.includes(user.role)) {
        router.replace('/dashboard');
      } else {
        setGlobalError('You do not have permission to access the dashboard.');
        dispatch({ type: 'auth/logout' });
      }
    }
  }, [isAuthenticated, user, router, dispatch]);

  // Effect to handle login errors
  useEffect(() => {
    if (error) {
      console.error('Login error:', error);
      setLoginStatus('error');
      setGlobalError(error);
    }
  }, [error]);

  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const checkNetworkConnectivity = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      const isConnected = state.isConnected && state.isInternetReachable;
      setNetworkError(!isConnected);
      return isConnected;
    } catch (error) {
      console.error('Network connectivity check failed:', error);
      setNetworkError(true);
      return false;
    }
  }, []);

  const validateForm = useCallback(() => {
    let isValid = true;

    if (!formData.email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!formData.password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  }, [formData, validateEmail]);

  const handleLogin = useCallback(async () => {
    // Dismiss keyboard
    Keyboard.dismiss();

    // Reset previous states
    setNetworkError(false);
    setGlobalError(null);
    setLoginStatus(null);
    dispatch(clearError());

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Check network connectivity
    const isNetworkAvailable = await checkNetworkConnectivity();
    if (!isNetworkAvailable) {
      setNetworkError(true);
      setGlobalError('No internet connection. Please check your network settings.');
      return;
    }

    // Set loading state
    setIsLoading(true);

    try {
      // Attempt login
      await dispatch(loginUser({
        email: formData.email.trim(),
        password: formData.password.trim()
      })).unwrap();
    } catch (error) {
      console.error('Login attempt error:', error);
      setGlobalError(error?.message || 'Login failed. Please try again.');
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  }, [dispatch, formData, validateForm, checkNetworkConnectivity]);

  const handleEmailSubmit = () => {
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  };

  // Role Display Helper
  const getRoleDisplayName = (role) => {
    const roleMap = {
      'superadmin': 'Super Administrator',
      'admin': 'Administrator',
      'support': 'Support Staff',
      'sales_manager': 'Sales Manager',
      'pg_manager': 'Property Manager',
      'default': 'User'
    };
    return roleMap[role] || roleMap['default'];
  };

  // Status Modal Component
  const LoginStatusModal = () => {
    if (!loginStatus) return null;

    return (
      <Modal
        transparent={true}
        animationType="slide"
        visible={!!loginStatus}
        onRequestClose={() => setLoginStatus(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {loginStatus === 'success' && (
              <>
                <Text style={[styles.modalTitle, { color: theme.statusColors.success.text }]}>
                  Login Successful
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.text }]}>
                  Welcome, {getRoleDisplayName(user?.role)}!
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.secondaryText, fontSize: 14 }]}>
                  Redirecting to dashboard...
                </Text>
              </>
            )}

            {loginStatus === 'error' && (
              <>
                <Text style={[styles.modalTitle, { color: theme.statusColors.danger.text }]}>
                  Login Failed
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.text }]}>
                  {globalError || 'Unable to log in'}
                </Text>
              </>
            )}

            <ActivityIndicator 
              size="large" 
              color={loginStatus === 'success' ? theme.statusColors.success.text : theme.statusColors.danger.text} 
              style={styles.modalSpinner}
            />

            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setLoginStatus(null)}
            >
              <Text style={{ color: theme.primary }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={[styles.logo, { backgroundColor: theme.primary }]}>
              <Text style={[styles.logoText, { color: theme.card }]}>🏢</Text>
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Admin Portal</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              Secure access for administrators only
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Input
              label="Email Address"
              value={formData.email}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, email: text }));
                if (emailError) setEmailError('');
              }}
              placeholder="Enter your admin email"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={handleEmailSubmit}
              error={emailError}
              style={styles.input}
            />

            <Input
              ref={passwordInputRef}
              label="Password"
              value={formData.password}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, password: text }));
                if (passwordError) setPasswordError('');
              }}
              placeholder="Enter your password"
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              error={passwordError}
              style={styles.input}
            />

            {/* Loading Indicator */}
            {(isLoading || loading) && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator 
                  size="large" 
                  color={theme.primary} 
                />
                <Text style={[styles.loadingText, { color: theme.text }]}>
                  Logging in...
                </Text>
              </View>
            )}

            {/* Login Button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              disabled={isLoading || loading}
              style={styles.loginButton}
              size="large"
            />

            {/* Error Messages */}
            {networkError && (
              <View style={[styles.errorContainer, { backgroundColor: theme.statusColors.danger.background }]}>
                <Text style={[styles.errorText, { color: theme.statusColors.danger.text }]}>
                  No internet connection. Please check your network settings.
                </Text>
              </View>
            )}

            {globalError && (
              <View style={[styles.errorContainer, { backgroundColor: theme.statusColors.danger.background }]}>
                <Text style={[styles.errorText, { color: theme.statusColors.danger.text }]}>
                  {globalError}
                </Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.secondaryText }]}>
              Need help? Contact support
            </Text>
          </View>
        </View>

        {/* Login Status Modal */}
        <LoginStatusModal />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  formSection: {
    width: '100%',
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
  },
  
  // New Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSpinner: {
    marginBottom: 20,
  },
  modalCloseButton: {
    padding: 10,
  },
});

export default LoginScreen;
