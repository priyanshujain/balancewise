import NetInfo from '@react-native-community/netinfo';
import { getPendingOperations } from '@/services/database/sync-operations';
import { getSyncSettings, updateLastSyncTime } from '@/services/database/sync-settings';
import { uploadExecutor } from './upload-executor';
import { googleDriveTokenManager } from '@/services/google-drive/token-manager';

let isProcessing = false;

export class QueueProcessor {
  async processSyncQueue(jwtToken?: string): Promise<void> {
    if (isProcessing) {
      return;
    }

    isProcessing = true;

    try {
      if (jwtToken) {
        googleDriveTokenManager.setJwtToken(jwtToken);
      }

      const settings = await getSyncSettings();

      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;

      if (!isOnline) {
        return;
      }

      if (settings.wifiOnly && networkState.type !== 'wifi') {
        return;
      }

      const pendingOperations = await getPendingOperations();

      if (pendingOperations.length === 0) {
        return;
      }

      for (const operation of pendingOperations) {
        try {
          await uploadExecutor.executeOperation(operation);

          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error processing operation ${operation.id}:`, error);
        }
      }

      await updateLastSyncTime();
    } catch (error) {
      console.error('Error in sync queue processor:', error);
    } finally {
      isProcessing = false;
    }
  }
}

export const queueProcessor = new QueueProcessor();
