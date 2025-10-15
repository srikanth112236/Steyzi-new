import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColor } from '../../hooks/use-theme-color';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
  inputStyle,
  labelStyle,
  errorStyle,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = useThemeColor({
    light: isFocused ? '#3B82F6' : error ? '#EF4444' : '#D1D5DB',
    dark: isFocused ? '#60A5FA' : error ? '#F87171' : '#4B5563',
  });

  const backgroundColor = useThemeColor({
    light: '#FFFFFF',
    dark: '#1F2937',
  });

  const textColor = useThemeColor({
    light: '#111827',
    dark: '#F9FAFB',
  });

  const placeholderColor = useThemeColor({
    light: '#9CA3AF',
    dark: '#6B7280',
  });

  const labelColor = useThemeColor({
    light: '#374151',
    dark: '#F3F4F6',
  });

  const errorColor = '#EF4444';

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: labelColor }, labelStyle]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor,
            backgroundColor,
          },
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            {
              color: textColor,
            },
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {rightIcon && (
          <View style={styles.rightIcon}>
            {rightIcon}
          </View>
        )}

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={[styles.eyeIcon, { color: textColor }]}>
              {showPassword ? '🙈' : '👁️'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={[styles.error, { color: errorColor }, errorStyle]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  eyeIcon: {
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default Input;
