-- Create enum for service types
CREATE TYPE service_type AS ENUM (
  'driver',
  'nanny',
  'caretaker',
  'chef',
  'house_helper',
  'parcel_delivery'
);

-- Create enum for provider status
CREATE TYPE provider_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- Create or update provider_details table
CREATE TABLE IF NOT EXISTS public.provider_details (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  service_type service_type NOT NULL,
  experience_years INTEGER,
  skills TEXT,
  govt_id_url TEXT,
  license_url TEXT,
  profile_picture TEXT,
  status provider_status DEFAULT 'pending',
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_details ENABLE ROW LEVEL SECURITY;

-- Policies for provider_details
DROP POLICY IF EXISTS "Providers can view their own details" ON public.provider_details;
DROP POLICY IF EXISTS "Providers can update their own details" ON public.provider_details;
DROP POLICY IF EXISTS "Admin can view all providers" ON public.provider_details;
DROP POLICY IF EXISTS "Admin can approve providers" ON public.provider_details;

-- Provider policies
CREATE POLICY "Providers can view their own details"
ON public.provider_details
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Providers can update their own details"
ON public.provider_details
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND status = 'approved'
  AND (NEW.status = OLD.status) -- Prevent providers from changing their status
)
WITH CHECK (
  auth.uid() = user_id
  AND status = 'approved'
);

-- Admin policies (using is_admin() function)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1
      FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admin can view all providers"
ON public.provider_details
FOR SELECT
USING (is_admin());

CREATE POLICY "Admin can approve providers"
ON public.provider_details
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- Function to handle provider approval
CREATE OR REPLACE FUNCTION public.approve_provider(
  provider_user_id UUID,
  approval_status provider_status
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can approve providers';
  END IF;

  -- Update provider status
  UPDATE public.provider_details
  SET 
    status = approval_status,
    updated_at = now()
  WHERE user_id = provider_user_id
  RETURNING json_build_object(
    'id', id,
    'user_id', user_id,
    'status', status,
    'updated_at', updated_at
  ) INTO result;

  -- Insert notification for provider
  INSERT INTO public.notifications (
    user_id,
    type,
    message,
    created_at
  ) VALUES (
    provider_user_id,
    CASE 
      WHEN approval_status = 'approved' THEN 'PROVIDER_APPROVED'
      WHEN approval_status = 'rejected' THEN 'PROVIDER_REJECTED'
      ELSE 'PROVIDER_STATUS_UPDATED'
    END,
    CASE 
      WHEN approval_status = 'approved' THEN 'Your provider application has been approved! You can now start accepting bookings.'
      WHEN approval_status = 'rejected' THEN 'Your provider application has been rejected. Please contact support for more information.'
      ELSE 'Your provider status has been updated.'
    END,
    now()
  );

  RETURN result;
END;
$$; 