import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useGoals } from '@/contexts/goals-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function AddGoalScreen() {
  const [goalText, setGoalText] = useState('');
  const { addGoal } = useGoals();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleAddGoal = async () => {
    if (goalText.trim()) {
      await addGoal(goalText.trim());
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 p-6">
          {/* Header */}
          <Text className="text-2xl font-bold mb-6" style={{ color: colors.text }}>
            Daily Goals
          </Text>

          {/* Quote */}
          <Text className="text-base italic text-center mb-8" style={{ color: colors.text }}>
            "with better habits, anything is possible"
          </Text>

          {/* Input section */}
          <View className="flex-1">
            <Text className="text-sm mb-2" style={{ color: colors.icon }}>
              What must be done?
            </Text>
            <View className="flex-row items-center pb-2" style={{ borderBottomWidth: 2, borderBottomColor: colors.border }}>
              <TextInput
                className="flex-1 text-base"
                style={{ color: colors.text }}
                placeholder="Drink 5 litre of water every day"
                placeholderTextColor={colors.icon}
                value={goalText}
                onChangeText={setGoalText}
                autoFocus
                multiline
                onSubmitEditing={handleAddGoal}
              />
              <Pressable
                className="w-12 h-12 rounded-full items-center justify-center ml-3"
                style={{ backgroundColor: colors.tint }}
                onPress={handleAddGoal}
                disabled={!goalText.trim()}
              >
                <MaterialIcons name="arrow-forward" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
