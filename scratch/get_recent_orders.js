import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse .env file
const envPath = path.join(__dirname, '../.env');
let databaseUrl = process.env.DATABASE_URL;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (key === 'DATABASE_URL') {
        databaseUrl = val;
      }
    }
  });
}

if (!databaseUrl) {
  console.error("Error: DATABASE_URL not configured in environment or .env file.");
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  }
});

async function inspect() {
  try {
    await client.connect();
    console.log('Connected to DB');

    const ordersRes = await client.query(`
      SELECT id, customer_name, total, status, payment_method, created_at, items
      FROM orders
      ORDER BY created_at DESC
      LIMIT 10;
    `);

    console.log('=== Recent Orders ===');
    ordersRes.rows.forEach(r => {
      console.log(r);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

inspect();
