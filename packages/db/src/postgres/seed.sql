-- ============================================================
-- SaaS POS — Seed Data (Development / Staging only)
-- ============================================================

-- Demo tenant: a retail store
INSERT INTO public.tenants (id, name, industry_type, modules_config, valid_until)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Bodega Doña Rosa',
  'retail',
  '{"has_inventory": true, "has_tables": false, "has_appointments": false}',
  now() + INTERVAL '365 days'
) ON CONFLICT (id) DO NOTHING;

-- Demo items for the retail tenant
INSERT INTO public.items (id, tenant_id, type, name, price, stock) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'product', 'Coca Cola 500ml',   250,  50),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'product', 'Leche Gloria 1L',   380,  30),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'product', 'Pan de molde',      350,  20),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'product', 'Arroz Costeño 1kg', 450,  100),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'product', 'Aceite Primor 1L',  700,  25)
ON CONFLICT (id) DO NOTHING;
