import { getDatabase } from './connection';
import { fileStorage } from '@/services/file-storage';
import type { DietSyncStatus } from '@/types/sync';

/**
 * Diet entry data structure
 */
export interface DietEntry {
  id: string;
  imageUri: string;
  name: string;
  description: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  timestamp: number;
  syncStatus?: DietSyncStatus;
  gdriveFileId?: string | null;
  gdriveFolderId?: string | null;
}

/**
 * Save a new diet entry to the database
 */
export async function saveDietEntry(entry: DietEntry): Promise<void> {
  const db = getDatabase();

  await db.runAsync(
    `INSERT INTO diet (id, image_uri, name, description, calories, protein, carbs, fat, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.imageUri,
      entry.name,
      entry.description,
      entry.calories,
      entry.protein,
      entry.carbs,
      entry.fat,
      entry.timestamp,
    ]
  );
}

/**
 * Get all diet entries, ordered by timestamp (newest first)
 */
export async function getDietEntries(): Promise<DietEntry[]> {
  const db = getDatabase();

  const rows = await db.getAllAsync<{
    id: string;
    image_uri: string;
    name: string | null;
    description: string | null;
    calories: string | null;
    protein: string | null;
    carbs: string | null;
    fat: string | null;
    timestamp: number;
    sync_status: string | null;
    gdrive_file_id: string | null;
    gdrive_folder_id: string | null;
  }>('SELECT * FROM diet ORDER BY timestamp DESC');

  return rows.map((row) => ({
    id: row.id,
    imageUri: row.image_uri,
    name: row.name || '',
    description: row.description || '',
    calories: row.calories || '',
    protein: row.protein || '',
    carbs: row.carbs || '',
    fat: row.fat || '',
    timestamp: row.timestamp,
    syncStatus: (row.sync_status as DietSyncStatus) || 'not_synced',
    gdriveFileId: row.gdrive_file_id,
    gdriveFolderId: row.gdrive_folder_id,
  }));
}

/**
 * Get a single diet entry by ID
 */
export async function getDietEntryById(id: string): Promise<DietEntry | null> {
  const db = getDatabase();

  const row = await db.getFirstAsync<{
    id: string;
    image_uri: string;
    name: string | null;
    description: string | null;
    calories: string | null;
    protein: string | null;
    carbs: string | null;
    fat: string | null;
    timestamp: number;
    sync_status: string | null;
    gdrive_file_id: string | null;
    gdrive_folder_id: string | null;
  }>('SELECT * FROM diet WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    imageUri: row.image_uri,
    name: row.name || '',
    description: row.description || '',
    calories: row.calories || '',
    protein: row.protein || '',
    carbs: row.carbs || '',
    fat: row.fat || '',
    timestamp: row.timestamp,
    syncStatus: (row.sync_status as DietSyncStatus) || 'not_synced',
    gdriveFileId: row.gdrive_file_id,
    gdriveFolderId: row.gdrive_folder_id,
  };
}

/**
 * Update an existing diet entry
 */
export async function updateDietEntry(entry: DietEntry): Promise<void> {
  const db = getDatabase();

  await db.runAsync(
    `UPDATE diet
     SET image_uri = ?, name = ?, description = ?, calories = ?, protein = ?, carbs = ?, fat = ?, timestamp = ?
     WHERE id = ?`,
    [
      entry.imageUri,
      entry.name,
      entry.description,
      entry.calories,
      entry.protein,
      entry.carbs,
      entry.fat,
      entry.timestamp,
      entry.id,
    ]
  );
}

/**
 * Delete a diet entry by ID
 */
export async function deleteDietEntry(id: string): Promise<void> {
  const db = getDatabase();

  const entry = await getDietEntryById(id);
  if (entry?.imageUri) {
    await fileStorage.deleteImage(entry.imageUri);
  }

  await db.runAsync('DELETE FROM diet WHERE id = ?', [id]);
}

/**
 * Delete all diet entries (useful for testing)
 */
export async function deleteAllDietEntries(): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM diet');
}

/**
 * Update sync status for a diet entry
 */
export async function updateDietEntrySyncStatus(
  id: string,
  syncStatus: DietSyncStatus
): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE diet SET sync_status = ? WHERE id = ?', [syncStatus, id]);
}

/**
 * Update Google Drive file information for a diet entry
 */
export async function updateDietEntryGDriveInfo(
  id: string,
  fileId: string,
  folderId: string
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'UPDATE diet SET gdrive_file_id = ?, gdrive_folder_id = ?, sync_status = ? WHERE id = ?',
    [fileId, folderId, 'synced', id]
  );
}
