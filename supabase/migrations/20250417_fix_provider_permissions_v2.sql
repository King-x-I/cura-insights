-- First disable RLS temporarily to allow initial setup
ALTER TABLE public.provider_details DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Providers can manage their own details" ON public.provider_details;
DROP POLICY IF EXISTS "Anyone can view provider details" ON public.provider_details;
DROP POLICY IF EXISTS "Providers can insert their own details" ON public.provider_details;
DROP POLICY IF EXISTS "Providers can view their own details" ON public.provider_details;
DROP POLICY IF EXISTS "Providers can update their own details" ON public.provider_details;

-- Create new policies
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

-- Re-enable RLS
ALTER TABLE public.provider_details ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.provider_details TO authenticated;
GRANT SELECT ON public.provider_details TO anon; 