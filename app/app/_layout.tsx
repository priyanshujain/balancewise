import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { GoalsProvider } from '@/contexts/goals-context';
import { WorkoutSessionProvider } from '@/contexts/WorkoutSessionContext';
import { NetworkProvider, useNetwork } from '@/contexts/network-context';
import { seedDatabaseIfNeeded } from '@/services/database';
import { OfflineIndicator } from '@/components/offline-indicator';
import { registerBackgroundSync } from '@/services/sync/background-sync-task';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const { topOffset } = useNetwork();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    seedDatabaseIfNeeded().catch(console.error);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'sign-in';

    if (!user && !inAuthGroup) {
      router.replace('/sign-in');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading, router]);

  useEffect(() => {
    if (user?.hasDrivePermission) {
      registerBackgroundSync().catch((error) => {
        console.error('Failed to register background sync:', error);
      });
    }
  }, [user?.hasDrivePermission]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      paddingTop: withTiming(topOffset, {
        duration: 300,
      }),
    };
  });

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Animated.View style={animatedStyle}>
        <Stack>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen
          name="add-goal"
          options={{
            presentation: 'modal',
            title: 'New Goal',
            headerShown: true
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
          name="exercise/workout-builder"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="exercise/workout-player"
          options={{
            headerShown: false,
            gestureEnabled: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="exercise/exercise-detail"
          options={{ presentation: 'modal', title: 'Exercise Details' }}
        />
      </Stack>
      </Animated.View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NetworkProvider>
        <AuthProvider>
          <GoalsProvider>
            <WorkoutSessionProvider>
              <RootLayoutNav />
              <OfflineIndicator />
            </WorkoutSessionProvider>
          </GoalsProvider>
        </AuthProvider>
      </NetworkProvider>
    </GestureHandlerRootView>
  );
}
