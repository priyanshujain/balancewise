import { Tabs, useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import MoreOptionsModal from '@/components/more-options-modal';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [showMoreModal, setShowMoreModal] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: showMoreModal ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showMoreModal, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            paddingTop: 8,
            paddingBottom: 8,
            height: 72,
          },
          tabBarLabelStyle: {
            marginTop: 4,
            fontSize: 11,
          },
        }}>
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="check-circle-outline" size={28} color={color} />
            ),
          }}
          listeners={{
            tabPress: () => {
              if (showMoreModal) {
                setShowMoreModal(false);
              }
            },
          }}
        />
        <Tabs.Screen
          name="diet"
          options={{
            title: 'Diet',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="restaurant" size={28} color={color} />
            ),
          }}
          listeners={{
            tabPress: () => {
              if (showMoreModal) {
                setShowMoreModal(false);
              }
            },
          }}
        />
        <Tabs.Screen
          name="exercise"
          options={{
            title: 'Exercise',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="fitness-center" size={28} color={color} />
            ),
          }}
          listeners={{
            tabPress: () => {
              if (showMoreModal) {
                setShowMoreModal(false);
              }
            },
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: ({ color }) => (
              <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                <MaterialIcons
                  name={showMoreModal ? "close" : "keyboard-arrow-up"}
                  size={28}
                  color={showMoreModal ? Colors[colorScheme ?? 'light'].tint : color}
                />
              </Animated.View>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setShowMoreModal(!showMoreModal);
            },
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            href: null,
          }}
        />
      </Tabs>

      <MoreOptionsModal
        visible={showMoreModal}
        onClose={() => setShowMoreModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
