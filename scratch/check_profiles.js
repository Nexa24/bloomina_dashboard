
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pshiqbehsouzzljbsdhg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzaGlxYmVoc291enpsamJzZGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTY2NjEsImV4cCI6MjA5MzIzMjY2MX0.UZUdw_e7zsS6WYCUn8Fkl1vRbzaQJ2pAYycCkjELC7Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProfiles() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Profiles columns:', Object.keys(data[0] || {}));
        console.log('First row:', data[0]);
    }
}

checkProfiles();
