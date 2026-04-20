import { createClient, SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js';

/**
 * Factory to create a Supabase client with custom options.
 * Useful for mobile (AsyncStorage) or server-side usage.
 */
export const createSupabaseClient = (
  url: string,
  key: string,
  options?: SupabaseClientOptions<any>
): SupabaseClient => {
  return createClient(url, key, options);
};

/**
 * Singleton instance for Web usage.
 * It attempts to read environment variables from process.env (Vite/Node)
 * Or can be used directly if environment variables are injected.
 */
const getEnv = (key: string): string => {
  // @ts-ignore - Handle different environment variable access patterns
  const env = typeof process !== 'undefined' ? process.env : (import.meta as any)?.env || {};
  return env[key] || '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'placeholder';

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
