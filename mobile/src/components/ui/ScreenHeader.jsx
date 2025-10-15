import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';

const ScreenHeader = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightComponent,
  style,
}) => {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.card }, style]}>
      <View style={styles.headerContent}>
        {showBackButton && (
          <TouchableOpacity
            onPress={onBackPress}
            style={[styles.backButton, { borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.backIcon, { color: theme.primary }]}>←</Text>
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              {subtitle}
            </Text>
          )}
        </View>

        {rightComponent && (
          <View style={styles.rightContainer}>
            {rightComponent}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '400',
  },
  rightContainer: {
    marginLeft: 12,
  },
});

export default ScreenHeader;
