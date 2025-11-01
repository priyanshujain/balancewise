import { View, Text, Pressable } from 'react-native';
import { useEffect, useState } from 'react';

interface BreakTimerProps {
  initialSeconds: number;
  onComplete: () => void;
  onSkip: () => void;
}

export function BreakTimer({ initialSeconds, onComplete, onSkip }: BreakTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (secondsLeft / initialSeconds) * 100;

  return (
    <View className="flex-1 bg-black/80 items-center justify-center">
      <View className="bg-white rounded-3xl p-8 items-center w-80">
        <Text className="text-2xl font-semibold text-gray-900 mb-8">Take a Break</Text>

        <View className="relative items-center justify-center mb-8">
          <View className="w-48 h-48 rounded-full bg-gray-200" />
          <View
            className="absolute w-48 h-48 rounded-full bg-blue-500"
            style={{
              transform: [{ scaleY: progress / 100 }],
            }}
          />
          <View className="absolute items-center justify-center">
            <Text className="text-6xl font-bold text-gray-900">{formatTime(secondsLeft)}</Text>
          </View>
        </View>

        <Pressable
          onPress={onSkip}
          className="bg-blue-500 rounded-xl px-8 py-4 w-full items-center active:bg-blue-600"
        >
          <Text className="text-white text-lg font-semibold">Skip Break</Text>
        </Pressable>
      </View>
    </View>
  );
}
