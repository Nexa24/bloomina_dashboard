-- Helper function to get global coin and referral statistics for the Admin Dashboard
CREATE OR REPLACE FUNCTION public.get_admin_referral_stats()
RETURNS JSONB AS $$
DECLARE
    total_coins_distributed BIGINT;
    total_referrals BIGINT;
    coins_last_24h BIGINT;
    active_referrers BIGINT;
BEGIN
    SELECT COALESCE(SUM(coins), 0) INTO total_coins_distributed FROM public.profiles;
    SELECT COALESCE(SUM(referral_count), 0) INTO total_referrals FROM public.profiles;
    
    -- Estimate coins distributed in last 24h from system logs
    SELECT COUNT(*) * 20 
    INTO coins_last_24h 
    FROM public.system_logs 
    WHERE source = 'referrals' 
    AND created_at > now() - interval '24 hours';

    SELECT COUNT(*) INTO active_referrers FROM public.profiles WHERE referral_count > 0;

    RETURN json_build_object(
        'total_distributed', total_coins_distributed,
        'total_referrals', total_referrals,
        'coins_last_24h', COALESCE(coins_last_24h, 0),
        'active_referrers', active_referrers
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
