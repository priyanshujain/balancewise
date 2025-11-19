import React, { useMemo } from 'react';
import { View, Text, Pressable, Image, Alert, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const profileImageUri = useMemo(() => {
    if (!user?.picture) return null;

    if (user.picture.startsWith('http') || user.picture.startsWith('data:')) {
      return user.picture;
    }

    return `data:image/jpeg;base64,${user.picture}`;
  }, [user?.picture]);

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (!confirmed) return;

      try {
        await signOut();
        router.replace('/');
      } catch {
        window.alert('Failed to sign out');
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              try {
                await signOut();
                router.replace('/');
              } catch {
                Alert.alert('Error', 'Failed to sign out');
              }
            },
          },
        ]
      );
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="items-center py-8 px-5">
        <View className="mb-6">
          {profileImageUri ? (
            <Image
              source={{ uri: profileImageUri }}
              className="w-32 h-32 rounded-full border-4 border-gray-200"
            />
          ) : (
            <View className="w-32 h-32 rounded-full bg-blue-500 items-center justify-center">
              <MaterialIcons name="person" size={64} color="#fff" />
            </View>
          )}
        </View>

        <View className="items-center mb-8">
          <Text style={{ color: colors.text }} className="text-2xl font-semibold mb-2">
            {user?.name || 'User'}
          </Text>
          <Text style={{ color: colors.icon }} className="text-base">
            {user?.email || 'No email'}
          </Text>
        </View>

        <Pressable
          className="bg-red-500 active:bg-red-600 px-10 py-3.5 rounded-xl flex-row items-center gap-2"
          onPress={handleSignOut}
        >
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text className="text-white text-base font-semibold">Logout</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
