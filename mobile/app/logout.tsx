import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../src/store/authSlice';
import { Loading } from '../src/components/ui';

export default function Logout() {
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await dispatch(logoutUser()).unwrap();
        // Redirect to login after successful logout
        router.replace('/login');
      } catch (error) {
        Alert.alert('Error', 'Failed to logout. Please try again.');
        // Still redirect to login even if logout fails
        router.replace('/login');
      }
    };

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => router.back(), // Go back if cancelled
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: handleLogout,
        },
      ]
    );
  }, [dispatch, router]);

  return (
    <View style={styles.container}>
      <Loading fullScreen text="Logging out..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
