import React, { useState, useRef, useEffect } from 'react';
import { Pressable, ActivityIndicator, Alert, Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';
import { apiService } from '@/services/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const { signIn } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const pollingIntervalRef = useRef<number | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const startPolling = async (state: string) => {
    let pollCount = 0;
    const maxPolls = 120; // 2 minutes (120 * 1 second)

    setStatusMessage('Waiting for authentication...');

    pollingIntervalRef.current = setInterval(async () => {
      pollCount++;

      if (pollCount > maxPolls) {
        // Timeout
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        setIsLoading(false);
        setStatusMessage('');
        Alert.alert('Timeout', 'Authentication timed out. Please try again.');
        return;
      }

      try {
        const result = await apiService.pollAuth(state);

        if (result.authenticated && result.token && result.user) {
          // Authentication successful
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }

          setStatusMessage('Authentication successful!');

          // Save authentication data
          await signIn(result.token, result.user);

          // Navigate to app
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Continue polling even if there's an error
      }
    }, 1000); // Poll every 1 second
  };

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Initiating authentication...');

      // Call initiate endpoint to get Google OAuth URL and state
      const { authUrl, state } = await apiService.initiateAuth();

      setStatusMessage('Opening browser...');

      // Start polling for authentication status
      startPolling(state);

      // Open Google OAuth URL in browser
      const result = await WebBrowser.openBrowserAsync(authUrl);

      // Handle browser closure
      if (result.type === 'cancel' || result.type === 'dismiss') {
        // User closed the browser
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        setIsLoading(false);
        setStatusMessage('');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      setIsLoading(false);
      setStatusMessage('');
      Alert.alert(
        'Sign In Failed',
        error instanceof Error ? error.message : 'Failed to initiate Google Sign In'
      );
    }
  };

  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: colors.yellow }}
      edges={['top', 'bottom']}
    >
      <View className="w-full max-w-md items-center px-5">
        <Image
          source={require('@/assets/images/icon.png')}
          style={{ width: 100, height: 100, marginBottom: 24 }}
          resizeMode="contain"
        />
        <ThemedText
          className="text-4xl font-bold mb-3 text-center"
          lightColor="#11181C"
          darkColor="#11181C"
        >
          Welcome to BalanceWise
        </ThemedText>
        <ThemedText
          className="text-base mb-10 text-center opacity-70"
          lightColor="#11181C"
          darkColor="#11181C"
        >
          Sign in with your Google account to continue
        </ThemedText>

        <Pressable
          className="items-center justify-center active:opacity-70"
          onPress={handleSignIn}
          disabled={isLoading}
          style={{ width: 320, height: 56 }}>
          {isLoading ? (
            <ActivityIndicator color="#3c4043" />
          ) : (
            <Image
              source={require('@/assets/images/google-signin.png')}
              style={{ width: 320, height: 56 }}
              resizeMode="contain"
            />
          )}
        </Pressable>

        {statusMessage && (
          <ThemedText
            className="mt-5 text-sm opacity-70 text-center"
            lightColor="#11181C"
            darkColor="#11181C"
          >
            {statusMessage}
          </ThemedText>
        )}
      </View>
    </SafeAreaView>
  );
}

