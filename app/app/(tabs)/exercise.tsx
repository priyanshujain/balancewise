import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
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
  const [loading, setLoading] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithExercises | null>(null);

  const loadWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const workoutList = await getAllWorkouts();
      const workoutsWithExercises = await Promise.all(
        workoutList.map(w => getWorkoutWithExercises(w.id))
      );
      setWorkouts(workoutsWithExercises.filter(Boolean) as WorkoutWithExercises[]);
    } catch (error) {
      console.error('Failed to load workouts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const recentSessions = await getRecentSessions(20);
      setSessions(recentSessions);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            <>
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

              <Pressable
                className="w-14 h-14 rounded-full items-center justify-center self-end mt-6 mb-6 shadow-lg"
                style={{ backgroundColor: colors.tint }}
                onPress={() => router.push('/exercise/workout-builder')}
              >
                <MaterialIcons name="add" size={28} color="#FFFFFF" />
              </Pressable>
            </>
          )}
        </View>

        <View key="1" className="flex-1 px-6">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : sessions.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-base" style={{ color: colors.icon }}>
                No workout history yet
              </Text>
            </View>
          ) : (
            sessions.map(session => (
              <View
                key={session.id}
                className="mb-4 rounded-lg p-4"
                style={{ backgroundColor: colors.card }}
              >
                <Text className="text-base font-semibold mb-2" style={{ color: colors.text }}>
                  {session.startedAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm" style={{ color: colors.icon }}>
                    {session.startedAt.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text className="text-sm" style={{ color: colors.text }}>
                    {formatDuration(session.durationSeconds)}
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
                      {session.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))
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
