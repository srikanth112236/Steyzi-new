import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';

const ActivityItem = ({
  icon,
  title,
  subtitle,
  time,
  type,
  onPress,
  style,
}) => {
  const { theme } = useAppTheme();

  const getTypeColor = (type) => {
    switch (type) {
      case 'payment':
        return '#10b981';
      case 'checkin':
        return '#3b82f6';
      case 'maintenance':
        return '#f59e0b';
      case 'transfer':
        return '#8b5cf6';
      case 'alert':
        return '#ef4444';
      default:
        return theme.primary;
    }
  };

  const ItemContent = () => (
    <View style={[styles.container, { backgroundColor: theme.card }, style]}>
      <View style={[styles.iconContainer, { backgroundColor: getTypeColor(type) + '15' }]}>
        <Text style={[styles.icon, { color: getTypeColor(type) }]}>{icon}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]} numberOfLines={2}>
          {subtitle}
        </Text>
        <Text style={[styles.time, { color: theme.secondaryText }]}>{time}</Text>
      </View>

      <View style={[styles.indicator, { backgroundColor: getTypeColor(type) }]} />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <ItemContent />
      </TouchableOpacity>
    );
  }

  return <ItemContent />;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  indicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginLeft: 12,
  },
});

export default ActivityItem;
