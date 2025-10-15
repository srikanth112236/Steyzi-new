import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppTheme } from '../../src/contexts/ThemeContext';
import BottomNavigation from '../../src/navigation/BottomNavigation';

function MainLayoutContent() {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Slot />
      </View>
      <BottomNavigation />
    </View>
  );
}

export default function MainLayout() {
  return (
    <SafeAreaProvider>
      <MainLayoutContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 85 : 70, // Account for bottom navigation height
  },
});
