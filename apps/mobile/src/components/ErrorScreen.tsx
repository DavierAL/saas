import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface ErrorScreenProps {
  error: Error;
  resetError: () => void;
}

/**
 * ErrorScreen — Premium fallback for application crashes.
 * Used by the Root Error Boundary.
 */
export function ErrorScreen({ error, resetError }: ErrorScreenProps) {
  return (
    <SafeAreaView style={s.container}>
      <StatusBar style="light" />
      <View style={s.card}>
        <View style={s.iconWrap}>
          <Text style={s.icon}>✕</Text>
        </View>

        <Text style={s.title}>Algo salió mal</Text>
        <Text style={s.desc}>
          La aplicación encontró un error inesperado y no pudo continuar.
        </Text>

        <View style={s.errorDetailBox}>
          <Text style={s.errorLabel}>Detalle técnico:</Text>
          <Text style={s.errorText} numberOfLines={3}>
            {error.message || 'Error desconocido'}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [s.btn, pressed && s.btnPressed]}
          onPress={resetError}
        >
          <Text style={s.btnText}>Reintentar</Text>
        </Pressable>

        <Text style={s.footer}>
          Si el problema persiste, contacta al soporte técnico.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#272727',
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2b0d0d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EF444430',
  },
  icon: {
    fontSize: 28,
    color: '#EF4444',
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ededed',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: '#9b9b9b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorDetailBox: {
    width: '100%',
    backgroundColor: '#0f0f0f',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#272727',
  },
  errorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  btn: {
    width: '100%',
    height: 48,
    backgroundColor: '#3ECF8E',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  btnPressed: {
    backgroundColor: '#2EBF7E',
    transform: [{ scale: 0.98 }],
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f0f0f',
  },
  footer: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
  },
});
