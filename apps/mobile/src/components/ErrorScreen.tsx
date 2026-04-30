import React from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius, Button } from '@saas-pos/ui';

interface ErrorScreenProps {
  error: Error;
  resetError: () => void;
}

export function ErrorScreen({ error, resetError }: ErrorScreenProps) {
  const isDev = __DEV__;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <View style={s.iconContainer}>
          <Text style={s.icon}>⚠</Text>
        </View>

        <View style={s.card}>
          <Text style={s.title}>Algo salió mal</Text>
          <Text style={s.message}>
            Ha ocurrido un error inesperado en la aplicación.
          </Text>

          {isDev && (
            <View style={s.debugContainer}>
              <Text style={s.debugTitle}>Detalles del error (Solo Dev):</Text>
              <ScrollView style={s.debugScroll} nestedScrollEnabled>
                <Text style={s.debugText}>{error.message}</Text>
                <Text style={s.debugStack}>{error.stack}</Text>
              </ScrollView>
            </View>
          )}

          <Button 
            label="Reintentar" 
            onPress={resetError}
            variant="primary"
          />
          
          <Text style={s.footer}>
            Si el problema persiste, contacta a soporte.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  content: {
    flex: 1,
    padding: spacing[6],
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.accent.redDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: colors.accent.red,
  },
  icon: {
    fontSize: 32,
    color: colors.accent.red,
  },
  card: {
    width: '100%',
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  title: {
    fontSize: 20,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  message: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 20,
  },
  debugContainer: {
    backgroundColor: colors.bg.base,
    borderRadius: radius.md,
    padding: spacing[3],
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: colors.border.default,
    maxHeight: 200,
  },
  debugTitle: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
    color: colors.text.muted,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
  },
  debugScroll: {
    flexGrow: 0,
  },
  debugText: {
    fontSize: 12,
    color: colors.accent.red,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  debugStack: {
    fontSize: 10,
    color: colors.text.muted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footer: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing[6],
  },
});
