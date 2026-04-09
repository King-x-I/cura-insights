
-- Enable Supabase Realtime tracking for payments
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Create payments table to store payment history
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  consumer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Consumers can view their own payments" 
ON public.payments FOR SELECT 
USING (auth.uid() = consumer_id);

CREATE POLICY "Providers can view their own payments" 
ON public.payments FOR SELECT 
USING (auth.uid() = provider_id);

-- Add tracking table to store real-time location data
CREATE TABLE IF NOT EXISTS public.location_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.location_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for location tracking
CREATE POLICY "Users can update their own location" 
ON public.location_tracking FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location" 
ON public.location_tracking FOR UPDATE 
USING (auth.uid() = user_id);

-- Location sharing permissions for active bookings
CREATE POLICY "Providers can view consumer location for active bookings" 
ON public.location_tracking FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE 
      bookings.id = location_tracking.booking_id 
      AND bookings.provider_id = auth.uid() 
      AND bookings.booking_status IN ('provider_assigned', 'in_progress')
  )
);

CREATE POLICY "Consumers can view provider location for active bookings" 
ON public.location_tracking FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE 
      bookings.id = location_tracking.booking_id 
      AND bookings.consumer_id = auth.uid() 
      AND bookings.booking_status IN ('provider_assigned', 'in_progress')
  )
);

-- Add these tables to the realtime publication
BEGIN;
  -- Drop the tables from the publication if they exist (idempotent)
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.location_tracking;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.payments;
  
  -- Re-add them to the publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.location_tracking;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
COMMIT;
