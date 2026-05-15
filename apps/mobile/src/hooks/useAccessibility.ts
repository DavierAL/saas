import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

interface AccessibilityPreferences {
  prefersReducedMotion: boolean;
  isScreenReaderEnabled: boolean;
}

export function useAccessibility() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    prefersReducedMotion: false,
    isScreenReaderEnabled: false,
  });

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      setPreferences((p) => ({ ...p, prefersReducedMotion: reduced }));
    });

    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (reduced) => {
        setPreferences((p) => ({ ...p, prefersReducedMotion: reduced }));
      }
    );

    return () => sub.remove();
  }, []);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      setPreferences((p) => ({ ...p, isScreenReaderEnabled: enabled }));
    });

    const sub = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => {
        setPreferences((p) => ({ ...p, isScreenReaderEnabled: enabled }));
      }
    );

    return () => sub.remove();
  }, []);

  return preferences;
}