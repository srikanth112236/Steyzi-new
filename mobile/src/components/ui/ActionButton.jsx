import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';

const ActionButton = ({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'danger'
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false,
  loading = false,
  icon,
  style,
}) => {
  const { theme } = useAppTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.secondaryText + '20',
          textColor: theme.secondaryText,
          borderColor: 'transparent',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          textColor: theme.primary,
          borderColor: theme.primary,
        };
      case 'danger':
        return {
          backgroundColor: '#ef4444',
          textColor: 'white',
          borderColor: 'transparent',
        };
      default: // primary
        return {
          backgroundColor: theme.primary,
          textColor: 'white',
          borderColor: 'transparent',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          fontSize: 14,
          minHeight: 36,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 24,
          fontSize: 18,
          minHeight: 56,
        };
      default: // medium
        return {
          paddingVertical: 12,
          paddingHorizontal: 20,
          fontSize: 16,
          minHeight: 48,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonStyles = [
    styles.container,
    {
      backgroundColor: disabled ? theme.secondaryText + '40' : variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      minHeight: sizeStyles.minHeight,
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
    },
    style,
  ];

  const textStyles = [
    styles.text,
    {
      color: disabled ? theme.secondaryText : variantStyles.textColor,
      fontSize: sizeStyles.fontSize,
    },
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={variantStyles.textColor}
            style={styles.loader}
          />
        )}
        {icon && !loading && (
          <Text style={[styles.icon, { color: variantStyles.textColor }]}>
            {icon}
          </Text>
        )}
        <Text style={textStyles}>
          {loading ? 'Loading...' : title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  loader: {
    marginRight: 8,
  },
});

export default ActionButton;
