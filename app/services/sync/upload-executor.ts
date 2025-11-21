import { googleDriveApi } from '@/services/google-drive/drive-api';
import {
  updateOperationStatus,
  markOperationComplete,
  markOperationFailed,
  incrementRetryCount,
} from '@/services/database/sync-operations';
import {
  updateDietEntrySyncStatus,
  updateDietEntryGDriveInfo,
  getDietEntryById,
} from '@/services/database/diet';
import {
  incrementTotalUploads,
  incrementFailedUploads,
} from '@/services/database/sync-settings';
import { retryStrategy } from './retry-strategy';
import type { SyncOperation } from '@/types/sync';

export class UploadExecutor {
  async executeOperation(operation: SyncOperation): Promise<boolean> {
    try {
      await updateOperationStatus(operation.id, 'processing');
      await updateDietEntrySyncStatus(operation.dietEntryId, 'syncing');

      let success = false;

      switch (operation.operationType) {
        case 'upload':
          success = await this.handleUpload(operation);
          break;
        case 'update':
          success = await this.handleUpdate(operation);
          break;
        case 'delete':
          success = await this.handleDelete(operation);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.operationType}`);
      }

      if (success) {
        await markOperationComplete(operation.id);

        if (operation.operationType !== 'delete') {
          await incrementTotalUploads();
        }

        return true;
      } else {
        throw new Error('Operation failed');
      }
    } catch (error: any) {
      console.error(`Operation ${operation.id} failed:`, error);

      const errorMessage = error.message || 'Unknown error';

      if (retryStrategy.isPermanentError(errorMessage)) {
        await markOperationFailed(operation.id, errorMessage);
        await updateDietEntrySyncStatus(operation.dietEntryId, 'failed');
        await incrementFailedUploads();
        console.log(`Operation ${operation.id} permanently failed: ${errorMessage}`);
        return false;
      }

      if (retryStrategy.shouldRetry(operation.retryCount)) {
        await incrementRetryCount(operation.id);
        await updateOperationStatus(operation.id, 'pending', errorMessage);
        await updateDietEntrySyncStatus(operation.dietEntryId, 'not_synced');
        return false;
      } else {
        await markOperationFailed(operation.id, errorMessage);
        await updateDietEntrySyncStatus(operation.dietEntryId, 'failed');
        await incrementFailedUploads();
        console.log(`Operation ${operation.id} failed after max retries`);
        return false;
      }
    }
  }

  private async handleUpload(operation: SyncOperation): Promise<boolean> {
    if (!operation.localImageUri) {
      throw new Error('No local image URI for upload operation');
    }

    const dietEntry = await getDietEntryById(operation.dietEntryId);
    if (!dietEntry) {
      throw new Error('Diet entry not found');
    }

    const folderId = await googleDriveApi.ensureFolderStructure(dietEntry.timestamp);

    const filename = `${operation.dietEntryId}.jpg`;

    const result = await googleDriveApi.uploadImage(
      operation.localImageUri,
      filename,
      folderId
    );

    if (result.success && result.fileId) {
      await updateDietEntryGDriveInfo(operation.dietEntryId, result.fileId, folderId);
      return true;
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  }

  private async handleUpdate(operation: SyncOperation): Promise<boolean> {
    if (!operation.localImageUri) {
      throw new Error('No local image URI for update operation');
    }

    const dietEntry = await getDietEntryById(operation.dietEntryId);
    if (!dietEntry) {
      throw new Error('Diet entry not found');
    }

    const folderId = await googleDriveApi.ensureFolderStructure(dietEntry.timestamp);

    const filename = `${operation.dietEntryId}.jpg`;

    if (operation.gdriveFileId) {
      const result = await googleDriveApi.updateFile(
        operation.gdriveFileId,
        operation.localImageUri,
        filename,
        folderId
      );

      if (result.success && result.fileId) {
        await updateDietEntryGDriveInfo(operation.dietEntryId, result.fileId, folderId);
        return true;
      } else {
        throw new Error(result.error || 'Update failed');
      }
    } else {
      const result = await googleDriveApi.uploadImage(
        operation.localImageUri,
        filename,
        folderId
      );

      if (result.success && result.fileId) {
        await updateDietEntryGDriveInfo(operation.dietEntryId, result.fileId, folderId);
        return true;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    }
  }

  private async handleDelete(operation: SyncOperation): Promise<boolean> {
    if (!operation.gdriveFileId) {
      console.warn('No file ID for delete operation, considering as complete');
      return true;
    }

    const deleted = await googleDriveApi.deleteFile(operation.gdriveFileId);

    if (!deleted) {
      throw new Error('Failed to delete file from Google Drive');
    }

    return true;
  }
}

export const uploadExecutor = new UploadExecutor();
