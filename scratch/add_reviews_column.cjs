const { Client } = require('pg');
const connectionString = "postgres://postgres.pshiqbehsouzzljbsdhg:Bloomina%402026@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    // Add the column show_on_home to reviews table
    await client.query("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN DEFAULT false");
    console.log("Column 'show_on_home' successfully added to 'reviews' table.");
    
    // Seed some reviews to show_on_home = true by default to populate the homepage immediately
    await client.query("UPDATE reviews SET show_on_home = true WHERE rating >= 4");
    console.log("High-rating reviews seeded for homepage display.");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
main();
