import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';

const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  onPress,
  style,
  variant = 'default', // 'default', 'success', 'warning', 'danger'
}) => {
  const { theme } = useAppTheme();

  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          accentColor: '#22c55e',
        };
      case 'warning':
        return {
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          accentColor: '#f59e0b',
        };
      case 'danger':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          accentColor: '#ef4444',
        };
      default:
        return {
          backgroundColor: theme.card,
          accentColor: theme.primary,
        };
    }
  };

  const variantColors = getVariantColors();

  const CardContent = () => (
    <View style={[styles.container, { backgroundColor: variantColors.backgroundColor }, style]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        {trend && (
          <View style={[styles.trendContainer, { backgroundColor: variantColors.accentColor }]}>
            <Text style={styles.trendText}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.value, { color: variantColors.accentColor }]}>
          {value}
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.touchableContainer}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  touchableContainer: {
    margin: 4,
  },
  container: {
    borderRadius: 16,
    padding: 20,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  icon: {
    fontSize: 24,
  },
  trendContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
});

export default StatsCard;
