-- Link Coins to Orders: Add necessary columns for coin tracking
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='coins_used') THEN 
        ALTER TABLE public.orders ADD COLUMN coins_used INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='subtotal') THEN 
        ALTER TABLE public.orders ADD COLUMN subtotal NUMERIC;
    END IF;
END $$;
