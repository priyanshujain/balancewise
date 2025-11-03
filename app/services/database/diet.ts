import { getDatabase } from './connection';

/**
 * Diet entry data structure
 */
export interface DietEntry {
  id: string;
  imageUri: string;
  description: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  timestamp: number;
}

/**
 * Save a new diet entry to the database
 */
export async function saveDietEntry(entry: DietEntry): Promise<void> {
  const db = getDatabase();

  await db.runAsync(
    `INSERT INTO diet (id, image_uri, description, calories, protein, carbs, fat, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.imageUri,
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
    description: string | null;
    calories: string | null;
    protein: string | null;
    carbs: string | null;
    fat: string | null;
    timestamp: number;
  }>('SELECT * FROM diet ORDER BY timestamp DESC');

  return rows.map((row) => ({
    id: row.id,
    imageUri: row.image_uri,
    description: row.description || '',
    calories: row.calories || '',
    protein: row.protein || '',
    carbs: row.carbs || '',
    fat: row.fat || '',
    timestamp: row.timestamp,
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
    description: string | null;
    calories: string | null;
    protein: string | null;
    carbs: string | null;
    fat: string | null;
    timestamp: number;
  }>('SELECT * FROM diet WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    imageUri: row.image_uri,
    description: row.description || '',
    calories: row.calories || '',
    protein: row.protein || '',
    carbs: row.carbs || '',
    fat: row.fat || '',
    timestamp: row.timestamp,
  };
}

/**
 * Update an existing diet entry
 */
export async function updateDietEntry(entry: DietEntry): Promise<void> {
  const db = getDatabase();

  await db.runAsync(
    `UPDATE diet
     SET image_uri = ?, description = ?, calories = ?, protein = ?, carbs = ?, fat = ?, timestamp = ?
     WHERE id = ?`,
    [
      entry.imageUri,
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
  await db.runAsync('DELETE FROM diet WHERE id = ?', [id]);
}

/**
 * Delete all diet entries (useful for testing)
 */
export async function deleteAllDietEntries(): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM diet');
}
