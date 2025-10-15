import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/authSlice';
import { Button, Card } from '../../components/ui';
import { useAppTheme } from '../../contexts/ThemeContext';
import BottomNavigation from '../../navigation/BottomNavigation';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, loading, isAuthenticated } = useSelector((state) => state.auth);
  const { theme: appTheme, isDarkMode, toggleTheme } = useAppTheme();

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      // Use setTimeout to ensure proper navigation after render
      setTimeout(() => {
        router.replace('/auth/login');
      }, 0);
    }
  }, [isAuthenticated, router]);

  // Animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = async () => {
    try {
      await new Promise((resolve) => {
        Alert.alert(
          'Logout',
          'Are you sure you want to logout?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: 'Logout',
              style: 'destructive',
              onPress: () => resolve(true),
            },
          ]
        );
      });

      // Dispatch logout action
      await dispatch(logoutUser()).unwrap();

      // Use setTimeout to ensure proper navigation after render
      setTimeout(() => {
        router.replace('/auth/login');
      }, 0);
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, redirect to login
      setTimeout(() => {
        router.replace('/auth/login');
      }, 0);
    }
  };

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Prevent rendering if not authenticated
  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.scrollContainer, { backgroundColor: appTheme.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Theme Toggle Button */}
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={toggleTheme}
          >
            <Text style={[styles.themeIcon, { color: appTheme.text }]}>
              {isDarkMode ? '☀️' : '🌙'}
            </Text>
          </TouchableOpacity>

          <View style={styles.welcomeSection}>
            <Text style={[styles.greeting, { color: appTheme.secondaryText }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.userName, { color: appTheme.text }]}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={[styles.userRole, { color: appTheme.secondaryText }]}>
              {getRoleDisplayName(user?.role)}
            </Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
              {user?.lastName?.charAt(0)?.toUpperCase() || ''}
            </Text>
          </View>
        </Animated.View>

        {/* User Details Card */}
        <Animated.View
          style={[
            styles.userDetailsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Card style={[styles.userDetailsCard, { backgroundColor: appTheme.card }]}>
            <Text style={[styles.cardTitle, { color: appTheme.text }]}>
              Account Information
            </Text>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: appTheme.secondaryText }]}>
                Full Name:
              </Text>
              <Text style={[styles.detailValue, { color: appTheme.text }]}>
                {user?.firstName} {user?.lastName}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: appTheme.secondaryText }]}>
                Email:
              </Text>
              <Text style={[styles.detailValue, { color: appTheme.text }]}>
                {user?.email}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: appTheme.secondaryText }]}>
                Role:
              </Text>
              <Text style={[styles.detailValue, { color: appTheme.text }]}>
                {getRoleDisplayName(user?.role)}
              </Text>
            </View>

            {user?.pgName && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: appTheme.secondaryText }]}>
                  Property:
                </Text>
                <Text style={[styles.detailValue, { color: appTheme.text }]}>
                  {user.pgName}
                </Text>
              </View>
            )}

            {user?.phone && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: appTheme.secondaryText }]}>
                  Phone:
                </Text>
                <Text style={[styles.detailValue, { color: appTheme.text }]}>
                  {user.phone}
                </Text>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View
          style={[
            styles.logoutContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="secondary"
            style={styles.logoutButton}
          />
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
  },
  themeToggle: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  themeIcon: {
    fontSize: 24,
  },
  welcomeSection: {
    flex: 1,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#666',
  },
  userDetailsContainer: {
    padding: 24,
    paddingTop: 0,
  },
  userDetailsCard: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    maxWidth: '60%',
    textAlign: 'right',
  },
  logoutContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  logoutButton: {
    marginTop: 16,
  },
});

export default DashboardScreen;
