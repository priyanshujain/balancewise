import { View, Text, TextInput, Pressable, ScrollView, Alert, StatusBar } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WorkoutWithExercises, Exercise } from '@/types/exercise';
import { ExerciseSelector } from './ExerciseSelector';
import { ValuePickerModal } from './ValuePickerModal';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface SetData {
  reps: number;
  weightKg?: number;
}

interface ExerciseData {
  exercise: Exercise;
  sets: SetData[];
  breakSeconds: number;
}

interface WorkoutBuilderProps {
  workout?: WorkoutWithExercises;
  onSave: (data: {
    name: string;
    scheduleDays: number[];
    exercises: {
      exerciseId: string;
      sets: number;
      reps: number;
      weightKg?: number;
      durationSeconds?: number;
      breakSeconds: number;
    }[];
  }) => void;
  onCancel: () => void;
}

interface PickerState {
  visible: boolean;
  type: 'reps' | 'weight' | 'break';
  exerciseIndex: number;
  setIndex: number;
  currentValue: number;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const REPS_OPTIONS = [5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50];
const WEIGHT_OPTIONS = [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90, 100];
const BREAK_OPTIONS = [15, 30, 45, 60, 90, 120, 180];

export function WorkoutBuilder({ workout, onSave, onCancel }: WorkoutBuilderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [name, setName] = useState(workout?.name || '');
  const [scheduleDays, setScheduleDays] = useState<number[]>(workout?.scheduleDays || []);
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [pickerState, setPickerState] = useState<PickerState>({
    visible: false,
    type: 'reps',
    exerciseIndex: 0,
    setIndex: 0,
    currentValue: 10,
  });

  useEffect(() => {
    if (workout?.exercises) {
      setExercises(
        workout.exercises.map(we => ({
          exercise: we.exercise!,
          sets: Array.from({ length: we.sets }, () => ({
            reps: we.reps,
            weightKg: we.weightKg,
          })),
          breakSeconds: we.breakSeconds,
        }))
      );
    }
  }, [workout]);

  const toggleDay = (day: number) => {
    if (scheduleDays.includes(day)) {
      setScheduleDays(scheduleDays.filter(d => d !== day));
    } else {
      setScheduleDays([...scheduleDays, day].sort());
    }
  };

  const handleAddExercise = (exercise: Exercise) => {
    setExercises([
      ...exercises,
      {
        exercise,
        sets: [{ reps: 10 }],
        breakSeconds: exercise.breakSeconds,
      },
    ]);
    setShowExerciseSelector(false);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleAddSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    const lastSet = newExercises[exerciseIndex].sets[newExercises[exerciseIndex].sets.length - 1];
    newExercises[exerciseIndex].sets.push({
      reps: lastSet?.reps || 10,
      weightKg: lastSet?.weightKg,
    });
    setExercises(newExercises);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    if (newExercises[exerciseIndex].sets.length > 1) {
      newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter(
        (_, i) => i !== setIndex
      );
      setExercises(newExercises);
    }
  };

  const showPicker = (
    type: 'reps' | 'weight' | 'break',
    exerciseIndex: number,
    setIndex: number,
    currentValue: number
  ) => {
    setPickerState({
      visible: true,
      type,
      exerciseIndex,
      setIndex,
      currentValue,
    });
  };

  const handlePickerSelect = (value: number) => {
    const newExercises = [...exercises];
    const { type, exerciseIndex, setIndex } = pickerState;

    if (type === 'break') {
      newExercises[exerciseIndex].breakSeconds = value;
    } else if (type === 'reps') {
      newExercises[exerciseIndex].sets[setIndex].reps = value;
    } else if (type === 'weight') {
      newExercises[exerciseIndex].sets[setIndex].weightKg = value;
    }

    setExercises(newExercises);
    setPickerState({ ...pickerState, currentValue: value });
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    onSave({
      name,
      scheduleDays,
      exercises: exercises.map(e => {
        const avgReps = Math.round(
          e.sets.reduce((sum, set) => sum + set.reps, 0) / e.sets.length
        );
        const avgWeight = e.sets[0].weightKg
          ? e.sets.reduce((sum, set) => sum + (set.weightKg || 0), 0) / e.sets.length
          : undefined;

        return {
          exerciseId: e.exercise.id,
          sets: e.sets.length,
          reps: avgReps,
          weightKg: avgWeight,
          durationSeconds: undefined,
          breakSeconds: e.breakSeconds,
        };
      }),
    });
  };

  return (
    <>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
        <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={onCancel} className="p-2">
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-semibold" style={{ color: colors.text }}>
          {workout ? 'Edit Workout' : 'New Workout'}
        </Text>
        <Pressable onPress={handleSave} className="p-2">
          <Text className="text-base font-semibold" style={{ color: colors.tint }}>
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6">
          <Text className="text-base font-medium mb-2" style={{ color: colors.text }}>
            Workout Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Upper Body Day"
            placeholderTextColor={colors.icon}
            className="rounded-lg px-4 py-3 mb-6"
            style={{ backgroundColor: colors.card, color: colors.text }}
          />

          <Text className="text-base font-medium mb-3" style={{ color: colors.text }}>
            Schedule Days
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {DAY_NAMES.map((day, index) => (
              <Pressable
                key={index}
                onPress={() => toggleDay(index)}
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: scheduleDays.includes(index) ? colors.tint : colors.card,
                }}
              >
                <Text
                  className="font-medium"
                  style={{ color: scheduleDays.includes(index) ? '#FFFFFF' : colors.text }}
                >
                  {day}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-medium" style={{ color: colors.text }}>
              Exercises
            </Text>
            <Pressable
              onPress={() => setShowExerciseSelector(true)}
              className="flex-row items-center px-3 py-2 rounded-lg"
              style={{ backgroundColor: colors.tint }}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
              <Text className="text-white font-medium ml-1">Add</Text>
            </Pressable>
          </View>

          {exercises.length === 0 ? (
            <View className="py-12 items-center">
              <Text style={{ color: colors.icon }}>No exercises added yet</Text>
            </View>
          ) : (
            exercises.map((item, exerciseIndex) => (
              <View
                key={exerciseIndex}
                className="rounded-lg p-4 mb-3"
                style={{ backgroundColor: colors.card }}
              >
                <View className="flex-row items-start justify-between mb-3">
                  <Text className="text-base font-semibold flex-1" style={{ color: colors.text }}>
                    {item.exercise.name}
                  </Text>
                  <Pressable onPress={() => handleRemoveExercise(exerciseIndex)}>
                    <MaterialIcons name="close" size={20} color={colors.icon} />
                  </Pressable>
                </View>

                <Pressable
                  onPress={() =>
                    showPicker('break', exerciseIndex, 0, item.breakSeconds)
                  }
                  className="flex-row items-center mb-3 p-2 rounded"
                  style={{ backgroundColor: colors.background }}
                >
                  <MaterialIcons name="timer" size={16} color={colors.icon} />
                  <Text className="text-sm ml-2" style={{ color: colors.text }}>
                    Rest Timer: {item.breakSeconds}s
                  </Text>
                </Pressable>

                <View className="mb-2">
                  <View className="flex-row mb-2 px-2">
                    <Text className="text-xs font-medium" style={{ color: colors.icon, width: 40 }}>
                      SET
                    </Text>
                    <Text className="text-xs font-medium" style={{ color: colors.icon, flex: 1, textAlign: 'center' }}>
                      REPS
                    </Text>
                    {item.exercise.requiresWeight && (
                      <Text className="text-xs font-medium" style={{ color: colors.icon, flex: 1, textAlign: 'center' }}>
                        KG
                      </Text>
                    )}
                    <View style={{ width: 24 }} />
                  </View>

                  {item.sets.map((set, setIndex) => (
                    <View key={setIndex} className="flex-row items-center mb-2">
                      <Text className="text-base" style={{ color: colors.text, width: 40 }}>
                        {setIndex + 1}
                      </Text>

                      <Pressable
                        onPress={() =>
                          showPicker('reps', exerciseIndex, setIndex, set.reps)
                        }
                        className="flex-1 items-center py-2 rounded"
                        style={{ backgroundColor: colors.background }}
                      >
                        <Text className="text-base" style={{ color: colors.text }}>
                          {set.reps}
                        </Text>
                      </Pressable>

                      {item.exercise.requiresWeight && (
                        <Pressable
                          onPress={() =>
                            showPicker('weight', exerciseIndex, setIndex, set.weightKg || 0)
                          }
                          className="flex-1 items-center py-2 rounded ml-2"
                          style={{ backgroundColor: colors.background }}
                        >
                          <Text className="text-base" style={{ color: colors.text }}>
                            {set.weightKg || '-'}
                          </Text>
                        </Pressable>
                      )}

                      {item.sets.length > 1 && (
                        <Pressable
                          onPress={() => handleRemoveSet(exerciseIndex, setIndex)}
                          className="ml-2"
                          style={{ width: 24 }}
                        >
                          <MaterialIcons name="remove-circle-outline" size={20} color={colors.icon} />
                        </Pressable>
                      )}
                      {item.sets.length === 1 && <View style={{ width: 24 }} />}
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={() => handleAddSet(exerciseIndex)}
                  className="flex-row items-center justify-center py-3 rounded-lg"
                  style={{ backgroundColor: colors.background }}
                >
                  <MaterialIcons name="add" size={20} color={colors.text} />
                  <Text className="text-sm font-medium ml-1" style={{ color: colors.text }}>
                    Add Set
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View className="p-6" style={{ backgroundColor: colors.background }}>
        <Pressable
          onPress={handleSave}
          className="rounded-lg py-4 items-center"
          style={{ backgroundColor: colors.tint }}
        >
          <Text className="text-white text-lg font-semibold">Save Workout</Text>
        </Pressable>
      </View>

      <ExerciseSelector
        visible={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        onSelect={handleAddExercise}
      />

      <ValuePickerModal
        visible={pickerState.visible}
        title={
          pickerState.type === 'reps'
            ? 'Select Reps'
            : pickerState.type === 'weight'
              ? 'Select Weight'
              : 'Rest Timer'
        }
        value={pickerState.currentValue}
        values={
          pickerState.type === 'reps'
            ? REPS_OPTIONS
            : pickerState.type === 'weight'
              ? WEIGHT_OPTIONS
              : BREAK_OPTIONS
        }
        suffix={
          pickerState.type === 'reps'
            ? 'reps'
            : pickerState.type === 'weight'
              ? 'kg'
              : 's'
        }
        onSelect={handlePickerSelect}
        onClose={() => setPickerState({ ...pickerState, visible: false })}
      />
      </SafeAreaView>
    </>
  );
}
