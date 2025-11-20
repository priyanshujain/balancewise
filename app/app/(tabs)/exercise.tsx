import { View, Text, Pressable, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import PagerView from '@/components/ui/PagerView';
import { WorkoutWithExercises, WorkoutSession } from '@/types/exercise';
import { getAllWorkouts, getWorkoutWithExercises, getRecentSessions } from '@/services/database';
import { useWorkoutSession } from '@/contexts/WorkoutSessionContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { WorkoutDetailsModal } from '@/components/exercise/WorkoutDetailsModal';

export default function ExerciseScreen() {
  const router = useRouter();
  const { startWorkout } = useWorkoutSession();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const pagerRef = useRef<PagerView>(null);

  const [activeTab, setActiveTab] = useState(0);
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [workoutsLoaded, setWorkoutsLoaded] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithExercises | null>(null);

  const loadWorkouts = useCallback(async (force = false) => {
    if (workoutsLoaded && !force) return;
    setLoading(true);
    try {
      const workoutList = await getAllWorkouts();
      const workoutsWithExercises = await Promise.all(
        workoutList.map(w => getWorkoutWithExercises(w.id))
      );
      setWorkouts(workoutsWithExercises.filter(Boolean) as WorkoutWithExercises[]);
      setWorkoutsLoaded(true);
    } catch (error) {
      console.error('Failed to load workouts:', error);
    } finally {
      setLoading(false);
    }
  }, [workoutsLoaded]);

  const loadHistory = useCallback(async (force = false) => {
    if (historyLoaded && !force) return;
    setLoading(true);
    try {
      const recentSessions = await getRecentSessions(20);
      setSessions(recentSessions);
      setHistoryLoaded(true);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  }, [historyLoaded]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 0) {
        loadWorkouts();
      } else {
        loadHistory();
      }
    }, [activeTab, loadWorkouts, loadHistory])
  );

  const handleStartWorkout = async (workout: WorkoutWithExercises) => {
    try {
      await startWorkout(workout);
      router.push('/exercise/workout-player');
    } catch (error) {
      console.error('Failed to start workout:', error);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    return `${mins}min`;
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

  const handleTabPress = (index: number) => {
    setActiveTab(index);
    pagerRef.current?.setPage(index);
  };

  const handlePageSelected = (e: any) => {
    setActiveTab(e.nativeEvent.position);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={['top']}>
      <View className="p-6 pb-0">
        <Text className="text-2xl font-semibold mb-6" style={{ color: colors.text }}>
          Exercise
        </Text>

        <View className="flex-row mb-6" style={{ backgroundColor: colors.card, borderRadius: 8, padding: 4 }}>
          <Pressable
            onPress={() => handleTabPress(0)}
            className="flex-1 py-2 rounded"
            style={{ backgroundColor: activeTab === 0 ? colors.background : 'transparent' }}
          >
            <Text
              className="text-center font-medium"
              style={{ color: activeTab === 0 ? colors.tint : colors.text }}
            >
              My Workouts
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabPress(1)}
            className="flex-1 py-2 rounded"
            style={{ backgroundColor: activeTab === 1 ? colors.background : 'transparent' }}
          >
            <Text
              className="text-center font-medium"
              style={{ color: activeTab === 1 ? colors.tint : colors.text }}
            >
              History
            </Text>
          </Pressable>
        </View>
      </View>

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        <View key="0" className="flex-1 px-6">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : workouts.length === 0 ? (
            <Pressable
              className="rounded-lg py-3 px-4 flex-row items-center justify-center mt-4"
              style={{ backgroundColor: colors.background, borderWidth: 2, borderColor: colors.tint }}
              onPress={() => router.push('/exercise/workout-builder')}
            >
              <Text className="text-sm font-medium" style={{ color: colors.text }}>
                Create Your First Workout
              </Text>
              <Text className="text-sm"> 💪</Text>
            </Pressable>
          ) : (
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 80 }}
            >
              {workouts.map(workout => (
                <Pressable
                  key={workout.id}
                  className="mb-4 rounded-lg p-4"
                  style={{ backgroundColor: colors.card }}
                  onPress={() => setSelectedWorkout(workout)}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <Text className="text-lg font-semibold flex-1" style={{ color: colors.text }}>
                      {workout.name}
                    </Text>
                    <Pressable
                      onPress={e => {
                        e.stopPropagation();
                        router.push(`/exercise/workout-builder?id=${workout.id}`);
                      }}
                      className="p-1"
                    >
                      <MaterialIcons name="edit" size={20} color={colors.icon} />
                    </Pressable>
                  </View>
                  <Text className="text-sm mb-3" style={{ color: colors.icon }} numberOfLines={2}>
                    {workout.exercises.map(e => e.exercise?.name).filter(Boolean).join(', ')}
                  </Text>
                  {workout.scheduleDays.length > 0 && (
                    <View className="flex-row flex-wrap gap-2 mb-3">
                      {workout.scheduleDays.map(day => {
                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        return (
                          <View
                            key={day}
                            className="px-2 py-1 rounded"
                            style={{ backgroundColor: colors.tint + '20' }}
                          >
                            <Text
                              className="text-xs font-medium"
                              style={{ color: colors.tint }}
                            >
                              {dayNames[day]}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                  <Pressable
                    className="rounded-lg py-3 items-center"
                    style={{ backgroundColor: colors.tint }}
                    onPress={e => {
                      e.stopPropagation();
                      handleStartWorkout(workout);
                    }}
                  >
                    <Text className="text-white font-semibold">Start Workout</Text>
                  </Pressable>
                </Pressable>
              ))}
            </ScrollView>
          )}
            <Pressable
              className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center"
              style={[styles.fab, { backgroundColor: colors.tint }]}
              onPress={() => router.push('/exercise/workout-builder')}
            >
              <MaterialIcons name="add" size={28} color="#FFFFFF" />
            </Pressable>
        </View>

        <View key="1" className="flex-1">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : sessions.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-base" style={{ color: colors.icon }}>
                No workout history yet
              </Text>
            </View>
          ) : (
            <ScrollView
              className="flex-1 px-6"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {sessions.map(session => (
                <Pressable
                  key={session.id}
                  className="mb-4 rounded-lg p-4"
                  style={{ backgroundColor: colors.card }}
                  onPress={() => router.push(`/exercise/session-details?sessionId=${session.id}`)}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <Text className="text-lg font-semibold flex-1 mr-2" style={{ color: colors.text }}>
                      {session.workout?.name || 'Workout'}
                    </Text>
                    <View
                      className="px-2 py-1 rounded"
                      style={{
                        backgroundColor:
                          session.status === 'completed' ? colors.tint + '20' : colors.icon + '20',
                      }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{
                          color: session.status === 'completed' ? colors.tint : colors.icon,
                        }}
                      >
                        {getStatusLabel(session.status)}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm" style={{ color: colors.icon }}>
                      Time: {formatDuration(session.durationSeconds)}
                    </Text>
                    <Text className="text-sm" style={{ color: colors.icon }}>
                      {formatSessionDate(session.startedAt)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </PagerView>

      <WorkoutDetailsModal
        visible={selectedWorkout !== null}
        workout={selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        onEdit={() => {
          if (selectedWorkout) {
            setSelectedWorkout(null);
            router.push(`/exercise/workout-builder?id=${selectedWorkout.id}`);
          }
        }}
        onStart={() => {
          if (selectedWorkout) {
            handleStartWorkout(selectedWorkout);
            setSelectedWorkout(null);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fab: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
