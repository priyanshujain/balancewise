import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useNetwork } from '@/contexts/network-context';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const OFFLINE_INDICATOR_HEIGHT = 24;

export function OfflineIndicator() {
  const { isOnline } = useNetwork();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const translateY = useSharedValue(-OFFLINE_INDICATOR_HEIGHT - insets.top);

  useEffect(() => {
    if (isOnline) {
      translateY.value = withTiming(-OFFLINE_INDICATOR_HEIGHT - insets.top, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    } else {
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [isOnline, insets.top]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const backgroundColor = colorScheme === 'dark' ? '#37474F' : '#ECEFF1';
  const textColor = colorScheme === 'dark' ? '#B0BEC5' : '#546E7A';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: insets.top,
          height: OFFLINE_INDICATOR_HEIGHT + insets.top,
        },
        animatedStyle,
      ]}
    >
      <Ionicons name="cloud-offline" size={14} color={textColor} style={styles.icon} />
      <ThemedText style={styles.text} lightColor={textColor} darkColor={textColor}>
        Working Offline
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 6,
    zIndex: 9999,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
