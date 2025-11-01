import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ActiveWorkoutState } from '@/types/exercise';
import { useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ExerciseDetailModal } from './ExerciseDetailModal';

interface WorkoutPlayerProps {
  state: ActiveWorkoutState;
  onCompleteSet: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinishEarly: () => void;
  onExit: () => void;
  onSkipBreak: () => void;
  onTickBreak: () => void;
}

export function WorkoutPlayer({
  state,
  onCompleteSet,
  onPause,
  onResume,
  onFinishEarly,
  onExit,
  onSkipBreak,
  onTickBreak,
}: WorkoutPlayerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  useEffect(() => {
    if (state.isPaused || state.isOnBreak) return;

    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [state.isPaused, state.isOnBreak]);

  useEffect(() => {
    if (!state.isOnBreak) return;

    const timer = setInterval(() => {
      onTickBreak();
    }, 1000);

    return () => clearInterval(timer);
  }, [state.isOnBreak, onTickBreak]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExit = () => {
    Alert.alert(
      'Exit Workout?',
      'Choose how to end your workout',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish Early',
          onPress: onFinishEarly,
        },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: onExit,
        },
      ]
    );
  };

  const currentExercise = state.workout.exercises[state.currentExerciseIndex];
  if (!currentExercise || !currentExercise.exercise) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <Text style={{ color: colors.icon }}>No exercise data available</Text>
      </SafeAreaView>
    );
  }

  const totalExercises = state.workout.exercises.length;
  const progress = ((state.currentExerciseIndex + 1) / totalExercises) * 100;

  if (state.isOnBreak) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <View className="items-center p-6">
          <Text className="text-2xl font-semibold mb-8" style={{ color: colors.text }}>
            Break Time
          </Text>

          <View
            className="w-48 h-48 rounded-full items-center justify-center mb-8"
            style={{ backgroundColor: colors.card }}
          >
            <Text className="text-6xl font-bold" style={{ color: colors.tint }}>
              {formatTime(state.breakTimeRemaining)}
            </Text>
          </View>

          <Pressable
            className="rounded-lg px-8 py-4"
            style={{ backgroundColor: colors.tint }}
            onPress={onSkipBreak}
          >
            <Text className="text-white text-lg font-semibold">Skip Break</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={handleExit} className="p-2">
            <MaterialIcons name="close" size={24} color={colors.icon} />
          </Pressable>
          <Text className="text-base font-medium" style={{ color: colors.text }}>
            Exercise {state.currentExerciseIndex + 1} of {totalExercises}
          </Text>
          <Pressable onPress={state.isPaused ? onResume : onPause} className="p-2">
            <MaterialIcons
              name={state.isPaused ? 'play-arrow' : 'pause'}
              size={24}
              color={colors.icon}
            />
          </Pressable>
        </View>

        <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.card }}>
          <View
            className="h-full rounded-full"
            style={{ backgroundColor: colors.tint, width: `${progress}%` }}
          />
        </View>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <View className="items-center mb-12">
          <Text className="text-8xl font-bold" style={{ color: colors.tint }}>
            {formatTime(elapsedSeconds)}
          </Text>
          <Text className="text-lg mt-2" style={{ color: colors.icon }}>
            Total Time
          </Text>
        </View>

        <View className="flex-row items-center justify-center mb-6">
          <Text className="text-3xl font-bold text-center" style={{ color: colors.text }}>
            {currentExercise.exercise.name}
          </Text>
          <Pressable className="ml-2 p-1" onPress={() => setShowExerciseModal(true)}>
            <MaterialIcons name="info-outline" size={28} color={colors.icon} />
          </Pressable>
        </View>

        <View className="items-center mb-8">
          <Text className="text-5xl font-bold" style={{ color: colors.text }}>
            {state.currentSetNumber} / {currentExercise.sets}
          </Text>
          <Text className="text-lg mt-2" style={{ color: colors.icon }}>
            sets
          </Text>
        </View>

        <View className="flex-row items-center justify-center gap-8">
          <View className="items-center">
            <Text className="text-3xl font-bold" style={{ color: colors.text }}>
              {currentExercise.reps}
            </Text>
            <Text className="text-base mt-1" style={{ color: colors.icon }}>
              reps
            </Text>
          </View>

          {currentExercise.weightKg && (
            <View className="items-center">
              <Text className="text-3xl font-bold" style={{ color: colors.text }}>
                {currentExercise.weightKg}
              </Text>
              <Text className="text-base mt-1" style={{ color: colors.icon }}>
                kg
              </Text>
            </View>
          )}

          {currentExercise.durationSeconds && (
            <View className="items-center">
              <Text className="text-3xl font-bold" style={{ color: colors.text }}>
                {currentExercise.durationSeconds}
              </Text>
              <Text className="text-base mt-1" style={{ color: colors.icon }}>
                seconds
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="p-6">
        <Pressable
          onPress={onCompleteSet}
          disabled={state.isPaused}
          className="rounded-lg py-6 items-center"
          style={{ backgroundColor: state.isPaused ? colors.card : colors.tint }}
        >
          <Text className="text-white text-xl font-bold">Complete Set</Text>
        </Pressable>
      </View>

      <ExerciseDetailModal
        exercise={currentExercise.exercise}
        visible={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
      />
    </SafeAreaView>
  );
}
