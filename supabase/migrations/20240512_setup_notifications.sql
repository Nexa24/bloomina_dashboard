-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'order', 'lead', 'system', 'inventory'
    title TEXT NOT NULL,
    body TEXT,
    read BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for authenticated users" ON notifications
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON notifications
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON notifications
    FOR DELETE USING (auth.role() = 'authenticated');

-- Function to create a notification (can be called from triggers or manually)
CREATE OR REPLACE FUNCTION create_notification(
    p_type TEXT,
    p_title TEXT,
    p_body TEXT,
    p_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO notifications (type, title, body, data)
    VALUES (p_type, p_title, p_body, p_data)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for New Orders
CREATE OR REPLACE FUNCTION trg_notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        'order',
        '🛒 New Order #' || UPPER(SUBSTRING(NEW.id::text FROM 1 FOR 8)),
        'Customer ' || COALESCE(NEW.customer_name, 'Unknown') || ' placed an order for ₹' || NEW.total,
        jsonb_build_object('order_id', NEW.id, 'total', NEW.total, 'customer', NEW.customer_name)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS on_order_created ON orders;
CREATE TRIGGER on_order_created
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trg_notify_new_order();

-- Trigger for New Leads
CREATE OR REPLACE FUNCTION trg_notify_new_lead()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        'lead',
        '📧 New Inquiry',
        'New lead from ' || COALESCE(NEW.name, 'Unknown') || ' regarding ' || COALESCE(NEW.type, 'General Inquiry'),
        jsonb_build_object('lead_id', NEW.id, 'name', NEW.name, 'subject', NEW.type)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_lead_created ON leads;
CREATE TRIGGER on_lead_created
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION trg_notify_new_lead();

-- Trigger for Low Stock
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

DROP TRIGGER IF EXISTS on_product_stock_change ON products;
CREATE TRIGGER on_product_stock_change
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION trg_notify_low_stock();

-- Enable Realtime
ALTER TABLE notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
END $$;
