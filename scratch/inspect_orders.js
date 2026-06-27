const { Client } = require('pg');

const connectionString = "postgres://postgres.pshiqbehsouzzljbsdhg:Bloomina%402026@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const res = await client.query("SELECT * FROM orders LIMIT 1");
    console.log("Order structure:", JSON.stringify(res.rows[0], null, 2));
    
    // Also get distinct status and payment status values
    const statusRes = await client.query("SELECT DISTINCT status FROM orders");
    console.log("Unique statuses:", statusRes.rows);
    
    // Check columns
    const colsRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'");
    console.log("Columns in orders:", colsRes.rows.map(r => r.column_name));
    
    // Try to get payment status
    try {
      const paymentStatusRes = await client.query("SELECT DISTINCT payment_status FROM orders");
      console.log("Unique payment statuses (payment_status):", paymentStatusRes.rows);
    } catch (e) {
      console.log("payment_status column query failed:", e.message);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
