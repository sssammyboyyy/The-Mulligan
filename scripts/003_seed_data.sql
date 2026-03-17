-- Seed pricing rules for different user types and time periods
-- Adult pricing
INSERT INTO public.pricing_rules (user_type, day_type, start_hour, end_hour, price_per_hour, is_peak) VALUES
('adult', 'weekday', 6, 12, 350.00, false),
('adult', 'weekday', 12, 18, 450.00, true),
('adult', 'weekday', 18, 22, 400.00, true),
('adult', 'weekend', 6, 12, 450.00, true),
('adult', 'weekend', 12, 18, 550.00, true),
('adult', 'weekend', 18, 22, 500.00, true),
('adult', 'holiday', 6, 22, 600.00, true);

-- Student pricing (20% discount)
INSERT INTO public.pricing_rules (user_type, day_type, start_hour, end_hour, price_per_hour, is_peak) VALUES
('student', 'weekday', 6, 12, 280.00, false),
('student', 'weekday', 12, 18, 360.00, true),
('student', 'weekday', 18, 22, 320.00, true),
('student', 'weekend', 6, 12, 360.00, true),
('student', 'weekend', 12, 18, 440.00, true),
('student', 'weekend', 18, 22, 400.00, true),
('student', 'holiday', 6, 22, 480.00, true);

-- Junior pricing (30% discount)
INSERT INTO public.pricing_rules (user_type, day_type, start_hour, end_hour, price_per_hour, is_peak) VALUES
('junior', 'weekday', 6, 12, 245.00, false),
('junior', 'weekday', 12, 18, 315.00, true),
('junior', 'weekday', 18, 22, 280.00, true),
('junior', 'weekend', 6, 12, 315.00, true),
('junior', 'weekend', 12, 18, 385.00, true),
('junior', 'weekend', 18, 22, 350.00, true),
('junior', 'holiday', 6, 22, 420.00, true);

-- Senior pricing (25% discount)
INSERT INTO public.pricing_rules (user_type, day_type, start_hour, end_hour, price_per_hour, is_peak) VALUES
('senior', 'weekday', 6, 12, 262.50, false),
('senior', 'weekday', 12, 18, 337.50, true),
('senior', 'weekday', 18, 22, 300.00, true),
('senior', 'weekend', 6, 12, 337.50, true),
('senior', 'weekend', 12, 18, 412.50, true),
('senior', 'weekend', 18, 22, 375.00, true),
('senior', 'holiday', 6, 22, 450.00, true);

-- Seed availability for next 30 days (6 AM to 10 PM slots)
DO $$
DECLARE
  current_date DATE := CURRENT_DATE;
  end_date DATE := CURRENT_DATE + INTERVAL '30 days';
  slot_time TIME;
  day_type_val day_type;
BEGIN
  WHILE current_date <= end_date LOOP
    -- Determine day type
    IF EXTRACT(DOW FROM current_date) IN (0, 6) THEN
      day_type_val := 'weekend';
    ELSE
      day_type_val := 'weekday';
    END IF;
    
    -- Create hourly slots from 6 AM to 10 PM
    FOR hour IN 6..21 LOOP
      slot_time := (hour || ':00:00')::TIME;
      INSERT INTO public.availability (date, start_time, end_time, is_available, max_bookings, current_bookings, day_type)
      VALUES (current_date, slot_time, (slot_time + INTERVAL '1 hour')::TIME, true, 2, 0, day_type_val);
    END LOOP;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
END $$;

-- Seed upsells
INSERT INTO public.upsells (name, description, price, category, trigger_condition, is_active) VALUES
('Premium Golf Balls (Dozen)', 'Titleist Pro V1 golf balls', 85.00, 'equipment', '{"min_duration": 1}', true),
('Club Rental Set', 'Full set of premium clubs', 150.00, 'equipment', '{"player_count_min": 1}', true),
('30-Min Private Lesson', 'One-on-one coaching session', 450.00, 'lesson', '{"user_type": ["adult", "student"]}', true),
('Gourmet Burger & Chips', 'Chef''s special burger with fries', 120.00, 'food', '{"min_duration": 2}', true),
('Craft Beer Selection', 'Choice of premium craft beers', 65.00, 'beverage', '{"user_type": ["adult"]}', true),
('Soft Drinks & Snacks', 'Assorted beverages and snacks', 45.00, 'beverage', '{}', true),
('Monthly Membership', 'Unlimited access for 30 days', 2500.00, 'membership', '{"booking_count_min": 3}', true),
('Golf Glove', 'Premium leather golf glove', 35.00, 'equipment', '{}', true);

-- Seed sample competitions
INSERT INTO public.competitions (name, description, type, start_date, end_date, prize, is_active) VALUES
('Monthly Longest Drive Challenge', 'Hit the longest drive and win!', 'longest_drive', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'R2000 Pro Shop Voucher', true),
('Closest to the Pin Competition', 'Get closest to the pin on our signature hole', 'closest_to_pin', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'Free 2-Hour Session', true);

-- Seed South African public holidays for 2025
INSERT INTO public.holidays (date, name) VALUES
('2025-01-01', 'New Year''s Day'),
('2025-03-21', 'Human Rights Day'),
('2025-04-18', 'Good Friday'),
('2025-04-21', 'Family Day'),
('2025-04-27', 'Freedom Day'),
('2025-05-01', 'Workers'' Day'),
('2025-06-16', 'Youth Day'),
('2025-08-09', 'National Women''s Day'),
('2025-09-24', 'Heritage Day'),
('2025-12-16', 'Day of Reconciliation'),
('2025-12-25', 'Christmas Day'),
('2025-12-26', 'Day of Goodwill');
