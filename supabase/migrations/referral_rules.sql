-- Definitive Referral Rules (Consolidated & Fixed)
-- This replaces ALL previous referral triggers to ensure no double-counting.

-- 1. Ensure system_config has settings
INSERT INTO public.system_config (key, value, description) VALUES
('referral_settings', '{
    "referrer_reward": 20,
    "milestone_step": 10,
    "milestone_bonus": 50,
    "is_active": true
}', 'Configuration for the referral reward and milestone bonus system')
ON CONFLICT (key) DO NOTHING;

-- 2. Clean up OLD triggers to prevent double-counting
DROP TRIGGER IF EXISTS on_order_referral ON public.orders;
DROP TRIGGER IF EXISTS on_order_referral_payout ON public.orders;

-- 3. The consolidated logic
CREATE OR REPLACE FUNCTION public.handle_referral_rewards_v2()
RETURNS TRIGGER AS $$
DECLARE
    buyer_profile RECORD;
    referrer_profile RECORD;
    delivered_order_count INTEGER;
    settings JSONB;
    v_milestone_bonus INTEGER;
    v_referral_reward INTEGER;
    v_milestone_step INTEGER;
    v_is_active BOOLEAN;
    new_coin_history_entry JSONB;
    milestone_history_entry JSONB;
BEGIN
    -- Pull settings
    SELECT value INTO settings FROM public.system_config WHERE key = 'referral_settings';
    
    -- Safety check if settings missing
    IF settings IS NULL THEN
        v_is_active := TRUE;
        v_referral_reward := 20;
        v_milestone_step := 10;
        v_milestone_bonus := 50;
    ELSE
        v_is_active := (settings->>'is_active')::boolean;
        v_referral_reward := (settings->>'referrer_reward')::integer;
        v_milestone_step := (settings->>'milestone_step')::integer;
        v_milestone_bonus := (settings->>'milestone_bonus')::integer;
    END IF;

    IF v_is_active IS NOT TRUE THEN RETURN NEW; END IF;

    -- Only trigger when status becomes 'Delivered'
    IF (TG_OP = 'UPDATE' AND OLD.status <> 'Delivered' AND NEW.status = 'Delivered') OR 
       (TG_OP = 'INSERT' AND NEW.status = 'Delivered') THEN
        
        -- Check first delivered order
        SELECT COUNT(*) INTO delivered_order_count 
        FROM public.orders 
        WHERE user_id = NEW.user_id AND status = 'Delivered';

        IF delivered_order_count = 1 THEN
            SELECT * INTO buyer_profile FROM public.profiles WHERE id = NEW.user_id;

            IF buyer_profile.referred_by IS NOT NULL AND buyer_profile.referred_by <> '' THEN
                SELECT * INTO referrer_profile FROM public.profiles 
                WHERE referral_code = buyer_profile.referred_by 
                LIMIT 1;

                IF referrer_profile.id IS NOT NULL THEN
                    -- Award Referrer (20 coins)
                    new_coin_history_entry := json_build_object(
                        'id', extract(epoch from now())::bigint,
                        'type', 'earn',
                        'title', 'Referral Success: ' || COALESCE(buyer_profile.full_name, 'New User'),
                        'amount', v_referral_reward,
                        'date', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
                        'status', 'Completed'
                    );

                    UPDATE public.profiles 
                    SET 
                        coins = coins + v_referral_reward,
                        referral_count = referral_count + 1,
                        coin_history = COALESCE(coin_history, '[]'::jsonb) || new_coin_history_entry
                    WHERE id = referrer_profile.id;

                    -- Milestone Check
                    IF (referrer_profile.referral_count + 1) % v_milestone_step = 0 THEN
                        milestone_history_entry := json_build_object(
                            'id', extract(epoch from now())::bigint + 1,
                            'type', 'bonus',
                            'title', 'Milestone Reached (' || (referrer_profile.referral_count + 1) || ' Referrals)',
                            'amount', v_milestone_bonus,
                            'date', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
                            'status', 'Completed'
                        );

                        UPDATE public.profiles 
                        SET 
                            coins = coins + v_milestone_bonus,
                            coin_history = COALESCE(coin_history, '[]'::jsonb) || milestone_history_entry
                        WHERE id = referrer_profile.id;
                    END IF;

                    -- Award Buyer (10 coins Welcome Reward)
                    UPDATE public.profiles 
                    SET coins = coins + 10
                    WHERE id = NEW.user_id;

                    PERFORM log_system_event('success', 'referrals', 'Linked payout completed', json_build_object('referrer_id', referrer_profile.id, 'buyer_id', NEW.user_id));
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach
DROP TRIGGER IF EXISTS on_order_referral_unified ON public.orders;
CREATE TRIGGER on_order_referral_unified
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_referral_rewards_v2();
