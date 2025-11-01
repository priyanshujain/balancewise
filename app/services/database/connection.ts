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

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    initPromise = null;
    console.log('Database closed');
  }
}
