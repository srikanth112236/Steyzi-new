import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const QuickActionCard = ({
  icon,
  title,
  color,
  onPress,
  style,
}) => {
  const { theme } = useAppTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          shadowColor: color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 8,
        },
        style
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>

      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {title}
      </Text>

      <View style={[styles.glow, { backgroundColor: color + '20' }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: (width - 64) / 3, // 3 cards per row with margins
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  iconText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '600',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  glow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.3,
  },
});

export default QuickActionCard;
