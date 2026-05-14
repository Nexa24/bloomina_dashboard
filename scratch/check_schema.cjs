const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://pshiqbehsouzzljbsdhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzaGlxYmVoc291enpsamJzZGhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1NjY2MSwiZXhwIjoyMDkzMjMyNjYxfQ.aKHxamQuItHVqI4EYR3B5p2lk_GVx870yybjA1Yq5Q8');

async function checkSchema() {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) console.error(error);
    else {
        console.log('Columns:', Object.keys(data[0] || {}));
        console.log('Sample Row:', JSON.stringify(data[0], null, 2));
    }
}

checkSchema();
