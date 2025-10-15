import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';

const Header = ({
  title,
  showBackButton = false,
  onBackPress,
  showThemeToggle = true,
  onThemeToggle,
  rightComponent,
  style,
  titleStyle,
}) => {
  const { theme, isDarkMode, toggleTheme } = useAppTheme();

  const handleThemeToggle = () => {
    if (onThemeToggle) {
      onThemeToggle();
    } else {
      toggleTheme();
    }
  };

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <View style={[styles.container, { backgroundColor: theme.card }, style]}>
        {/* Back Button */}
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
          >
            <Text style={[styles.backButtonText, { color: theme.primary }]}>←</Text>
          </TouchableOpacity>
        )}

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }, titleStyle]}>
            {title}
          </Text>
        </View>

        {/* Right Components */}
        <View style={styles.rightContainer}>
          {rightComponent}

          {showThemeToggle && (
            <TouchableOpacity
              style={[styles.themeToggle, { backgroundColor: 'rgba(0,0,0,0.1)' }]}
              onPress={handleThemeToggle}
            >
              <Text style={[styles.themeIcon, { color: theme.text }]}>
                {isDarkMode ? '☀️' : '🌙'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggle: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  themeIcon: {
    fontSize: 20,
  },
});

export default Header;
