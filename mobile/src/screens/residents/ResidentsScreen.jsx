import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../contexts/ThemeContext';
import { GlobalHeader, StatsCard, ListItem, ActionButton } from '../../components/ui';

const { width } = Dimensions.get('window');

const ResidentsScreen = () => {
  const { theme } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [residents, setResidents] = useState([]);

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  // Mock data for residents
  useEffect(() => {
    const mockResidents = [
      {
        id: '1',
        name: 'John Doe',
        room: 'A-101',
        status: 'Active',
        rent: '₹12,500',
        dueDate: '2024-10-01',
        phone: '+91 98765 43210',
        moveInDate: '2024-01-15',
      },
      {
        id: '2',
        name: 'Jane Smith',
        room: 'B-205',
        status: 'Active',
        rent: '₹10,000',
        dueDate: '2024-10-01',
        phone: '+91 87654 32109',
        moveInDate: '2024-02-01',
      },
      {
        id: '3',
        name: 'Mike Johnson',
        room: 'C-301',
        status: 'Active',
        rent: '₹15,000',
        dueDate: '2024-10-01',
        phone: '+91 76543 21098',
        moveInDate: '2024-03-10',
      },
      {
        id: '4',
        name: 'Sarah Wilson',
        room: 'A-102',
        status: 'Inactive',
        rent: '₹11,000',
        dueDate: '2024-09-15',
        phone: '+91 65432 10987',
        moveInDate: '2023-12-01',
      },
      {
        id: '5',
        name: 'David Brown',
        room: 'B-304',
        status: 'Active',
        rent: '₹13,000',
        dueDate: '2024-10-01',
        phone: '+91 54321 09876',
        moveInDate: '2024-04-20',
      },
    ];
    setResidents(mockResidents);

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

  const getStatusVariant = (status) => {
    return status.toLowerCase() === 'active' ? 'success' : 'danger';
  };

  const residentStats = [
    {
      title: 'Total Residents',
      value: '24',
      subtitle: 'Across all rooms',
      icon: '👥',
      variant: 'default',
    },
    {
      title: 'Active Tenants',
      value: '22',
      subtitle: 'Currently occupying',
      icon: '✅',
      trend: 'up',
      trendValue: '+2',
      variant: 'success',
    },
    {
      title: 'Vacant Rooms',
      value: '8',
      subtitle: 'Available for rent',
      icon: '🏠',
      variant: 'warning',
    },
    {
      title: 'Move-ins This Month',
      value: '3',
      subtitle: 'New residents',
      icon: '📅',
      variant: 'default',
    },
  ];

  const renderResidentItem = ({ item }) => (
    <ListItem
      title={`${item.name} - ${item.room}`}
      subtitle={`Rent: ${item.rent} • Due: ${item.dueDate}`}
      leftIcon={item.status === 'Active' ? '👤' : '🚫'}
      rightText={item.status}
      onPress={() => console.log('Resident details', item.id)}
    />
  );

  const activeResidents = residents.filter(r => r.status === 'Active');
  const inactiveResidents = residents.filter(r => r.status === 'Inactive');

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
          colors={['#f093fb', '#f5576c']}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View style={[styles.heroContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.heroTitle}>🏠 Resident Hub</Text>
            <Text style={styles.heroSubtitle}>Manage tenants & occupancy</Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{activeResidents.length}</Text>
                <Text style={styles.heroStatLabel}>Active</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{inactiveResidents.length}</Text>
                <Text style={styles.heroStatLabel}>Inactive</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>87%</Text>
                <Text style={styles.heroStatLabel}>Occupancy</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {residentStats.map((stat, index) => (
            <Animated.View
              key={index}
              style={[styles.statCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
              <LinearGradient
                colors={stat.variant === 'success' ? ['#4ade80', '#22c55e'] :
                       stat.variant === 'warning' ? ['#fbbf24', '#f59e0b'] :
                       ['#3b82f6', '#2563eb']}
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
                  {stat.trend && (
                    <View style={styles.statTrend}>
                      <Text style={styles.statTrendText}>{stat.trend}</Text>
                    </View>
                  )}
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
                <Text style={styles.actionIconText}>👤</Text>
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Add Resident</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card }]}>
              <View style={[styles.actionIcon, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.actionIconText}>🔄</Text>
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Room Transfer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card }]}>
              <View style={[styles.actionIcon, { backgroundColor: '#f59e0b' }]}>
                <Text style={styles.actionIconText}>📋</Text>
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Check-in</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Residents */}
        <View style={styles.residentsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Active Residents
          </Text>

          <View style={styles.residentsList}>
            {activeResidents.map((resident, index) => (
              <Animated.View
                key={resident.id}
                style={[
                  styles.residentCard,
                  {
                    backgroundColor: theme.card,
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  }
                ]}
              >
                <View style={styles.residentHeader}>
                  <View style={styles.residentInfo}>
                    <Text style={styles.residentAvatar}>
                      {resident.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                    <View>
                      <Text style={[styles.residentName, { color: theme.text }]}>
                        {resident.name}
                      </Text>
                      <Text style={[styles.residentRoom, { color: theme.secondaryText }]}>
                        {resident.room}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.residentStatus, { backgroundColor: '#10b981' + '20' }]}>
                    <Text style={[styles.residentStatusText, { color: '#10b981' }]}>
                      Active
                    </Text>
                  </View>
                </View>

                <View style={styles.residentDetails}>
                  <View style={styles.residentDetail}>
                    <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Rent</Text>
                    <Text style={[styles.detailValue, { color: theme.primary }]}>{resident.rent}</Text>
                  </View>
                  <View style={styles.residentDetail}>
                    <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Due Date</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{resident.dueDate}</Text>
                  </View>
                  <View style={styles.residentDetail}>
                    <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Phone</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{resident.phone}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Occupancy Overview */}
        <View style={styles.occupancySection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Occupancy Overview
          </Text>

          <View style={[styles.occupancyCard, { backgroundColor: theme.card }]}>
            <View style={styles.buildingRow}>
              <Text style={[styles.buildingName, { color: theme.text }]}>Building A</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '85%', backgroundColor: '#10b981' }]} />
              </View>
              <Text style={[styles.buildingStats, { color: theme.secondaryText }]}>17/20</Text>
            </View>

            <View style={styles.buildingRow}>
              <Text style={[styles.buildingName, { color: theme.text }]}>Building B</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '70%', backgroundColor: '#f59e0b' }]} />
              </View>
              <Text style={[styles.buildingStats, { color: theme.secondaryText }]}>14/20</Text>
            </View>

            <View style={styles.buildingRow}>
              <Text style={[styles.buildingName, { color: theme.text }]}>Building C</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '60%', backgroundColor: '#ef4444' }]} />
              </View>
              <Text style={[styles.buildingStats, { color: theme.secondaryText }]}>12/20</Text>
            </View>
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
  residentsSection: {
    padding: 16,
    paddingTop: 0,
  },
  residentsList: {
    gap: 12,
  },
  residentCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  residentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  residentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  residentAvatar: {
    fontSize: 24,
    marginRight: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    textAlign: 'center',
    lineHeight: 48,
    fontWeight: '700',
    color: '#3b82f6',
  },
  residentName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  residentRoom: {
    fontSize: 14,
  },
  residentStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  residentStatusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  residentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  residentDetail: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  occupancySection: {
    padding: 16,
    paddingTop: 0,
  },
  occupancyCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buildingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  buildingName: {
    fontSize: 16,
    fontWeight: '600',
    width: 80,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  buildingStats: {
    fontSize: 14,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
});

export default ResidentsScreen;
