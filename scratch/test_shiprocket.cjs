const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgres://postgres.pshiqbehsouzzljbsdhg:Bloomina%402026@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

function loadEnv() {
  const env = {};
  const paths = [
    path.resolve(__dirname, '../../Bloomina/.env'),
    path.resolve(__dirname, '../../Bloomina/.env.local'),
    path.resolve(__dirname, '../.env')
  ];

  for (const envPath of paths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed) return;
        const index = trimmed.indexOf('=');
        if (index > 0) {
          const key = trimmed.slice(0, index).trim();
          let value = trimmed.slice(index + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
      });
    }
  }
  return env;
}

const config = loadEnv();

async function attemptLogin(email, password) {
  console.log(`Attempting authentication for email: "${email}"...`);
  const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data.token;
}

async function testConnection() {
  const pgClient = new Client({ connectionString });
  await pgClient.connect();
  
  try {
    const password = config.SHIPROCKET_PASSWORD;
    if (!password) {
      throw new Error('SHIPROCKET_PASSWORD is missing in the .env file.');
    }

    let token = null;
    const emailsToTry = [config.SHIPROCKET_EMAIL, config.APi_EMAIL, 'admin@bloomina.in'].filter(Boolean);
    
    // Try unique emails only
    const uniqueEmails = [...new Set(emailsToTry)];

    for (const email of uniqueEmails) {
      try {
        token = await attemptLogin(email, password);
        console.log(`SUCCESS! Authenticated successfully using email: "${email}"`);
        break;
      } catch (err) {
        console.log(`Failed for "${email}": ${err.message}`);
      }
    }

    if (!token) {
      console.log("\nFAILED: Could not authenticate with any of the emails using the provided password.");
      return;
    }

    console.log("\n2. Finding a test order in the database...");
    const orderRes = await pgClient.query("SELECT id, customer_name, total, items, shipping_address, created_at, payment_method, email, phone FROM orders LIMIT 1");
    
    if (orderRes.rows.length === 0) {
      console.log("No orders found in database. Place a test order first.");
      return;
    }
    
    const order = orderRes.rows[0];
    console.log(`Found order ID: ${order.id} for customer "${order.customer_name}"`);

    // Map items
    const orderItems = (order.items || []).map((item) => ({
      name: item.name || 'Product Item',
      sku: item.sku || `SKU-${item.product_id || 'PROD'}`,
      units: item.quantity || 1,
      selling_price: item.price || 0,
      discount: 0,
      tax: 0,
    }));

    const payload = {
      order_id: order.id,
      order_date: new Date(order.created_at).toISOString().split('T')[0],
      pickup_location: config.SHIPROCKET_PICKUP_LOCATION_NAME || 'Primary Warehouse',
      billing_customer_name: order.customer_name.split(' ')[0] || 'Customer',
      billing_last_name: order.customer_name.split(' ').slice(1).join(' ') || 'Name',
      billing_address: order.shipping_address.street || 'Test Address',
      billing_city: order.shipping_address.city || 'Delhi',
      billing_pincode: order.shipping_address.zip || '110001',
      billing_state: order.shipping_address.state || 'Delhi',
      billing_country: 'India',
      billing_email: order.email || 'support@bloomina.in',
      billing_phone: order.phone || '9999999999',
      shipping_is_billing: true,
      order_items: orderItems.length > 0 ? orderItems : [{ name: 'Test Product', sku: 'TEST-SKU', units: 1, selling_price: 100 }],
      payment_method: order.payment_method === 'COD' ? 'COD' : 'Prepaid',
      sub_total: order.total,
      length: 15,
      breadth: 15,
      height: 10,
      weight: 0.3,
    };

    console.log("\n3. Sending check to Shiprocket order creation API...");
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    console.log("\nShiprocket Response:", JSON.stringify(result, null, 2));
    
    if (res.ok) {
      console.log("\nSUCCESS! Shiprocket connection is active and fully functional!");
    } else {
      console.log("\nFAILED: Shiprocket rejected the payload. Review the error response above.");
    }

  } catch (err) {
    console.error("\nError during Shiprocket test:", err.message);
  } finally {
    await pgClient.end();
  }
}

testConnection();
