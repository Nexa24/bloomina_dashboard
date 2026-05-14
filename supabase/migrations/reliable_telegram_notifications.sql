
-- 1. Enable Http extension for reliable server-side notifications
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- 2. Create the contact_messages table if it's missing
CREATE TABLE IF NOT EXISTS contact_messages (
    id bigserial PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    subject text,
    message text NOT NULL,
    notified_telegram boolean DEFAULT false
);

-- 3. Create a Function to forward new messages to Telegram (Server-Side)
-- Note: Replace with your actual BOT_TOKEN and CHAT_ID
CREATE OR REPLACE FUNCTION notify_telegram_on_contact()
RETURNS TRIGGER AS $$
DECLARE
    bot_token text := '8080807550:AAHYq4HsjvP1hRO3aSqKkUOS4Fn7E6GIIX8';
    chat_id text := '-1003835795139';
    message_text text;
BEGIN
    message_text := '📬 <b>New Support Inquiry (Production)</b>' || CHR(10) || CHR(10) ||
                    '<b>From:</b> ' || NEW.name || CHR(10) ||
                    '<b>Email:</b> ' || NEW.email || CHR(10) ||
                    '<b>Phone:</b> ' || COALESCE(NEW.phone, 'N/A') || CHR(10) ||
                    '<b>Topic:</b> ' || NEW.subject || CHR(10) || CHR(10) ||
                    '<b>Message:</b> ' || CHR(10) || '<i>' || NEW.message || '</i>';

    -- Execute server-side HTTP POST to Telegram API
    -- Using the extensions.http extension
    PERFORM extensions.http_post(
        'https://api.telegram.org/bot' || bot_token || '/sendMessage',
        jsonb_build_object(
            'chat_id', chat_id,
            'text', message_text,
            'parse_mode', 'HTML'
        )::text,
        'application/json'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Set up the Trigger
DROP TRIGGER IF EXISTS on_contact_message ON contact_messages;
CREATE TRIGGER on_contact_message
    AFTER INSERT ON contact_messages
    FOR EACH ROW EXECUTE FUNCTION notify_telegram_on_contact();
