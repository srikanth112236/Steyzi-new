import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { useAppTheme } from '@/contexts/ThemeContext';
import GlobalHeader from '@/components/ui/GlobalHeader';
import Card from '@/components/ui/Card';

const SuperAdminDashboardScreen = () => {
  const { theme } = useAppTheme();
  const { user } = useSelector((state) => state.auth);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <GlobalHeader 
        title="SuperAdmin Dashboard" 
        subtitle={`Welcome, ${user?.name || 'SuperAdmin'}`} 
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            SuperAdmin Overview
          </Text>
          <Text style={[styles.cardSubtitle, { color: theme.secondaryText }]}>
            Full system management and control
          </Text>
        </Card>
        {/* Add more SuperAdmin specific dashboard widgets */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
  },
});

export default SuperAdminDashboardScreen;
