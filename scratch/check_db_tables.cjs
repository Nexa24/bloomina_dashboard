const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envPath = path.resolve(__dirname, '../.env');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
    });
    return env;
}

const env = getEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not found in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Checking tables...');
    
    // Check materials
    const { data: materials, error: matError } = await supabase.from('materials').select('id, name');
    if (matError) console.error('Materials error:', matError.message);
    else console.log(`Found ${materials.length} materials.`);

    // Check size_guides
    const { data: guides, error: guideError } = await supabase.from('size_guides').select('id, name');
    if (guideError) {
        if (guideError.message.includes('relation "public.size_guides" does not exist')) {
            console.log('--- size_guides table is MISSING. ---');
        } else {
            console.error('Size guides error:', guideError.message);
        }
    } else {
        console.log(`Found ${guides.length} size guides.`);
    }
}

checkTables();
