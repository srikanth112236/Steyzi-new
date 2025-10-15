import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../contexts/ThemeContext';
import {
  GlobalHeader,
  MetricCard,
  ActivityItem,
  QuickActionCard,
  ProgressCard
} from '../../components/ui';

const { width } = Dimensions.get('window');

const DashboardsScreen = () => {
  const { theme } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  useEffect(() => {
    // Animate on mount
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

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Dashboard metrics
  const metrics = [
    {
      title: 'Total Revenue',
      value: '₹2,45,000',
      subtitle: 'This month',
      icon: '💰',
      gradient: ['#10b981', '#059669'],
      trend: 'up',
      trendValue: '+12%',
    },
    {
      title: 'Active Tenants',
      value: '24',
      subtitle: 'Current residents',
      icon: '👥',
      gradient: ['#3b82f6', '#2563eb'],
      trend: 'up',
      trendValue: '+2',
    },
    {
      title: 'Occupancy Rate',
      value: '87%',
      subtitle: 'Property utilization',
      icon: '🏠',
      gradient: ['#8b5cf6', '#7c3aed'],
      trend: 'up',
      trendValue: '+5%',
    },
    {
      title: 'Pending Tasks',
      value: '8',
      subtitle: 'Requires attention',
      icon: '📋',
      gradient: ['#f59e0b', '#d97706'],
      trend: 'down',
      trendValue: '-3',
    },
  ];

  // Quick actions
  const quickActions = [
    {
      icon: '👤',
      title: 'Add Resident',
      color: '#10b981',
      action: 'add_resident',
    },
    {
      icon: '💳',
      title: 'Record Payment',
      color: '#3b82f6',
      action: 'record_payment',
    },
    {
      icon: '🔧',
      title: 'Maintenance',
      color: '#f59e0b',
      action: 'maintenance',
    },
    {
      icon: '📊',
      title: 'Reports',
      color: '#8b5cf6',
      action: 'reports',
    },
    {
      icon: '📞',
      title: 'Inquiries',
      color: '#ef4444',
      action: 'inquiries',
    },
    {
      icon: '⚙️',
      title: 'Settings',
      color: '#6b7280',
      action: 'settings',
    },
  ];

  // Recent activities
  const activities = [
    {
      id: '1',
      icon: '💰',
      title: 'Payment Received',
      subtitle: '₹12,500 from John Doe (A-101)',
      time: '2 hours ago',
      type: 'payment',
    },
    {
      id: '2',
      icon: '👤',
      title: 'New Resident',
      subtitle: 'Jane Smith checked into B-205',
      time: '4 hours ago',
      type: 'checkin',
    },
    {
      id: '3',
      icon: '🔧',
      title: 'Maintenance Request',
      subtitle: 'Leaking faucet reported in C-301',
      time: '6 hours ago',
      type: 'maintenance',
    },
    {
      id: '4',
      icon: '↗️',
      title: 'Room Transfer',
      subtitle: 'Mike Johnson moved to C-301',
      time: '1 day ago',
      type: 'transfer',
    },
    {
      id: '5',
      icon: '⚠️',
      title: 'Overdue Payment',
      subtitle: 'Sarah Wilson payment due',
      time: '2 days ago',
      type: 'alert',
    },
  ];

  // Property occupancy data
  const occupancyData = [
    { title: 'Building A', current: 17, total: 20, color: '#10b981' },
    { title: 'Building B', current: 14, total: 20, color: '#f59e0b' },
    { title: 'Building C', current: 12, total: 20, color: '#ef4444' },
  ];


  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <GlobalHeader />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View style={[styles.heroContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.heroTitle}>🏢 Dashboard</Text>
            <Text style={styles.heroSubtitle}>Property management at a glance</Text>

            <View style={styles.heroMetrics}>
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricValue}>₹2,45,000</Text>
                <Text style={styles.heroMetricLabel}>Revenue</Text>
              </View>
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricValue}>24</Text>
                <Text style={styles.heroMetricLabel}>Tenants</Text>
              </View>
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricValue}>87%</Text>
                <Text style={styles.heroMetricLabel}>Occupancy</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Key Metrics
          </Text>
          <View style={styles.metricsGrid}>
            {metrics.map((metric, index) => (
              <Animated.View
                key={index}
                style={[styles.metricWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
              >
                <MetricCard
                  title={metric.title}
                  value={metric.value}
                  subtitle={metric.subtitle}
                  icon={metric.icon}
                  gradient={metric.gradient}
                  trend={metric.trend}
                  trendValue={metric.trendValue}
                />
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <Animated.View
                key={index}
                style={[styles.quickActionWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
              >
                <QuickActionCard
                  icon={action.icon}
                  title={action.title}
                  color={action.color}
                  onPress={() => handleQuickAction(action.action)}
                />
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recent Activities
          </Text>
          <View style={styles.activitiesContainer}>
            {activities.map((activity, index) => (
              <Animated.View
                key={activity.id}
                style={[styles.activityWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
              >
                <ActivityItem
                  icon={activity.icon}
                  title={activity.title}
                  subtitle={activity.subtitle}
                  time={activity.time}
                  type={activity.type}
                  onPress={() => console.log('Activity pressed:', activity.id)}
                />
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Property Occupancy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Property Occupancy
          </Text>
          <View style={styles.occupancyContainer}>
            {occupancyData.map((building, index) => (
              <Animated.View
                key={index}
                style={[styles.occupancyWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
              >
                <ProgressCard
                  title={building.title}
                  current={building.current}
                  total={building.total}
                  color={building.color}
                />
              </Animated.View>
            ))}
          </View>
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
    paddingBottom: 60,
    marginBottom: 20,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 24,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricWrapper: {
    width: (width - 40) / 2,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionWrapper: {
    marginBottom: 12,
  },
  activitiesContainer: {
    gap: 8,
  },
  activityWrapper: {
    marginBottom: 8,
  },
  occupancyContainer: {
    gap: 12,
  },
  occupancyWrapper: {
    marginBottom: 8,
  },
});

export default DashboardsScreen;
