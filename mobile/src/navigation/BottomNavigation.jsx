import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSelector } from 'react-redux';

import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ROLE_ACCESS_MAP } from '@/constants/roles';
import { IconSymbol } from 'components/ui/icon-symbol';

const BottomNavigation = ({
  visible = true,
  style,
}) => {
  const { theme } = useAppTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSelector((state) => state.auth);

  const getNavigationItems = () => {
    const userRole = user?.role || 'guest';
    const roleConfig = ROLE_ACCESS_MAP[userRole] || ROLE_ACCESS_MAP['guest'];

    return [
      {
        name: 'Dashboard',
        icon: 'house.fill',
        route: '/dashboard',
        activeRoutes: ['/dashboard']
      },
      {
        name: 'Residents',
        icon: 'person.2.fill',
        route: '/residents',
        activeRoutes: ['/residents']
      },
      {
        name: 'Payments',
        icon: 'creditcard.fill',
        route: '/payments',
        activeRoutes: ['/payments']
      },
      {
        name: 'Settings',
        icon: 'gear',
        route: '/settings',
        activeRoutes: ['/settings']
      }
    ].filter(item => roleConfig.bottomNavItems.includes(item.name.toLowerCase()));
  };

  const isActive = (item) => {
    return item.activeRoutes.some(route => pathname.includes(route));
  };

  const handleNavigation = (item) => {
    router.push(item.route);
  };

  if (!visible) return null;

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.background, 
        borderTopColor: theme.border 
      }, 
      style
    ]}>
      {getNavigationItems().map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.navItem}
          onPress={() => handleNavigation(item)}
        >
          <IconSymbol 
            name={item.icon} 
            size={24} 
            color={isActive(item) ? theme.primary : theme.text} 
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 70,
    borderTopWidth: 1,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomNavigation;
