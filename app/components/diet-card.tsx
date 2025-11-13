import { useState } from 'react';
import { StyleSheet, View, Image, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ImageViewerModal } from '@/components/image-viewer-modal';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { DietEntry } from '@/services/database/diet';

interface DietCardProps {
  meal: DietEntry;
  onEdit?: (meal: DietEntry) => void;
  onDelete?: (mealId: string) => void;
}

export function DietCard({ meal, onEdit, onDelete }: DietCardProps) {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleDelete = () => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(meal.id)
        },
      ]
    );
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return days === 1 ? '1 day ago' : `${days} days ago`;
    } else if (hours > 0) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else if (minutes > 0) {
      return minutes === 1 ? '1 minute ago' : `${minutes} Minutes ago`;
    } else {
      return 'just now';
    }
  };

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          shadowColor: colorScheme === 'dark' ? '#fff' : '#000',
        },
      ]}>
      <View style={styles.content}>
        <Pressable
          onPress={() => setShowImageViewer(true)}
          onLongPress={() => onEdit?.(meal)}
          style={styles.imageContainer}>
          <Image
            source={{ uri: meal.imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        </Pressable>

        <Pressable style={styles.infoContainer} onPress={() => onEdit?.(meal)}>
          <ThemedText style={[styles.timeText, { color: colors.tabIconDefault }]}>
            {getTimeAgo(meal.timestamp)}
          </ThemedText>

          {meal.description && (
            <ThemedText style={styles.description} numberOfLines={2}>
              {meal.description}
            </ThemedText>
          )}

          <View style={styles.nutritionContainer}>
            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <ThemedText style={styles.nutritionEmoji}>🔥</ThemedText>
                <View>
                  <ThemedText style={styles.nutritionValue}>
                    {meal.calories || '0'}
                  </ThemedText>
                  <ThemedText
                    style={[styles.nutritionLabel, { color: colors.tabIconDefault }]}>
                    calories
                  </ThemedText>
                </View>
              </View>

              <View style={styles.nutritionItem}>
                <ThemedText style={styles.nutritionEmoji}>🍖</ThemedText>
                <View>
                  <ThemedText style={styles.nutritionValue}>
                    {meal.protein || '0'}g
                  </ThemedText>
                  <ThemedText
                    style={[styles.nutritionLabel, { color: colors.tabIconDefault }]}>
                    protein
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <ThemedText style={styles.nutritionEmoji}>🍚</ThemedText>
                <View>
                  <ThemedText style={styles.nutritionValue}>
                    {meal.carbs || '0'}g
                  </ThemedText>
                  <ThemedText
                    style={[styles.nutritionLabel, { color: colors.tabIconDefault }]}>
                    carbs
                  </ThemedText>
                </View>
              </View>

              <View style={styles.nutritionItem}>
                <ThemedText style={styles.nutritionEmoji}>🥑</ThemedText>
                <View>
                  <ThemedText style={styles.nutritionValue}>
                    {meal.fat || '0'}g
                  </ThemedText>
                  <ThemedText
                    style={[styles.nutritionLabel, { color: colors.tabIconDefault }]}>
                    fat
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </Pressable>
      </View>

      <Pressable
        style={[styles.editButton, { backgroundColor: colors.background }]}
        onPress={() => onEdit?.(meal)}>
        <Ionicons name="pencil-outline" size={20} color={colors.tint} />
      </Pressable>

      <ImageViewerModal
        visible={showImageViewer}
        imageUri={meal.imageUri}
        onClose={() => setShowImageViewer(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 13,
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  nutritionContainer: {
    gap: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: 16,
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  nutritionEmoji: {
    fontSize: 20,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  nutritionLabel: {
    fontSize: 12,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center'
  },
  editButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
