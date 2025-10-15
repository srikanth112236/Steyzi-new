import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';

// Theme configuration
const lightTheme = Colors.light;
const darkTheme = Colors.dark;

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
