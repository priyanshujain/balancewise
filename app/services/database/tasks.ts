import { DailyGoal, TaskCompletion } from '@/types/goals';
import { getDatabase, initDatabase } from './index';

// Goals operations
export async function getAllGoals(): Promise<DailyGoal[]> {
  await initDatabase();
  const db = getDatabase();

  const result = await db.getAllAsync<{ id: string; text: string; created_at: string }>(
    'SELECT * FROM goals ORDER BY created_at DESC'
  );

  return result.map(row => ({
    id: row.id,
    text: row.text,
    createdAt: new Date(row.created_at),
  }));
}

export async function addGoal(text: string): Promise<DailyGoal> {
  await initDatabase();
  const db = getDatabase();

  const id = Date.now().toString();
  const createdAt = new Date();

  await db.runAsync(
    'INSERT INTO goals (id, text, created_at) VALUES (?, ?, ?)',
    id,
    text,
    createdAt.toISOString()
  );

  return {
    id,
    text,
    createdAt,
  };
}

export async function removeGoal(goalId: string): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  await db.runAsync('DELETE FROM goals WHERE id = ?', goalId);
  await db.runAsync('DELETE FROM task_completions WHERE goal_id = ?', goalId);
}

// Task completions operations
export async function getAllCompletions(): Promise<TaskCompletion[]> {
  await initDatabase();
  const db = getDatabase();

  const result = await db.getAllAsync<{
    goal_id: string;
    date: string;
    completed_at: string;
  }>('SELECT * FROM task_completions ORDER BY completed_at DESC');

  return result.map(row => ({
    goalId: row.goal_id,
    date: row.date,
    completedAt: new Date(row.completed_at),
  }));
}

export async function addCompletion(goalId: string, date: string): Promise<TaskCompletion> {
  await initDatabase();
  const db = getDatabase();

  const completedAt = new Date();

  await db.runAsync(
    'INSERT OR REPLACE INTO task_completions (goal_id, date, completed_at) VALUES (?, ?, ?)',
    goalId,
    date,
    completedAt.toISOString()
  );

  return {
    goalId,
    date,
    completedAt,
  };
}

export async function removeCompletion(goalId: string, date: string): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  await db.runAsync(
    'DELETE FROM task_completions WHERE goal_id = ? AND date = ?',
    goalId,
    date
  );
}

export async function getCompletionsByDate(date: string): Promise<TaskCompletion[]> {
  await initDatabase();
  const db = getDatabase();

  const result = await db.getAllAsync<{
    goal_id: string;
    date: string;
    completed_at: string;
  }>('SELECT * FROM task_completions WHERE date = ?', date);

  return result.map(row => ({
    goalId: row.goal_id,
    date: row.date,
    completedAt: new Date(row.completed_at),
  }));
}
