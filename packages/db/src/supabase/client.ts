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
  // @ts-ignore - Handle different environment variable access patterns
  const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) 
    || (typeof process !== 'undefined' ? process.env : {});
  const val = env[key];
  return typeof val === 'string' ? val.trim() : '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY') || 'placeholder';

// Diagnostic logging for development — only log if we are NOT using a placeholder
// or if we explicitly want to debug.
if (supabaseUrl.includes('placeholder')) {
  // Silent placeholder in library mode to avoid confusing consumers who pass their own client
} else {
  console.log(`[Supabase] Initializing client with project URL: ${supabaseUrl.split('.')[0]}...`);
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
