import { useState, useEffect, useCallback } from 'react';
import {
  getDietEntries,
  saveDietEntry,
  updateDietEntry as updateDietEntryInDb,
  deleteDietEntry as deleteDietEntryFromDb,
  getDietEntryById,
  type DietEntry,
} from '@/services/database/diet';
import { operationQueue } from '@/services/sync/operation-queue';
import { queueProcessor } from '@/services/sync/queue-processor';
import { useAuth } from '@/contexts/auth-context';

interface UseDietReturn {
  dietEntries: DietEntry[];
  loading: boolean;
  error: string | null;
  addDietEntry: (entry: DietEntry) => Promise<void>;
  updateDietEntry: (entry: DietEntry) => Promise<void>;
  removeDietEntry: (entryId: string) => Promise<void>;
  refreshDietEntries: () => Promise<void>;
}

/**
 * Custom hook for managing diet entries with database persistence
 *
 * Usage:
 * const { dietEntries, loading, addDietEntry, updateDietEntry, removeDietEntry } = useDiet();
 */
export function useDiet(): UseDietReturn {
  const [dietEntries, setDietEntries] = useState<DietEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();

  /**
   * Load all diet entries from database
   */
  const loadDietEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedEntries = await getDietEntries();
      setDietEntries(loadedEntries);
    } catch (err) {
      console.error('Error loading diet entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to load diet entries');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load diet entries on mount
   */
  useEffect(() => {
    loadDietEntries();
  }, [loadDietEntries]);

  /**
   * Add a new diet entry
   */
  const addDietEntry = useCallback(async (entry: DietEntry) => {
    try {
      setError(null);
      await saveDietEntry(entry);

      // Optimistic UI update - add to beginning of list
      setDietEntries((prevEntries) => [entry, ...prevEntries]);

      // Queue sync operation if user has Drive permission
      if (user?.hasDrivePermission) {
        try {
          await operationQueue.enqueueUpload(entry.id, entry.imageUri);
          // Attempt immediate foreground sync
          if (token) {
            queueProcessor.processSyncQueue(token).catch((err) => {
              console.error('Foreground sync failed:', err);
            });
          }
        } catch (syncErr) {
          console.error('Error enqueueing sync operation:', syncErr);
        }
      }
    } catch (err) {
      console.error('Error adding diet entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to add diet entry');

      // Reload diet entries from database on error
      await loadDietEntries();
      throw err;
    }
  }, [loadDietEntries, user, token]);

  /**
   * Update an existing diet entry
   */
  const updateDietEntry = useCallback(async (entry: DietEntry) => {
    try {
      setError(null);

      // Get old entry to check if image changed
      const oldEntry = await getDietEntryById(entry.id);
      const imageChanged = oldEntry && oldEntry.imageUri !== entry.imageUri;

      await updateDietEntryInDb(entry);

      // Optimistic UI update - update in list
      setDietEntries((prevEntries) =>
        prevEntries.map((e) => (e.id === entry.id ? entry : e))
      );

      // Queue sync operation if image changed and user has Drive permission
      if (imageChanged && user?.hasDrivePermission) {
        try {
          await operationQueue.enqueueUpdate(
            entry.id,
            entry.imageUri,
            oldEntry.gdriveFileId || null
          );
          // Attempt immediate foreground sync
          if (token) {
            queueProcessor.processSyncQueue(token).catch((err) => {
              console.error('Foreground sync failed:', err);
            });
          }
        } catch (syncErr) {
          console.error('Error enqueueing sync operation:', syncErr);
        }
      }
    } catch (err) {
      console.error('Error updating diet entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to update diet entry');

      // Reload diet entries from database on error
      await loadDietEntries();
      throw err;
    }
  }, [loadDietEntries, user, token]);

  /**
   * Delete a diet entry
   */
  const removeDietEntry = useCallback(async (entryId: string) => {
    try {
      setError(null);

      // Get entry to check if it has a Drive file ID
      const entry = await getDietEntryById(entryId);

      await deleteDietEntryFromDb(entryId);

      // Optimistic UI update - remove from list
      setDietEntries((prevEntries) => prevEntries.filter((e) => e.id !== entryId));

      // Queue delete operation if entry has Drive file and user has permission
      if (entry?.gdriveFileId && user?.hasDrivePermission) {
        try {
          await operationQueue.enqueueDelete(entry.gdriveFileId, entryId);
          // Attempt immediate foreground sync
          if (token) {
            queueProcessor.processSyncQueue(token).catch((err) => {
              console.error('Foreground sync failed:', err);
            });
          }
        } catch (syncErr) {
          console.error('Error enqueueing sync operation:', syncErr);
        }
      }
    } catch (err) {
      console.error('Error deleting diet entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete diet entry');

      // Reload diet entries from database on error
      await loadDietEntries();
      throw err;
    }
  }, [loadDietEntries, user, token]);

  /**
   * Refresh diet entries from database
   */
  const refreshDietEntries = useCallback(async () => {
    await loadDietEntries();
  }, [loadDietEntries]);

  return {
    dietEntries,
    loading,
    error,
    addDietEntry,
    updateDietEntry,
    removeDietEntry,
    refreshDietEntries,
  };
}
