-- Drop existing policies
DROP POLICY IF EXISTS "Providers can manage their own details" ON public.provider_details;
DROP POLICY IF EXISTS "Anyone can view provider details" ON public.provider_details;

-- Create new policies
CREATE POLICY "Providers can insert their own details"
ON public.provider_details
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Providers can view their own details"
ON public.provider_details
FOR SELECT
USING (
  auth.uid() = user_id
);

CREATE POLICY "Providers can update their own details"
ON public.provider_details
FOR UPDATE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- Allow anyone to view provider details
CREATE POLICY "Anyone can view provider details"
ON public.provider_details
FOR SELECT
USING (true);

-- Grant necessary permissions
GRANT ALL ON public.provider_details TO authenticated;
GRANT SELECT ON public.provider_details TO anon; 