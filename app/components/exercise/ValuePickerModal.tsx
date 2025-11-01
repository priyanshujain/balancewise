import { View, Text, Pressable, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface ValuePickerModalProps {
  visible: boolean;
  title: string;
  value: number;
  values: number[];
  suffix?: string;
  onSelect: (value: number) => void;
  onClose: () => void;
}

export function ValuePickerModal({
  visible,
  title,
  value,
  values,
  suffix = '',
  onSelect,
  onClose,
}: ValuePickerModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.background }}>
          <View className="p-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                {title}
              </Text>
              <Pressable onPress={onClose}>
                <MaterialIcons name="close" size={24} color={colors.icon} />
              </Pressable>
            </View>

            <View className="rounded-lg mb-4" style={{ backgroundColor: colors.card }}>
              <Picker
                selectedValue={value}
                onValueChange={onSelect}
                style={{ color: colors.text }}
              >
                {values.map(v => (
                  <Picker.Item key={v} label={`${v}${suffix ? ' ' + suffix : ''}`} value={v} />
                ))}
              </Picker>
            </View>

            <Pressable
              className="rounded-lg py-4 items-center"
              style={{ backgroundColor: colors.tint }}
              onPress={onClose}
            >
              <Text className="text-white font-semibold">Done</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
