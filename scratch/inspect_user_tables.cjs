const { Client } = require('pg');

const connectionString = "postgres://postgres.pshiqbehsouzzljbsdhg:Bloomina%402026@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const profilesCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'");
    console.log("Profiles columns:", profilesCols.rows.map(r => r.column_name));
    
    const usersCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    console.log("Users columns:", usersCols.rows.map(r => r.column_name));

    // Sample select from profiles
    const profileRes = await client.query("SELECT * FROM profiles LIMIT 1");
    console.log("Profile sample:", profileRes.rows[0]);

    // Sample select from users
    try {
      const userRes = await client.query("SELECT * FROM users LIMIT 1");
      console.log("User sample:", userRes.rows[0]);
    } catch (e) {
      console.log("Users table select failed:", e.message);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
