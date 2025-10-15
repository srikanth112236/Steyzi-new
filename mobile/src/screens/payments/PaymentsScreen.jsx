import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../contexts/ThemeContext';
import { GlobalHeader, ActionButton } from '../../components/ui';

const { width } = Dimensions.get('window');

const PaymentsScreen = () => {
  const { theme } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  // Mock data for payments
  useEffect(() => {
    const mockPayments = [
      {
        id: '1',
        resident: 'John Doe',
        room: 'A-101',
        amount: '₹12,500',
        status: 'paid',
        date: '2024-10-15',
        type: 'Monthly Rent',
        avatar: '👨',
      },
      {
        id: '2',
        resident: 'Jane Smith',
        room: 'B-205',
        amount: '₹8,000',
        status: 'pending',
        date: '2024-10-14',
        type: 'Security Deposit',
        avatar: '👩',
      },
      {
        id: '3',
        resident: 'Mike Johnson',
        room: 'C-301',
        amount: '₹15,000',
        status: 'paid',
        date: '2024-10-13',
        type: 'Monthly Rent',
        avatar: '👨',
      },
      {
        id: '4',
        resident: 'Sarah Wilson',
        room: 'A-102',
        amount: '₹10,000',
        status: 'overdue',
        date: '2024-10-10',
        type: 'Monthly Rent',
        avatar: '👩',
      },
    ];
    setPayments(mockPayments);

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

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'overdue':
        return '#ef4444';
      default:
        return theme.primary;
    }
  };

  const getStatusBg = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'rgba(16, 185, 129, 0.1)';
      case 'pending':
        return 'rgba(245, 158, 11, 0.1)';
      case 'overdue':
        return 'rgba(239, 68, 68, 0.1)';
      default:
        return 'rgba(59, 130, 246, 0.1)';
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (selectedFilter === 'all') return true;
    return payment.status === selectedFilter;
  });

  const paymentStats = [
    {
      title: 'Total Collected',
      value: '₹2,45,000',
      subtitle: 'This month',
      icon: '💰',
      gradient: ['#10b981', '#059669'],
      trend: '+12%',
    },
    {
      title: 'Pending Payments',
      value: '₹35,000',
      subtitle: 'Outstanding',
      icon: '⏳',
      gradient: ['#f59e0b', '#d97706'],
      trend: '-5%',
    },
    {
      title: 'Overdue Amount',
      value: '₹18,000',
      subtitle: 'Needs attention',
      icon: '⚠️',
      gradient: ['#ef4444', '#dc2626'],
      trend: '+3%',
    },
    {
      title: 'Active Residents',
      value: '24',
      subtitle: 'Paying tenants',
      icon: '👥',
      gradient: ['#3b82f6', '#2563eb'],
      trend: '+2',
    },
  ];

  const filters = [
    { id: 'all', label: 'All', count: payments.length },
    { id: 'paid', label: 'Paid', count: payments.filter(p => p.status === 'paid').length },
    { id: 'pending', label: 'Pending', count: payments.filter(p => p.status === 'pending').length },
    { id: 'overdue', label: 'Overdue', count: payments.filter(p => p.status === 'overdue').length },
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
            <Text style={styles.heroTitle}>💰 Payment Center</Text>
            <Text style={styles.heroSubtitle}>Manage rent collections & payments</Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>₹2,45,000</Text>
                <Text style={styles.heroStatLabel}>This Month</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>24</Text>
                <Text style={styles.heroStatLabel}>Active Tenants</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {paymentStats.map((stat, index) => (
            <Animated.View
              key={index}
              style={[styles.statCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
              <LinearGradient
                colors={stat.gradient}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statIcon}>
                  <Text style={styles.statIconText}>{stat.icon}</Text>
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                  <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
                  <View style={styles.statTrend}>
                    <Text style={styles.statTrendText}>{stat.trend}</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card }]}>
              <View style={[styles.actionIcon, { backgroundColor: '#10b981' }]}>
                <Text style={styles.actionIconText}>➕</Text>
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Record Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card }]}>
              <View style={[styles.actionIcon, { backgroundColor: '#f59e0b' }]}>
                <Text style={styles.actionIconText}>📄</Text>
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Generate Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card }]}>
              <View style={[styles.actionIcon, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.actionIconText}>📊</Text>
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>View Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Payments</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setSelectedFilter(filter.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selectedFilter === filter.id ? theme.primary : theme.card,
                    borderColor: theme.primary,
                  }
                ]}
              >
                <Text style={[
                  styles.filterText,
                  { color: selectedFilter === filter.id ? 'white' : theme.primary }
                ]}>
                  {filter.label} ({filter.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Payments List */}
        <View style={styles.paymentsList}>
          {filteredPayments.map((payment, index) => (
            <Animated.View
              key={payment.id}
              style={[
                styles.paymentCard,
                {
                  backgroundColor: theme.card,
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <View style={styles.paymentHeader}>
                <View style={styles.paymentUser}>
                  <Text style={styles.paymentAvatar}>{payment.avatar}</Text>
                  <View>
                    <Text style={[styles.paymentName, { color: theme.text }]}>{payment.resident}</Text>
                    <Text style={[styles.paymentRoom, { color: theme.secondaryText }]}>{payment.room}</Text>
                  </View>
                </View>
                <View style={[styles.paymentStatus, { backgroundColor: getStatusBg(payment.status) }]}>
                  <Text style={[styles.paymentStatusText, { color: getStatusColor(payment.status) }]}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.paymentDetails}>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentType, { color: theme.secondaryText }]}>{payment.type}</Text>
                  <Text style={[styles.paymentDate, { color: theme.secondaryText }]}>{payment.date}</Text>
                </View>
                <Text style={[styles.paymentAmount, { color: getStatusColor(payment.status) }]}>
                  {payment.amount}
                </Text>
              </View>
            </Animated.View>
          ))}
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
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  heroStat: {
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 48) / 2,
    margin: 4,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statIconText: {
    fontSize: 24,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  statTrend: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  statTrendText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  actionsSection: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionIconText: {
    fontSize: 20,
    color: 'white',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  filtersSection: {
    padding: 16,
    paddingBottom: 8,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentsList: {
    padding: 16,
    paddingTop: 0,
  },
  paymentCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  paymentRoom: {
    fontSize: 14,
  },
  paymentStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentType: {
    fontSize: 14,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
});

export default PaymentsScreen;
