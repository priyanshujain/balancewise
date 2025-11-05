import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { ThemedText } from './themed-text';
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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

      const result = await WebBrowser.openBrowserAsync(authUrl);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        setIsLoading(false);
        setStatusMessage('');
        return;
      }

      setStatusMessage('Permission granted! Updating...');

      timeoutRef.current = setTimeout(async () => {
        try {
          await setDrivePermission(true);
          setIsLoading(false);
          setStatusMessage('');
          onSuccess();
          onClose();
        } catch (error) {
          console.error('Failed to update Drive permission:', error);
          setIsLoading(false);
          setStatusMessage('');
          Alert.alert('Error', 'Failed to update Drive permission. Please try again.');
        }
      }, 2000);

    } catch (error) {
      console.error('Drive permission error:', error);
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
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Ionicons name="logo-google-drive" size={48} color={colors.tint} />
            <ThemedText style={styles.title}>Google Drive Access</ThemedText>
          </View>

          <ThemedText style={[styles.description, { color: colors.text }]}>
            To save your food images securely, we need permission to access your Google Drive.
          </ThemedText>

          <View style={[styles.benefitsContainer, { backgroundColor: colors.card }]}>
            <View style={styles.benefitRow}>
              <Ionicons name="cloud-upload-outline" size={24} color={colors.tint} />
              <ThemedText style={styles.benefitText}>
                Your photos will be stored in your personal Google Drive
              </ThemedText>
            </View>

            <View style={styles.benefitRow}>
              <Ionicons name="folder-outline" size={24} color={colors.tint} />
              <ThemedText style={styles.benefitText}>
                Organized in a "BalanceWise" folder you can access anytime
              </ThemedText>
            </View>

            <View style={styles.benefitRow}>
              <Ionicons name="lock-closed-outline" size={24} color={colors.tint} />
              <ThemedText style={styles.benefitText}>
                Only you have access - we never see your photos
              </ThemedText>
            </View>
          </View>

          {statusMessage && (
            <ThemedText style={[styles.statusMessage, { color: colors.tabIconDefault }]}>
              {statusMessage}
            </ThemedText>
          )}

          <View style={styles.buttonContainer}>
            <Pressable
              style={[
                styles.button,
                styles.cancelButton,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
              onPress={onClose}
              disabled={isLoading}
            >
              <ThemedText style={[styles.buttonText, { color: colors.text }]}>
                Not Now
              </ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                styles.grantButton,
                { backgroundColor: colors.tint },
                isLoading && styles.buttonDisabled
              ]}
              onPress={handleGrantPermission}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={[styles.buttonText, { color: '#fff' }]}>
                  Grant Access
                </ThemedText>
              )}
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  benefitsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
  statusMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  grantButton: {
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
