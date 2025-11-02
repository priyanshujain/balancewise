import { useState, useEffect, useCallback } from 'react';
import {
  getMeals,
  saveMeal,
  updateMeal as updateMealInDb,
  deleteMeal as deleteMealFromDb,
  type MealData,
} from '@/services/database/meals';

interface UseMealsReturn {
  meals: MealData[];
  loading: boolean;
  error: string | null;
  addMeal: (meal: MealData) => Promise<void>;
  updateMeal: (meal: MealData) => Promise<void>;
  removeMeal: (mealId: string) => Promise<void>;
  refreshMeals: () => Promise<void>;
}

/**
 * Custom hook for managing meals with database persistence
 *
 * Usage:
 * const { meals, loading, addMeal, updateMeal, removeMeal } = useMeals();
 */
export function useMeals(): UseMealsReturn {
  const [meals, setMeals] = useState<MealData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all meals from database
   */
  const loadMeals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedMeals = await getMeals();
      setMeals(loadedMeals);
    } catch (err) {
      console.error('Error loading meals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load meals');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load meals on mount
   */
  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  /**
   * Add a new meal
   */
  const addMeal = useCallback(async (meal: MealData) => {
    try {
      setError(null);
      await saveMeal(meal);

      // Optimistic UI update - add to beginning of list
      setMeals((prevMeals) => [meal, ...prevMeals]);
    } catch (err) {
      console.error('Error adding meal:', err);
      setError(err instanceof Error ? err.message : 'Failed to add meal');

      // Reload meals from database on error
      await loadMeals();
      throw err;
    }
  }, [loadMeals]);

  /**
   * Update an existing meal
   */
  const updateMeal = useCallback(async (meal: MealData) => {
    try {
      setError(null);
      await updateMealInDb(meal);

      // Optimistic UI update - update in list
      setMeals((prevMeals) =>
        prevMeals.map((m) => (m.id === meal.id ? meal : m))
      );
    } catch (err) {
      console.error('Error updating meal:', err);
      setError(err instanceof Error ? err.message : 'Failed to update meal');

      // Reload meals from database on error
      await loadMeals();
      throw err;
    }
  }, [loadMeals]);

  /**
   * Delete a meal
   */
  const removeMeal = useCallback(async (mealId: string) => {
    try {
      setError(null);
      await deleteMealFromDb(mealId);

      // Optimistic UI update - remove from list
      setMeals((prevMeals) => prevMeals.filter((m) => m.id !== mealId));
    } catch (err) {
      console.error('Error deleting meal:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete meal');

      // Reload meals from database on error
      await loadMeals();
      throw err;
    }
  }, [loadMeals]);

  /**
   * Refresh meals from database
   */
  const refreshMeals = useCallback(async () => {
    await loadMeals();
  }, [loadMeals]);

  return {
    meals,
    loading,
    error,
    addMeal,
    updateMeal,
    removeMeal,
    refreshMeals,
  };
}
