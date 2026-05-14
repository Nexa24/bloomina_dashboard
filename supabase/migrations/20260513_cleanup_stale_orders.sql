-- ORDER CLEANUP SCRIPT
-- This script helps manage stale orders (abandoned checkouts or failed payments)

-- OPTION 1: DELETE (Completely remove from database)
-- Use this if you want to clear abandoned checkouts that have no value
-- DELETE FROM public.orders 
-- WHERE status IN ('Payment Pending', 'Payment Canceled', 'Declined');

-- OPTION 2: CANCEL (Keep record but set status to 'Cancelled')
-- This is better for keeping track of how many people drop off during checkout
UPDATE public.orders 
SET status = 'Cancelled'
WHERE status IN ('Payment Pending', 'Payment Canceled', 'Declined');

-- Optional: Automated Cleanup Helper
-- You can run this to remove any 'Payment Pending' order older than 24 hours
-- DELETE FROM public.orders 
-- WHERE status = 'Payment Pending' 
-- AND created_at < NOW() - INTERVAL '24 hours';
