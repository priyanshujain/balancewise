import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DailyGoal, TaskCompletion } from '@/types/goals';
import * as db from '@/services/database';

interface GoalsContextType {
  goals: DailyGoal[];
  completions: TaskCompletion[];
  addGoal: (text: string) => Promise<void>;
  removeGoal: (goalId: string) => Promise<void>;
  toggleTaskCompletion: (goalId: string) => Promise<void>;
  isTaskCompletedToday: (goalId: string) => boolean;
  getTodayCompletions: () => TaskCompletion[];
  isLoading: boolean;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
};

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from SQLite on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await db.initDatabase();
      const [loadedGoals, loadedCompletions] = await Promise.all([
        db.getAllGoals(),
        db.getAllCompletions(),
      ]);
      setGoals(loadedGoals);
      setCompletions(loadedCompletions);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addGoal = async (text: string) => {
    try {
      const newGoal = await db.addGoal(text);
      setGoals(prev => [...prev, newGoal]);
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  };

  const removeGoal = async (goalId: string) => {
    try {
      await db.removeGoal(goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
      setCompletions(prev => prev.filter(c => c.goalId !== goalId));
    } catch (error) {
      console.error('Error removing goal:', error);
      throw error;
    }
  };

  const toggleTaskCompletion = async (goalId: string) => {
    const today = getTodayDate();
    const existingCompletion = completions.find(
      c => c.goalId === goalId && c.date === today
    );

    try {
      if (existingCompletion) {
        // Remove completion
        await db.removeCompletion(goalId, today);
        setCompletions(prev => prev.filter(
          c => !(c.goalId === goalId && c.date === today)
        ));
      } else {
        // Add completion
        const newCompletion = await db.addCompletion(goalId, today);
        setCompletions(prev => [...prev, newCompletion]);
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  };

  const isTaskCompletedToday = (goalId: string): boolean => {
    const today = getTodayDate();
    return completions.some(c => c.goalId === goalId && c.date === today);
  };

  const getTodayCompletions = (): TaskCompletion[] => {
    const today = getTodayDate();
    return completions.filter(c => c.date === today);
  };

  return (
    <GoalsContext.Provider
      value={{
        goals,
        completions,
        addGoal,
        removeGoal,
        toggleTaskCompletion,
        isTaskCompletedToday,
        getTodayCompletions,
        isLoading,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
}
