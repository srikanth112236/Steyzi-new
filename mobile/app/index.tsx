import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Always redirect to login screen initially
  return <Redirect href="/auth/login" />;
}