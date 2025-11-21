import { getDatabase } from '@/services/database/connection';

const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export class GoogleDriveFolderCache {
  async getFolderId(key: string): Promise<string | null> {
    try {
      const db = getDatabase();

      const row = await db.getFirstAsync<{
        folder_id: string;
        timestamp: number;
      }>('SELECT folder_id, timestamp FROM folder_cache WHERE key = ?', [key]);

      if (!row) {
        return null;
      }

      if (this.isCacheExpired(row.timestamp)) {
        await db.runAsync('DELETE FROM folder_cache WHERE key = ?', [key]);
        return null;
      }

      return row.folder_id;
    } catch (error) {
      console.error('Error reading folder cache:', error);
      return null;
    }
  }

  async setFolderId(key: string, folderId: string): Promise<void> {
    try {
      const db = getDatabase();
      const now = Date.now();

      await db.runAsync(
        `INSERT OR REPLACE INTO folder_cache (key, folder_id, timestamp)
         VALUES (?, ?, ?)`,
        [key, folderId, now]
      );
    } catch (error) {
      console.error('Error writing folder cache:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      const db = getDatabase();
      await db.runAsync('DELETE FROM folder_cache');
    } catch (error) {
      console.error('Error clearing folder cache:', error);
    }
  }

  private isCacheExpired(timestamp: number): boolean {
    const now = Date.now();
    return now - timestamp > CACHE_DURATION_MS;
  }
}

export const googleDriveFolderCache = new GoogleDriveFolderCache();
