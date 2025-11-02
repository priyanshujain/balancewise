import { View, Text, Pressable } from 'react-native';
import { Workout } from '@/types/exercise';

interface WorkoutCardProps {
  workout: Workout;
  exerciseCount?: number;
  lastCompletedDate?: Date;
  onPress: () => void;
  onStart?: () => void;
}

export function WorkoutCard({
  workout,
  exerciseCount = 0,
  lastCompletedDate,
  onPress,
  onStart,
}: WorkoutCardProps) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const scheduledDays = workout.scheduleDays.map(d => dayNames[d]).join(', ');

  return (
    <Pressable onPress={onPress} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-3">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 mb-1">{workout.name}</Text>
          {workout.description && (
            <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
              {workout.description}
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center mb-3">
        <View className="bg-blue-100 px-3 py-1 rounded-full mr-2">
          <Text className="text-xs font-medium text-blue-700">
            {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
          </Text>
        </View>
        {scheduledDays && (
          <View className="bg-purple-100 px-3 py-1 rounded-full">
            <Text className="text-xs font-medium text-purple-700">{scheduledDays}</Text>
          </View>
        )}
      </View>

      {lastCompletedDate && (
        <Text className="text-xs text-gray-500 mb-3">
          Last completed: {lastCompletedDate.toLocaleDateString()}
        </Text>
      )}

      {onStart && (
        <Pressable
          onPress={e => {
            e.stopPropagation();
            onStart();
          }}
          className="bg-green-500 rounded-lg py-3 items-center active:bg-green-600"
        >
          <Text className="text-white font-semibold">Start Workout</Text>
        </Pressable>
      )}
    </Pressable>
  );
}
