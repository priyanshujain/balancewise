import { useState } from 'react';
import { StyleSheet, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ActionSheet } from '@/components/action-sheet';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ImagePickerComponentProps {
  onImageSelected?: (uri: string) => void;
  buttonText?: string;
  changeButtonText?: string;
}

export function ImagePickerComponent({
  onImageSelected,
  buttonText = 'Add Photo',
  changeButtonText = 'Change Photo',
}: ImagePickerComponentProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const pickImageFromGallery = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      onImageSelected?.(uri);
    }
  };

  const takePhoto = async () => {
    // Request permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera.');
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      onImageSelected?.(uri);
    }
  };

  const showImagePickerOptions = () => {
    setShowActionSheet(true);
  };

  return (
    <ThemedView>
      <Pressable
        style={({ pressed }) => [
          styles.photoButton,
          {
            backgroundColor: colors.tint,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={showImagePickerOptions}>
        <ThemedText style={styles.photoButtonText}>
          {selectedImage ? changeButtonText : buttonText}
        </ThemedText>
      </Pressable>

      {selectedImage && (
        <ThemedView style={styles.imageContainer}>
          <Image
            source={{ uri: selectedImage }}
            style={styles.selectedImage}
            contentFit="cover"
          />
        </ThemedView>
      )}

      <ActionSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title="Select Image"
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  photoButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
});
