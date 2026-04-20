import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useAuth } from '../src/providers/AppProvider';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

import { colors } from '@saas-pos/ui';

// ─── AuthGuard ────────────────────────────────────────────────
function AuthGuard() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Not logged in -> go to login
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Logged in + in auth group -> go to app
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments]);

  return null;
}

// ─── Root Layout ──────────────────────────────────────────────
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <StatusBar style="light" />
        <AuthGuard />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg.base },
            headerTintColor: colors.text.primary,
            headerTitleStyle: { fontWeight: '600', fontSize: 16 },
            contentStyle: { backgroundColor: colors.bg.base },
          }}
        >
          <Stack.Screen name="(tabs)"    options={{ headerShown: false }} />
          <Stack.Screen name="(auth)"    options={{ headerShown: false }} />
          <Stack.Screen name="paywall"   options={{
            title: 'Suscripción',
            headerStyle: { backgroundColor: '#0f0f0f' },
            headerTintColor: '#ededed',
          }} />
        </Stack>
      </AppProvider>
    </ErrorBoundary>
  );
}
