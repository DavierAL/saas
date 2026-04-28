import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';

/**
 * Factory to create a Supabase client with custom options.
 * Useful for mobile (AsyncStorage) or server-side usage.
 */
export const createSupabaseClient = (
  url: string,
  key: string,
  options?: SupabaseClientOptions<'public'>
): SupabaseClient => createClient(url, key, options);

/**
 * Resolves an env variable across different environments:
 * - Expo/React Native: process.env.EXPO_PUBLIC_*
 * - Vite/Web:          import.meta.env.VITE_*
 * - Node/Server:       process.env.*
 */
const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return (process.env[key] as string).trim();
  }

  const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
  if (!isReactNative) {
    try {
      // @ts-ignore - Safe access for Vite/Web environments
      const metaEnv = (import.meta as any).env;
      if (metaEnv && metaEnv[key]) {
        return (metaEnv[key] as string).trim();
      }
    } catch (_e) {
      // import.meta may be unavailable in some environments (Hermes)
    }
  }

  return '';
};

/**
 * Resolves Supabase env vars with priority:
 *   1. EXPO_PUBLIC_*  (mobile / React Native)
 *   2. VITE_*         (web / Vite)
 *   3. raw key        (server / Node)
 */
const getSupabaseEnv = (key: string): string =>
  getEnv(`EXPO_PUBLIC_${key}`) || getEnv(`VITE_${key}`) || getEnv(key);

/**
 * Lazy singleton — created only on first access.
 *
 * Why lazy? In Expo/React Native, `process.env.EXPO_PUBLIC_*` vars are
 * injected by Metro at bundle time. If this module initializes eagerly
 * (top-level), the vars aren't yet available and Supabase throws
 * "supabaseUrl is required", crashing every route at startup.
 *
 * Using a Proxy lets us defer initialization until the client is actually
 * used (e.g., `supabase.auth.signIn(...)`), by which time Metro has
 * already replaced all `process.env.*` references with their real values.
 */
let _supabaseInstance: SupabaseClient | null = null;

const getOrCreateSupabase = (): SupabaseClient => {
  if (_supabaseInstance) return _supabaseInstance;

  const supabaseUrl     = getSupabaseEnv('SUPABASE_URL');
  const supabaseAnonKey = getSupabaseEnv('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('[Supabase] Missing env vars. Check .env.local and ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.');
  }

  console.log(`[Supabase] Initializing client → ${supabaseUrl.split('.')[0]}...`);
  _supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  return _supabaseInstance;
};

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    return (getOrCreateSupabase() as any)[prop];
  },
});
