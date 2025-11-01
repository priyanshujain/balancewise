import { View, Text, Image, Pressable } from 'react-native';
import { Exercise } from '@/types/exercise';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: () => void;
}

export function ExerciseCard({ exercise, onPress }: ExerciseCardProps) {
  const categoryColors = {
    upper_body: 'bg-blue-100',
    lower_body: 'bg-green-100',
    core: 'bg-yellow-100',
    cardio: 'bg-red-100',
    flexibility: 'bg-purple-100',
    mobility: 'bg-pink-100',
  };

  const categoryTextColors = {
    upper_body: 'text-blue-700',
    lower_body: 'text-green-700',
    core: 'text-yellow-700',
    cardio: 'text-red-700',
    flexibility: 'text-purple-700',
    mobility: 'text-pink-700',
  };

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-3"
    >
      {exercise.images.length > 0 && (
        <Image
          source={{ uri: exercise.images[0] }}
          className="w-full h-40"
          resizeMode="cover"
        />
      )}
      <View className="p-4">
        <Text className="text-lg font-semibold text-gray-900 mb-2">{exercise.name}</Text>
        <View
          className={`self-start px-3 py-1 rounded-full mb-2 ${categoryColors[exercise.category]}`}
        >
          <Text className={`text-xs font-medium ${categoryTextColors[exercise.category]}`}>
            {exercise.category.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <Text className="text-sm text-gray-600">
          {exercise.musclesAffected.slice(0, 3).join(', ')}
          {exercise.musclesAffected.length > 3 && '...'}
        </Text>
      </View>
    </Pressable>
  );
}
