import pg from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = "postgres://postgres.pshiqbehsouzzljbsdhg:Bloomina%402026@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require";

async function checkDb() {
    const client = new pg.Client({ 
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        
        console.log("--- TRIGGERS ON orders & notifications TABLES ---");
        const triggersRes = await client.query(`
            SELECT 
                event_object_table,
                trigger_name,
                event_manipulation,
                action_statement,
                action_timing
            FROM information_schema.triggers
            WHERE event_object_table IN ('orders', 'notifications');
        `);
        console.log(triggersRes.rows);

        console.log("--- TRIGGER FUNCTION DEFINITION ---");
        const funcRes = await client.query(`
            SELECT prosrc 
            FROM pg_proc 
            WHERE proname = 'trg_notify_new_order';
        `);
        if (funcRes.rows.length > 0) {
            console.log(funcRes.rows[0].prosrc);
        } else {
            console.log("Function 'trg_notify_new_order' not found.");
        }

        console.log("--- NOTIFICATION FUNCTION DEFINITION ---");
        const notifFuncRes = await client.query(`
            SELECT prosrc 
            FROM pg_proc 
            WHERE proname = 'create_notification';
        `);
        if (notifFuncRes.rows.length > 0) {
            console.log(notifFuncRes.rows[0].prosrc);
        } else {
            console.log("Function 'create_notification' not found.");
        }

        console.log("--- PROFILES SAMPLE ---");
        const profilesRes = await client.query(`
            SELECT id, email, role, full_name
            FROM public.profiles
            LIMIT 5;
        `);
        console.log(profilesRes.rows);

        console.log("--- RLS POLICIES ON orders TABLE ---");
        const policiesRes = await client.query(`
            SELECT 
                policyname,
                roles,
                cmd,
                qual,
                with_check
            FROM pg_policies
            WHERE tablename = 'orders';
        `);
        console.log(policiesRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkDb();
