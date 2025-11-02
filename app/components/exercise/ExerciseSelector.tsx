import { View, Text, TextInput, Pressable, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Exercise, ExerciseCategory } from '@/types/exercise';
import { useState, useEffect, useCallback } from 'react';
import { getAllExercises, getExercisesByCategory, searchExercises } from '@/services/database';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface ExerciseSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

const CATEGORIES: { value: ExerciseCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upper_body', label: 'Upper' },
  { value: 'lower_body', label: 'Lower' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'flexibility', label: 'Flex' },
  { value: 'mobility', label: 'Mobility' },
];

export function ExerciseSelector({ visible, onClose, onSelect }: ExerciseSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadExercises = useCallback(async () => {
    setLoading(true);
    try {
      let result: Exercise[];
      if (searchQuery) {
        result = await searchExercises(searchQuery);
      } else if (selectedCategory === 'all') {
        result = await getAllExercises();
      } else {
        result = await getExercisesByCategory(selectedCategory);
      }
      setExercises(result);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        loadExercises();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setExercises([]);
      setLoading(false);
    }
  }, [visible, loadExercises]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between p-4">
          <Text className="text-xl font-semibold" style={{ color: colors.text }}>
            Add Exercise
          </Text>
          <Pressable onPress={onClose} className="p-2">
            <MaterialIcons name="close" size={24} color={colors.icon} />
          </Pressable>
        </View>

        <View className="px-4 pb-3">
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search exercises..."
            placeholderTextColor={colors.icon}
            className="rounded-lg px-4 py-3"
            style={{ backgroundColor: colors.card, color: colors.text }}
          />
        </View>

        <View className="px-4 pb-4">
          <FlatList
            horizontal
            data={CATEGORIES}
            keyExtractor={item => item.value}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setSelectedCategory(item.value);
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-full mr-2"
                style={{
                  backgroundColor: selectedCategory === item.value ? colors.tint : colors.card,
                }}
              >
                <Text
                  className="font-medium"
                  style={{
                    color: selectedCategory === item.value ? '#FFFFFF' : colors.text,
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            )}
          />
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : exercises.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-base" style={{ color: colors.icon }}>
              No exercises found
            </Text>
          </View>
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={item => item.id}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <Pressable
                className="mx-4 mb-3 rounded-lg p-4"
                style={{ backgroundColor: colors.card }}
                onPress={() => onSelect(item)}
              >
                <Text className="text-base font-semibold mb-1" style={{ color: colors.text }}>
                  {item.name}
                </Text>
                <Text className="text-sm" style={{ color: colors.icon }}>
                  {item.category.replace('_', ' ')} • {item.musclesAffected.slice(0, 2).join(', ')}
                </Text>
              </Pressable>
            )}
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
}
