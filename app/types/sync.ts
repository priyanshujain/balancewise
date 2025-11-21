export type SyncOperationType = 'upload' | 'update' | 'delete';

export type SyncOperationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type DietSyncStatus = 'not_synced' | 'syncing' | 'synced' | 'failed';

export interface SyncOperation {
  id: string;
  operationType: SyncOperationType;
  dietEntryId: string;
  localImageUri: string | null;
  gdriveFileId: string | null;
  status: SyncOperationStatus;
  retryCount: number;
  lastError: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface SyncSettings {
  id: number;
  wifiOnly: boolean;
  lastSyncAt: number | null;
  totalUploads: number;
  failedUploads: number;
}

export interface GoogleDriveToken {
  access_token: string;
  expires_at: string;
}

export interface GoogleDriveFolderMetadata {
  id: string;
  name: string;
  mimeType: string;
}

export interface GoogleDriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  error?: string;
}

export interface FolderCacheEntry {
  folderId: string;
  timestamp: number;
}
