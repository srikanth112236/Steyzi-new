import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme configuration
const lightTheme = {
  background: '#F8FAFC',
  text: '#1F2937',
  secondaryText: '#6B7280',
  primary: '#3B82F6',
  card: '#FFFFFF',
  border: 'rgba(0,0,0,0.1)',
  statusColors: {
    success: { text: '#10B981', background: '#D1FAE5' },
    warning: { text: '#F59E0B', background: '#FEF3C7' },
    danger: { text: '#EF4444', background: '#FEE2E2' },
    neutral: { text: '#6B7280', background: '#F3F4F6' }
  }
};

const darkTheme = {
  background: '#1E293B',
  text: '#F1F5F9',
  secondaryText: '#94A3B8',
  primary: '#60A5FA',
  card: '#2D3748',
  border: 'rgba(255,255,255,0.1)',
  statusColors: {
    success: { text: '#6EE7B7', background: '#064E3B' },
    warning: { text: '#FCD34D', background: '#92400E' },
    danger: { text: '#FCA5A5', background: '#7F1D1D' },
    neutral: { text: '#9CA3AF', background: '#374151' }
  }
};

// Create context
export const ThemeContext = createContext({
  isDarkMode: false,
  theme: lightTheme,
  toggleTheme: () => {},
});

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState(lightTheme);

  // Load theme preference from storage on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('appTheme');
        if (storedTheme !== null) {
          const parsedTheme = JSON.parse(storedTheme);
          const newIsDarkMode = parsedTheme.isDarkMode;
          setIsDarkMode(newIsDarkMode);
          setTheme(newIsDarkMode ? darkTheme : lightTheme);
        }
      } catch (error) {
        // Ignore errors
      }
    };

    loadThemePreference();
  }, []);

  // Toggle theme
  const toggleTheme = async () => {
    const newIsDarkMode = !isDarkMode;
    console.log('Toggling theme:', { current: isDarkMode, new: newIsDarkMode });
    setIsDarkMode(newIsDarkMode);
    setTheme(newIsDarkMode ? darkTheme : lightTheme);

    try {
      await AsyncStorage.setItem('appTheme', JSON.stringify({
        isDarkMode: newIsDarkMode
      }));
      console.log('Theme saved to storage:', newIsDarkMode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      theme,
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using theme
export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
