import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useAuth } from '../src/providers/AppProvider';
import { ToastProvider } from '../src/providers/ToastProvider';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

import { colors } from '@saas-pos/ui';

// ─── Root Layout ──────────────────────────────────────────────
function RootContent() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Si no hay sesión y no estamos en auth, redirigir a login
      router.replace('/(auth)/login');
    }
    // No redirigimos al inicio si hay sesión porque app/index.tsx ya maneja el flujo de carga (DB y sync).
  }, [session, isLoading, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg.base },
        headerTintColor: colors.text.primary,
        headerTitleStyle: { fontWeight: '600', fontSize: 16 },
        contentStyle: { backgroundColor: colors.bg.base },
      }}
    >
      {/* Screens are defined. Navigation is handled by redirects in individual screens. */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="paywall" options={{
        title: 'Suscripción',
        headerStyle: { backgroundColor: '#0f0f0f' },
        headerTintColor: '#ededed',
      }} />
    </Stack>
  );
}

function RootLayout() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <ToastProvider>
          <StatusBar style="light" />
          <RootContent />
        </ToastProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default RootLayout;
