-- Migration to handle referral rewards (recording the coin)
-- This runs on the backend to safely update metadata for both buyer and referrer

CREATE OR REPLACE FUNCTION public.handle_referral_rewards()
RETURNS TRIGGER AS $$
DECLARE
    buyer_metadata JSONB;
    referrer_id UUID;
    referrer_metadata JSONB;
    referred_by_code TEXT;
    order_count INTEGER;
    buyer_coins INTEGER;
    referrer_coins INTEGER;
    history_entry_buyer JSONB;
    history_entry_referrer JSONB;
BEGIN
    -- 1. Check if this is the user's first order
    SELECT COUNT(*) INTO order_count 
    FROM public.orders 
    WHERE user_id = NEW.user_id;

    -- Only award coins on the FIRST order
    IF order_count = 1 THEN
        -- 2. Get buyer's metadata
        SELECT raw_user_meta_data INTO buyer_metadata 
        FROM auth.users 
        WHERE id = NEW.user_id;

        referred_by_code := buyer_metadata->>'referred_by';

        -- 3. If they were referred by someone
        IF referred_by_code IS NOT NULL AND referred_by_code <> '' THEN
            
            -- Find the Referrer
            SELECT id, raw_user_meta_data INTO referrer_id, referrer_metadata
            FROM auth.users
            WHERE raw_user_meta_data->>'referral_code' = referred_by_code
            LIMIT 1;

            IF referrer_id IS NOT NULL THEN
                -- A. Credit BOTH users (metadata update)
                
                -- Buyer Reward (10 coins)
                buyer_coins := (COALESCE((buyer_metadata->>'coins')::INTEGER, 0)) + 10;
                history_entry_buyer := json_build_object(
                    'id', extract(epoch from now())::bigint,
                    'type', 'earn',
                    'title', 'Referral Bonus (First Order)',
                    'amount', 10,
                    'date', to_char(now(), 'DD/MM/YYYY'),
                    'status', 'Completed'
                );

                UPDATE auth.users 
                SET raw_user_meta_data = jsonb_set(
                    jsonb_set(buyer_metadata, '{coins}', buyer_coins::text::jsonb),
                    '{coin_history}', 
                    (COALESCE(buyer_metadata->'coin_history', '[]'::jsonb) || history_entry_buyer::jsonb)
                )
                WHERE id = NEW.user_id;

                -- Referrer Reward (20 coins)
                referrer_coins := (COALESCE((referrer_metadata->>'coins')::INTEGER, 0)) + 20;
                history_entry_referrer := json_build_object(
                    'id', extract(epoch from now())::bigint,
                    'type', 'earn',
                    'title', 'Friend Joined & Ordered',
                    'amount', 20,
                    'date', to_char(now(), 'DD/MM/YYYY'),
                    'status', 'Completed'
                );

                UPDATE auth.users 
                SET raw_user_meta_data = jsonb_set(
                    jsonb_set(
                        jsonb_set(referrer_metadata, '{coins}', referrer_coins::text::jsonb),
                        '{referral_count}', 
                        ((COALESCE((referrer_metadata->>'referral_count')::INTEGER, 0)) + 1)::text::jsonb
                    ),
                    '{coin_history}', 
                    (COALESCE(referrer_metadata->'coin_history', '[]'::jsonb) || history_entry_referrer::jsonb)
                )
                WHERE id = referrer_id;

            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after a new order is inserted
DROP TRIGGER IF EXISTS on_order_referral ON public.orders;
CREATE TRIGGER on_order_referral
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_referral_rewards();
