import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColor } from '../../hooks/use-theme-color';

const Card = ({
  children,
  style,
  padding = 16,
  margin = 0,
  shadow = true,
  borderRadius = 12,
  ...props
}) => {
  const backgroundColor = useThemeColor
  ({
    light: '#FFFFFF',
    dark: '#1F2937',
  });

  const shadowColor = useThemeColor({
    light: '#000000',
    dark: '#000000',
  });

  const cardStyles = [
    styles.card,
    {
      backgroundColor,
      padding,
      margin,
      borderRadius,
      ...(shadow && {
        shadowColor,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    style,
  ];

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 0,
  },
});

export default Card;
