import React from 'react';
import { Slot } from 'expo-router';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { store } from '../src/store';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <ThemeProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Slot />
          </GestureHandlerRootView>
        </ThemeProvider>
      </Provider>
    </SafeAreaProvider>
  );
}