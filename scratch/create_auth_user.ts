import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function createAuthUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'donpepe.final@saas.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: { role: 'admin' }
  });

  if (error) {
    console.error('Error creating auth user:', error);
  } else {
    console.log('✅ Auth user created successfully:', data.user.id);
  }
}

createAuthUser();
