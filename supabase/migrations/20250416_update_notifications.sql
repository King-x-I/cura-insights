-- Alter the notifications table to add a booking_id column
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id);

-- Enable RLS on tables
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_details ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies for bookings
CREATE POLICY IF NOT EXISTS "Providers can view assigned bookings" 
  ON public.bookings 
  FOR SELECT 
  USING (auth.uid() = provider_id OR auth.uid() = consumer_id);

CREATE POLICY IF NOT EXISTS "Consumers can create bookings" 
  ON public.bookings 
  FOR INSERT 
  WITH CHECK (auth.uid() = consumer_id);

CREATE POLICY IF NOT EXISTS "Providers can update their assigned bookings" 
  ON public.bookings 
  FOR UPDATE 
  USING (auth.uid() = provider_id);

-- Set up RLS policies for notifications
CREATE POLICY IF NOT EXISTS "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "System can insert notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (true);

-- Alter provider_details table to ensure correct ID field
ALTER TABLE public.provider_details DROP CONSTRAINT IF EXISTS provider_details_pkey;
ALTER TABLE public.provider_details ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.provider_details ADD PRIMARY KEY (user_id);

-- Drop existing policies for provider_details
DROP POLICY IF EXISTS "Providers can update their own details" ON public.provider_details;
DROP POLICY IF EXISTS "Providers can view their own details" ON public.provider_details;
DROP POLICY IF EXISTS "Providers can insert their own details" ON public.provider_details;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all operations for users based on user_id" ON public.provider_details;

-- Create a simpler policy for provider_details
CREATE POLICY "Providers can manage their own details"
ON public.provider_details
FOR ALL
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- Create a policy for viewing provider details
CREATE POLICY "Anyone can view active provider details"
ON public.provider_details
FOR SELECT
USING (
  true  -- This allows reading all provider records
);

-- Set up RLS policies for consumer_details
CREATE POLICY IF NOT EXISTS "Consumers can view and update their own details" 
  ON public.consumer_details 
  FOR ALL 
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Providers can view consumer details" 
  ON public.consumer_details 
  FOR SELECT 
  USING (true);

-- Create a secure view for accessing limited user data
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  email_confirmed_at,
  raw_user_meta_data->>'user_type' as user_type
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON public.user_profiles TO authenticated;

-- Drop existing policies
DROP POLICY IF EXISTS "Providers can manage their own details" ON public.provider_details;
DROP POLICY IF EXISTS "Anyone can view active provider details" ON public.provider_details;

-- Create policies for provider_details
CREATE POLICY "Providers can manage their own details"
ON public.provider_details
FOR ALL
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Anyone can view provider details"
ON public.provider_details
FOR SELECT
USING (true);

-- Update handle_new_user function to use user_profiles view
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_profile RECORD;
BEGIN
    SELECT * INTO user_profile 
    FROM public.user_profiles 
    WHERE id = NEW.id;

    IF user_profile.user_type = 'consumer' THEN
        INSERT INTO public.consumer_details(
            id,
            email,
            full_name
        ) VALUES (
            NEW.id,
            user_profile.email,
            COALESCE(user_profile.full_name, user_profile.email)
        );
    ELSIF user_profile.user_type = 'provider' THEN
        INSERT INTO public.provider_details(
            user_id,
            email,
            full_name,
            service_type,
            is_online,
            is_approved
        ) VALUES (
            NEW.id,
            user_profile.email,
            COALESCE(user_profile.full_name, user_profile.email),
            LOWER(COALESCE(NEW.raw_user_meta_data->>'service_type', 'driver')),
            false,
            false
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- Enable RLS
ALTER TABLE public.provider_details ENABLE ROW LEVEL SECURITY;

-- Create policy for user_profiles view
CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
USING (
    auth.uid() = id
);

-- Enable RLS on the view
ALTER VIEW public.user_profiles SECURITY DEFINER;

-- Create function to check if user is provider
CREATE OR REPLACE FUNCTION public.is_provider(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM provider_details
    WHERE user_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-email@example.com';
