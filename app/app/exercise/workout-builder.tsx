import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { WorkoutBuilder } from '@/components/exercise/WorkoutBuilder';
import {
  createWorkout,
  updateWorkout,
  getWorkoutWithExercises,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
} from '@/services/database';
import { WorkoutWithExercises } from '@/types/exercise';

export default function WorkoutBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const workoutId = params.id as string | undefined;

  const [workout, setWorkout] = useState<WorkoutWithExercises | undefined>();

  const loadWorkout = useCallback(async () => {
    if (!workoutId) return;
    try {
      const data = await getWorkoutWithExercises(workoutId);
      if (data) setWorkout(data);
    } catch (error) {
      console.error('Failed to load workout:', error);
      Alert.alert('Error', 'Failed to load workout');
    }
  }, [workoutId]);

  useEffect(() => {
    if (workoutId) {
      loadWorkout();
    }
  }, [workoutId, loadWorkout]);

  const handleSave = async (data: {
    name: string;
    scheduleDays: number[];
    exercises: {
      exerciseId: string;
      sets: number;
      reps: number;
      weightKg?: number;
      durationSeconds?: number;
      breakSeconds: number;
    }[];
  }) => {
    try {
      let currentWorkoutId = workoutId;

      if (workoutId) {
        await updateWorkout(workoutId, {
          name: data.name,
          scheduleDays: data.scheduleDays,
        });

        if (workout) {
          for (const oldExercise of workout.exercises) {
            await removeExerciseFromWorkout(oldExercise.id);
          }
        }
      } else {
        const newWorkout = await createWorkout({
          name: data.name,
          scheduleDays: data.scheduleDays,
        });
        currentWorkoutId = newWorkout.id;
      }

      for (let i = 0; i < data.exercises.length; i++) {
        const exercise = data.exercises[i];
        await addExerciseToWorkout({
          workoutId: currentWorkoutId,
          exerciseId: exercise.exerciseId,
          orderIndex: i,
          sets: exercise.sets,
          reps: exercise.reps,
          weightKg: exercise.weightKg,
          durationSeconds: exercise.durationSeconds,
          breakSeconds: exercise.breakSeconds,
        });
      }

      router.back();
    } catch (error) {
      console.error('Failed to save workout:', error);
      Alert.alert('Error', 'Failed to save workout');
    }
  };

  return (
    <WorkoutBuilder
      workout={workout}
      onSave={handleSave}
      onCancel={() => router.back()}
    />
  );
}
