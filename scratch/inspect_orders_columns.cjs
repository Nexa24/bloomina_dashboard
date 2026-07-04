const { Client } = require('pg');
const connectionString = "postgres://postgres.pshiqbehsouzzljbsdhg:Bloomina%402026@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'");
    console.log("Columns of orders table:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
main();
