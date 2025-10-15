import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAppTheme } from '../contexts/ThemeContext';

const BottomNavigation = ({
  visible = true,
  style,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useAppTheme();

  // Animation values
  const translateY = new Animated.Value(0);
  const opacity = new Animated.Value(1);

  // Update visibility animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: visible ? 0 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '🏠',
      route: '/dashboard',
      activeRoutes: ['/dashboard'],
    },
    {
      id: 'residents',
      label: 'Residents',
      icon: '👥',
      route: '/residents',
      activeRoutes: ['/residents'],
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: '💰',
      route: '/payments',
      activeRoutes: ['/payments'],
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      route: '/profile',
      activeRoutes: ['/profile'],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      route: '/settings',
      activeRoutes: ['/settings'],
    },
  ];

  const isActive = (item) => {
    return item.activeRoutes.some(route => pathname.includes(route));
  };

  const handleNavigation = (item) => {
    if (pathname !== item.route) {
      router.push(item.route);
    }
  };

  const getActiveItem = () => {
    return navigationItems.find(item => isActive(item)) || navigationItems[0];
  };

  const activeItem = getActiveItem();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          transform: [{ translateY }],
          opacity,
        },
        style,
      ]}
    >
      <View style={styles.navigation}>
        {navigationItems.map((item) => {
          const active = isActive(item);
          const scale = new Animated.Value(active ? 1.1 : 1);

          // Animate scale on active change
          useEffect(() => {
            Animated.spring(scale, {
              toValue: active ? 1.1 : 1,
              useNativeDriver: true,
            }).start();
          }, [active]);

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.navItem}
              onPress={() => handleNavigation(item)}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.navItemContent,
                  {
                    transform: [{ scale }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    active && {
                      backgroundColor: theme.primary,
                      shadowColor: theme.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 5,
                    },
                  ]}
                >
                  <Text style={[
                    styles.icon,
                    {
                      color: active ? theme.card : theme.secondaryText,
                    },
                  ]}>
                    {item.icon}
                  </Text>
                </View>

                <Text style={[
                  styles.label,
                  {
                    color: active ? theme.primary : theme.secondaryText,
                    fontWeight: active ? '600' : '400',
                  },
                ]}>
                  {item.label}
                </Text>

                {/* Active indicator */}
                {active && (
                  <Animated.View
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: theme.primary }
                    ]}
                  />
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navigation: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 85 : 70,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    transition: 'all 0.3s ease',
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -10,
    width: 30,
    height: 3,
    borderRadius: 2,
  },
});

export default BottomNavigation;
