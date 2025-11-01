import { FlatList, View, Text, ActivityIndicator } from 'react-native';
import { WorkoutWithExercises } from '@/types/exercise';
import { WorkoutCard } from './WorkoutCard';

interface WorkoutListProps {
  workouts: WorkoutWithExercises[];
  onWorkoutPress: (workout: WorkoutWithExercises) => void;
  onStartWorkout?: (workout: WorkoutWithExercises) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function WorkoutList({
  workouts,
  onWorkoutPress,
  onStartWorkout,
  loading = false,
  emptyMessage = 'No workouts yet. Create your first workout!',
}: WorkoutListProps) {
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (workouts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-gray-500 text-center text-lg">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={workouts}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <WorkoutCard
          workout={item}
          exerciseCount={item.exercises.length}
          onPress={() => onWorkoutPress(item)}
          onStart={onStartWorkout ? () => onStartWorkout(item) : undefined}
        />
      )}
      contentContainerClassName="p-4"
      showsVerticalScrollIndicator={false}
    />
  );
}
