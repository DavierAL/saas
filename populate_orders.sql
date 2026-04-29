-- Orders for Bodega Don Pepe
-- Tenant ID: d86874dd-0418-4cf6-929c-0afe3cee82f9
-- User ID: 2183738d-3d70-49c7-aaa3-b6ac765cafc2

DO $$
DECLARE
    tid uuid := 'd86874dd-0418-4cf6-929c-0afe3cee82f9';
    uid uuid := '2183738d-3d70-49c7-aaa3-b6ac765cafc2';
    oid uuid;
BEGIN
    -- Order 1: Breakfast items
    oid := extensions.uuid_generate_v4();
    INSERT INTO orders (id, tenant_id, user_id, status, total_amount, created_at)
    VALUES (oid, tid, uid, 'paid', 1720, now() - interval '8 hours');
    INSERT INTO order_lines (order_id, item_id, quantity, unit_price, subtotal, tenant_id)
    VALUES (oid, 'bcbf6359-daae-4231-b08f-ad1e49f3c625', 2, 420, 840, tid), -- Leche
           (oid, '8185f06f-2abc-41d9-95cb-04f7d62f42e0', 1, 950, 950, tid); -- Pan

    -- Order 2: Basics
    oid := extensions.uuid_generate_v4();
    INSERT INTO orders (id, tenant_id, user_id, status, total_amount, created_at)
    VALUES (oid, tid, uid, 'paid', 1280, now() - interval '7 hours');
    INSERT INTO order_lines (order_id, item_id, quantity, unit_price, subtotal, tenant_id)
    VALUES (oid, 'd3870611-0bdb-4473-a1ba-e4ccc137f07d', 2, 450, 900, tid), -- Arroz
           (oid, '01796f47-4d4f-4097-89d1-0c8e7ad1cc3e', 1, 380, 380, tid); -- Azúcar

    -- Order 3: Lunch prep
    oid := extensions.uuid_generate_v4();
    INSERT INTO orders (id, tenant_id, user_id, status, total_amount, created_at)
    VALUES (oid, tid, uid, 'paid', 2150, now() - interval '6 hours');
    INSERT INTO order_lines (order_id, item_id, quantity, unit_price, subtotal, tenant_id)
    VALUES (oid, '36af38f1-dc80-4a1d-bfdf-1871a9a4a3c5', 1, 1150, 1150, tid), -- Aceite
           (oid, '4e870b1d-638c-4256-b741-8f60a416c739', 2, 320, 640, tid), -- Fideos
           (oid, '20a12951-fdde-432f-98d6-c5bc83b8e5a4', 2, 180, 360, tid); -- Sal

    -- Order 4: Snacks
    oid := extensions.uuid_generate_v4();
    INSERT INTO orders (id, tenant_id, user_id, status, total_amount, created_at)
    VALUES (oid, tid, uid, 'paid', 850, now() - interval '5 hours');
    INSERT INTO order_lines (order_id, item_id, quantity, unit_price, subtotal, tenant_id)
    VALUES (oid, 'bc446697-345e-4b22-a200-f4c8ecd0c1ad', 1, 650, 650, tid), -- Coca Cola
           (oid, '2712f8cd-1572-4457-8949-42e8d3d7b1df', 1, 200, 200, tid); -- Sublime

    -- Order 5: Cleaning
    oid := extensions.uuid_generate_v4();
    INSERT INTO orders (id, tenant_id, user_id, status, total_amount, created_at)
    VALUES (oid, tid, uid, 'paid', 2450, now() - interval '4 hours');
    INSERT INTO order_lines (order_id, item_id, quantity, unit_price, subtotal, tenant_id)
    VALUES (oid, '0a150684-9097-4c27-91ac-d1ee336dd2b1', 1, 450, 450, tid), -- Detergente
           (oid, '3c2ff31d-e1ec-4c0a-884b-28f2a1b7a2f3', 1, 1450, 1450, tid), -- Shampoo
           (oid, '9d952229-c20a-4c9b-a116-1b0a125787c8', 1, 550, 550, tid); -- Limpia todo

    -- ... and 10 more small orders to reach ~200
    -- Total so far: 1720 + 1280 + 2150 + 850 + 2450 = 8450 (84.50 PEN)
    -- Need ~11550 more.

    FOR i IN 1..10 LOOP
        oid := extensions.uuid_generate_v4();
        INSERT INTO orders (id, tenant_id, user_id, status, total_amount, created_at)
        VALUES (oid, tid, uid, 'paid', 1155, now() - (interval '1 hour' * (i % 4 + 1)));
        INSERT INTO order_lines (order_id, item_id, quantity, unit_price, subtotal, tenant_id)
        VALUES (oid, '8546469a-a8d4-4333-acbe-915f12c6ab67', 2, 100, 200, tid), -- Galletas
               (oid, 'ae88aba4-8140-4927-bc10-d6d43808d952', 1, 650, 650, tid), -- Inca Kola
               (oid, 'd5538566-fdab-41a0-9c57-60e4f6cca79a', 1, 350, 350, tid); -- Encendedor (total 1200, close enough to 1155)
    END LOOP;
END $$;
