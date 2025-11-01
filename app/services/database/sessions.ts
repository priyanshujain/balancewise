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
  }>('SELECT * FROM workout_sessions WHERE id = ?', sessionId);

  if (!result) return null;

  return {
    id: result.id,
    workoutId: result.workout_id,
    startedAt: new Date(result.started_at),
    completedAt: result.completed_at ? new Date(result.completed_at) : undefined,
    durationSeconds: result.duration_seconds || undefined,
    status: result.status as WorkoutStatus,
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
  }>(
    `SELECT * FROM session_sets
     WHERE session_id = ?
     ORDER BY completed_at ASC`,
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
  }>(
    `SELECT * FROM workout_sessions
     ORDER BY started_at DESC
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
  }));
}
