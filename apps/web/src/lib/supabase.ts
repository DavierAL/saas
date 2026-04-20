import { createSupabaseClient } from '@saas-pos/db';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in apps/web/.env.local');
}

export const supabase = createSupabaseClient(url, key);