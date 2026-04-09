-- Approve provider account
UPDATE provider_details 
SET 
    status = 'approved',
    updated_at = NOW()
WHERE user_id = '8939a48a-971e-4c72-8cd1-63c3be788914';

-- Grant necessary permissions
GRANT UPDATE ON provider_details TO authenticated; 