DO $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- Dummy for now, or I can use gen_random_uuid()
    v_item_id UUID;
    v_order_id UUID;
    v_daily_total INTEGER;
    v_target_daily INTEGER := 20000; -- 200 soles
    v_current_day DATE;
    v_item_price INTEGER;
    v_qty INTEGER;
    v_subtotal INTEGER;
    v_item_count INTEGER;
BEGIN
    -- 1. Create Tenant
    INSERT INTO tenants (name, industry_type, currency, modules_config, valid_until)
    VALUES ('Bodega Don Pepe', 'retail', 'PEN', '{"has_tables": false, "has_inventory": true, "has_appointments": false}', (now() + interval '1 year'))
    RETURNING id INTO v_tenant_id;

    -- 2. Create User Profile (Dummy ID for testing)
    INSERT INTO users (id, tenant_id, email, role)
    VALUES (gen_random_uuid(), v_tenant_id, 'donpepe@saas.com', 'admin')
    RETURNING id INTO v_user_id;

    -- 3. Create 50 Items
    -- (I'll use a temporary table to store names and prices to iterate)
    CREATE TEMP TABLE tmp_items (name TEXT, price INTEGER);
    INSERT INTO tmp_items (name, price) VALUES
    ('Arroz Extra Costeño 1kg', 480), ('Arroz Superior Paisana 1kg', 420), ('Azúcar Rubia Dulfina 1kg', 390),
    ('Azúcar Blanca Cartavio 1kg', 410), ('Aceite Primor Premium 1L', 980), ('Aceite Cil 1L', 850),
    ('Leche Gloria Azul 400g', 420), ('Leche Ideal Cremosita 400g', 380), ('Fideos Don Vittorio 500g', 320),
    ('Fideos Lavaggi Canuto 500g', 280), ('Atún Real Trozos en Aceite', 650), ('Atún Fanny Grated', 520),
    ('Huevos Pardos x 12', 850), ('Pan de Molde Bimbo Grande', 1150), ('Mantequilla Gloria 200g', 780),
    ('Mermelada Gloria Fresa 200g', 550), ('Café Altomayo Instantáneo 100g', 1250), ('Té McColins 25 sobres', 350),
    ('Cocoa Winters 160g', 680), ('Avena 3 Ositos 150g', 250), ('Galletas Soda Field x 6', 450),
    ('Galletas Casino Vainilla x 6', 520), ('Gaseosa Coca Cola 1.5L', 650), ('Gaseosa Inca Kola 1.5L', 650),
    ('Agua Cielo 625ml', 150), ('Jugo Frugos Naranja 1L', 580), ('Detergente Ariel 800g', 1050),
    ('Detergente Opal 800g', 920), ('Jabón Bolívar 150g', 350), ('Jabón Protex', 420),
    ('Papel Higiénico Elite 4 rollos', 580), ('Pasta Colgate 75ml', 450), ('Shampoo H&S 180ml', 1450),
    ('Desodorante Rexona', 1850), ('Yogurt Gloria Fresa 1kg', 750), ('Queso Fresco Laive 250g', 980),
    ('Jamonada San Fernando 200g', 650), ('Sal Lobos 1kg', 180), ('Vinagre Pagoda 500ml', 250),
    ('Sillao Kikko 250ml', 480), ('Ajinomoto 100g', 350), ('Mayonesa Alacena 190g', 580),
    ('Ketchup Alacena 190g', 450), ('Mostaza Alacena 190g', 420), ('Limpiatodo Poett 900ml', 680),
    ('Lavavajilla Ayudín 400g', 550), ('Esponja Scotch-Brite', 280), ('Bolsas Basura x 10', 450),
    ('Fósforos Llamas x 10', 150), ('Velas Mágicas x 4', 350);

    INSERT INTO items (tenant_id, type, name, price, stock)
    SELECT v_tenant_id, 'product', name, price, (random() * 50 + 20)::int
    FROM tmp_items;

    -- 4. Create Orders for last 7 days
    FOR i IN 0..6 LOOP
        v_current_day := current_date - i;
        v_daily_total := 0;
        
        WHILE v_daily_total < v_target_daily LOOP
            v_order_id := gen_random_uuid();
            
            INSERT INTO orders (id, tenant_id, user_id, status, total_amount, currency, created_at)
            VALUES (v_order_id, v_tenant_id, v_user_id, 'paid', 0, 'PEN', v_current_day + (random() * interval '12 hours' + interval '8 hours'))
            RETURNING id INTO v_order_id;
            
            -- Add 1-5 lines per order
            v_item_count := floor(random() * 5 + 1);
            v_subtotal := 0;
            
            FOR j IN 1..v_item_count LOOP
                -- Select random item from this tenant
                SELECT id, price INTO v_item_id, v_item_price FROM items WHERE tenant_id = v_tenant_id ORDER BY random() LIMIT 1;
                v_qty := floor(random() * 2 + 1);
                
                INSERT INTO order_lines (order_id, item_id, quantity, unit_price, subtotal)
                VALUES (v_order_id, v_item_id, v_qty, v_item_price, v_item_price * v_qty);
                
                v_subtotal := v_subtotal + (v_item_price * v_qty);
            END LOOP;
            
            UPDATE orders SET total_amount = v_subtotal WHERE id = v_order_id;
            v_daily_total := v_daily_total + v_subtotal;
        END LOOP;
    END LOOP;

    DROP TABLE tmp_items;
    
    RAISE NOTICE 'Seed completed for tenant %', v_tenant_id;
END $$;
