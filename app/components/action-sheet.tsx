import { Modal, StyleSheet, Pressable, TouchableWithoutFeedback, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
}

export function ActionSheet({ visible, onClose, title, options }: ActionSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleOptionPress = (onPress: () => void) => {
    onPress();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View>
              <ThemedView style={[styles.container, { backgroundColor: colors.card }]}>
                {title && (
                  <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <ThemedText type="subtitle" style={styles.title}>
                      {title}
                    </ThemedText>
                  </View>
                )}

                <View style={styles.optionsContainer}>
                  {options.map((option, index) => (
                    <Pressable
                      key={index}
                      style={styles.option}
                      onPress={() => handleOptionPress(option.onPress)}>
                      <ThemedText
                        style={[
                          styles.optionText,
                          option.destructive && styles.destructiveText,
                        ]}>
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                  <Pressable
                  style={{
                    margin:10
                  }}
                  onPress={onClose}>
                  <ThemedText style={[
                          styles.optionText,
                          styles.destructiveText,
                        ]}>
                    Cancel
                  </ThemedText>
                </Pressable>
                </View>
              </ThemedView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    padding: 8,
    paddingBottom: 16,
  },
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsContainer: {
    paddingVertical: 0,
    margin:10
  },
  option: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionPressed: {
    opacity: 0.5,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  optionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '400',
  },
  destructiveText: {
    color: '#FF3B30',
  },
  cancelContainer: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
});
