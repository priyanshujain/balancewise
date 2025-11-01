import { EXERCISE_DATA } from '@/data/exercises';
import { seedExercises } from './exercises';
import { getDatabase, initDatabase } from './connection';

export async function seedDatabaseIfNeeded(): Promise<void> {
  try {
    await initDatabase();
    const db = getDatabase();

    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM exercises'
    );

    if (result && result.count > 0) {
      console.log('Exercises already seeded, skipping...');
      return;
    }

    console.log('Seeding exercises...');
    await seedExercises(EXERCISE_DATA);
    console.log(`Successfully seeded ${EXERCISE_DATA.length} exercises`);
  } catch (error) {
    console.error('Failed to seed exercises:', error);
    throw error;
  }
}
