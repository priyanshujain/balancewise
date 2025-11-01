import { View, Text, ScrollView, Image, Pressable, Modal, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Exercise } from '@/types/exercise';
import { useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  visible: boolean;
  onClose: () => void;
  onAddToWorkout?: (exercise: Exercise) => void;
}

export function ExerciseDetailModal({
  exercise,
  visible,
  onClose,
  onAddToWorkout,
}: ExerciseDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  if (!exercise) return null;

  const categoryColors: Record<string, { bg: string; text: string }> = {
    upper_body: { bg: '#DBEAFE', text: '#1D4ED8' },
    lower_body: { bg: '#D1FAE5', text: '#065F46' },
    core: { bg: '#FEF3C7', text: '#92400E' },
    cardio: { bg: '#FEE2E2', text: '#991B1B' },
    flexibility: { bg: '#E9D5FF', text: '#6B21A8' },
    mobility: { bg: '#FCE7F3', text: '#9F1239' },
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

        <View className="flex-row items-center justify-between px-4 py-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable onPress={onClose} className="px-2">
            <Text className="text-lg" style={{ color: colors.tint }}>Close</Text>
          </Pressable>
          {onAddToWorkout && (
            <Pressable
              onPress={() => {
                onAddToWorkout(exercise);
                onClose();
              }}
              className="rounded-lg px-4 py-2"
              style={{ backgroundColor: colors.tint }}
            >
              <Text className="text-white font-semibold">Add to Workout</Text>
            </Pressable>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {exercise.images.length > 0 && (
            <View>
              <Image
                source={{ uri: exercise.images[currentImageIndex] }}
                className="w-full h-80"
                resizeMode="cover"
              />
              {exercise.images.length > 1 && (
                <View className="flex-row justify-center mt-4">
                  {exercise.images.map((_, index) => (
                    <Pressable
                      key={index}
                      onPress={() => setCurrentImageIndex(index)}
                      className="w-2 h-2 rounded-full mx-1"
                      style={{ backgroundColor: index === currentImageIndex ? colors.tint : colors.icon }}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          <View className="p-6">
            <Text className="text-3xl font-bold mb-4" style={{ color: colors.text }}>{exercise.name}</Text>

            <View
              className="self-start px-4 py-2 rounded-full mb-6"
              style={{ backgroundColor: categoryColors[exercise.category].bg }}
            >
              <Text className="text-sm font-medium" style={{ color: categoryColors[exercise.category].text }}>
                {exercise.category.replace('_', ' ').toUpperCase()}
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-semibold mb-3" style={{ color: colors.text }}>Muscles Targeted</Text>
              <View className="flex-row flex-wrap">
                {exercise.musclesAffected.map((muscle, index) => (
                  <View key={index} className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: colors.card }}>
                    <Text className="text-sm capitalize" style={{ color: colors.text }}>
                      {muscle.replace('_', ' ')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-semibold mb-2" style={{ color: colors.text }}>Rest Time</Text>
              <Text className="text-base" style={{ color: colors.icon }}>{exercise.breakSeconds} seconds</Text>
            </View>

            {exercise.videoLink && (
              <View className="mb-6">
                <Text className="text-lg font-semibold mb-2" style={{ color: colors.text }}>Video Tutorial</Text>
                <Text className="text-sm" style={{ color: colors.tint }}>{exercise.videoLink}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
