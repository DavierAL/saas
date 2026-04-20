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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get user from token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // Extract tenant_id from user metadata (injected by our hook)
    const tenantId = user.app_metadata.tenant_id
    if (!tenantId) throw new Error('No tenant_id found in user metadata')

    // Fetch canonical valid_until from database
    const { data: tenant, error: dbError } = await supabaseClient
      .from('tenants')
      .select('valid_until')
      .eq('id', tenantId)
      .single()

    if (dbError || !tenant) throw new Error('Tenant not found')

    return new Response(
      JSON.stringify({ 
        valid_until: tenant.valid_until,
        server_time: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
