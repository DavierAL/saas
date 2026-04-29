import { useRouter } from 'expo-router';
import { useAuth } from '../src/providers/AppProvider';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@saas-pos/ui';
import { useEffect } from 'react';

/**
 * Root Index — Redirige automáticamente al grupo (tabs) o (auth).
 * Usamos useEffect para asegurar que el Navigator esté montado.
 */
export default function RootIndex() {
  const { session, isLoading, isDbReady, tenantId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si no hay sesión, vamos al login
    if (!isLoading && !session) {
      router.replace('/(auth)/login');
      return;
    }

    // Si hay sesión y el tenant está listo, vamos a las tabs
    if (!isLoading && session && isDbReady) {
      const t = setTimeout(() => {
        router.replace('/(tabs)');
      }, 0);
      return () => clearTimeout(t);
    }
  }, [session, isLoading, isDbReady, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.base }}>
      <ActivityIndicator color={colors.accent.green} />
    </View>
  );
}
