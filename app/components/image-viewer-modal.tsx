import { StyleSheet, Pressable, View } from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import { Ionicons } from '@expo/vector-icons';

interface ImageViewerModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}

export function ImageViewerModal({ visible, imageUri, onClose }: ImageViewerModalProps) {
  const images = [{ uri: imageUri }];

  const HeaderComponent = () => (
    <View style={styles.headerContainer}>
      <Pressable style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={28} color="#fff" />
      </Pressable>
    </View>
  );

  return (
    <ImageViewing
      images={images}
      imageIndex={0}
      visible={visible}
      onRequestClose={onClose}
      swipeToCloseEnabled={true}
      doubleTapToZoomEnabled={true}
      HeaderComponent={HeaderComponent}
    />
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    zIndex: 100,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
