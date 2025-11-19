import { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ActionSheet } from '@/components/action-sheet';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { DietEntry } from '@/services/database/diet';

interface DietEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (entryData: DietEntry) => void;
  onDelete?: (mealId: string) => void;
  editEntry?: DietEntry | null;
}

export function DietEntryModal({ visible, onClose, onSave, onDelete, editEntry }: DietEntryModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const isEditMode = !!editEntry;

  const showImagePickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickImageFromGallery();
          }
        }
      );
    } else {
      setShowImagePicker(true);
    }
  };

  // Populate form when editing
  useEffect(() => {
    if (editEntry) {
      setSelectedImage(editEntry.imageUri);
      setDescription(editEntry.description);
      setCalories(editEntry.calories);
      setProtein(editEntry.protein);
      setCarbs(editEntry.carbs);
      setFat(editEntry.fat);
    }
  }, [editEntry]);

  const compressImage = async (uri: string): Promise<string> => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1000 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return manipResult.uri;
    } catch (error) {
      return uri;
    }
  };

  const pickImageFromGallery = async () => {
    setIsPickingImage(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to add photos.');
        setIsPickingImage(false);
        return;
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request photo library permission.');
      setIsPickingImage(false);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const compressedUri = await compressImage(result.assets[0].uri);
      setSelectedImage(compressedUri);
    }

    setIsPickingImage(false);
  };

  const takePhoto = async () => {
    setIsPickingImage(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
        setIsPickingImage(false);
        return;
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request camera permission.');
      setIsPickingImage(false);
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const compressedUri = await compressImage(result.assets[0].uri);
        setSelectedImage(compressedUri);
      }
    } catch (error: any) {
      if (error.message?.includes('simulator')) {
        Alert.alert('Camera Unavailable', 'Camera is not available on the simulator. Please use "Choose from Gallery" or test on a real device.');
      } else {
        Alert.alert('Error', 'Failed to open camera.');
      }
    }

    setIsPickingImage(false);
  };

  const handleSave = () => {
    if (!selectedImage) {
      return;
    }

    const entryData: DietEntry = {
      id: isEditMode ? editEntry!.id : Date.now().toString(),
      imageUri: selectedImage,
      description,
      calories,
      protein,
      carbs,
      fat,
      timestamp: isEditMode ? editEntry!.timestamp : Date.now(),
    };

    onSave(entryData);
    resetForm();
  };

  const resetForm = () => {
    setSelectedImage(null);
    setDescription('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
  };

  const handleClose = () => {
    if (isPickingImage) {
      return;
    }
    resetForm();
    onClose();
  };

  const handleDelete = () => {
    if (!editEntry) return;

    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.(editEntry.id);
            resetForm();
            onClose();
          }
        },
      ]
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.overlay}>
              <TouchableWithoutFeedback>
                <ThemedView
                  style={[styles.container, { backgroundColor: colors.background }]}>
                  <View style={styles.header}>
                    {isEditMode && (
                      <Pressable onPress={handleDelete} style={styles.deleteButton}>
                        <Ionicons
                          name="trash-outline"
                          size={24}
                          color="#FF3B30"
                        />
                      </Pressable>
                    )}
                    <ThemedText type="subtitle" style={styles.title}>
                      {isEditMode ? 'Edit Meal' : 'Add Meal'}
                    </ThemedText>
                    <Pressable onPress={handleClose} style={styles.closeButton}>
                      <Ionicons
                        name="close"
                        size={24}
                        color={colors.text}
                      />
                    </Pressable>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}>
                    {selectedImage ? (
                      <View style={styles.imageContainer}>
                        <Image
                          source={{ uri: selectedImage }}
                          style={styles.selectedImage}
                          resizeMode="contain"
                        />
                        <Pressable
                          style={[styles.changeImageOverlay, { position: 'relative', marginTop: 10 }]}
                          onPress={showImagePickerOptions}>
                          <Ionicons name="camera" size={24} color="#fff" />
                          <ThemedText style={styles.changeImageText}>
                            Change Photo
                          </ThemedText>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        style={[
                          styles.imagePlaceholder,
                          { borderColor: colors.tint },
                        ]}
                        onPress={showImagePickerOptions}>
                        <Ionicons name="camera" size={48} color={colors.tint} />
                        <ThemedText style={[styles.placeholderText, { color: colors.tint }]}>
                          Tap to add photo
                        </ThemedText>
                      </Pressable>
                    )}

                    <View style={styles.formContainer}>
                      <ThemedText style={styles.label}>Description (optional)</ThemedText>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.card,
                            color: colors.text,
                            borderColor: colors.border,
                          },
                        ]}
                        placeholder="e.g., Oatmeal with berries"
                        placeholderTextColor={colors.tabIconDefault}
                        value={description}
                        onChangeText={setDescription}
                      />

                      <View style={styles.nutritionGrid}>
                        <View style={styles.nutritionItem}>
                          <ThemedText style={styles.label}>Calories</ThemedText>
                          <TextInput
                            style={[
                              styles.input,
                              {
                                backgroundColor: colors.card,
                                color: colors.text,
                                borderColor: colors.border,
                              },
                            ]}
                            placeholder="350"
                            placeholderTextColor={colors.tabIconDefault}
                            keyboardType="numeric"
                            value={calories}
                            onChangeText={setCalories}
                          />
                        </View>

                        <View style={styles.nutritionItem}>
                          <ThemedText style={styles.label}>Protein (g)</ThemedText>
                          <TextInput
                            style={[
                              styles.input,
                              {
                                backgroundColor: colors.card,
                                color: colors.text,
                                borderColor: colors.border,
                              },
                            ]}
                            placeholder="8"
                            placeholderTextColor={colors.tabIconDefault}
                            keyboardType="numeric"
                            value={protein}
                            onChangeText={setProtein}
                          />
                        </View>
                      </View>

                      <View style={styles.nutritionGrid}>
                        <View style={styles.nutritionItem}>
                          <ThemedText style={styles.label}>Carbs (g)</ThemedText>
                          <TextInput
                            style={[
                              styles.input,
                              {
                                backgroundColor: colors.card,
                                color: colors.text,
                                borderColor: colors.border,
                              },
                            ]}
                            placeholder="50"
                            placeholderTextColor={colors.tabIconDefault}
                            keyboardType="numeric"
                            value={carbs}
                            onChangeText={setCarbs}
                          />
                        </View>

                        <View style={styles.nutritionItem}>
                          <ThemedText style={styles.label}>Fat (g)</ThemedText>
                          <TextInput
                            style={[
                              styles.input,
                              {
                                backgroundColor: colors.card,
                                color: colors.text,
                                borderColor: colors.border,
                              },
                            ]}
                            placeholder="14"
                            placeholderTextColor={colors.tabIconDefault}
                            keyboardType="numeric"
                            value={fat}
                            onChangeText={setFat}
                          />
                        </View>
                      </View>
                    </View>
                  </ScrollView>

                  <Pressable
                    style={[
                      styles.saveButton,
                      {
                        backgroundColor: selectedImage ? colors.tint : colors.tabIconDefault,
                      },
                    ]}
                    onPress={handleSave}
                    disabled={!selectedImage}>
                    <ThemedText style={styles.saveButtonText}>
                      {isEditMode ? 'Update Meal' : 'Save Meal'}
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <ActionSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        title="Add Photo"
        options={[
          {
            label: 'Take Photo',
            onPress: takePhoto,
          },
          {
            label: 'Choose from Gallery',
            onPress: pickImageFromGallery,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  deleteButton: {
    position: 'absolute',
    left: 16,
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  imagePlaceholder: {
    height: 200,
    margin: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  imageContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    padding: 16,
    paddingTop: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
  },
  saveButton: {
    margin: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
