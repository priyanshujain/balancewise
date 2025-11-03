import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkoutSession } from '@/contexts/WorkoutSessionContext';
import { WorkoutPlayer } from '@/components/exercise/WorkoutPlayer';
import { useEffect } from 'react';

export default function WorkoutPlayerScreen() {
  const router = useRouter();
  const { state, completeSet, skipBreak, tickBreak, pauseWorkout, resumeWorkout, finishEarly, exitWorkout } =
    useWorkoutSession();

  useEffect(() => {
    if (!state) {
      router.replace('/(tabs)/exercise');
    }
  }, [state, router]);

  if (!state) {
    return null;
  }

  const handleCompleteSet = async () => {
    await completeSet();

    const currentExercise = state.workout.exercises[state.currentExerciseIndex];
    const isLastSet = state.currentSetNumber >= currentExercise.sets;
    const isLastExercise = state.currentExerciseIndex >= state.workout.exercises.length - 1;

    if (isLastSet && isLastExercise) {
      Alert.alert(
        'Workout Complete!',
        'Congratulations on completing your workout!',
        [
          {
            text: 'Done',
            onPress: () => router.replace('/(tabs)/exercise'),
          },
        ]
      );
    }
  };

  const handleFinishEarly = async () => {
    await finishEarly();
    router.replace('/(tabs)/exercise');
  };

  const handleExit = async () => {
    await exitWorkout();
    router.replace('/(tabs)/exercise');
  };

  return (
    <WorkoutPlayer
      key={state.session.id}
      state={state}
      onCompleteSet={handleCompleteSet}
      onPause={pauseWorkout}
      onResume={resumeWorkout}
      onFinishEarly={handleFinishEarly}
      onExit={handleExit}
      onSkipBreak={skipBreak}
      onTickBreak={tickBreak}
    />
  );
}
