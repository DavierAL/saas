import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useAuth } from '../src/providers/AppProvider';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

import { colors } from '@saas-pos/ui';

// ─── Root Layout ──────────────────────────────────────────────
function RootContent() {
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
        <StatusBar style="light" />
        <RootContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default RootLayout;
