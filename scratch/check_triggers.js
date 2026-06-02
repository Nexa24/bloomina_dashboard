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

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = databaseUrl;

async function checkDb() {
    const client = new pg.Client({ 
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        
        console.log("--- TRIGGERS ON orders & notifications TABLES ---");
        const triggersRes = await client.query(`
            SELECT 
                event_object_table,
                trigger_name,
                event_manipulation,
                action_statement,
                action_timing
            FROM information_schema.triggers
            WHERE event_object_table IN ('orders', 'notifications');
        `);
        console.log(triggersRes.rows);

        console.log("--- TRIGGER FUNCTION DEFINITION ---");
        const funcRes = await client.query(`
            SELECT prosrc 
            FROM pg_proc 
            WHERE proname = 'trg_notify_new_order';
        `);
        if (funcRes.rows.length > 0) {
            console.log(funcRes.rows[0].prosrc);
        } else {
            console.log("Function 'trg_notify_new_order' not found.");
        }

        console.log("--- NOTIFICATION FUNCTION DEFINITION ---");
        const notifFuncRes = await client.query(`
            SELECT prosrc 
            FROM pg_proc 
            WHERE proname = 'create_notification';
        `);
        if (notifFuncRes.rows.length > 0) {
            console.log(notifFuncRes.rows[0].prosrc);
        } else {
            console.log("Function 'create_notification' not found.");
        }

        console.log("--- PROFILES SAMPLE ---");
        const profilesRes = await client.query(`
            SELECT id, email, role, full_name
            FROM public.profiles
            LIMIT 5;
        `);
        console.log(profilesRes.rows);

        console.log("--- RLS POLICIES ON orders TABLE ---");
        const policiesRes = await client.query(`
            SELECT 
                policyname,
                roles,
                cmd,
                qual,
                with_check
            FROM pg_policies
            WHERE tablename = 'orders';
        `);
        console.log(policiesRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkDb();
