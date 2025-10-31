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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 p-6">
          {/* Quote */}
          <Text className="text-base italic text-center mb-8" style={{ color: colors.text }}>
            &ldquo;with better habits, anything is possible&rdquo;
          </Text>

          {/* Input section */}
          <View className="flex-1">
            <Text className="text-sm mb-3" style={{ color: colors.icon }}>
              What must be done?
            </Text>
            <TextInput
              className="rounded-xl p-4 mb-4 text-base"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
                minHeight: 60,
                paddingTop: 16,
                textAlignVertical: 'top'
              }}
              placeholder="Drink 5 litre of water every day"
              placeholderTextColor={colors.icon}
              value={goalText}
              onChangeText={setGoalText}
              autoFocus
              multiline
            />

            <Pressable
              className="w-14 h-14 rounded-full items-center justify-center self-end"
              style={{ backgroundColor: colors.tint }}
              onPress={handleAddGoal}
              disabled={!goalText.trim()}
            >
              <MaterialIcons name="arrow-forward" size={28} color={colors.background} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
