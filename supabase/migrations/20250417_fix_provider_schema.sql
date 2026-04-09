-- Drop existing table if it exists
DROP TABLE IF EXISTS public.provider_details;

-- Create the provider_details table with correct schema
CREATE TABLE public.provider_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    service_type TEXT,
    experience_years INTEGER,
    skills TEXT,
    govt_id_url TEXT,
    license_url TEXT,
    profile_picture TEXT,
    languages TEXT,
    id_type TEXT,
    id_number TEXT,
    driving_license_number TEXT,
    vehicle_type TEXT,
    license_expiry_date TEXT,
    working_hours_from TEXT,
    working_hours_to TEXT,
    bank_account_name TEXT,
    bank_account_number TEXT,
    ifsc_code TEXT,
    upi_id TEXT,
    resume_url TEXT,
    status TEXT DEFAULT 'pending',
    is_online BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX provider_user_id_idx ON public.provider_details(user_id);

-- Enable RLS
ALTER TABLE public.provider_details ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable insert for authenticated users"
ON public.provider_details
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable select for authenticated users"
ON public.provider_details
FOR SELECT
USING (true);

CREATE POLICY "Enable update for users based on user_id"
ON public.provider_details
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.provider_details TO authenticated;
GRANT SELECT ON public.provider_details TO anon; 