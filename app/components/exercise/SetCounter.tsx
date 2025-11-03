import { View, Text } from 'react-native';

interface SetCounterProps {
  currentSet: number;
  totalSets: number;
  reps: number;
  exerciseName: string;
}

export function SetCounter({ currentSet, totalSets, reps, exerciseName }: SetCounterProps) {
  return (
    <View className="items-center py-8">
      <Text className="text-3xl font-bold text-gray-900 mb-2">{exerciseName}</Text>
      <View className="flex-row items-center space-x-2">
        <Text className="text-6xl font-bold text-blue-600">
          {currentSet}
        </Text>
        <Text className="text-3xl text-gray-400">/</Text>
        <Text className="text-4xl font-semibold text-gray-600">{totalSets}</Text>
      </View>
      <Text className="text-lg text-gray-600 mt-4">
        {reps} reps
      </Text>
    </View>
  );
}
