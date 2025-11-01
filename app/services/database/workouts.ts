import { Workout, WorkoutExercise, WorkoutWithExercises, ExerciseCategory } from '@/types/exercise';
import { getDatabase, initDatabase } from './connection';

export async function createWorkout(
  workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Workout> {
  await initDatabase();
  const db = getDatabase();

  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const now = new Date();

  await db.runAsync(
    `INSERT INTO workouts (id, name, description, schedule_days, reminder_time, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    workout.name,
    workout.description || null,
    JSON.stringify(workout.scheduleDays),
    workout.reminderTime || null,
    now.toISOString(),
    now.toISOString()
  );

  return {
    id,
    name: workout.name,
    description: workout.description,
    scheduleDays: workout.scheduleDays,
    reminderTime: workout.reminderTime,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateWorkout(
  id: string,
  updates: Partial<Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description || null);
  }
  if (updates.scheduleDays !== undefined) {
    fields.push('schedule_days = ?');
    values.push(JSON.stringify(updates.scheduleDays));
  }
  if (updates.reminderTime !== undefined) {
    fields.push('reminder_time = ?');
    values.push(updates.reminderTime || null);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await db.runAsync(
    `UPDATE workouts SET ${fields.join(', ')} WHERE id = ?`,
    ...values
  );
}

export async function deleteWorkout(id: string): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  await db.runAsync('DELETE FROM workouts WHERE id = ?', id);
}

export async function getAllWorkouts(): Promise<Workout[]> {
  await initDatabase();
  const db = getDatabase();

  const result = await db.getAllAsync<{
    id: string;
    name: string;
    description: string | null;
    schedule_days: string;
    reminder_time: string | null;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM workouts ORDER BY created_at DESC');

  return result.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    scheduleDays: JSON.parse(row.schedule_days),
    reminderTime: row.reminder_time || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

export async function getWorkoutById(id: string): Promise<Workout | null> {
  await initDatabase();
  const db = getDatabase();

  const result = await db.getFirstAsync<{
    id: string;
    name: string;
    description: string | null;
    schedule_days: string;
    reminder_time: string | null;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM workouts WHERE id = ?', id);

  if (!result) return null;

  return {
    id: result.id,
    name: result.name,
    description: result.description || undefined,
    scheduleDays: JSON.parse(result.schedule_days),
    reminderTime: result.reminder_time || undefined,
    createdAt: new Date(result.created_at),
    updatedAt: new Date(result.updated_at),
  };
}

export async function getWorkoutWithExercises(
  workoutId: string
): Promise<WorkoutWithExercises | null> {
  await initDatabase();
  const db = getDatabase();

  const workout = await getWorkoutById(workoutId);
  if (!workout) return null;

  const exercisesResult = await db.getAllAsync<{
    id: string;
    workout_id: string;
    exercise_id: string;
    order_index: number;
    sets: number;
    reps: number;
    weight_kg: number | null;
    duration_seconds: number | null;
    break_seconds: number;
    exercise_name: string;
    exercise_slug: string;
    exercise_category: string;
    exercise_affected_muscles: string;
    exercise_images: string;
    exercise_video_link: string | null;
    exercise_break_seconds: number;
    exercise_created_at: string;
  }>(
    `SELECT we.*,
            e.id as exercise_id,
            e.name as exercise_name,
            e.slug as exercise_slug,
            e.category as exercise_category,
            e.affected_muscles as exercise_affected_muscles,
            e.images as exercise_images,
            e.video_link as exercise_video_link,
            e.break_seconds as exercise_break_seconds,
            e.created_at as exercise_created_at
     FROM workout_exercises we
     JOIN exercises e ON we.exercise_id = e.id
     WHERE we.workout_id = ?
     ORDER BY we.order_index ASC`,
    workoutId
  );

  const exercises: WorkoutExercise[] = exercisesResult.map(row => ({
    id: row.id,
    workoutId: row.workout_id,
    exerciseId: row.exercise_id,
    exercise: {
      id: row.exercise_id,
      slug: row.exercise_slug,
      name: row.exercise_name,
      category: row.exercise_category as ExerciseCategory,
      musclesAffected: JSON.parse(row.exercise_affected_muscles),
      images: JSON.parse(row.exercise_images),
      videoLink: row.exercise_video_link || undefined,
      breakSeconds: row.exercise_break_seconds,
      createdAt: new Date(row.exercise_created_at),
    },
    orderIndex: row.order_index,
    sets: row.sets,
    reps: row.reps,
    weightKg: row.weight_kg || undefined,
    durationSeconds: row.duration_seconds || undefined,
    breakSeconds: row.break_seconds,
  }));

  return {
    ...workout,
    exercises,
  };
}

export async function addExerciseToWorkout(
  workoutExercise: Omit<WorkoutExercise, 'id' | 'exercise'>
): Promise<WorkoutExercise> {
  await initDatabase();
  const db = getDatabase();

  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

  await db.runAsync(
    `INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index, sets, reps, weight_kg, duration_seconds, break_seconds)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    workoutExercise.workoutId,
    workoutExercise.exerciseId,
    workoutExercise.orderIndex,
    workoutExercise.sets,
    workoutExercise.reps,
    workoutExercise.weightKg || null,
    workoutExercise.durationSeconds || null,
    workoutExercise.breakSeconds
  );

  await db.runAsync(
    'UPDATE workouts SET updated_at = ? WHERE id = ?',
    new Date().toISOString(),
    workoutExercise.workoutId
  );

  return {
    id,
    ...workoutExercise,
  };
}

export async function updateWorkoutExercise(
  id: string,
  updates: Partial<Omit<WorkoutExercise, 'id' | 'workoutId' | 'exerciseId' | 'exercise'>>
): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.orderIndex !== undefined) {
    fields.push('order_index = ?');
    values.push(updates.orderIndex);
  }
  if (updates.sets !== undefined) {
    fields.push('sets = ?');
    values.push(updates.sets);
  }
  if (updates.reps !== undefined) {
    fields.push('reps = ?');
    values.push(updates.reps);
  }
  if (updates.weightKg !== undefined) {
    fields.push('weight_kg = ?');
    values.push(updates.weightKg || null);
  }
  if (updates.durationSeconds !== undefined) {
    fields.push('duration_seconds = ?');
    values.push(updates.durationSeconds || null);
  }
  if (updates.breakSeconds !== undefined) {
    fields.push('break_seconds = ?');
    values.push(updates.breakSeconds);
  }

  if (fields.length === 0) return;

  values.push(id);

  await db.runAsync(
    `UPDATE workout_exercises SET ${fields.join(', ')} WHERE id = ?`,
    ...values
  );

  const workoutId = await db.getFirstAsync<{ workout_id: string }>(
    'SELECT workout_id FROM workout_exercises WHERE id = ?',
    id
  );

  if (workoutId) {
    await db.runAsync(
      'UPDATE workouts SET updated_at = ? WHERE id = ?',
      new Date().toISOString(),
      workoutId.workout_id
    );
  }
}

export async function removeExerciseFromWorkout(id: string): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  const workoutId = await db.getFirstAsync<{ workout_id: string }>(
    'SELECT workout_id FROM workout_exercises WHERE id = ?',
    id
  );

  await db.runAsync('DELETE FROM workout_exercises WHERE id = ?', id);

  if (workoutId) {
    await db.runAsync(
      'UPDATE workouts SET updated_at = ? WHERE id = ?',
      new Date().toISOString(),
      workoutId.workout_id
    );
  }
}

export async function reorderWorkoutExercises(
  workoutId: string,
  exerciseIds: string[]
): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  for (let i = 0; i < exerciseIds.length; i++) {
    await db.runAsync(
      'UPDATE workout_exercises SET order_index = ? WHERE id = ?',
      i,
      exerciseIds[i]
    );
  }

  await db.runAsync(
    'UPDATE workouts SET updated_at = ? WHERE id = ?',
    new Date().toISOString(),
    workoutId
  );
}
