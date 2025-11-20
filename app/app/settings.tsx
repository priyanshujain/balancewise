import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';
import {
  getSyncSettings,
  setWifiOnly,
  resetSyncStats,
} from '@/services/database/sync-settings';
import {
  getFailedOperations,
  resetOperationForRetry,
  deleteOperation,
  getPendingOperationCount,
} from '@/services/database/sync-operations';
import { queueProcessor } from '@/services/sync/queue-processor';
import { getRelativeTime } from '@/utils/date-helpers';
import type { SyncSettings, SyncOperation } from '@/types/sync';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SyncSettings | null>(null);
  const [failedOps, setFailedOps] = useState<SyncOperation[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, token } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      const [syncSettings, failed, pending] = await Promise.all([
        getSyncSettings(),
        getFailedOperations(),
        getPendingOperationCount(),
      ]);
      setSettings(syncSettings);
      setFailedOps(failed);
      setPendingCount(pending);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWifiToggle = async (value: boolean) => {
    try {
      await setWifiOnly(value);
      setSettings((prev) => (prev ? { ...prev, wifiOnly: value } : null));
    } catch (error) {
      console.error('Error updating WiFi setting:', error);
    }
  };

  const handleManualSync = async () => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to sync');
      return;
    }

    if (!user?.hasDrivePermission) {
      Alert.alert('Error', 'Google Drive permission required');
      return;
    }

    try {
      setSyncing(true);
      await queueProcessor.processSyncQueue(token);
      Alert.alert('Success', 'Sync completed');
      await loadData();
    } catch (error) {
      console.error('Manual sync failed:', error);
      Alert.alert('Error', 'Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleRetryOperation = async (opId: string) => {
    try {
      await resetOperationForRetry(opId);
      Alert.alert('Success', 'Operation queued for retry');
      await loadData();
    } catch (error) {
      console.error('Error retrying operation:', error);
      Alert.alert('Error', 'Failed to retry operation');
    }
  };

  const handleDeleteOperation = async (opId: string) => {
    Alert.alert(
      'Delete Operation',
      'Are you sure you want to delete this failed operation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOperation(opId);
              await loadData();
            } catch (error) {
              console.error('Error deleting operation:', error);
            }
          },
        },
      ]
    );
  };

  const handleResetStats = async () => {
    Alert.alert(
      'Reset Statistics',
      'Are you sure you want to reset sync statistics?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetSyncStats();
              await loadData();
            } catch (error) {
              console.error('Error resetting stats:', error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ title: 'Settings' }} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user?.hasDrivePermission) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ title: 'Settings' }} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Ionicons name="cloud-offline-outline" size={64} color={colors.tabIconDefault} />
          <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 16, color: colors.text }}>
            Google Drive Not Connected
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.tabIconDefault,
              textAlign: 'center',
              marginTop: 8,
            }}>
            Grant Google Drive permission from the Diet tab to enable sync settings.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            Sync Preferences
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
            }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                WiFi Only
              </Text>
              <Text style={{ fontSize: 13, color: colors.tabIconDefault, marginTop: 2 }}>
                Only sync when connected to WiFi
              </Text>
            </View>
            <Switch
              value={settings?.wifiOnly ?? true}
              onValueChange={handleWifiToggle}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            Statistics
          </Text>

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: colors.tabIconDefault }}>Total Uploads</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {settings?.totalUploads ?? 0}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: colors.tabIconDefault }}>Failed Uploads</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>
                {settings?.failedUploads ?? 0}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: colors.tabIconDefault }}>Pending Operations</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#F59E0B' }}>
                {pendingCount}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: colors.tabIconDefault }}>Last Sync</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                {settings?.lastSyncAt ? getRelativeTime(settings.lastSyncAt) : 'Never'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleResetStats}
            style={{
              marginTop: 16,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.tabIconDefault }}>
              Reset Statistics
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleManualSync}
          disabled={syncing}
          style={{
            backgroundColor: colors.tint,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: syncing ? 0.6 : 1,
          }}>
          {syncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="sync" size={20} color="#fff" />
          )}
          <Text
            style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginLeft: syncing ? 12 : 8 }}>
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Text>
        </Pressable>

        {failedOps.length > 0 && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              Failed Operations
            </Text>

            {failedOps.map((op) => (
              <View
                key={op.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: colors.background,
                  marginBottom: 8,
                }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textTransform: 'capitalize' }}>
                    {op.operationType}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.tabIconDefault }}>
                    {getRelativeTime(op.updatedAt)}
                  </Text>
                </View>

                {op.lastError && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginBottom: 8 }}>
                    {op.lastError}
                  </Text>
                )}

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => handleRetryOperation(op.id)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 6,
                      backgroundColor: colors.tint,
                      alignItems: 'center',
                    }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Retry</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleDeleteOperation(op.id)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: 'center',
                    }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.tabIconDefault }}>
                      Dismiss
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
