import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper to parse JWT safely
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const jsonPayload = decodeURIComponent(atob(padded).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn("[validate-subscription] JWT Parse Error:", e.message);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[validate-subscription] Request received");
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[validate-subscription] Missing Authorization header");
      throw new Error("Missing Authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const jwtPayload = parseJwt(token);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl) {
        console.error("[validate-subscription] Missing SUPABASE_URL");
        throw new Error("Missing SUPABASE_URL environment variable");
    }

    // [DEBUG] Check if we have a valid token
    console.log(`[validate-subscription] Authenticating user via getUser()`);
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await userClient.auth.getUser();

    if (authErr || !user) {
      console.error(`[validate-subscription] Auth Error: ${authErr?.message || "User not found"}`);
      return new Response(JSON.stringify({ error: "Unauthorized", details: authErr?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract tenant_id from JWT payload (priority) or metadata
    const tenantId = (
      jwtPayload?.tenant_id || 
      user.app_metadata?.tenant_id ||
      user.user_metadata?.tenant_id
    ) as string | undefined;

    console.log(`[validate-subscription] User: ${user.email} (${user.id}), Tenant: ${tenantId}`);

    if (!tenantId) {
      console.warn(`[validate-subscription] No tenant_id found for user ${user.id}`);
      return new Response(
        JSON.stringify({
          error: "No tenant_id found in JWT or user metadata",
          jwt_keys: Object.keys(jwtPayload || {}),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Lookup subscription using user privileges (RLS handles isolation)
    console.log(`[validate-subscription] Fetching tenant info for ${tenantId}...`);
    const { data: tenant, error: dbErr } = await userClient
      .from("tenants")
      .select("valid_until, name")
      .eq("id", tenantId)
      .maybeSingle();

    if (dbErr) {
      console.error(`[validate-subscription] DB Error: ${dbErr.message}`);
      return new Response(JSON.stringify({ error: dbErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tenant) {
      console.warn(`[validate-subscription] Tenant ${tenantId} not found`);
      return new Response(
        JSON.stringify({ error: "Tenant not found", tenantId }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[validate-subscription] Success: ${tenant.name} valid until ${tenant.valid_until}`);

    return new Response(
      JSON.stringify({
        valid_until: tenant.valid_until,
        server_time: new Date().toISOString(),
        tenant_name: tenant.name
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error(`[validate-subscription] UNCAUGHT ERROR: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

