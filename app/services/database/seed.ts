import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXERCISE_DATA } from '@/data/exercises';
import { seedExercises } from './exercises';

const SEED_KEY = 'exercises_seeded';

export async function seedDatabaseIfNeeded(): Promise<void> {
  try {
    const isSeeded = await AsyncStorage.getItem(SEED_KEY);

    if (isSeeded === 'true') {
      console.log('Exercises already seeded, skipping...');
      return;
    }

    console.log('Seeding exercises...');
    await seedExercises(EXERCISE_DATA);

    await AsyncStorage.setItem(SEED_KEY, 'true');
    console.log(`Successfully seeded ${EXERCISE_DATA.length} exercises`);
  } catch (error) {
    console.error('Failed to seed exercises:', error);
    throw error;
  }
}
