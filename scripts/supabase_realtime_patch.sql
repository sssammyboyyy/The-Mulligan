-- Grant base access
GRANT SELECT ON public.bookings TO anon, authenticated;

-- Enable RLS and create public read policy
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to bookings" ON public.bookings;
CREATE POLICY "Allow public read access to bookings" 
ON public.bookings FOR SELECT TO anon, authenticated USING (true);

-- Enable Realtime broadcasts
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
