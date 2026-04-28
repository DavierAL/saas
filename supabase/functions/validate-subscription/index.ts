import { serve } from "http/server.ts"
import { createClient } from "supabase"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('[ValidateSubscription] Request received. Version: 7');
    console.log('[ValidateSubscription] Auth header present:', !!authHeader);

    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('[ValidateSubscription] Env check - URL:', !!supabaseUrl, 'Anon:', !!supabaseAnonKey, 'Service:', !!serviceKey);

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Internal server configuration error: Missing base Supabase env vars');
    }

    // 1. User Client: For validating the caller's identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, { 
      global: { headers: { Authorization: authHeader } } 
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error('[ValidateSubscription] Auth error:', authError?.message || 'No user found');
      throw new Error(`Unauthorized: ${authError?.message || 'Session invalid'}`);
    }

    // 2. Admin Client: For administrative tasks
    if (!serviceKey) {
      console.error('[ValidateSubscription] Missing SERVICE_ROLE_KEY');
      throw new Error('Internal server configuration error: Missing service role key');
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Extract tenant_id (checking all possible metadata locations)
    const tenantId = user.app_metadata?.tenant_id ||
      user.user_metadata?.tenant_id ||
      (user as any).tenant_id ||
      user.user_metadata?.sub;

    console.log('[ValidateSubscription] Extracted tenantId:', tenantId, 'for user:', user.email);
    console.log('[ValidateSubscription] Metadata dump:', JSON.stringify({
      app: user.app_metadata,
      user: user.user_metadata
    }));

    if (!tenantId) {
      throw new Error('No tenant_id found in user profile or metadata');
    }

    // Fetch canonical valid_until from database using adminClient
    const { data: tenant, error: dbError } = await adminClient
      .from('tenants')
      .select('valid_until')
      .eq('id', tenantId)
      .single();

    if (dbError || !tenant) {
      console.error('[ValidateSubscription] DB error for tenant', tenantId, ':', dbError?.message || 'Tenant not found');
      throw new Error(`Tenant validation failed: ${dbError?.message || 'Tenant record missing'}`);
    }

    console.log('[ValidateSubscription] Found tenant. valid_until:', tenant.valid_until);

    return new Response(
      JSON.stringify({
        valid_until: tenant.valid_until,
        server_time: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[ValidateSubscription] Catch error:', error.message);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Unknown error',
        details: error?.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
})
