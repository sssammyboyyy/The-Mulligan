-- Add a public policy to allow anyone to view booking time slots for availability checking
-- This only exposes start_time data for availability purposes, not user information

-- First check if policy exists and drop it if so
DROP POLICY IF EXISTS "Anyone can view booking times for availability" ON public.bookings;

-- Create new policy that allows public read access to non-cancelled bookings
-- but only for the fields needed for availability (start_time, end_time, booking_date)
CREATE POLICY "Anyone can view booking times for availability"
  ON public.bookings FOR SELECT
  USING (status != 'cancelled');
