import { useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { DietEntryModal } from '@/components/diet-entry-modal';
import { DrivePermissionModal } from '@/components/drive-permission-modal';
import { DietCard } from '@/components/diet-card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDiet } from '@/hooks/use-diet';
import { useAuth } from '@/contexts/auth-context';
import type { DietEntry } from '@/services/database/diet';

export default function DietScreen() {
  const [showModal, setShowModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DietEntry | null>(null);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { dietEntries, loading, addDietEntry, updateDietEntry, removeDietEntry } = useDiet();
  const { hasDrivePermission } = useAuth();

  const handleSaveEntry = async (entryData: DietEntry) => {
    try {
      if (editingEntry) {
        // Update existing entry
        await updateDietEntry(entryData);
      } else {
        // Add new entry
        await addDietEntry(entryData);
      }
      setShowModal(false);
      setEditingEntry(null);
    } catch (error) {
      console.error('Error saving diet entry:', error);
      // Could show an error toast/alert here
    }
  };

  const handleEditEntry = (entry: DietEntry) => {
    setEditingEntry(entry);
    setShowModal(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await removeDietEntry(entryId);
    } catch (error) {
      console.error('Error deleting diet entry:', error);
      // Could show an error toast/alert here
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEntry(null);
  };

  const handleAddNew = () => {
    if (!hasDrivePermission) {
      setShowDriveModal(true);
      return;
    }
    setEditingEntry(null);
    setShowModal(true);
  };

  const handleDrivePermissionSuccess = () => {
    setEditingEntry(null);
    setShowModal(true);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={['top']}>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.tint} />
          <Text className="mt-4 text-base" style={{ color: colors.tabIconDefault }}>
            Loading diet entries...
          </Text>
        </View>
      ) : (
        <FlatList
          data={dietEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DietCard
              meal={item}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
            />
          )}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24 px-10">
              <Ionicons name="restaurant-outline" size={64} color={colors.tabIconDefault} />
              <Text className="text-lg font-semibold mt-4" style={{ color: colors.tabIconDefault }}>
                No diet entries logged yet
              </Text>
              <Text className="text-sm mt-2 text-center" style={{ color: colors.tabIconDefault }}>
                Tap the + button to add your first entry
              </Text>
            </View>
          }
        />
      )}

      <Pressable
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ backgroundColor: colors.tint }}
        onPress={handleAddNew}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <DietEntryModal
        visible={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
        editEntry={editingEntry}
      />

      <DrivePermissionModal
        visible={showDriveModal}
        onClose={() => setShowDriveModal(false)}
        onSuccess={handleDrivePermissionSuccess}
      />
    </SafeAreaView>
  );
}
