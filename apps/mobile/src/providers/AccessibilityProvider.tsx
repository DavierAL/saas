import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';

interface AccessibilityPreferences {
  prefersReducedMotion: boolean;
  isScreenReaderEnabled: boolean;
}

interface AccessibilityContextValue {
  preferences: AccessibilityPreferences;
}

const AccessibilityContext = createContext<AccessibilityContextValue>({
  preferences: {
    prefersReducedMotion: false,
    isScreenReaderEnabled: false,
  },
});

export const useAccessibilityPreferences = () => useContext(AccessibilityContext);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    prefersReducedMotion: false,
    isScreenReaderEnabled: false,
  });

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      setPreferences((p) => ({ ...p, prefersReducedMotion: reduced }));
    });

    const motionSub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (reduced) => {
        setPreferences((p) => ({ ...p, prefersReducedMotion: reduced }));
      }
    );

    return () => motionSub.remove();
  }, []);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      setPreferences((p) => ({ ...p, isScreenReaderEnabled: enabled }));
    });

    const srSub = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => {
        setPreferences((p) => ({ ...p, isScreenReaderEnabled: enabled }));
      }
    );

    return () => srSub.remove();
  }, []);

  return (
    <AccessibilityContext.Provider value={{ preferences }}>
      {children}
    </AccessibilityContext.Provider>
  );
}