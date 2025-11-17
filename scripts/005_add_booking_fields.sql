-- Add missing fields to bookings table for production deployment

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS session_type TEXT,
ADD COLUMN IF NOT EXISTS famous_course_option TEXT,
ADD COLUMN IF NOT EXISTS accept_whatsapp BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS enter_competition BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- Create index for coupon code lookups
CREATE INDEX IF NOT EXISTS idx_bookings_coupon_code ON public.bookings(coupon_code);

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.session_type IS 'Type of session: quickplay or famous-course';
COMMENT ON COLUMN public.bookings.famous_course_option IS 'Special pricing option: 3-ball or 4-ball for famous courses';
COMMENT ON COLUMN public.bookings.accept_whatsapp IS 'POPIA compliant WhatsApp consent for booking confirmations';
COMMENT ON COLUMN public.bookings.enter_competition IS 'Optional competition entry consent';
COMMENT ON COLUMN public.bookings.coupon_code IS 'Applied coupon code for discount tracking';
