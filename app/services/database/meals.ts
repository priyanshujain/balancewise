import { getDatabase } from './index';

export interface MealData {
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
 * Save a new meal or update an existing one
 */
export async function saveMeal(meal: MealData): Promise<void> {
  const db = getDatabase();

  await db.runAsync(
    `INSERT OR REPLACE INTO meals (id, image_uri, description, calories, protein, carbs, fat, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      meal.id,
      meal.imageUri,
      meal.description,
      meal.calories,
      meal.protein,
      meal.carbs,
      meal.fat,
      meal.timestamp,
    ]
  );

  console.log('Meal saved to database:', meal.id);
}

/**
 * Get all meals ordered by timestamp (newest first)
 */
export async function getMeals(): Promise<MealData[]> {
  const db = getDatabase();

  const rows = await db.getAllAsync<{
    id: string;
    image_uri: string;
    description: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    timestamp: number;
  }>('SELECT * FROM meals ORDER BY timestamp DESC');

  const meals: MealData[] = rows.map((row) => ({
    id: row.id,
    imageUri: row.image_uri,
    description: row.description,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    timestamp: row.timestamp,
  }));

  console.log(`Loaded ${meals.length} meals from database`);
  return meals;
}

/**
 * Update an existing meal
 */
export async function updateMeal(meal: MealData): Promise<void> {
  const db = getDatabase();

  await db.runAsync(
    `UPDATE meals
     SET image_uri = ?, description = ?, calories = ?, protein = ?, carbs = ?, fat = ?, timestamp = ?
     WHERE id = ?`,
    [
      meal.imageUri,
      meal.description,
      meal.calories,
      meal.protein,
      meal.carbs,
      meal.fat,
      meal.timestamp,
      meal.id,
    ]
  );

  console.log('Meal updated in database:', meal.id);
}

/**
 * Delete a meal by ID
 */
export async function deleteMeal(mealId: string): Promise<void> {
  const db = getDatabase();

  await db.runAsync('DELETE FROM meals WHERE id = ?', [mealId]);

  console.log('Meal deleted from database:', mealId);
}

/**
 * Get a single meal by ID
 */
export async function getMealById(mealId: string): Promise<MealData | null> {
  const db = getDatabase();

  const row = await db.getFirstAsync<{
    id: string;
    image_uri: string;
    description: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    timestamp: number;
  }>('SELECT * FROM meals WHERE id = ?', [mealId]);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    imageUri: row.image_uri,
    description: row.description,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    timestamp: row.timestamp,
  };
}

/**
 * Delete all meals (useful for testing/reset)
 */
export async function deleteAllMeals(): Promise<void> {
  const db = getDatabase();

  await db.runAsync('DELETE FROM meals');

  console.log('All meals deleted from database');
}
