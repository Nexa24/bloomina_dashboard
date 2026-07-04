const { Client } = require('pg');
const connectionString = "postgres://postgres.pshiqbehsouzzljbsdhg:Bloomina%402026@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    // Add columns to orders table
    await client.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT");
    await client.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_shipment_id TEXT");
    await client.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_status TEXT");
    console.log("Shiprocket integration columns successfully added to 'orders' table.");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
main();
