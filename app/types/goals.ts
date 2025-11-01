export interface DailyGoal {
  id: string;
  text: string;
  createdAt: Date;
}

export interface TaskCompletion {
  goalId: string;
  date: string; // YYYY-MM-DD format
  completedAt: Date;
}

export interface GoalsState {
  goals: DailyGoal[];
  completions: TaskCompletion[];
}
