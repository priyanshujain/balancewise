import { useState } from 'react';
import { StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MealEntryModal } from '@/components/meal-entry-modal';
import { MealCard } from '@/components/meal-card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDiet } from '@/hooks/use-diet';
import type { DietEntry } from '@/services/database/diet';

export default function DietScreen() {
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DietEntry | null>(null);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Use the custom hook for database operations
  const { dietEntries, loading, addDietEntry, updateDietEntry, removeDietEntry } = useDiet();

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
    setEditingEntry(null);
    setShowModal(true);
  };

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={[styles.loadingText, { color: colors.tabIconDefault }]}>
            Loading diet entries...
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={dietEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MealCard
              meal={item}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={64} color={colors.tabIconDefault} />
              <ThemedText style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                No diet entries logged yet
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                Tap the + button to add your first entry
              </ThemedText>
            </ThemedView>
          }
        />
      )}

      <Pressable
        style={[styles.fab, { backgroundColor: colors.tint }]}
        onPress={handleAddNew}>
        <Ionicons name="add" size={32} color="#fff" />
      </Pressable>

      <MealEntryModal
        visible={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveEntry}
        editMeal={editingEntry}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 22
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
