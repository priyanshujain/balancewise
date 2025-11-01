import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ActiveWorkoutState, WorkoutWithExercises, WorkoutSession, SessionSet } from '@/types/exercise';
import {
  startWorkoutSession,
  completeWorkoutSession,
  abandonWorkoutSession,
  finishWorkoutEarly,
  deleteWorkoutSession,
  addSetCompletion,
} from '@/services/database';

type WorkoutSessionAction =
  | { type: 'START_WORKOUT'; workout: WorkoutWithExercises; session: WorkoutSession }
  | { type: 'COMPLETE_SET' }
  | { type: 'START_BREAK' }
  | { type: 'END_BREAK' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'COMPLETE_WORKOUT' }
  | { type: 'FINISH_EARLY' }
  | { type: 'EXIT_WORKOUT' }
  | { type: 'TICK_BREAK' };

interface WorkoutSessionContextType {
  state: ActiveWorkoutState | null;
  startWorkout: (workout: WorkoutWithExercises) => Promise<void>;
  completeSet: () => Promise<void>;
  skipBreak: () => void;
  tickBreak: () => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  completeWorkout: () => Promise<void>;
  finishEarly: () => Promise<void>;
  exitWorkout: () => Promise<void>;
}

const WorkoutSessionContext = createContext<WorkoutSessionContextType | undefined>(undefined);

function workoutSessionReducer(
  state: ActiveWorkoutState | null,
  action: WorkoutSessionAction
): ActiveWorkoutState | null {
  if (!state && action.type !== 'START_WORKOUT') return null;

  switch (action.type) {
    case 'START_WORKOUT':
      return {
        session: action.session,
        workout: action.workout,
        currentExerciseIndex: 0,
        currentSetNumber: 1,
        isOnBreak: false,
        breakTimeRemaining: 0,
        isPaused: false,
        completedSets: [],
      };

    case 'COMPLETE_SET': {
      if (!state) return null;

      const currentExercise = state.workout.exercises[state.currentExerciseIndex];
      const isLastSet = state.currentSetNumber >= currentExercise.sets;
      const isLastExercise = state.currentExerciseIndex >= state.workout.exercises.length - 1;

      if (isLastSet && isLastExercise) {
        return state;
      }

      if (isLastSet) {
        return {
          ...state,
          currentExerciseIndex: state.currentExerciseIndex + 1,
          currentSetNumber: 1,
          isOnBreak: true,
          breakTimeRemaining: currentExercise.breakSeconds,
        };
      }

      return {
        ...state,
        currentSetNumber: state.currentSetNumber + 1,
        isOnBreak: true,
        breakTimeRemaining: currentExercise.breakSeconds,
      };
    }

    case 'START_BREAK':
      if (!state) return null;
      return {
        ...state,
        isOnBreak: true,
        breakTimeRemaining:
          state.workout.exercises[state.currentExerciseIndex]?.breakSeconds || 30,
      };

    case 'END_BREAK':
      if (!state) return null;
      return {
        ...state,
        isOnBreak: false,
        breakTimeRemaining: 0,
      };

    case 'TICK_BREAK':
      if (!state || !state.isOnBreak) return state;
      const newTime = Math.max(0, state.breakTimeRemaining - 1);
      if (newTime === 0) {
        return {
          ...state,
          isOnBreak: false,
          breakTimeRemaining: 0,
        };
      }
      return {
        ...state,
        breakTimeRemaining: newTime,
      };

    case 'PAUSE':
      if (!state) return null;
      return { ...state, isPaused: true };

    case 'RESUME':
      if (!state) return null;
      return { ...state, isPaused: false };

    case 'COMPLETE_WORKOUT':
    case 'FINISH_EARLY':
    case 'EXIT_WORKOUT':
      return null;

    default:
      return state;
  }
}

export function WorkoutSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workoutSessionReducer, null);

  const startWorkout = async (workout: WorkoutWithExercises) => {
    const session = await startWorkoutSession(workout.id);
    dispatch({ type: 'START_WORKOUT', workout, session });
  };

  const completeSet = async () => {
    if (!state) return;

    const currentExercise = state.workout.exercises[state.currentExerciseIndex];

    await addSetCompletion({
      sessionId: state.session.id,
      workoutExerciseId: currentExercise.id,
      setNumber: state.currentSetNumber,
      repsCompleted: currentExercise.reps,
      weightKg: currentExercise.weightKg,
      durationSeconds: currentExercise.durationSeconds,
    });

    dispatch({ type: 'COMPLETE_SET' });

    const isLastSet = state.currentSetNumber >= currentExercise.sets;
    const isLastExercise = state.currentExerciseIndex >= state.workout.exercises.length - 1;

    if (isLastSet && isLastExercise) {
      await completeWorkout();
    }
  };

  const skipBreak = () => {
    dispatch({ type: 'END_BREAK' });
  };

  const tickBreak = () => {
    dispatch({ type: 'TICK_BREAK' });
  };

  const pauseWorkout = () => {
    dispatch({ type: 'PAUSE' });
  };

  const resumeWorkout = () => {
    dispatch({ type: 'RESUME' });
  };

  const completeWorkout = async () => {
    if (!state) return;

    const durationSeconds = Math.floor(
      (new Date().getTime() - state.session.startedAt.getTime()) / 1000
    );

    await completeWorkoutSession(state.session.id, durationSeconds);
    dispatch({ type: 'COMPLETE_WORKOUT' });
  };

  const finishEarly = async () => {
    if (!state) return;

    const durationSeconds = Math.floor(
      (new Date().getTime() - state.session.startedAt.getTime()) / 1000
    );

    await finishWorkoutEarly(state.session.id, durationSeconds);
    dispatch({ type: 'FINISH_EARLY' });
  };

  const exitWorkout = async () => {
    if (!state) return;

    await deleteWorkoutSession(state.session.id);
    dispatch({ type: 'EXIT_WORKOUT' });
  };

  return (
    <WorkoutSessionContext.Provider
      value={{
        state,
        startWorkout,
        completeSet,
        skipBreak,
        tickBreak,
        pauseWorkout,
        resumeWorkout,
        completeWorkout,
        finishEarly,
        exitWorkout,
      }}
    >
      {children}
    </WorkoutSessionContext.Provider>
  );
}

export function useWorkoutSession() {
  const context = useContext(WorkoutSessionContext);
  if (!context) {
    throw new Error('useWorkoutSession must be used within WorkoutSessionProvider');
  }
  return context;
}
