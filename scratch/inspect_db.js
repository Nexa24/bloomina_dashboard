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

    const notifRes = await client.query(`
      SELECT id, type, title, body, created_at
      FROM notifications
      ORDER BY created_at DESC
      LIMIT 5;
    `);

    console.log('=== Recent Notifications ===');
    notifRes.rows.forEach(r => {
      console.log(r);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

inspect();
