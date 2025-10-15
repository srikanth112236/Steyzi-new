import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';

const ListItem = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  rightText,
  onPress,
  style,
  showBorder = true,
  chevron = true,
}) => {
  const { theme } = useAppTheme();

  const ItemContent = () => (
    <View style={[styles.container, style]}>
      {leftIcon && (
        <View style={[styles.leftIcon, { backgroundColor: theme.primary + '20' }]}>
          <Text style={[styles.icon, { color: theme.primary }]}>{leftIcon}</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightContainer}>
        {rightText && (
          <Text style={[styles.rightText, { color: theme.secondaryText }]}>
            {rightText}
          </Text>
        )}
        {rightIcon && (
          <View style={[styles.rightIcon, { backgroundColor: theme.secondaryText + '20' }]}>
            <Text style={[styles.icon, { color: theme.secondaryText }]}>{rightIcon}</Text>
          </View>
        )}
        {chevron && !rightIcon && (
          <Text style={[styles.chevron, { color: theme.secondaryText }]}>›</Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.touchableContainer, showBorder && styles.borderBottom]}
      >
        <ItemContent />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.touchableContainer, showBorder && styles.borderBottom]}>
      <ItemContent />
    </View>
  );
};

const styles = StyleSheet.create({
  touchableContainer: {
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  leftIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  rightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
});

export default ListItem;
