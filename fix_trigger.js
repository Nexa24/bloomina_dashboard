import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse .env file
const envPath = path.join(__dirname, '.env');
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

async function fixTrigger() {
  try {
    await client.connect();
    console.log('Connected to DB');
    
    const query = `
    CREATE OR REPLACE FUNCTION trg_notify_low_stock()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Only notify if quantity tracking is on and stock drops below 5
        IF NEW."trackQuantity" = true AND NEW.stock <= 5 AND (OLD.stock > 5 OR OLD.stock IS NULL) THEN
            PERFORM create_notification(
                'inventory',
                '⚠️ Low Stock Alert',
                'Product "' || NEW.name || '" is running low (' || NEW.stock || ' remaining)',
                jsonb_build_object('product_id', NEW.id, 'name', NEW.name, 'stock', NEW.stock)
            );
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    await client.query(query);
    console.log('Trigger function updated successfully.');
  } catch (error) {
    console.error('Error executing query:', error);
  } finally {
    await client.end();
  }
}

fixTrigger();
