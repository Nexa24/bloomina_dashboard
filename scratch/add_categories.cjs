const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://pshiqbehsouzzljbsdhg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzaGlxYmVoc291enpsamJzZGhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY1NjY2MSwiZXhwIjoyMDkzMjMyNjYxfQ.aKHxamQuItHVqI4EYR3B5p2lk_GVx870yybjA1Yq5Q8');

async function add() {
    const cats = [
        { name: 'Bras', slug: 'bras' },
        { name: 'Panties', slug: 'panties' },
        { name: 'Bestsellers', slug: 'bestsellers' },
        { name: 'Combo Packs', slug: 'combo-packs' },
        { name: 'Luxe', slug: 'luxe' }
    ];
    const { data, error } = await supabase.from('categories').insert(cats);
    if (error) console.error(error);
    else console.log('Categories added successfully');
}

add();
