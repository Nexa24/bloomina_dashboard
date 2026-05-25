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

async function test() {
    console.log("Attempting to insert test order...");
    const orderRow = {
        status: 'Processing',
        customer_name: 'Test Manual Order',
        email: 'test@example.com',
        phone: '1234567890',
        subtotal: 1,
        discount_amount: 0,
        shipping_cost: 0,
        total: 1,
        items: [
            {
                id: '351569e3-256d-454c-81da-d980f20a4f65',
                size: '34C',
                color: 'Black',
                image: '',
                price: 1,
                title: 'Essential Daily Cotton Bra',
                quantity: 1
            }
        ],
        shipping_address: {
            street: '123 Test St',
            city: 'Kozhikode',
            state: 'Kerala',
            zip: '673008',
            country: 'India'
        },
        payment_method: 'COD',
        created_at: new Date().toISOString()
    };

    try {
        const { data, error } = await supabase
            .from('orders')
            .insert([orderRow])
            .select()
            .single();
        
        if (error) {
            console.error('Supabase returned error:', error);
        } else {
            console.log('Insert succeeded! Data:', data);
        }
    } catch (e) {
        console.error('Catch block error:', e);
    }
}

test();
