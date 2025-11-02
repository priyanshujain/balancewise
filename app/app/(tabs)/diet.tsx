import { useState } from 'react';
import { StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { MealEntryModal } from '@/components/meal-entry-modal';
import { MealCard } from '@/components/meal-card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMeals } from '@/hooks/use-meals';
import type { MealData } from '@/services/database/meals';

export default function DietScreen() {
  const [showModal, setShowModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealData | null>(null);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Use the custom hook for database operations
  const { meals, loading, addMeal, updateMeal, removeMeal } = useMeals();

  const handleSaveMeal = async (mealData: MealData) => {
    try {
      if (editingMeal) {
        // Update existing meal
        await updateMeal(mealData);
      } else {
        // Add new meal
        await addMeal(mealData);
      }
      setShowModal(false);
      setEditingMeal(null);
    } catch (error) {
      console.error('Error saving meal:', error);
      // Could show an error toast/alert here
    }
  };

  const handleEditMeal = (meal: MealData) => {
    setEditingMeal(meal);
    setShowModal(true);
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      await removeMeal(mealId);
    } catch (error) {
      console.error('Error deleting meal:', error);
      // Could show an error toast/alert here
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMeal(null);
  };

  const handleAddNew = () => {
    setEditingMeal(null);
    setShowModal(true);
  };

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={[styles.loadingText, { color: colors.tabIconDefault }]}>
            Loading meals...
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={meals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MealCard
              meal={item}
              onEdit={handleEditMeal}
              onDelete={handleDeleteMeal}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={64} color={colors.tabIconDefault} />
              <ThemedText style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                No meals logged yet
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                Tap the + button to add your first meal
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
        onSave={handleSaveMeal}
        editMeal={editingMeal}
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
