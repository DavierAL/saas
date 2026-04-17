import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useAuth } from '../src/providers/AppProvider';

// ─── AuthGuard ────────────────────────────────────────────────
// Runs inside AppProvider so it can access the auth context.
// Uses expo-router's useSegments to detect which route group is active.
function AuthGuard() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Still loading session — don't redirect yet

    const inAuthGroup   = segments[0] === '(auth)';
    const inPaywall     = segments[0] === 'paywall';

    if (!session && !inAuthGroup) {
      // Not logged in → force to login
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Logged in but stuck on auth screen → go to app
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments]);

  return null;
}

// ─── Root Layout ──────────────────────────────────────────────
export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <AuthGuard />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0f0f0f' },
          headerTintColor: '#ededed',
          headerTitleStyle: { fontWeight: '600', fontSize: 16 },
          contentStyle: { backgroundColor: '#0f0f0f' },
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
  );
}
