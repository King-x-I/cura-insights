
-- Add additional fields to driver_booking_requests table
ALTER TABLE driver_booking_requests 
ADD COLUMN IF NOT EXISTS destination text,
ADD COLUMN IF NOT EXISTS estimate_km numeric,
ADD COLUMN IF NOT EXISTS cost_estimate numeric,
ADD COLUMN IF NOT EXISTS is_round_trip boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS additional_notes text;
