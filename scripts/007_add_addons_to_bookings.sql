-- Add add-on fields to bookings table for golf club rental and coaching

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS golf_club_rental BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS coaching_session BOOLEAN DEFAULT FALSE;

-- Add comment explaining the add-ons
COMMENT ON COLUMN bookings.golf_club_rental IS 'Golf club rental add-on (R100)';
COMMENT ON COLUMN bookings.coaching_session IS 'Professional coaching add-on (R450 for 1 hour)';
