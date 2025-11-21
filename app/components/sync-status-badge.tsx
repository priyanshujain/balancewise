import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DietSyncStatus } from '@/types/sync';

interface SyncStatusBadgeProps {
  status: DietSyncStatus | undefined;
  size?: number;
}

export function SyncStatusBadge({ status = 'not_synced', size = 16 }: SyncStatusBadgeProps) {
  if (!status || status === 'not_synced') {
    return (
      <View style={{ opacity: 0.5 }}>
        <Ionicons name="cloud-upload-outline" size={size} color="#9CA3AF" />
      </View>
    );
  }

  if (status === 'syncing') {
    return <ActivityIndicator size="small" color="#3B82F6" />;
  }

  if (status === 'synced') {
    return <Ionicons name="cloud-done-outline" size={size} color="#10B981" />;
  }

  if (status === 'failed') {
    return <Ionicons name="cloud-offline-outline" size={size} color="#EF4444" />;
  }

  return null;
}
