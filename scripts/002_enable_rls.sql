-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_upsells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_entries ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Booking upsells policies
CREATE POLICY "Users can view their booking upsells"
  ON public.booking_upsells FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_upsells.booking_id
      AND (bookings.user_id = auth.uid() OR bookings.user_id IS NULL)
    )
  );

CREATE POLICY "Users can create booking upsells"
  ON public.booking_upsells FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_upsells.booking_id
      AND (bookings.user_id = auth.uid() OR bookings.user_id IS NULL)
    )
  );

-- Competition entries policies
CREATE POLICY "Users can view their competition entries"
  ON public.competition_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create competition entries"
  ON public.competition_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public read access for reference tables (no auth required)
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pricing rules"
  ON public.pricing_rules FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view availability"
  ON public.availability FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view active upsells"
  ON public.upsells FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active competitions"
  ON public.competitions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view holidays"
  ON public.holidays FOR SELECT
  USING (true);
