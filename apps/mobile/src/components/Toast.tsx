import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@saas-pos/ui';
import { useAccessibilityPreferences } from '../providers/AccessibilityProvider';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastState extends ToastConfig {
  visible: boolean;
}

const TOAST_ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  warning: 'warning',
  info: 'information-circle',
};

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: '#0d2b1e', border: '#3ECF8E', icon: '#3ECF8E' },
  error:   { bg: '#2d0f0f', border: '#EF4444', icon: '#EF4444' },
  warning: { bg: '#2d2400', border: '#F59E0B', icon: '#F59E0B' },
  info:    { bg: '#0f1f2d', border: '#3B82F6', icon: '#3B82F6' },
};

interface ToastProps {
  toast: ToastState;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const { preferences } = useAccessibilityPreferences();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const DURATION_FAST = 100;
  const DURATION_SLOW = 250;
  
  const enterDuration = preferences.prefersReducedMotion ? DURATION_FAST : 200;
  const exitDuration = preferences.prefersReducedMotion ? DURATION_FAST : 250;
  const dismissDelay = preferences.prefersReducedMotion ? 1500 : (toast.duration ?? 2800);

  useEffect(() => {
    if (toast.visible) {
      if (preferences.prefersReducedMotion) {
        Animated.timing(opacity, {
          toValue: 1,
          duration: DURATION_FAST,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }).start();
      } else {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 120,
            friction: 10,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: enterDuration,
            useNativeDriver: true,
          }),
        ]).start();
      }

      const timer = setTimeout(() => {
        if (preferences.prefersReducedMotion) {
          Animated.timing(opacity, {
            toValue: 0,
            duration: DURATION_FAST,
            useNativeDriver: true,
          }).start(() => onDismiss());
        } else {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 100,
              duration: exitDuration,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: exitDuration,
              useNativeDriver: true,
            }),
          ]).start(() => onDismiss());
        }
      }, dismissDelay);

      return () => clearTimeout(timer);
    }
  }, [toast.visible, preferences.prefersReducedMotion]);

  if (!toast.visible) return null;

  const type = toast.type ?? 'success';
  const cfg = TOAST_COLORS[type];
  
  const typeLabels = {
    success: 'Éxito',
    error: 'Error',
    warning: 'Advertencia',
    info: 'Información',
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: cfg.bg, borderColor: cfg.border, transform: [{ translateY }], opacity },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`${typeLabels[type]}: ${toast.message}`}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={TOAST_ICONS[type]} size={20} color={cfg.icon} />
      <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
      <Pressable 
        onPress={onDismiss} 
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Cerrar mensaje"
      >
        <Ionicons name="close" size={16} color={colors.text.muted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    lineHeight: 20,
  },
});