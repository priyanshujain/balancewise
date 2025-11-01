import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { WorkoutSession, SessionSet } from '@/types/exercise';
import { getSessionById, getSessionSets, deleteWorkoutSession } from '@/services/database';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function SessionDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sets, setSets] = useState<SessionSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionDetails();
  }, [params.sessionId]);

  const loadSessionDetails = async () => {
    if (!params.sessionId) {
      router.back();
      return;
    }

    setLoading(true);
    try {
      const sessionData = await getSessionById(params.sessionId);
      if (!sessionData) {
        Alert.alert('Error', 'Session not found');
        router.back();
        return;
      }

      const setsData = await getSessionSets(params.sessionId);
      setSession(sessionData);
      setSets(setsData);
    } catch (error) {
      console.error('Failed to load session details:', error);
      Alert.alert('Error', 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
  };

  const formatSessionDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (sessionDate.getTime() === today.getTime()) {
      return `today at ${time}`;
    } else if (sessionDate.getTime() === yesterday.getTime()) {
      return `yesterday at ${time}`;
    } else {
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return `${dateStr} at ${time}`;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'finished_early':
        return 'Finished Early';
      case 'abandoned':
        return 'Abandoned';
      default:
        return status.toUpperCase();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this workout session? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorkoutSession(params.sessionId);
              router.back();
            } catch (error) {
              console.error('Failed to delete session:', error);
              Alert.alert('Error', 'Failed to delete session');
            }
          },
        },
      ]
    );
  };

  // Group sets by exercise
  const groupedSets = sets.reduce((acc, set) => {
    const exerciseId = set.workoutExerciseId;
    if (!acc[exerciseId]) {
      acc[exerciseId] = [];
    }
    acc[exerciseId].push(set);
    return acc;
  }, {} as Record<string, SessionSet[]>);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <View className="flex-1 items-center justify-center">
            <Text style={{ color: colors.text }}>Session not found</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={['top']}>
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center justify-between border-b" style={{ borderBottomColor: colors.card }}>
        <Pressable onPress={() => router.back()} className="mr-4">
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-xl font-semibold flex-1" style={{ color: colors.text }}>
          Session Details
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Session Header */}
          <View className="mb-6">
            <View className="flex-row items-start justify-between mb-3">
              <Text className="text-2xl font-bold flex-1 mr-2" style={{ color: colors.text }}>
                {session.workout?.name || 'Workout'}
              </Text>
              <View
                className="px-3 py-1 rounded"
                style={{
                  backgroundColor:
                    session.status === 'completed' ? colors.tint + '20' : colors.icon + '20',
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: session.status === 'completed' ? colors.tint : colors.icon,
                  }}
                >
                  {getStatusLabel(session.status)}
                </Text>
              </View>
            </View>
            <Text className="text-base mb-1" style={{ color: colors.icon }}>
              {formatSessionDate(session.startedAt)}
            </Text>
            <Text className="text-base" style={{ color: colors.icon }}>
              Duration: {formatDuration(session.durationSeconds)}
            </Text>
          </View>

          {/* Sets Breakdown */}
          {sets.length > 0 ? (
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                Exercise Breakdown
              </Text>
              {Object.entries(groupedSets).map(([exerciseId, exerciseSets]) => {
                const exerciseName = exerciseSets[0]?.workoutExercise?.exercise?.name || 'Exercise';
                return (
                  <View key={exerciseId} className="mb-6">
                    <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
                      {exerciseName}
                    </Text>
                    {exerciseSets.map((set, index) => {
                      // Calculate break time between this set and the previous one
                      let breakTime = 0;
                      if (index > 0) {
                        const prevSet = exerciseSets[index - 1];
                        const timeBetweenSets = Math.floor(
                          (set.completedAt.getTime() - prevSet.completedAt.getTime()) / 1000
                        );
                        // Subtract current set duration to get actual break time
                        breakTime = timeBetweenSets - (set.durationSeconds || 0);
                      }

                      return (
                        <View key={set.id}>
                          {/* Break indicator */}
                          {index > 0 && breakTime > 0 && (
                            <View className="flex-row items-center justify-center my-2">
                              <View
                                className="flex-1 h-px"
                                style={{ backgroundColor: colors.icon + '30' }}
                              />
                              <Text
                                className="text-xs px-2"
                                style={{ color: colors.icon }}
                              >
                                Break: {formatDuration(breakTime)}
                              </Text>
                              <View
                                className="flex-1 h-px"
                                style={{ backgroundColor: colors.icon + '30' }}
                              />
                            </View>
                          )}

                          {/* Set card */}
                          <View
                            className="mb-2 rounded-lg p-3"
                            style={{ backgroundColor: colors.card }}
                          >
                            <View className="flex-row items-center justify-between mb-2">
                              <Text className="text-sm font-medium" style={{ color: colors.text }}>
                                Set {set.setNumber}
                              </Text>
                              <View className="flex-row items-center gap-4">
                                <Text className="text-sm" style={{ color: colors.icon }}>
                                  {set.repsCompleted} reps
                                </Text>
                                {set.weightKg && (
                                  <Text className="text-sm" style={{ color: colors.icon }}>
                                    {set.weightKg} kg
                                  </Text>
                                )}
                              </View>
                            </View>
                            {set.durationSeconds && (
                              <Text className="text-xs" style={{ color: colors.icon }}>
                                Duration: {formatDuration(set.durationSeconds)}
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="items-center py-12">
              <Text style={{ color: colors.icon }}>No sets recorded for this session</Text>
            </View>
          )}

          {/* Delete Button */}
          <Pressable
            className="rounded-lg py-3 items-center"
            style={{ backgroundColor: '#DC2626' }}
            onPress={handleDelete}
          >
            <Text className="text-white font-semibold">Delete Session</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
    </>
  );
}
