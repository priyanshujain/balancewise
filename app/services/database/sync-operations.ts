import { getDatabase } from './connection';
import type { SyncOperation, SyncOperationType, SyncOperationStatus } from '@/types/sync';

interface SyncOperationRow {
  id: string;
  operation_type: string;
  diet_entry_id: string;
  local_image_uri: string | null;
  gdrive_file_id: string | null;
  status: string;
  retry_count: number;
  last_error: string | null;
  created_at: number;
  updated_at: number;
}

function rowToSyncOperation(row: SyncOperationRow): SyncOperation {
  return {
    id: row.id,
    operationType: row.operation_type as SyncOperationType,
    dietEntryId: row.diet_entry_id,
    localImageUri: row.local_image_uri,
    gdriveFileId: row.gdrive_file_id,
    status: row.status as SyncOperationStatus,
    retryCount: row.retry_count,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createSyncOperation(
  id: string,
  operationType: SyncOperationType,
  dietEntryId: string,
  localImageUri: string | null = null,
  gdriveFileId: string | null = null
): Promise<void> {
  const db = getDatabase();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO sync_operations (id, operation_type, diet_entry_id, local_image_uri, gdrive_file_id, status, retry_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
    [id, operationType, dietEntryId, localImageUri, gdriveFileId, now, now]
  );
}

export async function getPendingOperations(): Promise<SyncOperation[]> {
  const db = getDatabase();

  const rows = await db.getAllAsync<SyncOperationRow>(
    `SELECT * FROM sync_operations
     WHERE status IN ('pending', 'failed')
     ORDER BY created_at ASC`
  );

  return rows.map(rowToSyncOperation);
}

export async function getOperationById(id: string): Promise<SyncOperation | null> {
  const db = getDatabase();

  const row = await db.getFirstAsync<SyncOperationRow>(
    'SELECT * FROM sync_operations WHERE id = ?',
    [id]
  );

  return row ? rowToSyncOperation(row) : null;
}

export async function getOperationsByDietEntry(dietEntryId: string): Promise<SyncOperation[]> {
  const db = getDatabase();

  const rows = await db.getAllAsync<SyncOperationRow>(
    'SELECT * FROM sync_operations WHERE diet_entry_id = ? ORDER BY created_at DESC',
    [dietEntryId]
  );

  return rows.map(rowToSyncOperation);
}

export async function getFailedOperations(): Promise<SyncOperation[]> {
  const db = getDatabase();

  const rows = await db.getAllAsync<SyncOperationRow>(
    `SELECT * FROM sync_operations
     WHERE status = 'failed' OR retry_count >= 3
     ORDER BY updated_at DESC`
  );

  return rows.map(rowToSyncOperation);
}

export async function updateOperationStatus(
  id: string,
  status: SyncOperationStatus,
  error: string | null = null
): Promise<void> {
  const db = getDatabase();
  const now = Date.now();

  await db.runAsync(
    `UPDATE sync_operations
     SET status = ?, last_error = ?, updated_at = ?
     WHERE id = ?`,
    [status, error, now, id]
  );
}

export async function markOperationComplete(id: string, gdriveFileId: string | null = null): Promise<void> {
  const db = getDatabase();
  const now = Date.now();

  await db.runAsync(
    `UPDATE sync_operations
     SET status = 'completed', gdrive_file_id = ?, updated_at = ?
     WHERE id = ?`,
    [gdriveFileId, now, id]
  );
}

export async function markOperationFailed(id: string, error: string): Promise<void> {
  const db = getDatabase();
  const now = Date.now();

  await db.runAsync(
    `UPDATE sync_operations
     SET status = 'failed', last_error = ?, updated_at = ?
     WHERE id = ?`,
    [error, now, id]
  );
}

export async function incrementRetryCount(id: string): Promise<void> {
  const db = getDatabase();
  const now = Date.now();

  await db.runAsync(
    `UPDATE sync_operations
     SET retry_count = retry_count + 1, status = 'pending', updated_at = ?
     WHERE id = ?`,
    [now, id]
  );
}

export async function resetOperationForRetry(id: string): Promise<void> {
  const db = getDatabase();
  const now = Date.now();

  await db.runAsync(
    `UPDATE sync_operations
     SET retry_count = 0, status = 'pending', last_error = NULL, updated_at = ?
     WHERE id = ?`,
    [now, id]
  );
}

export async function deleteOperation(id: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM sync_operations WHERE id = ?', [id]);
}

export async function deleteCompletedOperations(): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM sync_operations WHERE status = ?', ['completed']);
}

export async function getOperationCount(): Promise<number> {
  const db = getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM sync_operations'
  );
  return result?.count ?? 0;
}

export async function getPendingOperationCount(): Promise<number> {
  const db = getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sync_operations
     WHERE status IN ('pending', 'failed')`
  );
  return result?.count ?? 0;
}
