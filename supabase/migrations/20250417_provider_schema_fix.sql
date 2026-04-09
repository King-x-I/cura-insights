-- Drop existing table if it exists
DROP TABLE IF EXISTS provider_details;

-- Create the provider_details table with all necessary fields
CREATE TABLE provider_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    service_type TEXT NOT NULL,
    experience_years INTEGER,
    skills TEXT,
    govt_id_url TEXT,
    license_url TEXT,
    profile_picture TEXT,
    languages TEXT,
    id_type TEXT NOT NULL,
    id_number TEXT NOT NULL,
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
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_provider_details_updated_at
    BEFORE UPDATE ON provider_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON provider_details;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON provider_details;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON provider_details;
DROP POLICY IF EXISTS "Enable insert during signup" ON provider_details;

-- Enable RLS
ALTER TABLE provider_details ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all"
ON provider_details FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert for signup"
ON provider_details FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Enable update for users based on user_id"
ON provider_details FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON provider_details TO public;
GRANT ALL ON provider_details TO authenticated;
GRANT ALL ON provider_details TO service_role;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_provider_details_user_id ON provider_details(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_details_status ON provider_details(status);

-- Create stored procedure for provider details insertion
CREATE OR REPLACE FUNCTION insert_provider_details(provider_data JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO provider_details (
        user_id,
        full_name,
        email,
        phone,
        address,
        service_type,
        experience_years,
        skills,
        govt_id_url,
        license_url,
        profile_picture,
        languages,
        id_type,
        id_number,
        driving_license_number,
        vehicle_type,
        license_expiry_date,
        working_hours_from,
        working_hours_to,
        bank_account_name,
        bank_account_number,
        ifsc_code,
        upi_id,
        resume_url,
        status,
        is_online,
        is_approved
    )
    VALUES (
        (provider_data->>'user_id')::uuid,
        provider_data->>'full_name',
        provider_data->>'email',
        provider_data->>'phone',
        provider_data->>'address',
        provider_data->>'service_type',
        (provider_data->>'experience_years')::integer,
        provider_data->>'skills',
        provider_data->>'govt_id_url',
        provider_data->>'license_url',
        provider_data->>'profile_picture',
        provider_data->>'languages',
        provider_data->>'id_type',
        provider_data->>'id_number',
        provider_data->>'driving_license_number',
        provider_data->>'vehicle_type',
        provider_data->>'license_expiry_date',
        provider_data->>'working_hours_from',
        provider_data->>'working_hours_to',
        provider_data->>'bank_account_name',
        provider_data->>'bank_account_number',
        provider_data->>'ifsc_code',
        provider_data->>'upi_id',
        provider_data->>'resume_url',
        'pending',
        false,
        false
    );
END;
$$; 