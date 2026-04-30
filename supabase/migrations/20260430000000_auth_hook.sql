-- Create custom access token hook to lift tenant_id to root claims
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  tenant_id text;
begin
  -- Lee tenant_id desde app_metadata y lo sube al top level
  tenant_id := event->'claims'->'app_metadata'->>'tenant_id';
  
  if tenant_id is not null then
    event := jsonb_set(event, '{claims,tenant_id}', to_jsonb(tenant_id));
  end if;
  
  return event;
end;
$$;

-- Grant access to the function
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to authenticator;
