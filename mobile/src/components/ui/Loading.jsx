import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useThemeColor } from '../../hooks/use-theme-color';

const Loading = ({
  size = 'large',
  color,
  text = 'Loading...',
  fullScreen = false,
  style,
  textStyle,
  ...props
}) => {
  const defaultColor = useThemeColor({
    light: '#3B82F6',
    dark: '#60A5FA',
  });

  const textColor = useThemeColor({
    light: '#374151',
    dark: '#F3F4F6',
  });

  const containerStyle = fullScreen
    ? [styles.fullScreenContainer, style]
    : [styles.container, style];

  return (
    <View style={containerStyle} {...props}>
      <ActivityIndicator
        size={size}
        color={color || defaultColor}
        style={styles.indicator}
      />
      {text && (
        <Text style={[styles.text, { color: textColor }, textStyle]}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  indicator: {
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default Loading;
