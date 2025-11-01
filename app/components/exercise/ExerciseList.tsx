import { FlatList, View, Text, ActivityIndicator } from 'react-native';
import { Exercise } from '@/types/exercise';
import { ExerciseCard } from './ExerciseCard';

interface ExerciseListProps {
  exercises: Exercise[];
  onExercisePress: (exercise: Exercise) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function ExerciseList({
  exercises,
  onExercisePress,
  loading = false,
  emptyMessage = 'No exercises found',
}: ExerciseListProps) {
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (exercises.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-gray-500 text-center text-lg">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={exercises}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <ExerciseCard exercise={item} onPress={() => onExercisePress(item)} />
      )}
      contentContainerClassName="p-4"
      showsVerticalScrollIndicator={false}
    />
  );
}
