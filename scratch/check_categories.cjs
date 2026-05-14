const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://pshiqbehsouzzljbsdhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzaGlxYmVoc291enpsamJzZGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTY2NjEsImV4cCI6MjA5MzIzMjY2MX0.UZUdw_e7zsS6WYCUn8Fkl1vRbzaQJ2pAYycCkjELC7Y');

async function check() {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

check();
