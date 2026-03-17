-- ============================================================
-- FIX: Multi-Bay Exclusion Constraint
-- ============================================================
-- PROBLEM: The current `no_double_booking` constraint blocks ALL 
-- overlapping bookings, not considering that there are 3 bays.
--
-- SOLUTION: Drop the old constraint and create a new one that 
-- includes `simulator_id` so bookings can overlap if they're on
-- different bays.
-- ============================================================

-- Step 1: Drop the existing constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_double_booking;

-- Step 2: Ensure the btree_gist extension is enabled (needed for exclusion constraints)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Step 3: Create the CORRECT exclusion constraint
-- This allows overlapping time slots AS LONG AS they're on different simulators
ALTER TABLE bookings ADD CONSTRAINT no_double_booking 
  EXCLUDE USING gist (
    simulator_id WITH =,
    tstzrange(slot_start, slot_end) WITH &&
  )
  WHERE (status != 'cancelled');

-- ============================================================
-- HOW THIS WORKS:
-- - `simulator_id WITH =` → Blocks if same bay
-- - `tstzrange(slot_start, slot_end) WITH &&` → Blocks if times overlap
-- - BOTH conditions must be true to block
-- - So: Bay 1 at 09:00-10:00 blocks Bay 1 at 09:30-10:30
--       BUT allows Bay 2 at 09:30-10:30
-- ============================================================
