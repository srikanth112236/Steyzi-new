import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { useAppTheme } from '../../contexts/ThemeContext';

const GlobalHeader = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightComponent,
  style,
  showUserInfo = true,
  visible = true,
  transparent = false,
  elevation = 3,
}) => {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const { theme, isDarkMode, toggleTheme } = useAppTheme();

  // Auto-detect if back button should be shown based on navigation state
  const shouldShowBackButton = showBackButton || router.canGoBack();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  // If not visible, return null
  if (!visible) {
    return null;
  }

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'superadmin': 'Super Admin',
      'admin': 'Admin',
      'support': 'Support',
      'sales_manager': 'Sales Manager',
      'pg_manager': 'Property Manager',
      'user': 'User',
      'resident': 'Resident',
      'staff': 'Staff',
      'default': 'User'
    };
    return roleMap[role] || roleMap['default'];
  };

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={transparent ? 'transparent' : theme.card}
      />
      <View style={[
        styles.container,
        {
          backgroundColor: transparent ? 'transparent' : theme.card,
          shadowOpacity: transparent ? 0 : 0.1,
          elevation: transparent ? 0 : elevation,
        },
        style
      ]}>
        <View style={styles.headerContent}>
          {/* Left Section - Back Button or User Info */}
          <View style={styles.leftSection}>
            {shouldShowBackButton ? (
              <TouchableOpacity
                onPress={handleBackPress}
                style={[styles.backButton, {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  shadowColor: theme.text,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.backIcon, { color: theme.primary }]}>←</Text>
              </TouchableOpacity>
            ) : showUserInfo && (
              <View style={styles.userInfo}>
                <View style={[styles.avatar, {
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }]}>
                  <Text style={[styles.avatarText, { color: theme.card }]}>
                    {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    {user?.lastName?.charAt(0)?.toUpperCase() || ''}
                  </Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={[styles.greeting, { color: theme.secondaryText }]}>
                    Welcome back,
                  </Text>
                  <Text style={[styles.userName, { color: theme.text, fontWeight: '700' }]}>
                    {user?.firstName} {user?.lastName}
                  </Text>
                  <Text style={[styles.userRole, {
                    color: theme.primary,
                    fontWeight: '600',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }]}>
                    {getRoleDisplayName(user?.role)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Center Section - Title/Subtitle */}
          {(title || subtitle) && (
            <View style={styles.centerSection}>
              {title && (
                <Text style={[styles.title, { color: theme.text }]}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                  {subtitle}
                </Text>
              )}
            </View>
          )}

          {/* Right Section - Theme Toggle & Other Actions */}
          <View style={styles.rightSection}>
            {rightComponent}
            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.themeToggle, {
                backgroundColor: theme.card,
                borderColor: theme.border,
                shadowColor: theme.text,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.themeIcon, { color: theme.primary }]}>
                {isDarkMode ? '☀️' : '🌙'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 16,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '700',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  userDetails: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    marginBottom: 3,
    opacity: 0.8,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 1,
    letterSpacing: -0.3,
  },
  userRole: {
    fontSize: 11,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 3,
    opacity: 0.8,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  themeIcon: {
    fontSize: 20,
  },
});

export default GlobalHeader;
