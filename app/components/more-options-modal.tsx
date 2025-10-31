import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

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
        style={[styles.backdrop, { opacity: opacityAnim }]}
        onPress={onClose}
        pointerEvents="auto"
      />

      <Animated.View
        style={[
          styles.modalContent,
          { transform: [{ translateY }] },
        ]}
        pointerEvents="auto"
      >
        <View style={styles.contentContainer}>
          <View className="flex-row flex-wrap">
            {moreOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionItem}
                onPress={() => {
                  console.log(`${option.label} pressed`);
                  onClose();
                }}
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
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  modalContent: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    maxHeight: '60%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    zIndex: 2,
  },
  contentContainer: {
    paddingHorizontal: 24,
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
