import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useGoals } from '@/contexts/goals-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const QUOTES = [
  {
    text: "Every action you take is a vote for the person you wish to become",
    author: "James Clear"
  },
  {
    text: "with better habits, anything is possible",
    author: ""
  }
];

export default function TasksScreen() {
  const { goals, isLoading, toggleTaskCompletion, isTaskCompletedToday, getTodayCompletions } = useGoals();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const colors = Colors[colorScheme ?? 'light'];

  // Format the current date
  const formatDate = () => {
    const date = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayOfWeek = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];

    // Get ordinal suffix (st, nd, rd, th)
    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return `${dayOfWeek}, ${getOrdinal(day)} ${month}`;
  };

  // Calculate progress
  const todayCompletions = getTodayCompletions();
  const completedCount = todayCompletions.length;
  const totalCount = goals.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Get pending and completed goals
  const pendingGoals = goals.filter(g => !isTaskCompletedToday(g.id));
  const completedGoals = goals.filter(g => isTaskCompletedToday(g.id));

  // Get completion time
  const getCompletionTime = (goalId: string) => {
    const completion = todayCompletions.find(c => c.goalId === goalId);
    if (!completion) return '';

    const date = new Date(completion.completedAt);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `Last Updated: ${displayHours}:${displayMinutes} ${ampm}`;
  };

  // Random quote
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={['top']}>
      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Header with date */}
          <Text className="text-2xl font-semibold text-center mb-6" style={{ color: colors.text }}>
            {formatDate()}
          </Text>

          {/* Quote */}
          <View className="mb-8">
            <Text className="text-base italic text-center leading-6" style={{ color: colors.text }}>
              "{quote.text}"
            </Text>
            {quote.author && (
              <Text className="text-sm text-center mt-2" style={{ color: colors.icon }}>
                - {quote.author}
              </Text>
            )}
          </View>

          {/* Empty state or progress */}
          {goals.length === 0 ? (
            <Pressable
              className="rounded-lg p-4 flex-row items-center justify-center mt-4"
              style={{ borderWidth: 1, borderColor: colors.border }}
              onPress={() => router.push('/add-goal')}
            >
              <Text className="text-base font-medium" style={{ color: colors.text }}>
                Add Your First Daily Goal
              </Text>
              <Text className="text-base"> 🎯</Text>
            </Pressable>
          ) : (
            <View className="mt-4">
              {/* Progress section */}
              <Text className="text-xl font-semibold mb-4" style={{ color: colors.text }}>
                Today's progress
              </Text>

              {/* Progress bar */}
              <View className="h-2 rounded-full overflow-hidden mb-3" style={{ backgroundColor: colors.card }}>
                <View
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: colors.tint,
                    width: `${progressPercentage}%`
                  }}
                />
              </View>

              {/* Percentage text */}
              <Text className="text-sm text-center mb-6" style={{ color: colors.text }}>
                {progressPercentage}% goals completed for today
              </Text>

              {/* Pending goals */}
              {pendingGoals.length > 0 && (
                <>
                  <Text className="text-base font-medium mb-3 mt-4" style={{ color: colors.text }}>
                    Pending ({pendingGoals.length})
                  </Text>
                  {pendingGoals.map((goal) => (
                    <Pressable
                      key={goal.id}
                      className="flex-row items-start py-3"
                      onPress={() => toggleTaskCompletion(goal.id)}
                    >
                      <View className="mr-3">
                        <MaterialIcons name="radio-button-unchecked" size={24} color={colors.icon} />
                      </View>
                      <Text className="text-base flex-1" style={{ color: colors.text }}>
                        {goal.text}
                      </Text>
                    </Pressable>
                  ))}
                </>
              )}

              {/* Completed goals */}
              {completedGoals.length > 0 && (
                <>
                  <Text className="text-base font-medium mb-3 mt-4" style={{ color: colors.text }}>
                    Completed ({completedGoals.length})
                  </Text>
                  {completedGoals.map((goal) => (
                    <Pressable
                      key={goal.id}
                      className="flex-row items-start py-3"
                      onPress={() => toggleTaskCompletion(goal.id)}
                    >
                      <View className="mr-3">
                        <MaterialIcons name="check-circle" size={24} color={colors.tint} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base line-through" style={{ color: colors.text }}>
                          {goal.text}
                        </Text>
                        <Text className="text-xs mt-1" style={{ color: colors.icon }}>
                          {getCompletionTime(goal.id)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </>
              )}
            </View>
          )}

          {/* Add goal button for when goals exist */}
          {goals.length > 0 && (
            <Pressable
              className="w-14 h-14 rounded-full items-center justify-center self-end mt-6 shadow-lg"
              style={{ backgroundColor: colors.tint }}
              onPress={() => router.push('/add-goal')}
            >
              <MaterialIcons name="add" size={28} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
