const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function listTables() {
  const { data, error } = await supabase
    .from('orders') // Just a placeholder to get schema info if possible, but actually we want all tables
    .select('id')
    .limit(1);

  // Supabase JS doesn't have a direct 'list tables' RPC usually unless we created one.
  // We can try to query pg_catalog if we have permissions, but usually anon doesn't.
  // Let's just check the ones we know or suspect.
  const tables = [
    'orders', 'products', 'categories', 'profiles', 'system_config', 
    'system_logs', 'coupons', 'material_templates', 'hero_slides',
    'cart_abandonment', 'traffic_stats', 'reviews'
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`Table '${table}': Not found or error (${error.message})`);
    } else {
      console.log(`Table '${table}': Found (${count} rows)`);
    }
  }
}

listTables();
