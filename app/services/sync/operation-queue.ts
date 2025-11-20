import { createSyncOperation } from '@/services/database/sync-operations';
import { updateDietEntrySyncStatus } from '@/services/database/diet';

export class OperationQueue {
  async enqueueUpload(dietEntryId: string, localImageUri: string): Promise<void> {
    const operationId = `upload_${dietEntryId}_${Date.now()}`;

    await createSyncOperation(operationId, 'upload', dietEntryId, localImageUri, null);

    await updateDietEntrySyncStatus(dietEntryId, 'not_synced');
  }

  async enqueueUpdate(
    dietEntryId: string,
    newImageUri: string,
    oldGdriveFileId: string | null
  ): Promise<void> {
    const operationId = `update_${dietEntryId}_${Date.now()}`;

    await createSyncOperation(operationId, 'update', dietEntryId, newImageUri, oldGdriveFileId);

    await updateDietEntrySyncStatus(dietEntryId, 'not_synced');
  }

  async enqueueDelete(gdriveFileId: string, dietEntryId: string): Promise<void> {
    const operationId = `delete_${Date.now()}`;

    await createSyncOperation(operationId, 'delete', dietEntryId, null, gdriveFileId);
  }
}

export const operationQueue = new OperationQueue();
