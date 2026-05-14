-- Migration to create system configuration and logging tables
-- This allows the Admin panel to control global store settings and monitor system activity

-- 1. Create system_config table
CREATE TABLE IF NOT EXISTS public.system_config (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    description text,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Policies for system_config (Only admins should access this)
-- Assuming admin users are identified by a flag in user_metadata or a specific role
DROP POLICY IF EXISTS "Admins can manage system_config" ON public.system_config;
CREATE POLICY "Admins can manage system_config" 
ON public.system_config
FOR ALL
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR 
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);


-- 2. Insert default configuration
INSERT INTO public.system_config (key, value, description) VALUES
('storefront_status', '{"online": true, "maintenance_mode": false}', 'Current status of the public storefront'),
('backup_settings', '{"last_backup": null, "frequency": "daily"}', 'Database backup configuration'),
('webhook_stats', '{"active_endpoints": 0, "failed_today": 0}', 'Statistics for outgoing webhooks')
ON CONFLICT (key) DO NOTHING;

-- 3. Create system_logs table for auditing and real-time monitoring
CREATE TABLE IF NOT EXISTS public.system_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    level text DEFAULT 'info', -- info, warn, error, success
    source text, -- e.g., 'auth', 'orders', 'inventory', 'system'
    message text NOT NULL,
    metadata jsonb,
    user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Policies for system_logs
DROP POLICY IF EXISTS "Admins can view system_logs" ON public.system_logs;
CREATE POLICY "Admins can view system_logs" 
ON public.system_logs
FOR SELECT
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR 
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);


-- 4. Enable Realtime for logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'system_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.system_logs;
    END IF;
END $$;


-- 5. Helper function to log system events
CREATE OR REPLACE FUNCTION log_system_event(
    p_level text,
    p_source text,
    p_message text,
    p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
    INSERT INTO public.system_logs (level, source, message, metadata, user_id)
    VALUES (p_level, p_source, p_message, p_metadata, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to get real-time storage usage
-- This queries the storage.objects table to sum up file sizes
CREATE OR REPLACE FUNCTION get_storage_usage()
RETURNS bigint AS $$
DECLARE
    total_size bigint;
BEGIN
    SELECT COALESCE(SUM(octet_length(name)), 0) INTO total_size FROM storage.objects;
    -- Note: octet_length(name) is not the file size. 
    -- The real file size is in metadata->>'size'
    SELECT COALESCE(SUM((metadata->>'size')::bigint), 0) INTO total_size FROM storage.objects;
    RETURN total_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to get real-time database storage usage (tables + indexes)
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS bigint AS $$
BEGIN
    RETURN pg_database_size(current_database());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
