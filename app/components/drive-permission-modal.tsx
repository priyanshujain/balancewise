import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Pressable, ActivityIndicator, Alert, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { ThemedView } from './themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';
import { apiService } from '@/services/api';

WebBrowser.maybeCompleteAuthSession();

interface DrivePermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DrivePermissionModal({ visible, onClose, onSuccess }: DrivePermissionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token, setDrivePermission } = useAuth();
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const handleCancel = () => {
    stopPolling();
    setIsLoading(false);
    setStatusMessage('');
    onClose();
  };

  const pollForPermission = async () => {
    if (!token) return;

    setStatusMessage('Checking authorization...');

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const profile = await apiService.getProfile(token);

        if (profile.gdrive_allowed) {
          stopPolling();
          setStatusMessage('Permission granted! Updating...');

          await setDrivePermission(true);
          setIsLoading(false);
          setStatusMessage('');
          onSuccess();
          onClose();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 1000);

    pollingTimeoutRef.current = setTimeout(() => {
      stopPolling();
      setIsLoading(false);
      setStatusMessage('');
      Alert.alert(
        'Authorization Timeout',
        'The authorization process timed out. Please try again.'
      );
    }, 120000);
  };

  const handleGrantPermission = async () => {
    if (!token) {
      Alert.alert('Error', 'You must be signed in to grant Drive permissions');
      return;
    }

    try {
      setIsLoading(true);
      setStatusMessage('Preparing authorization...');

      const { authUrl } = await apiService.requestDrivePermission(token);

      setStatusMessage('Opening browser...');

      await WebBrowser.openBrowserAsync(authUrl);

      pollForPermission();

    } catch (error) {
      console.error('Drive permission error:', error);
      stopPolling();
      setIsLoading(false);
      setStatusMessage('');
      Alert.alert(
        'Permission Request Failed',
        error instanceof Error ? error.message : 'Failed to request Drive permissions'
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <ThemedView className="flex-1">
        {/* Close/Cancel button */}
        <Pressable
          className="absolute top-14 right-5 z-10 p-2"
          onPress={handleCancel}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>

        {/* Content */}
        <View className="flex-1 items-center justify-center px-10">
          {/* Google Drive Logo */}
          <Image
            source={require('@/assets/images/gdrive.png')}
            className="w-24 h-24 mb-8"
            resizeMode="contain"
          />

          {/* Title */}
          <Text className="text-2xl font-bold text-center mb-5" style={{ color: colors.text }}>
            Google Drive Access Required
          </Text>

          {/* Description */}
          <Text className="text-base text-center leading-6 mb-10 opacity-90" style={{ color: colors.text }}>
            To save your food images securely, we need permission to access your Google Drive.
          </Text>

          {/* Benefits */}
          <View
            className="w-full rounded-2xl p-6 gap-5"
            style={{ backgroundColor: colors.card }}
          >
            <View className="flex-row items-start gap-4">
              <Ionicons name="cloud-upload-outline" size={24} color={colors.tint} />
              <Text className="flex-1 text-[15px] leading-6" style={{ color: colors.text }}>
                Your photos will be stored in your personal Google Drive
              </Text>
            </View>

            <View className="flex-row items-start gap-4">
              <Ionicons name="folder-outline" size={24} color={colors.tint} />
              <Text className="flex-1 text-[15px] leading-6" style={{ color: colors.text }}>
                Organized in a {'"'}BalanceWise{'"'} folder you can access anytime
              </Text>
            </View>

            <View className="flex-row items-start gap-4">
              <Ionicons name="lock-closed-outline" size={24} color={colors.tint} />
              <Text className="flex-1 text-[15px] leading-6" style={{ color: colors.text }}>
                Only you have access - we never see your photos
              </Text>
            </View>
          </View>

          {statusMessage && (
            <Text
              className="text-sm text-center mt-5 italic"
              style={{ color: colors.icon }}
            >
              {statusMessage}
            </Text>
          )}
        </View>

        {/* Grant Access Button */}
        <View className="px-10 pb-12">
          <Pressable
            className="py-5 rounded-xl items-center justify-center"
            style={[
              { backgroundColor: colors.tint },
              isLoading && { opacity: 0.6 }
            ]}
            onPress={handleGrantPermission}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-lg font-semibold text-white">
                Grant Access
              </Text>
            )}
          </Pressable>
        </View>
      </ThemedView>
    </Modal>
  );
}
