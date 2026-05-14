
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pshiqbehsouzzljbsdhg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzaGlxYmVoc291enpsamJzZGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTY2NjEsImV4cCI6MjA5MzIzMjY2MX0.UZUdw_e7zsS6WYCUn8Fkl1vRbzaQJ2pAYycCkjELC7Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
    try {
        const { data, error } = await supabase.from('pg_tables').select('tablename').eq('schemaname', 'public');
        if (error) {
            // Usually pg_tables is not accessible via PostgREST.
            // Let's try a different way.
            console.log('Error querying pg_tables (expected):', error.message);
            
            // Try querying a common table to see if it exists
            const tables = ['profiles', 'users', 'admins', 'customers', 'orders', 'products'];
            for (const table of tables) {
                const { error: tableError } = await supabase.from(table).select('*').limit(0);
                if (tableError) {
                    console.log(`Table '${table}':`, tableError.message);
                } else {
                    console.log(`Table '${table}': EXISTS`);
                }
            }
        } else {
            console.log('Tables:', data.map(t => t.tablename));
        }
    } catch (err) {
        console.error('Execution error:', err);
    }
}

listTables();
