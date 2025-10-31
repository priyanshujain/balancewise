import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'balancewise.db';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Initialize database with singleton pattern to prevent race conditions.
 * Multiple simultaneous calls will wait for the same initialization to complete.
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  // If database is already initialized, return it
  if (db) return db;

  // If initialization is in progress, wait for it to complete
  if (initPromise) return initPromise;

  // Start initialization and store the promise
  initPromise = (async () => {
    try {
      db = await SQLite.openDatabaseAsync(DATABASE_NAME);

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
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);

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

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    initPromise = null;
    console.log('Database closed');
  }
}

// Re-export domain-specific operations
export * from './auth';
export * from './tasks';
