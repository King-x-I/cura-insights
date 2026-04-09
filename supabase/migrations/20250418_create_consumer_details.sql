-- Create consumer_details table if it doesn't exist
CREATE TABLE IF NOT EXISTS consumer_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    profile_picture TEXT,
    preferred_language VARCHAR(50),
    emergency_contact VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for consumer_details
ALTER TABLE consumer_details ENABLE ROW LEVEL SECURITY;

-- Policy for inserting own details
CREATE POLICY "Users can insert their own details"
ON consumer_details FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for viewing own details
CREATE POLICY "Users can view own details"
ON consumer_details FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for updating own details
CREATE POLICY "Users can update own details"
ON consumer_details FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for deleting own details
CREATE POLICY "Users can delete own details"
ON consumer_details FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON consumer_details TO authenticated;

-- Create function to automatically create consumer profile
CREATE OR REPLACE FUNCTION public.handle_new_consumer()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.consumer_details (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_consumer(); 