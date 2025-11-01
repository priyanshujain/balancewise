import { Exercise, ExerciseCategory } from '@/types/exercise';
import { getDatabase, initDatabase } from './connection';

export async function getAllExercises(): Promise<Exercise[]> {
  await initDatabase();
  const db = getDatabase();

  const result = await db.getAllAsync<{
    id: string;
    slug: string;
    name: string;
    category: string;
    affected_muscles: string;
    images: string;
    video_link: string | null;
    break_seconds: number;
    requires_weight: number;
    created_at: string;
  }>('SELECT * FROM exercises ORDER BY name ASC');

  return result.map(row => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category as ExerciseCategory,
    musclesAffected: JSON.parse(row.affected_muscles),
    images: JSON.parse(row.images),
    videoLink: row.video_link || undefined,
    breakSeconds: row.break_seconds,
    requiresWeight: row.requires_weight === 1,
    createdAt: new Date(row.created_at),
  }));
}

export async function getExercisesByCategory(
  category: ExerciseCategory
): Promise<Exercise[]> {
  await initDatabase();
  const db = getDatabase();

  const result = await db.getAllAsync<{
    id: string;
    slug: string;
    name: string;
    category: string;
    affected_muscles: string;
    images: string;
    video_link: string | null;
    break_seconds: number;
    requires_weight: number;
    created_at: string;
  }>('SELECT * FROM exercises WHERE category = ? ORDER BY name ASC', category);

  return result.map(row => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category as ExerciseCategory,
    musclesAffected: JSON.parse(row.affected_muscles),
    images: JSON.parse(row.images),
    videoLink: row.video_link || undefined,
    breakSeconds: row.break_seconds,
    requiresWeight: row.requires_weight === 1,
    createdAt: new Date(row.created_at),
  }));
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  await initDatabase();
  const db = getDatabase();

  const result = await db.getFirstAsync<{
    id: string;
    slug: string;
    name: string;
    category: string;
    affected_muscles: string;
    images: string;
    video_link: string | null;
    break_seconds: number;
    requires_weight: number;
    created_at: string;
  }>('SELECT * FROM exercises WHERE id = ?', id);

  if (!result) return null;

  return {
    id: result.id,
    slug: result.slug,
    name: result.name,
    category: result.category as ExerciseCategory,
    musclesAffected: JSON.parse(result.affected_muscles),
    images: JSON.parse(result.images),
    videoLink: result.video_link || undefined,
    breakSeconds: result.break_seconds,
    requiresWeight: result.requires_weight === 1,
    createdAt: new Date(result.created_at),
  };
}

export async function seedExercises(exercises: typeof import('@/data/exercises').EXERCISE_DATA): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  const createdAt = new Date().toISOString();

  for (const exercise of exercises) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    await db.runAsync(
      `INSERT OR IGNORE INTO exercises (id, slug, name, category, affected_muscles, images, video_link, break_seconds, requires_weight, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      exercise.slug,
      exercise.name,
      exercise.category,
      JSON.stringify(exercise.musclesAffected),
      JSON.stringify(exercise.images),
      exercise.videoLink || null,
      exercise.breakSeconds,
      exercise.requiresWeight ? 1 : 0,
      createdAt
    );
  }
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  await initDatabase();
  const db = getDatabase();

  const searchTerm = `%${query.toLowerCase()}%`;

  const result = await db.getAllAsync<{
    id: string;
    slug: string;
    name: string;
    category: string;
    affected_muscles: string;
    images: string;
    video_link: string | null;
    break_seconds: number;
    requires_weight: number;
    created_at: string;
  }>(
    `SELECT * FROM exercises
     WHERE LOWER(name) LIKE ? OR LOWER(category) LIKE ? OR LOWER(affected_muscles) LIKE ?
     ORDER BY name ASC`,
    searchTerm,
    searchTerm,
    searchTerm
  );

  return result.map(row => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category as ExerciseCategory,
    musclesAffected: JSON.parse(row.affected_muscles),
    images: JSON.parse(row.images),
    videoLink: row.video_link || undefined,
    breakSeconds: row.break_seconds,
    requiresWeight: row.requires_weight === 1,
    createdAt: new Date(row.created_at),
  }));
}
