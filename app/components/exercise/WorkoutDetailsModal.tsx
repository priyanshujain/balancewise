import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { WorkoutWithExercises } from '@/types/exercise';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface WorkoutDetailsModalProps {
  visible: boolean;
  workout: WorkoutWithExercises | null;
  onClose: () => void;
  onEdit: () => void;
  onStart: () => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WorkoutDetailsModal({
  visible,
  workout,
  onClose,
  onEdit,
  onStart,
}: WorkoutDetailsModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  if (!workout) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between p-4">
          <Pressable onPress={onClose} className="p-2">
            <MaterialIcons name="close" size={24} color={colors.icon} />
          </Pressable>
          <Text className="text-xl font-semibold" style={{ color: colors.text }}>
            Workout Details
          </Text>
          <Pressable onPress={onEdit} className="p-2">
            <MaterialIcons name="edit" size={24} color={colors.tint} />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
          <View className="p-6">
            <Text className="text-2xl font-bold mb-6" style={{ color: colors.text }}>
              {workout.name}
            </Text>

            {workout.scheduleDays.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-medium mb-2" style={{ color: colors.icon }}>
                  SCHEDULED DAYS
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {workout.scheduleDays.map(day => (
                    <View
                      key={day}
                      className="px-3 py-2 rounded-full"
                      style={{ backgroundColor: colors.tint }}
                    >
                      <Text className="text-white font-medium">{DAY_NAMES[day]}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View className="mb-4">
              <Text className="text-sm font-medium mb-3" style={{ color: colors.icon }}>
                EXERCISES ({workout.exercises.length})
              </Text>
              {workout.exercises.map((item, index) => (
                <View
                  key={item.id}
                  className="mb-3 rounded-lg p-4"
                  style={{ backgroundColor: colors.card }}
                >
                  <View className="flex-row items-start mb-2">
                    <View
                      className="w-6 h-6 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: colors.tint }}
                    >
                      <Text className="text-white text-xs font-bold">{index + 1}</Text>
                    </View>
                    <Text className="text-base font-semibold flex-1" style={{ color: colors.text }}>
                      {item.exercise?.name}
                    </Text>
                  </View>

                  <View className="ml-9">
                    <View className="flex-row items-center mb-1">
                      <MaterialIcons name="fitness-center" size={16} color={colors.icon} />
                      <Text className="text-sm ml-2" style={{ color: colors.text }}>
                        {item.sets} sets × {item.reps} reps
                      </Text>
                    </View>

                    {item.weightKg && (
                      <View className="flex-row items-center mb-1">
                        <MaterialIcons name="scale" size={16} color={colors.icon} />
                        <Text className="text-sm ml-2" style={{ color: colors.text }}>
                          {item.weightKg} kg
                        </Text>
                      </View>
                    )}

                    <View className="flex-row items-center">
                      <MaterialIcons name="timer" size={16} color={colors.icon} />
                      <Text className="text-sm ml-2" style={{ color: colors.text }}>
                        {item.breakSeconds}s rest
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View className="p-6" style={{ paddingBottom: insets.bottom + 16 }}>
          <Pressable
            className="rounded-lg py-4 items-center"
            style={{ backgroundColor: colors.tint }}
            onPress={onStart}
          >
            <Text className="text-white text-lg font-semibold">Start Workout</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
