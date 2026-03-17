-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update availability when booking is created
CREATE OR REPLACE FUNCTION public.update_availability_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    UPDATE public.availability
    SET current_bookings = current_bookings + 1
    WHERE date = NEW.booking_date
    AND start_time = NEW.start_time;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for booking creation
DROP TRIGGER IF EXISTS on_booking_confirmed ON public.bookings;
CREATE TRIGGER on_booking_confirmed
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_availability_on_booking();

-- Function to restore availability when booking is cancelled
CREATE OR REPLACE FUNCTION public.restore_availability_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.availability
    SET current_bookings = GREATEST(0, current_bookings - 1)
    WHERE date = NEW.booking_date
    AND start_time = NEW.start_time;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for booking cancellation
DROP TRIGGER IF EXISTS on_booking_cancelled ON public.bookings;
CREATE TRIGGER on_booking_cancelled
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_availability_on_cancel();

-- Function to calculate total price with upsells
CREATE OR REPLACE FUNCTION public.calculate_booking_total(booking_id_param UUID)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
AS $$
DECLARE
  base_price DECIMAL(10, 2);
  upsells_total DECIMAL(10, 2);
BEGIN
  SELECT b.base_price INTO base_price
  FROM public.bookings b
  WHERE b.id = booking_id_param;
  
  SELECT COALESCE(SUM(bu.price * bu.quantity), 0) INTO upsells_total
  FROM public.booking_upsells bu
  WHERE bu.booking_id = booking_id_param;
  
  RETURN base_price + upsells_total;
END;
$$;
