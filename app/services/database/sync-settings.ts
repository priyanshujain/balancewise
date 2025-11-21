import { getDatabase } from './connection';
import type { SyncSettings } from '@/types/sync';

interface SyncSettingsRow {
  id: number;
  wifi_only: number;
  last_sync_at: number | null;
  total_uploads: number;
  failed_uploads: number;
}

function rowToSyncSettings(row: SyncSettingsRow): SyncSettings {
  return {
    id: row.id,
    wifiOnly: row.wifi_only === 1,
    lastSyncAt: row.last_sync_at,
    totalUploads: row.total_uploads,
    failedUploads: row.failed_uploads,
  };
}

export async function getSyncSettings(): Promise<SyncSettings> {
  const db = getDatabase();

  const row = await db.getFirstAsync<SyncSettingsRow>(
    'SELECT * FROM sync_settings WHERE id = 1'
  );

  if (!row) {
    throw new Error('Sync settings not initialized');
  }

  return rowToSyncSettings(row);
}

export async function setWifiOnly(wifiOnly: boolean): Promise<void> {
  const db = getDatabase();

  await db.runAsync(
    'UPDATE sync_settings SET wifi_only = ? WHERE id = 1',
    [wifiOnly ? 1 : 0]
  );
}

export async function updateLastSyncTime(): Promise<void> {
  const db = getDatabase();
  const now = Date.now();

  await db.runAsync(
    'UPDATE sync_settings SET last_sync_at = ? WHERE id = 1',
    [now]
  );
}

export async function incrementTotalUploads(): Promise<void> {
  const db = getDatabase();

  await db.runAsync(
    'UPDATE sync_settings SET total_uploads = total_uploads + 1 WHERE id = 1'
  );
}

export async function incrementFailedUploads(): Promise<void> {
  const db = getDatabase();

  await db.runAsync(
    'UPDATE sync_settings SET failed_uploads = failed_uploads + 1 WHERE id = 1'
  );
}

export async function resetFailedUploads(): Promise<void> {
  const db = getDatabase();

  await db.runAsync(
    'UPDATE sync_settings SET failed_uploads = 0 WHERE id = 1'
  );
}

export async function resetSyncStats(): Promise<void> {
  const db = getDatabase();

  await db.runAsync(
    'UPDATE sync_settings SET total_uploads = 0, failed_uploads = 0 WHERE id = 1'
  );
}
