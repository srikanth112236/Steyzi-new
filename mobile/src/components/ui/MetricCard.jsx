import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../contexts/ThemeContext';

const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  gradient,
  trend,
  trendValue,
  onPress,
  style,
}) => {
  const { theme } = useAppTheme();

  const CardContent = () => (
    <LinearGradient
      colors={gradient}
      style={[styles.container, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        {trend && trendValue && (
          <View style={[styles.trend, {
            backgroundColor: trend === 'up' ? 'rgba(34, 197, 94, 0.2)' :
                           trend === 'down' ? 'rgba(239, 68, 68, 0.2)' :
                           'rgba(156, 163, 175, 0.2)'
          }]}>
            <Text style={[styles.trendText, {
              color: trend === 'up' ? '#22c55e' :
                     trend === 'down' ? '#ef4444' :
                     '#6b7280'
            }]}>
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    fontSize: 28,
  },
  content: {
    alignItems: 'flex-start',
  },
  value: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    marginBottom: 6,
    letterSpacing: -1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  trend: {
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default MetricCard;
