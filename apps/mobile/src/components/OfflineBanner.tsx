/**
 * OfflineBanner — Global banner shown when user is offline.
 * 
 * Displays a prominent offline indicator that persists across all screens.
 * Uses position: absolute to not affect layout flow.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { colors, spacing, typography } from '@saas-pos/ui';

export function OfflineBanner() {
  const syncState = useSyncStatus();
  
  if (syncState.status === 'connected' || syncState.status === 'connecting') {
    return null;
  }

  return (
    <View 
      style={s.container} 
      accessibilityRole="alert"
      accessibilityLabel="Sin conexión. Trabajando en modo local."
    >
      <View style={s.iconContainer}>
        <Text style={s.icon}>⛔</Text>
      </View>
      <View style={s.textContainer}>
        <Text style={s.title}>Sin conexión</Text>
        <Text style={s.subtitle}>Trabajando en modo local</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    backgroundColor: colors.accent.amber,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.accent.amber}AA`,
  },
  iconContainer: {
    marginRight: spacing[2],
  },
  icon: {
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.bg.base,
  },
  subtitle: {
    fontSize: typography.size.xs,
    color: colors.bg.base,
    opacity: 0.9,
  },
});