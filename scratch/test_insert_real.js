import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse .env file
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const newOrderItems = [
    {
      productId: '351569e3-256d-454c-81da-d980f20a4f65',
      id: '351569e3-256d-454c-81da-d980f20a4f65',
      title: 'Essential Daily Cotton Bra',
      price: 1,
      quantity: 1,
      image: 'https://pshiqbehsouzzljbsdhg.supabase.co/storage/v1/object/public/product-images/color_0_1777878911469_p0cwr.jpg',
      size: '34C',
      color: 'Black'
    }
  ];

  const orderRow = {
    status: 'Payment Done',
    customer_name: 'Test Real Order',
    email: 'test_real@example.com',
    phone: '9876543211',
    subtotal: 1,
    discount_amount: 0,
    shipping_cost: 0,
    total: 1,
    items: newOrderItems,
    shipping_address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'Kerala',
      zip: '673008',
      country: 'India'
    },
    payment_method: 'WhatsApp',
    razorpay_payment_id: null,
    created_at: new Date().toISOString()
  };

  console.log('Inserting with anon client (exact frontend payload style)...');
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
