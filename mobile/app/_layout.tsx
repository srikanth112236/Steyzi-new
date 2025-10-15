import React, { useEffect, useState } from 'react';
import { Slot, useRouter, usePathname } from 'expo-router';
import { Provider, useSelector } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { store } from '@/store';
import { ROLE_ACCESS_MAP } from '@/constants/roles';

function NavigationGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure the component is fully mounted before attempting navigation
    setIsReady(true);
  }, []);

  useEffect(() => {
    // Only attempt navigation when the component is ready
    if (!isReady) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Check role-based route access
    const userRole = user?.role || 'guest';
    const roleConfig = ROLE_ACCESS_MAP[userRole] || ROLE_ACCESS_MAP['guest'];

    // Check if current route is allowed for this role
    const isRouteAllowed = roleConfig.routes.some(route => 
      pathname.startsWith(route)
    );

    if (!isRouteAllowed) {
      // Redirect to default dashboard for the role
      router.replace('/dashboard');
    }
  }, [isReady, pathname, isAuthenticated, user, router]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationGuard />
        </GestureHandlerRootView>
      </ThemeProvider>
    </Provider>
  );
}