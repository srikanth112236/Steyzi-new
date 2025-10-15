import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeColor } from '../../hooks/use-theme-color';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props
}) => {
  const backgroundColor = useThemeColor({
    light: variant === 'primary' ? '#3B82F6' : variant === 'secondary' ? '#E5E7EB' : '#EF4444',
    dark: variant === 'primary' ? '#2563EB' : variant === 'secondary' ? '#374151' : '#DC2626',
  });

  const textColor = useThemeColor({
    light: variant === 'primary' ? '#FFFFFF' : '#374151',
    dark: variant === 'primary' ? '#FFFFFF' : '#F9FAFB',
  });

  const disabledBackgroundColor = useThemeColor({
    light: '#D1D5DB',
    dark: '#4B5563',
  });

  const disabledTextColor = useThemeColor({
    light: '#9CA3AF',
    dark: '#6B7280',
  });

  const buttonStyles = [
    styles.button,
    {
      backgroundColor: disabled ? disabledBackgroundColor : backgroundColor,
      paddingVertical: size === 'small' ? 8 : size === 'large' ? 16 : 12,
      paddingHorizontal: size === 'small' ? 16 : size === 'large' ? 32 : 24,
    },
    style,
  ];

  const textStyles = [
    styles.text,
    {
      color: disabled ? disabledTextColor : textColor,
      fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
    },
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Button;
