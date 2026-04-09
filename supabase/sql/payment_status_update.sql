
-- Add payment_status and payment_method columns to bookings table if they don't exist
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Create function to emit payment status changes
CREATE OR REPLACE FUNCTION public.handle_payment_status_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- If payment status changed to completed, create a notification for the provider
  IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status) AND NEW.payment_status = 'completed' THEN
    INSERT INTO public.notifications (
      user_id,
      message,
      type
    ) VALUES (
      NEW.provider_id,
      'Payment completed for booking #' || NEW.id,
      'payment'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for payment status changes
DROP TRIGGER IF EXISTS on_payment_status_change ON public.bookings;
CREATE TRIGGER on_payment_status_change
  AFTER UPDATE OF payment_status ON public.bookings
  FOR EACH ROW
  WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
  EXECUTE FUNCTION public.handle_payment_status_change();

-- Add bookings table to realtime publication if not already
BEGIN;
  -- Drop the table from the publication if it exists (idempotent)
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.bookings;
  
  -- Re-add it to the publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
COMMIT;
