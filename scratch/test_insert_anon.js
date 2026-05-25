import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pshiqbehsouzzljbsdhg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzaGlxYmVoc291enpsamJzZGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTY2NjEsImV4cCI6MjA5MzIzMjY2MX0.UZUdw_e7zsS6WYCUn8Fkl1vRbzaQJ2pAYycCkjELC7Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const orderRow = {
    status: 'Processing',
    customer_name: 'Test Manual Order',
    email: 'test@example.com',
    phone: '9876543210',
    subtotal: 1,
    discount_amount: 0,
    shipping_cost: 0,
    total: 1,
    items: [],
    shipping_address: {},
    payment_method: 'COD',
    created_at: new Date().toISOString()
  };

  console.log('Inserting with anon client...');
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderRow])
      .select();

    if (error) {
      console.error('Error inserting:', error);
    } else {
      console.log('Success! Data returned:', data);
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

testInsert();
