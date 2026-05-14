
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pshiqbehsouzzljbsdhg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzaGlxYmVoc291enpsamJzZGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTY2NjEsImV4cCI6MjA5MzIzMjY2MX0.UZUdw_e7zsS6WYCUn8Fkl1vRbzaQJ2pAYycCkjELC7Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
    try {
        const { data, error } = await supabase.from('users').select('*').limit(1);
        if (error) {
            console.error('Error:', error);
        } else {
            if (data && data.length > 0) {
                console.log('Users columns:', Object.keys(data[0]));
                console.log('First row sample:', JSON.stringify(data[0], null, 2));
            } else {
                console.log('No data found in users table.');
            }
        }
    } catch (err) {
        console.error('Execution error:', err);
    }
}

checkUsers();
