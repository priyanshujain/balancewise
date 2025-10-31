import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface MoreOption {
  id: string;
  label: string;
  icon: string;
}

interface MoreOptionsModalProps {
  visible: boolean;
  onClose: () => void;
}

const moreOptions: MoreOption[] = [
  { id: 'profile', label: 'Profile', icon: 'person' },
  { id: 'help', label: 'Help', icon: 'help' },
];

export default function MoreOptionsModal({ visible, onClose }: MoreOptionsModalProps) {
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const modalBottom = 72 + insets.bottom;

  const handleOptionPress = (optionId: string) => {
    onClose();

    switch (optionId) {
      case 'profile':
        router.push('/profile');
        break;
      case 'help':
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  if (!visible) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable
        style={[StyleSheet.absoluteFillObject, { bottom: modalBottom }]}
        onPress={onClose}
        pointerEvents="auto"
      >
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
      </Pressable>

      <Animated.View
        style={[
          styles.modalContent,
          {
            bottom: modalBottom,
            transform: [{ translateY }],
          },
        ]}
        pointerEvents="auto"
      >
        <View style={styles.contentContainer}>
          <View style={styles.optionsGrid}>
            {moreOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionItem}
                onPress={() => handleOptionPress(option.id)}
              >
                <MaterialIcons
                  name={option.icon as any}
                  size={28}
                  color="#6B7280"
                  style={styles.optionIcon}
                />
                <Text style={styles.optionLabel}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    maxHeight: '60%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 0,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionItem: {
    width: '25%',
    alignItems: 'center',
    marginTop: 24,
  },
  optionIcon: {
    marginBottom: 6,
  },
  optionLabel: {
    fontSize: 11,
    textAlign: 'center',
    color: '#4B5563',
  },
});
