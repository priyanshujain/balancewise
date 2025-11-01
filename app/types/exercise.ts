export type ExerciseCategory =
  | 'upper_body'
  | 'lower_body'
  | 'core'
  | 'cardio'
  | 'flexibility'
  | 'mobility';

export type WorkoutStatus = 'in_progress' | 'completed' | 'abandoned' | 'finished_early';

export interface Exercise {
  id: string;
  slug: string;
  name: string;
  category: ExerciseCategory;
  musclesAffected: string[];
  images: string[];
  videoLink?: string;
  breakSeconds: number;
  requiresWeight: boolean;
  createdAt: Date;
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  scheduleDays: number[];
  reminderTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  exercise?: Exercise;
  orderIndex: number;
  sets: number;
  reps: number;
  weightKg?: number;
  durationSeconds?: number;
  breakSeconds: number;
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  workout?: Workout;
  startedAt: Date;
  completedAt?: Date;
  durationSeconds?: number;
  status: WorkoutStatus;
}

export interface SessionSet {
  id: string;
  sessionId: string;
  workoutExerciseId: string;
  workoutExercise?: WorkoutExercise;
  setNumber: number;
  repsCompleted: number;
  weightKg?: number;
  durationSeconds?: number;
  completedAt: Date;
}

export interface WorkoutWithExercises extends Workout {
  exercises: WorkoutExercise[];
}

export interface ActiveWorkoutState {
  session: WorkoutSession;
  workout: WorkoutWithExercises;
  currentExerciseIndex: number;
  currentSetNumber: number;
  isOnBreak: boolean;
  breakTimeRemaining: number;
  isPaused: boolean;
  completedSets: SessionSet[];
  setStartTime: Date | null;
}
