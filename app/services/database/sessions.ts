import { WorkoutSession, SessionSet, WorkoutStatus } from '@/types/exercise';
import { getDatabase, initDatabase } from './index';

export async function startWorkoutSession(workoutId: string): Promise<WorkoutSession> {
  await initDatabase();
  const db = getDatabase();

  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const startedAt = new Date();

  await db.runAsync(
    `INSERT INTO workout_sessions (id, workout_id, started_at, status)
     VALUES (?, ?, ?, ?)`,
    id,
    workoutId,
    startedAt.toISOString(),
    'in_progress'
  );

  return {
    id,
    workoutId,
    startedAt,
    status: 'in_progress',
  };
}

export async function completeWorkoutSession(
  sessionId: string,
  durationSeconds: number
): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  const completedAt = new Date();

  await db.runAsync(
    `UPDATE workout_sessions
     SET completed_at = ?, duration_seconds = ?, status = ?
     WHERE id = ?`,
    completedAt.toISOString(),
    durationSeconds,
    'completed',
    sessionId
  );
}

export async function abandonWorkoutSession(
  sessionId: string,
  durationSeconds: number
): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  const completedAt = new Date();

  await db.runAsync(
    `UPDATE workout_sessions
     SET completed_at = ?, duration_seconds = ?, status = ?
     WHERE id = ?`,
    completedAt.toISOString(),
    durationSeconds,
    'abandoned',
    sessionId
  );
}

export async function finishWorkoutEarly(
  sessionId: string,
  durationSeconds: number
): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  const completedAt = new Date();

  await db.runAsync(
    `UPDATE workout_sessions
     SET completed_at = ?, duration_seconds = ?, status = ?
     WHERE id = ?`,
    completedAt.toISOString(),
    durationSeconds,
    'finished_early',
    sessionId
  );
}

export async function deleteWorkoutSession(sessionId: string): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  // Delete all sets associated with this session first
  await db.runAsync('DELETE FROM session_sets WHERE session_id = ?', sessionId);

  // Delete the session
  await db.runAsync('DELETE FROM workout_sessions WHERE id = ?', sessionId);
}

export async function getSessionById(sessionId: string): Promise<WorkoutSession | null> {
  await initDatabase();
  const db = getDatabase();

  const result = await db.getFirstAsync<{
    id: string;
    workout_id: string;
    started_at: string;
    completed_at: string | null;
    duration_seconds: number | null;
    status: string;
    workout_name: string | null;
    workout_description: string | null;
    workout_schedule_days: string | null;
    workout_reminder_time: string | null;
    workout_created_at: string | null;
    workout_updated_at: string | null;
  }>(
    `SELECT
      ws.*,
      w.name as workout_name,
      w.description as workout_description,
      w.schedule_days as workout_schedule_days,
      w.reminder_time as workout_reminder_time,
      w.created_at as workout_created_at,
      w.updated_at as workout_updated_at
     FROM workout_sessions ws
     LEFT JOIN workouts w ON ws.workout_id = w.id
     WHERE ws.id = ?`,
    sessionId
  );

  if (!result) return null;

  return {
    id: result.id,
    workoutId: result.workout_id,
    startedAt: new Date(result.started_at),
    completedAt: result.completed_at ? new Date(result.completed_at) : undefined,
    durationSeconds: result.duration_seconds || undefined,
    status: result.status as WorkoutStatus,
    workout: result.workout_name ? {
      id: result.workout_id,
      name: result.workout_name,
      description: result.workout_description || undefined,
      scheduleDays: result.workout_schedule_days ? JSON.parse(result.workout_schedule_days) : [],
      reminderTime: result.workout_reminder_time || undefined,
      createdAt: new Date(result.workout_created_at!),
      updatedAt: new Date(result.workout_updated_at!),
    } : undefined,
  };
}

export async function addSetCompletion(
  setData: Omit<SessionSet, 'id' | 'completedAt'>
): Promise<SessionSet> {
  await initDatabase();
  const db = getDatabase();

  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const completedAt = new Date();

  await db.runAsync(
    `INSERT INTO session_sets (id, session_id, workout_exercise_id, set_number, reps_completed, weight_kg, duration_seconds, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    setData.sessionId,
    setData.workoutExerciseId,
    setData.setNumber,
    setData.repsCompleted,
    setData.weightKg || null,
    setData.durationSeconds || null,
    completedAt.toISOString()
  );

  return {
    id,
    ...setData,
    completedAt,
  };
}

export async function getSessionSets(sessionId: string): Promise<SessionSet[]> {
  await initDatabase();
  const db = getDatabase();

  const result = await db.getAllAsync<{
    id: string;
    session_id: string;
    workout_exercise_id: string;
    set_number: number;
    reps_completed: number;
    weight_kg: number | null;
    duration_seconds: number | null;
    completed_at: string;
    exercise_id: string | null;
    exercise_name: string | null;
    exercise_category: string | null;
  }>(
    `SELECT
      ss.*,
      e.id as exercise_id,
      e.name as exercise_name,
      e.category as exercise_category
     FROM session_sets ss
     LEFT JOIN workout_exercises we ON ss.workout_exercise_id = we.id
     LEFT JOIN exercises e ON we.exercise_id = e.id
     WHERE ss.session_id = ?
     ORDER BY ss.completed_at ASC`,
    sessionId
  );

  return result.map(row => ({
    id: row.id,
    sessionId: row.session_id,
    workoutExerciseId: row.workout_exercise_id,
    setNumber: row.set_number,
    repsCompleted: row.reps_completed,
    weightKg: row.weight_kg || undefined,
    durationSeconds: row.duration_seconds || undefined,
    completedAt: new Date(row.completed_at),
    workoutExercise: row.exercise_id ? {
      id: row.workout_exercise_id,
      workoutId: '',
      exerciseId: row.exercise_id,
      orderIndex: 0,
      sets: 0,
      reps: 0,
      breakSeconds: 30,
      exercise: {
        id: row.exercise_id,
        slug: '',
        name: row.exercise_name!,
        category: row.exercise_category as any,
        musclesAffected: [],
        images: [],
        breakSeconds: 30,
        requiresWeight: false,
        createdAt: new Date(),
      },
    } : undefined,
  }));
}

export async function getWorkoutHistory(
  workoutId: string,
  limit: number = 10
): Promise<WorkoutSession[]> {
  await initDatabase();
  const db = getDatabase();

  const result = await db.getAllAsync<{
    id: string;
    workout_id: string;
    started_at: string;
    completed_at: string | null;
    duration_seconds: number | null;
    status: string;
  }>(
    `SELECT * FROM workout_sessions
     WHERE workout_id = ?
     ORDER BY started_at DESC
     LIMIT ?`,
    workoutId,
    limit
  );

  return result.map(row => ({
    id: row.id,
    workoutId: row.workout_id,
    startedAt: new Date(row.started_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    durationSeconds: row.duration_seconds || undefined,
    status: row.status as WorkoutStatus,
  }));
}

export async function getRecentSessions(limit: number = 20): Promise<WorkoutSession[]> {
  await initDatabase();
  const db = getDatabase();

  const result = await db.getAllAsync<{
    id: string;
    workout_id: string;
    started_at: string;
    completed_at: string | null;
    duration_seconds: number | null;
    status: string;
    workout_name: string | null;
    workout_description: string | null;
    workout_schedule_days: string | null;
    workout_reminder_time: string | null;
    workout_created_at: string | null;
    workout_updated_at: string | null;
  }>(
    `SELECT
      ws.*,
      w.name as workout_name,
      w.description as workout_description,
      w.schedule_days as workout_schedule_days,
      w.reminder_time as workout_reminder_time,
      w.created_at as workout_created_at,
      w.updated_at as workout_updated_at
     FROM workout_sessions ws
     LEFT JOIN workouts w ON ws.workout_id = w.id
     ORDER BY ws.started_at DESC
     LIMIT ?`,
    limit
  );

  return result.map(row => ({
    id: row.id,
    workoutId: row.workout_id,
    startedAt: new Date(row.started_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    durationSeconds: row.duration_seconds || undefined,
    status: row.status as WorkoutStatus,
    workout: row.workout_name ? {
      id: row.workout_id,
      name: row.workout_name,
      description: row.workout_description || undefined,
      scheduleDays: row.workout_schedule_days ? JSON.parse(row.workout_schedule_days) : [],
      reminderTime: row.workout_reminder_time || undefined,
      createdAt: new Date(row.workout_created_at!),
      updatedAt: new Date(row.workout_updated_at!),
    } : undefined,
  }));
}
