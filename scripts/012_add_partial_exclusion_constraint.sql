-- This migration updates the double-booking prevention mechanism to correctly handle cancelled bookings.
-- It replaces the old exclusion constraint with a new "partial" one that only applies to active bookings.

-- To find the exact name of your current constraint, you can connect to your database via psql and run:
-- \d public.bookings
-- Look for a line under "Indexes:" that contains "EXCLUDE".

-- Step 1: Drop the old constraint that applies to all rows.
-- We try dropping a few potential names to be safe.
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS "bookings_simulator_id_slot_start_slot_end_excl";

ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS "bookings_slot_excl";

-- Step 2: Add the new partial exclusion constraint.
-- This constraint does the same job but IGNORES rows where the status is 'cancelled'.
-- This allows new bookings to be created in slots that were previously occupied by a cancelled booking.
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_active_slot_excl
EXCLUDE USING gist (simulator_id WITH =, tstzrange(slot_start, slot_end) WITH &&)
WHERE (status <> 'cancelled');