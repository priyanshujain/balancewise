import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { initDatabase } from '@/services/database/connection';
import { queueProcessor } from './queue-processor';

export const SYNC_TASK_NAME = 'google-drive-background-sync';

// Define the task (MUST be in global scope and MUST return BackgroundTaskResult)
TaskManager.defineTask(SYNC_TASK_NAME, async () => {
  try {
    console.log('[Background Sync] Task started');

    await initDatabase();
    await queueProcessor.processSyncQueue();

    console.log('[Background Sync] Task completed successfully');
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('[Background Sync] Task failed:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundSync(): Promise<void> {
  try {
    // Check if background tasks are available
    const status = await BackgroundTask.getStatusAsync();
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
      console.warn('[Background Sync] Background tasks are not available');
      return;
    }

    await BackgroundTask.registerTaskAsync(SYNC_TASK_NAME, {
      minimumInterval: 60, // 60 minutes = 1 hour (minimum is 15)
    });

    console.log('[Background Sync] Task registered successfully');
  } catch (error: any) {
    if (error?.message?.includes('already registered') || error?.message?.includes('Task already exists')) {
      console.log('[Background Sync] Task already registered');
    } else {
      console.error('[Background Sync] Failed to register task:', error);
    }
  }
}

export async function unregisterBackgroundSync(): Promise<void> {
  try {
    await BackgroundTask.unregisterTaskAsync(SYNC_TASK_NAME);
    console.log('[Background Sync] Task unregistered');
  } catch (error) {
    console.error('[Background Sync] Failed to unregister task:', error);
  }
}

// Debug helper - only works in development builds
export async function testBackgroundSync(): Promise<void> {
  try {
    await BackgroundTask.triggerTaskWorkerForTestingAsync(SYNC_TASK_NAME);
    console.log('[Background Sync] Test trigger sent');
  } catch (error) {
    console.error('[Background Sync] Test trigger failed:', error);
  }
}
