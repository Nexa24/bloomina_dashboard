import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

const connectionString = databaseUrl;

async function run() {
    const client = new pg.Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL database successfully.');

        // Alter foreign key constraint on products to set size_guide_id to NULL on delete
        const sql = `
            ALTER TABLE public.products 
            DROP CONSTRAINT IF EXISTS products_size_guide_id_fkey;

            ALTER TABLE public.products 
            ADD CONSTRAINT products_size_guide_id_fkey 
            FOREIGN KEY (size_guide_id) 
            REFERENCES public.size_guides(id) 
            ON DELETE SET NULL;
        `;

        await client.query(sql);
        console.log('SQL command executed successfully. size_guide_id foreign key constraint updated to ON DELETE SET NULL.');
    } catch (err) {
        console.error('Error executing query:', err);
    } finally {
        await client.end();
    }
}

run();
