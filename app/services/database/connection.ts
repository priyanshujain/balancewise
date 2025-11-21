import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'balancewise.db';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Initialize database with singleton pattern to prevent race conditions.
 * Multiple simultaneous calls will wait for the same initialization to complete.
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      await db.execAsync('PRAGMA foreign_keys = ON;');

      // Create all tables
      await db.execAsync(`
        -- Goals/Tasks tables
        CREATE TABLE IF NOT EXISTS goals (
          id TEXT PRIMARY KEY NOT NULL,
          text TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS task_completions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          goal_id TEXT NOT NULL,
          date TEXT NOT NULL,
          completed_at TEXT NOT NULL,
          FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE,
          UNIQUE(goal_id, date)
        );

        CREATE INDEX IF NOT EXISTS idx_completions_date ON task_completions(date);
        CREATE INDEX IF NOT EXISTS idx_completions_goal_id ON task_completions(goal_id);

        -- Auth table
        CREATE TABLE IF NOT EXISTS auth (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token TEXT NOT NULL,
          user_id TEXT NOT NULL,
          email TEXT NOT NULL,
          name TEXT NOT NULL,
          picture TEXT,
          has_drive_permission INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        -- Exercise tables
        CREATE TABLE IF NOT EXISTS exercises (
          id TEXT PRIMARY KEY NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          affected_muscles TEXT NOT NULL,
          images TEXT NOT NULL,
          video_link TEXT,
          break_seconds INTEGER DEFAULT 30,
          requires_weight INTEGER DEFAULT 0,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS workouts (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          schedule_days TEXT,
          reminder_time TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS workout_exercises (
          id TEXT PRIMARY KEY NOT NULL,
          workout_id TEXT NOT NULL,
          exercise_id TEXT NOT NULL,
          order_index INTEGER NOT NULL,
          sets INTEGER NOT NULL,
          reps INTEGER NOT NULL,
          weight_kg REAL,
          duration_seconds INTEGER,
          break_seconds INTEGER NOT NULL DEFAULT 30,
          FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE,
          FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS workout_sessions (
          id TEXT PRIMARY KEY NOT NULL,
          workout_id TEXT NOT NULL,
          started_at TEXT NOT NULL,
          completed_at TEXT,
          duration_seconds INTEGER,
          status TEXT NOT NULL,
          FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS session_sets (
          id TEXT PRIMARY KEY NOT NULL,
          session_id TEXT NOT NULL,
          workout_exercise_id TEXT NOT NULL,
          set_number INTEGER NOT NULL,
          reps_completed INTEGER NOT NULL,
          weight_kg REAL,
          duration_seconds INTEGER,
          completed_at TEXT NOT NULL,
          FOREIGN KEY (session_id) REFERENCES workout_sessions (id) ON DELETE CASCADE,
          FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises (id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_id);
        CREATE INDEX IF NOT EXISTS idx_session_sets_session ON session_sets(session_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_workout ON workout_sessions(workout_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_date ON workout_sessions(started_at);

        -- Diet table
        CREATE TABLE IF NOT EXISTS diet (
          id TEXT PRIMARY KEY NOT NULL,
          image_uri TEXT NOT NULL,
          name TEXT,
          description TEXT,
          calories TEXT,
          protein TEXT,
          carbs TEXT,
          fat TEXT,
          timestamp INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_diet_timestamp ON diet(timestamp DESC);

        -- Sync operations table (outbox pattern)
        CREATE TABLE IF NOT EXISTS sync_operations (
          id TEXT PRIMARY KEY NOT NULL,
          operation_type TEXT NOT NULL,
          diet_entry_id TEXT NOT NULL,
          local_image_uri TEXT,
          gdrive_file_id TEXT,
          status TEXT DEFAULT 'pending',
          retry_count INTEGER DEFAULT 0,
          last_error TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(diet_entry_id) REFERENCES diet(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_sync_ops_status ON sync_operations(status, created_at);
        CREATE INDEX IF NOT EXISTS idx_sync_ops_diet_entry ON sync_operations(diet_entry_id);

        -- Sync settings table
        CREATE TABLE IF NOT EXISTS sync_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          wifi_only INTEGER DEFAULT 1,
          last_sync_at INTEGER,
          total_uploads INTEGER DEFAULT 0,
          failed_uploads INTEGER DEFAULT 0
        );

        -- Folder cache table for Google Drive folder IDs
        CREATE TABLE IF NOT EXISTS folder_cache (
          key TEXT PRIMARY KEY NOT NULL,
          folder_id TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );

      `);

      // Migration: Add name column to diet table if it doesn't exist
      try {
        await db.execAsync(`
          ALTER TABLE diet ADD COLUMN name TEXT;
        `);
        console.log('Added name column to diet table');

        // Migrate existing data: copy description to name for entries without name
        await db.execAsync(`
          UPDATE diet SET name = description WHERE name IS NULL AND description IS NOT NULL;
        `);
        console.log('Migrated existing descriptions to name field');
      } catch (error: any) {
        // Column likely already exists, which is fine
        if (!error.message?.includes('duplicate column name')) {
          console.error('Migration error:', error);
        }
      }

      // Migration: Add sync-related columns to diet table
      try {
        await db.execAsync(`
          ALTER TABLE diet ADD COLUMN sync_status TEXT DEFAULT 'not_synced';
        `);
        console.log('Added sync_status column to diet table');
      } catch (error: any) {
        if (!error.message?.includes('duplicate column name')) {
          console.error('Migration error (sync_status):', error);
        }
      }

      try {
        await db.execAsync(`
          ALTER TABLE diet ADD COLUMN gdrive_file_id TEXT;
        `);
        console.log('Added gdrive_file_id column to diet table');
      } catch (error: any) {
        if (!error.message?.includes('duplicate column name')) {
          console.error('Migration error (gdrive_file_id):', error);
        }
      }

      try {
        await db.execAsync(`
          ALTER TABLE diet ADD COLUMN gdrive_folder_id TEXT;
        `);
        console.log('Added gdrive_folder_id column to diet table');
      } catch (error: any) {
        if (!error.message?.includes('duplicate column name')) {
          console.error('Migration error (gdrive_folder_id):', error);
        }
      }

      // Initialize sync_settings table with default row if not exists
      try {
        await db.execAsync(`
          INSERT OR IGNORE INTO sync_settings (id, wifi_only, total_uploads, failed_uploads)
          VALUES (1, 1, 0, 0);
        `);
        console.log('Initialized sync_settings table');
      } catch (error: any) {
        console.error('Error initializing sync_settings:', error);
      }

      console.log('Database initialized successfully');
      return db;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Reset state on error to allow retry
      db = null;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get the database instance. Must call initDatabase() first.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    initPromise = null;
    console.log('Database closed');
  }
}
