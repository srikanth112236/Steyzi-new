import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useAppTheme } from '../../contexts/ThemeContext';
import { GlobalHeader, ListItem, ActionButton } from '../../components/ui';
import { ROLES } from '../../constants/roles';

const SettingsScreen = () => {
  const { theme, isDarkMode, toggleTheme } = useAppTheme();
  const { user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  const getSettingsSections = () => {
    const baseSettings = [
      {
        title: 'Account',
        items: [
          {
            id: 'profile',
            title: 'Profile Settings',
            subtitle: 'Update your personal information',
            icon: '👤',
            action: 'profile',
          },
          {
            id: 'security',
            title: 'Security',
            subtitle: 'Password, 2FA, and privacy',
            icon: '🔒',
            action: 'security',
          },
          {
            id: 'notifications',
            title: 'Notifications',
            subtitle: 'Manage notification preferences',
            icon: '🔔',
            action: 'notifications',
            rightComponent: (
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: theme.secondaryText + '40', true: theme.primary + '40' }}
                thumbColor={notifications ? theme.primary : theme.secondaryText}
              />
            ),
          },
        ],
      },
      {
        title: 'App Preferences',
        items: [
          {
            id: 'appearance',
            title: 'Appearance',
            subtitle: 'Theme and display settings',
            icon: '🎨',
            action: 'appearance',
            rightComponent: (
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.secondaryText + '40', true: theme.primary + '40' }}
                thumbColor={isDarkMode ? theme.primary : theme.secondaryText}
              />
            ),
          },
          {
            id: 'language',
            title: 'Language',
            subtitle: 'Choose your language',
            icon: '🌍',
            action: 'language',
            rightText: 'English',
          },
          {
            id: 'biometrics',
            title: 'Biometric Login',
            subtitle: 'Use fingerprint or face ID',
            icon: '👆',
            action: 'biometrics',
            rightComponent: (
              <Switch
                value={biometrics}
                onValueChange={setBiometrics}
                trackColor={{ false: theme.secondaryText + '40', true: theme.primary + '40' }}
                thumbColor={biometrics ? theme.primary : theme.secondaryText}
              />
            ),
          },
        ],
      },
    ];

    const roleSpecificSettings = {
      [ROLES.SUPER_ADMIN]: [
        {
          title: 'System Administration',
          items: [
            {
              id: 'system_config',
              title: 'System Configuration',
              subtitle: 'Global system settings',
              icon: '⚙️',
              action: 'system_config',
            },
            {
              id: 'user_management',
              title: 'User Management',
              subtitle: 'Manage users and roles',
              icon: '👥',
              action: 'user_management',
            },
          ],
        },
      ],
      [ROLES.ADMIN]: [
        {
          title: 'Admin Settings',
          items: [
            {
              id: 'property_settings',
              title: 'Property Settings',
              subtitle: 'Configure property details',
              icon: '🏢',
              action: 'property_settings',
            },
            {
              id: 'pricing',
              title: 'Pricing & Plans',
              subtitle: 'Manage room rates and plans',
              icon: '💰',
              action: 'pricing',
            },
          ],
        },
      ],
      [ROLES.SUPPORT]: [
        {
          title: 'Support Settings',
          items: [
            {
              id: 'support_tickets',
              title: 'Support Tickets',
              subtitle: 'Manage support ticket settings',
              icon: '🎫',
              action: 'support_tickets',
            },
          ],
        },
      ],
      [ROLES.SALES]: [
        {
          title: 'Sales Settings',
          items: [
            {
              id: 'sales_targets',
              title: 'Sales Targets',
              subtitle: 'Configure sales performance metrics',
              icon: '📊',
              action: 'sales_targets',
            },
          ],
        },
      ],
      [ROLES.SUB_SALES]: [
        {
          title: 'Sub Sales Settings',
          items: [
            {
              id: 'sales_tracking',
              title: 'Sales Tracking',
              subtitle: 'View and track sales performance',
              icon: '📈',
              action: 'sales_tracking',
            },
          ],
        },
      ],
    };

    const userRole = user?.role || 'guest';
    const roleSettings = roleSpecificSettings[userRole] || [];

    return [...baseSettings, ...roleSettings];
  };

  const handleSettingPress = (action) => {
    console.log('Navigate to:', action);
    Alert.alert('Coming Soon', `The ${action} settings screen will be available soon.`);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Handle logout logic here
            console.log('Logout pressed');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <GlobalHeader />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: theme.text }]}>⚙️ Settings</Text>
          <Text style={[styles.heroSubtitle, { color: theme.secondaryText }]}>
            Customize your experience
          </Text>
        </View>

        {getSettingsSections().map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {section.title}
            </Text>

            {section.items.map((item, itemIndex) => (
              <ListItem
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                leftIcon={item.icon}
                rightText={item.rightText}
                rightComponent={item.rightComponent}
                onPress={() => handleSettingPress(item.action)}
                showBorder={itemIndex < section.items.length - 1}
              />
            ))}
          </View>
        ))}

        {/* Logout Section */}
        <View style={styles.section}>
          <ActionButton
            title="Logout"
            onPress={handleLogout}
            variant="danger"
            style={styles.logoutButton}
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: theme.text }]}>
            Steyzi Property Management
          </Text>
          <Text style={[styles.appVersion, { color: theme.secondaryText }]}>
            Version 1.0.0 (Build 2024.10.15)
          </Text>
          <Text style={[styles.copyright, { color: theme.secondaryText }]}>
            © 2024 Steyzi. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    color: 'rgba(0,0,0,0.6)',
  },
  logoutButton: {
    marginTop: 16,
  },
  appInfo: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
  },
});

export default SettingsScreen;
