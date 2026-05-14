-- SQL for creating a webhook that triggers the Telegram notification
-- Run this in your Supabase SQL Editor

-- 1. Ensure the webhook extension is enabled (usually is by default)
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- 2. Create a function to handle the trigger (if not using the Webhooks UI)
-- Note: It's usually easier to use the "Database -> Webhooks" UI in the dashboard.
-- But if you prefer SQL:

/*
CREATE OR REPLACE FUNCTION notify_telegram_on_order()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://brhjzpzdlkbqhtaqoyjw.supabase.co/functions/v1/telegram-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body := json_build_object('record', row_to_json(NEW))::jsonb
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_created_telegram
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_telegram_on_order();
*/

-- IMPORTANT: It is highly recommended to use the Supabase Dashboard UI for Webhooks 
-- to avoid hardcoding SERVICE_ROLE_KEYS in your SQL migrations.
