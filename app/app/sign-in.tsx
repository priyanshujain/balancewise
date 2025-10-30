import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Welcome to BalanceWise
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Sign in with your Google account to continue
        </ThemedText>

        <Pressable
          style={({ pressed }) => [
            styles.googleButton,
            {
              backgroundColor: colors.tint,
              opacity: pressed || isLoading ? 0.8 : 1
            },
          ]}
          onPress={handleSignIn}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <ThemedView style={styles.googleIconContainer}>
                <ThemedText style={styles.googleIcon}>G</ThemedText>
              </ThemedView>
              <ThemedText style={styles.buttonText}>Sign in with Google</ThemedText>
            </>
          )}
        </Pressable>

        {statusMessage && (
          <ThemedText style={styles.statusMessage}>{statusMessage}</ThemedText>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.7,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    maxWidth: 320,
    minHeight: 50,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusMessage: {
    marginTop: 20,
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});
