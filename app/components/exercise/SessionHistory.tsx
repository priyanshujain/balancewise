import { FlatList, View, Text, ActivityIndicator } from 'react-native';
import { WorkoutSession } from '@/types/exercise';

interface SessionHistoryProps {
  sessions: WorkoutSession[];
  loading?: boolean;
}

export function SessionHistory({ sessions, loading = false }: SessionHistoryProps) {
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-gray-500 text-center text-lg">
          No workout history yet. Start your first workout!
        </Text>
      </View>
    );
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'abandoned':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <FlatList
      data={sessions}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold text-gray-900">
              {item.startedAt.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
              <Text className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-600">
              Started: {item.startedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text className="text-sm font-medium text-gray-900">
              Duration: {formatDuration(item.durationSeconds)}
            </Text>
          </View>
        </View>
      )}
      contentContainerClassName="p-4"
      showsVerticalScrollIndicator={false}
    />
  );
}
