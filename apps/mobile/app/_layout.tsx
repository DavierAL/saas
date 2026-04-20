import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useAuth } from '../src/providers/AppProvider';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

import * as Sentry from '@sentry/react-native';

import { colors } from '@saas-pos/ui';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  debug: __DEV__, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event.
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
});

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
function RootLayout() {
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

export default Sentry.wrap(RootLayout);
