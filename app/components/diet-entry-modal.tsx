import { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActionSheetIOS,
  ActivityIndicator,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ActionSheet } from '@/components/action-sheet';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { DietEntry } from '@/services/database/diet';
import { apiService } from '@/services/api';
import { fileStorage } from '@/services/file-storage';
import { useNetwork } from '@/contexts/network-context';

interface DietEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (entryData: DietEntry) => void;
  onDelete?: (mealId: string) => void;
  editEntry?: DietEntry | null;
}

export function DietEntryModal({ visible, onClose, onSave, onDelete, editEntry }: DietEntryModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nameSelection, setNameSelection] = useState<{start: number, end: number} | undefined>(undefined);

  const nameInputRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isOnline } = useNetwork();
  const insets = useSafeAreaInsets();

  const isEditMode = !!editEntry;

  const isValidNumber = (value: string): boolean => {
    if (!value || value.trim() === '') return false;
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  };

  const areAllNutritionFieldsValid = (): boolean => {
    return (
      isValidNumber(calories) &&
      isValidNumber(protein) &&
      isValidNumber(carbs) &&
      isValidNumber(fat)
    );
  };

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

  // Animate loader when analyzing
  useEffect(() => {
    if (isAnalyzing) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Pulse animation for the main circle
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Float animation for food icons
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(floatAnim1, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim1, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(floatAnim2, {
              toValue: 1,
              duration: 2500,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim2, {
              toValue: 0,
              duration: 2500,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(floatAnim3, {
              toValue: 1,
              duration: 1800,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim3, {
              toValue: 0,
              duration: 1800,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnalyzing]);

  console.log('MealEntryModal render - selectedImage:', selectedImage);

  // Populate form when editing
  useEffect(() => {
    if (editEntry) {
      setSelectedImage(editEntry.imageUri);
      setName(editEntry.name);
      setDescription(editEntry.description);
      setCalories(editEntry.calories);
      setProtein(editEntry.protein);
      setCarbs(editEntry.carbs);
      setFat(editEntry.fat);
      setNameSelection(undefined);
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
    } catch {
      return uri;
    }
  };

  const analyzeImage = async (imageUri: string) => {
    console.log('Analyzing image...', imageUri);
    setIsAnalyzing(true);

    try {
      const result = await apiService.analyzeDietImage(imageUri);
      console.log('Analysis result:', result);

      // Update the form fields with the analysis results
      setName(result.food_name);
      setCalories(result.calories.toString());
      setProtein(result.protein.toString());
      setCarbs(result.carbs.toString());
      setFat(result.fat.toString());

      // Set cursor to the beginning of the name field
      setNameSelection({ start: 0, end: 0 });

    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert(
        'Analysis Failed',
        'Could not analyze the image. Please enter nutrition information manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAnalyzing(false);
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
    } catch {
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
      console.log('State update called');

      if (isOnline) {
        await analyzeImage(compressedUri);
      }
    } else {
      console.log('Image selection was cancelled or no assets');
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
    } catch {
      Alert.alert('Error', 'Failed to request camera permission.');
      setIsPickingImage(false);
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Camera image captured:', imageUri);

        // Compress the image
        const compressedUri = await compressImage(imageUri);
        console.log('Setting selected image to compressed version:', compressedUri);
        setSelectedImage(compressedUri);
        console.log('State update called');

        if (isOnline) {
          await analyzeImage(compressedUri);
        }
      } else {
        console.log('Camera was cancelled or no assets');
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

  const handleSave = async () => {
    if (!selectedImage || !areAllNutritionFieldsValid()) {
      return;
    }

    try {
      const entryId = isEditMode ? editEntry!.id : Date.now().toString();
      const filename = `${entryId}.jpg`;

      let permanentUri: string;

      if (isEditMode && selectedImage === editEntry!.imageUri) {
        permanentUri = selectedImage;
      } else {
        if (isEditMode && editEntry!.imageUri) {
          await fileStorage.deleteImage(editEntry!.imageUri);
        }
        permanentUri = await fileStorage.saveImagePermanently(selectedImage, filename);
      }

      const entryData: DietEntry = {
        id: entryId,
        imageUri: permanentUri,
        name,
        description,
        calories,
        protein,
        carbs,
        fat,
        timestamp: isEditMode ? editEntry!.timestamp : Date.now(),
      };

      onSave(entryData);
      resetForm();
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setName('');
    setDescription('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setNameSelection(undefined);
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
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}>
        <View className="flex-1" style={{ backgroundColor: colors.background, paddingTop: insets.top }}>
          <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1">
            <View className="flex-1">
              <View className="flex-row items-center justify-center py-4 px-5 border-b border-gray-200 dark:border-gray-700">
              <Pressable onPress={handleClose} className="absolute left-4 p-1">
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.text}
                />
              </Pressable>
              <ThemedText className="text-lg font-semibold">
                {isEditMode ? 'Edit Meal' : 'Add Meal'}
              </ThemedText>
              {isEditMode && (
                <Pressable onPress={handleDelete} className="absolute right-4 p-1">
                  <Ionicons
                    name="trash-outline"
                    size={24}
                    color="#FF3B30"
                  />
                </Pressable>
              )}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 16 }}>
              {selectedImage ? (
                <View className="m-4 rounded-2xl overflow-hidden bg-gray-100">
                  <Image
                    source={{ uri: selectedImage }}
                    className="w-full h-52"
                    resizeMode="contain"
                  />
                  <Pressable
                    className="bg-gray-600 py-3 flex-row items-center justify-center gap-2"
                    onPress={showImagePickerOptions}
                    disabled={isAnalyzing}>
                    <Ionicons name="camera" size={24} color="#fff" />
                    <Text className="text-white text-base font-semibold">
                      Change Photo
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  className="h-52 m-4 rounded-2xl border-2 border-dashed items-center justify-center"
                  style={{ borderColor: colors.tint }}
                  onPress={showImagePickerOptions}>
                  <Ionicons name="camera" size={48} color={colors.tint} />
                  <ThemedText className="mt-3 text-base font-medium" style={{ color: colors.tint }}>
                    Tap to add photo
                  </ThemedText>
                </Pressable>
              )}

              <View className="px-4">
                <ThemedText className="text-sm font-semibold mb-2">Name (optional)</ThemedText>
                <TextInput
                  ref={nameInputRef}
                  className="py-3 px-4 rounded-xl border mb-4"
                  style={{
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                    opacity: isAnalyzing ? 0.5 : 1,
                    fontSize: 16,
                  }}
                  placeholder="e.g., Grilled Chicken Salad"
                  placeholderTextColor={colors.tabIconDefault}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setNameSelection(undefined);
                  }}
                  editable={!isAnalyzing}
                  selection={nameSelection}
                  onSelectionChange={() => {
                    if (!isAnalyzing) {
                      setNameSelection(undefined);
                    }
                  }}
                  onFocus={() => {
                    if (nameSelection) {
                      setTimeout(() => setNameSelection(undefined), 50);
                    }
                  }}
                />

                <ThemedText className="text-sm font-semibold mb-2">Description (optional)</ThemedText>
                <TextInput
                  className="py-3 px-4 rounded-xl border mb-4"
                  style={{
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                    opacity: isAnalyzing ? 0.5 : 1,
                    fontSize: 16,
                    minHeight: 80,
                    maxHeight: 120,
                  }}
                  placeholder="e.g., With avocado and vinaigrette dressing"
                  placeholderTextColor={colors.tabIconDefault}
                  value={description}
                  onChangeText={setDescription}
                  editable={!isAnalyzing}
                  multiline={true}
                  numberOfLines={2}
                  textAlignVertical="top"
                />

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <ThemedText className="text-sm font-semibold mb-2">Calories</ThemedText>
                      <ThemedText className="text-sm font-semibold text-red-500 ml-0.5 mb-2">*</ThemedText>
                    </View>
                    <TextInput
                      className="py-3 px-4 rounded-xl border mb-4"
                      style={{
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: colors.border,
                        opacity: isAnalyzing ? 0.5 : 1,
                        fontSize: 16,
                      }}
                      placeholder="350"
                      placeholderTextColor={colors.tabIconDefault}
                      keyboardType="decimal-pad"
                      value={calories}
                      onChangeText={setCalories}
                      editable={!isAnalyzing}
                    />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <ThemedText className="text-sm font-semibold mb-2">Protein (g)</ThemedText>
                      <ThemedText className="text-sm font-semibold text-red-500 ml-0.5 mb-2">*</ThemedText>
                    </View>
                    <TextInput
                      className="py-3 px-4 rounded-xl border mb-4"
                      style={{
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: colors.border,
                        opacity: isAnalyzing ? 0.5 : 1,
                        fontSize: 16,
                      }}
                      placeholder="8"
                      placeholderTextColor={colors.tabIconDefault}
                      keyboardType="decimal-pad"
                      value={protein}
                      onChangeText={setProtein}
                      editable={!isAnalyzing}
                    />
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <ThemedText className="text-sm font-semibold mb-2">Carbs (g)</ThemedText>
                      <ThemedText className="text-sm font-semibold text-red-500 ml-0.5 mb-2">*</ThemedText>
                    </View>
                    <TextInput
                      className="py-3 px-4 rounded-xl border mb-4"
                      style={{
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: colors.border,
                        opacity: isAnalyzing ? 0.5 : 1,
                        fontSize: 16,
                      }}
                      placeholder="50"
                      placeholderTextColor={colors.tabIconDefault}
                      keyboardType="decimal-pad"
                      value={carbs}
                      onChangeText={setCarbs}
                      editable={!isAnalyzing}
                    />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <ThemedText className="text-sm font-semibold mb-2">Fat (g)</ThemedText>
                      <ThemedText className="text-sm font-semibold text-red-500 ml-0.5 mb-2">*</ThemedText>
                    </View>
                    <TextInput
                      className="py-3 px-4 rounded-xl border mb-4"
                      style={{
                        backgroundColor: colors.card,
                        color: colors.text,
                        borderColor: colors.border,
                        opacity: isAnalyzing ? 0.5 : 1,
                        fontSize: 16,
                      }}
                      placeholder="14"
                      placeholderTextColor={colors.tabIconDefault}
                      keyboardType="decimal-pad"
                      value={fat}
                      onChangeText={setFat}
                      editable={!isAnalyzing}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View className="px-4 pb-6">
              <Pressable
                onPress={handleSave}
                className="rounded-lg py-4 items-center"
                style={{
                  backgroundColor: colors.tint,
                  opacity: (!selectedImage || isAnalyzing || !areAllNutritionFieldsValid()) ? 0.5 : 1,
                }}
                disabled={!selectedImage || isAnalyzing || !areAllNutritionFieldsValid()}>
                <Text className="text-white text-lg font-semibold">
                  {isEditMode ? 'Update Meal' : 'Save Meal'}
                </Text>
              </Pressable>
            </View>
            </View>
          </KeyboardAvoidingView>

          {/* Full Screen Animated Loader */}
          {isAnalyzing && (
            <Animated.View
              className="absolute inset-0 bg-black/85 justify-center items-center z-50"
              style={{ opacity: fadeAnim }}
              pointerEvents="auto">
              <View className="w-full h-full justify-center items-center relative">
                {/* Floating Food Icons */}
                <Animated.View
                  className="absolute"
                  style={{
                    top: '20%',
                    left: '15%',
                    transform: [
                      {
                        translateY: floatAnim1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -20],
                        }),
                      },
                    ],
                  }}>
                  <ThemedText className="text-5xl opacity-60">🍎</ThemedText>
                </Animated.View>

                <Animated.View
                  className="absolute"
                  style={{
                    top: '25%',
                    right: '20%',
                    transform: [
                      {
                        translateY: floatAnim2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -25],
                        }),
                      },
                    ],
                  }}>
                  <ThemedText className="text-5xl opacity-60">🥗</ThemedText>
                </Animated.View>

                <Animated.View
                  className="absolute"
                  style={{
                    bottom: '30%',
                    left: '20%',
                    transform: [
                      {
                        translateY: floatAnim3.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -15],
                        }),
                      },
                    ],
                  }}>
                  <ThemedText className="text-5xl opacity-60">🥑</ThemedText>
                </Animated.View>

                {/* Center Animated Circle */}
                <Animated.View
                  className="absolute w-64 h-64 rounded-full bg-blue-500"
                  style={{
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.2],
                        }),
                      },
                    ],
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.1],
                    }),
                  }}
                />

                {/* Main Content */}
                <View className="bg-white rounded-3xl p-8 items-center shadow-2xl z-10">
                  <ActivityIndicator size="large" color="#007AFF" />
                  <ThemedText className="text-xl font-bold mt-5 text-black">
                    Analyzing your food
                  </ThemedText>
                  <ThemedText className="text-sm mt-2 text-gray-600">
                    Detecting nutrition information...
                  </ThemedText>
                </View>
              </View>
            </Animated.View>
          )}
        </View>
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
