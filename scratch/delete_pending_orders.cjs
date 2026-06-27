const { Client } = require('pg');

const connectionString = "postgres://postgres.pshiqbehsouzzljbsdhg:Bloomina%402026@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    // 1. Get the count and details of the orders to delete
    const pendingOrdersRes = await client.query("SELECT id, customer_name, email, total, created_at FROM orders WHERE status = 'Payment Pending'");
    console.log(`Found ${pendingOrdersRes.rows.length} orders in 'Payment Pending' status.`);
    
    if (pendingOrdersRes.rows.length === 0) {
      console.log("No orders to delete.");
      return;
    }

    console.log("Orders to be deleted:");
    pendingOrdersRes.rows.forEach(order => {
      console.log(`- ID: ${order.id}, Customer: ${order.customer_name}, Email: ${order.email}, Total: ₹${order.total}, Created At: ${order.created_at}`);
    });

    // 2. Perform the deletion
    const deleteRes = await client.query("DELETE FROM orders WHERE status = 'Payment Pending'");
    console.log(`Successfully deleted ${deleteRes.rowCount} orders.`);
  } catch (err) {
    console.error("Error during deletion:", err);
  } finally {
    await client.end();
  }
}

main();
