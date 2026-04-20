/**
 * Supabase client for React Native (Expo).
 * Uses AsyncStorage as the auth session storage adapter.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSupabaseClient } from '@saas-pos/db';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (__DEV__ && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  console.warn('[Supabase] Missing env vars. Check .env.local');
}

export const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type SupabaseSession = Awaited<
  ReturnType<typeof supabase.auth.getSession>
>['data']['session'];
