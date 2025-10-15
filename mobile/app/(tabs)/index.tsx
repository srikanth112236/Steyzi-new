import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Let the AuthGuard in _layout.tsx handle authentication and routing
  return <Redirect href="/login" />;
}
