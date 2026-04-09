
-- Enable Supabase Realtime tracking for these tables
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.provider_details REPLICA IDENTITY FULL;
ALTER TABLE public.location_tracking REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;

-- Add tables to the realtime publication
BEGIN;
  -- Drop the tables from the publication if they exist (idempotent)
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.bookings;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.notifications;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.provider_details;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.location_tracking;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.payments;
  
  -- Re-add them to the publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_details;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.location_tracking;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
COMMIT;
