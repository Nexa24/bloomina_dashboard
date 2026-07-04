const { Client } = require('pg');
const connectionString = "postgres://postgres.pshiqbehsouzzljbsdhg:Bloomina%402026@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    // Add the column home_carousel
    await client.query("ALTER TABLE categories ADD COLUMN IF NOT EXISTS home_carousel BOOLEAN DEFAULT false");
    console.log("Column 'home_carousel' successfully added to 'categories' table.");
    
    // Seed default true values for the current carousel items to keep the fallback clean
    await client.query("UPDATE categories SET home_carousel = true WHERE slug IN ('wireless-bras', 'seamless-panties', 'lace-bras', 'bestsellers')");
    console.log("Default items successfully marked for home carousel.");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
main();
