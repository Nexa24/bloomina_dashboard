
-- Core system configuration table needed for Refer & Earn
CREATE TABLE IF NOT EXISTS system_config (
    key text PRIMARY KEY,
    value jsonb DEFAULT '{}'::jsonb,
    description text,
    updated_at timestamptz DEFAULT now()
);

-- Initialize default referral settings if they don't exist
INSERT INTO system_config (key, value, description)
VALUES (
    'referral_settings', 
    '{
        "referrer_reward": 20,
        "referred_reward": 10,
        "milestone_step": 10,
        "milestone_bonus": 50,
        "min_order_value": 0,
        "max_coin_usage": 20,
        "is_active": true
    }'::jsonb, 
    'Global referral and milestone settings'
)
ON CONFLICT (key) DO NOTHING;

-- Also ensure system_logs exists for the history feed
CREATE TABLE IF NOT EXISTS system_logs (
    id bigserial PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    message text,
    source text,
    type text
);
