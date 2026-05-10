import { useRouter } from 'expo-router';
import { useAuth } from '../src/providers/AppProvider';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@saas-pos/ui';
import { useEffect } from 'react';

/**
 * Root Index — Redirige automáticamente al grupo (tabs) o (auth).
 * Usamos useEffect para asegurar que el Navigator esté montado.
 */
export default function RootIndex() {
  const { session, isLoading, isDbReady, hasSynced } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/(auth)/login');
      return;
    }

    if (!isLoading && session && isDbReady) {
      const t = setTimeout(() => {
        router.replace('/(tabs)');
      }, 0);
      return () => clearTimeout(t);
    }
  }, [session, isLoading, isDbReady, router]);

  const getLoadingMessage = () => {
    if (isLoading) return 'Iniciando sesión...';
    if (!isDbReady) return 'Preparando base de datos...';
    if (!hasSynced) return 'Sincronizando datos...';
    return 'Cargando...';
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.accent.green} size="large" />
      <Text style={styles.message}>{getLoadingMessage()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.base,
    gap: spacing[4],
  },
  message: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
