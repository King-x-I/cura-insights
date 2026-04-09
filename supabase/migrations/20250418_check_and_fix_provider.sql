-- Check and fix provider status
DO $$
BEGIN
    -- First check if the provider exists and their status
    RAISE NOTICE 'Checking provider status...';
    
    -- Update provider status to approved
    UPDATE provider_details 
    SET 
        status = 'approved',
        updated_at = NOW()
    WHERE user_id = '8939a48a-971e-4c72-8cd1-63c3be788914'
    RETURNING id, status, user_id;

    -- Create foreign key relationships if they don't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_consumer_id_fkey'
    ) THEN
        -- Add foreign key for consumer_id in bookings table
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_consumer_id_fkey
        FOREIGN KEY (consumer_id) 
        REFERENCES consumer_details(user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_provider_id_fkey'
    ) THEN
        -- Add foreign key for provider_id in bookings table
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_provider_id_fkey
        FOREIGN KEY (provider_id) 
        REFERENCES provider_details(user_id);
    END IF;

    -- Grant necessary permissions
    GRANT ALL ON bookings TO authenticated;
    GRANT ALL ON consumer_details TO authenticated;
    GRANT ALL ON provider_details TO authenticated;

    RAISE NOTICE 'Provider status updated and relationships fixed';
END $$; 