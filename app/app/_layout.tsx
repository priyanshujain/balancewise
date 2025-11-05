import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { GoalsProvider } from '@/contexts/goals-context';
import { WorkoutSessionProvider } from '@/contexts/WorkoutSessionContext';
import { seedDatabaseIfNeeded } from '@/services/database';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
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

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
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
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <GoalsProvider>
          <WorkoutSessionProvider>
            <RootLayoutNav />
          </WorkoutSessionProvider>
        </GoalsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
