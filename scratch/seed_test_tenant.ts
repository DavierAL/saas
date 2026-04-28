import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Cargar env de apps/mobile para obtener las keys
dotenv.config({ path: path.resolve(process.cwd(), 'apps/mobile/.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Faltan variables de entorno en apps/mobile/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('🚀 Iniciando creación de tenant de prueba: Bodega Don Pepe');

  // 1. Crear Tenant
  const { data: tenant, error: tError } = await supabase
    .from('tenants')
    .insert({
      name: 'Bodega Don Pepe',
      industry_type: 'retail',
      currency: 'PEN',
      modules_config: { has_tables: false, has_inventory: true, has_appointments: false }
    })
    .select()
    .single();

  if (tError) {
    console.error('Error creando tenant:', tError);
    return;
  }

  console.log('✅ Tenant creado:', tenant.id);

  // 2. Crear Usuario en Auth (Admin API)
  const email = 'donpepe@saas.com';
  const password = 'password123';
  
  const { data: authUser, error: aError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { tenant_id: tenant.id, role: 'admin' }
  });

  if (aError) {
    console.error('Error creando usuario auth:', aError);
  } else {
    console.log('✅ Usuario auth creado:', email);
  }

  // 3. Crear Usuario en la tabla public.users
  const { error: uError } = await supabase
    .from('users')
    .insert({
      id: authUser.user?.id,
      tenant_id: tenant.id,
      email,
      role: 'admin'
    });

  if (uError) console.error('Error creando usuario public:', uError);

  // 4. Crear Items (Inventario)
  const items = [
    { name: 'Arroz Extra (1kg)', price: 450, stock: 50, type: 'product', tenant_id: tenant.id },
    { name: 'Leche Gloria (400g)', price: 420, stock: 100, type: 'product', tenant_id: tenant.id },
    { name: 'Aceite Primor (1L)', price: 850, stock: 20, type: 'product', tenant_id: tenant.id },
    { name: 'Azúcar Rubia (1kg)', price: 380, stock: 60, type: 'product', tenant_id: tenant.id },
    { name: 'Coca Cola (1.5L)', price: 550, stock: 24, type: 'product', tenant_id: tenant.id },
  ];

  const { data: createdItems, error: iError } = await supabase
    .from('items')
    .insert(items)
    .select();

  if (iError) {
    console.error('Error creando items:', iError);
    return;
  }
  console.log('✅ Items de inventario creados');

  // 5. Simular Facturación (~5000 PEN)
  // Necesitamos ~160 soles diarios aprox.
  // Vamos a crear órdenes para los últimos 30 días
  console.log('⏳ Generando historial de ventas (30 días)...');
  
  const orders = [];
  const orderLines = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Entre 3 y 8 órdenes por día
    const ordersPerDay = Math.floor(Math.random() * 5) + 3;
    
    for (let j = 0; j < ordersPerDay; j++) {
      const orderId = crypto.randomUUID();
      let totalAmount = 0;
      
      // Cada orden tiene 1-4 productos
      const linesCount = Math.floor(Math.random() * 4) + 1;
      for (let k = 0; k < linesCount; k++) {
        const item = createdItems[Math.floor(Math.random() * createdItems.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const subtotal = item.price * qty;
        
        orderLines.push({
          order_id: orderId,
          item_id: item.id,
          quantity: qty,
          unit_price: item.price,
          subtotal: subtotal,
          tenant_id: tenant.id
        });
        
        totalAmount += subtotal;
      }

      orders.push({
        id: orderId,
        tenant_id: tenant.id,
        user_id: authUser.user?.id,
        status: 'paid',
        total_amount: totalAmount,
        created_at: date.toISOString(),
        currency: 'PEN'
      });
    }
  }

  // Insertar en batches
  const { error: oError } = await supabase.from('orders').insert(orders);
  if (oError) console.error('Error insertando órdenes:', oError);
  
  const { error: olError } = await supabase.from('order_lines').insert(orderLines);
  if (olError) console.error('Error insertando líneas de orden:', olError);

  const totalCalculated = orders.reduce((acc, curr) => acc + curr.total_amount, 0) / 100;
  console.log(`✨ ¡Listo! Facturación total simulada: S/ ${totalCalculated.toFixed(2)}`);
  console.log(`📧 Credenciales: ${email} / ${password}`);
}

seed();
