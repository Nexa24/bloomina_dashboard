import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgres://postgres.pshiqbehsouzzljbsdhg:Bloomina%402026@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
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
