import * as React from 'react';
import { Pressable, Platform } from 'react-native';

let ReactNativeHapticFeedback: any = null;
try {
  ReactNativeHapticFeedback = require('react-native-haptic-feedback').default;
} catch {
  // Haptic not available
}

type HapticType = 'selection' | 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy';

const HAPTIC_MAP: Record<HapticType, string> = {
  selection: 'selection',
  success:   'notificationSuccess',
  warning:   'notificationWarning',
  error:     'notificationError',
  light:     'impactLight',
  medium:    'impactMedium',
  heavy:     'impactHeavy',
};

export function triggerHaptic(type: HapticType = 'selection') {
  if (!ReactNativeHapticFeedback) return;
  const hapticType = HAPTIC_MAP[type] ?? 'selection';
  ReactNativeHapticFeedback.trigger(hapticType, {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  });
}

interface HapticPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  disabled?: boolean;
  hitSlop?: number;
  type?: HapticType;
}

export function HapticPressable({
  children,
  onPress,
  style,
  disabled,
  hitSlop,
  type = 'selection',
}: HapticPressableProps) {
  const handlePress = () => {
    triggerHaptic(type);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={style}
      hitSlop={hitSlop}
    >
      {children}
    </Pressable>
  );
}