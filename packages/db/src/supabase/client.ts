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
 * Singleton instance for Web usage.
 * It attempts to read environment variables from Vite (import.meta.env), 
 * Deno (Deno.env), or Node (process.env).
 */
const getEnv = (key: string): string => {
  // 1. Check process.env (Standard for Node, React Native, Expo)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return (process.env[key] as string).trim();
  }

  // 2. Safely check for Web environment before accessing import.meta
  const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
  
  if (!isReactNative) {
    try {
      // @ts-ignore - Safe access for Vite/Web environments
      const metaEnv = (import.meta as any).env;
      if (metaEnv && metaEnv[key]) {
        return (metaEnv[key] as string).trim();
      }
    } catch (e) {
      // import.meta is a syntax error in some environments (like older Hermes)
    }
  }

  return '';
};

const getSupabaseEnv = (key: string): string => {
  return getEnv(`VITE_${key}`) || getEnv(`EXPO_PUBLIC_${key}`) || getEnv(key);
};

const supabaseUrl = getSupabaseEnv('SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseAnonKey = getSupabaseEnv('SUPABASE_ANON_KEY') || 'placeholder';

// Diagnostic logging for development — only log if we are NOT using a placeholder
// or if we explicitly want to debug.
if (supabaseUrl.includes('placeholder')) {
  // Silent placeholder in library mode to avoid confusing consumers who pass their own client
} else {
  console.log(`[Supabase] Initializing client with project URL: ${supabaseUrl.split('.')[0]}...`);
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
