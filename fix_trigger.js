import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgres://postgres.pshiqbehsouzzljbsdhg:Bloomina%402026@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false,
  }
});

async function fixTrigger() {
  try {
    await client.connect();
    console.log('Connected to DB');
    
    const query = `
    CREATE OR REPLACE FUNCTION trg_notify_low_stock()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Only notify if quantity tracking is on and stock drops below 5
        IF NEW."trackQuantity" = true AND NEW.stock <= 5 AND (OLD.stock > 5 OR OLD.stock IS NULL) THEN
            PERFORM create_notification(
                'inventory',
                '⚠️ Low Stock Alert',
                'Product "' || NEW.name || '" is running low (' || NEW.stock || ' remaining)',
                jsonb_build_object('product_id', NEW.id, 'name', NEW.name, 'stock', NEW.stock)
            );
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    await client.query(query);
    console.log('Trigger function updated successfully.');
  } catch (error) {
    console.error('Error executing query:', error);
  } finally {
    await client.end();
  }
}

fixTrigger();
