const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://pshiqbehsouzzljbsdhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzaGlxYmVoc291enpsamJzZGhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1NjY2MSwiZXhwIjoyMDkzMjMyNjYxfQ.aKHxamQuItHVqI4EYR3B5p2lk_GVx870yybjA1Yq5Q8');

async function checkColumns() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Columns in categories:', Object.keys(data[0]));
  } else {
    console.log('No data in categories table. Checking table structure via RPC if possible...');
  }
}

checkColumns();
