-- Seed Pricing Rules
-- This script populates the pricing_rules table with all pricing combinations
-- for the 4 user types, 3 day types, and peak/off-peak periods

-- Base prices:
-- Adult off-peak: R350/hr
-- Adult peak weekday/weekend: R450/hr
-- Adult peak holiday: R600/hr
-- Student: 20% off adult price
-- Junior: 30% off adult price
-- Senior: 25% off adult price

-- Peak definitions:
-- Weekdays: 16:00-21:00 are peak
-- Weekends: 10:00-21:00 are peak
-- Holidays: All day peak (00:00-24:00)

-- ============================================
-- ADULT PRICING
-- ============================================

-- Adult Weekday
INSERT INTO pricing_rules (user_type, day_type, start_hour, end_hour, price_per_hour, is_peak) VALUES
('adult', 'weekday', 0, 16, 350.00, false),   -- Off-peak morning/afternoon
('adult', 'weekday', 16, 21, 450.00, true),   -- Peak evening
('adult', 'weekday', 21, 24, 350.00, false);  -- Off-peak late night

-- Adult Weekend
INSERT INTO pricing_rules (user_type, day_type, start_hour, end_hour, price_per_hour, is_peak) VALUES
('adult', 'weekend', 0, 10, 350.00, false),   -- Off-peak early morning
('adult', 'weekend', 10, 21, 450.00, true),   -- Peak day/evening
('adult', 'weekend', 21, 24, 350.00, false);  -- Off-peak late night

-- Adult Holiday (all day peak)
INSERT INTO pricing_rules (user_type, day_type, start_hour, end_hour, price_per_hour, is_peak) VALUES
('adult', 'holiday', 0, 24, 600.00, true);    -- Peak all day

-- ============================================
-- STUDENT PRICING (20% off adult)
-- ============================================

-- Student Weekday
INSERT INTO pricing_rules (user_type, day_type, start_hour, end_hour, price_per_hour, is_peak) VALUES
('student', 'weekday', 0, 16, 280.00, false),   -- Off-peak: 350 * 0.80 = 280
('student', 'weekday', 16, 21, 360.00, true),   -- Peak: 450 * 0.80 = 360
('student', 'weekday', 21, 24, 280.00, false);  -- Off-peak late night

-- Student Weekend
INSERT INTO pricing_rules (user_type, day_type, start_hour, end_hour, price_per_hour, is_peak) VALUES
('student', 'weekend', 0, 10, 280.00, false),   -- Off-peak early morning
('student', 'weekend', 10, 21, 360.00, true),   -- Peak: 450 * 0.80 = 360
('student', 'weekend', 21, 24, 280.00, false);  -- Off-peak late night

-- Student Holiday
INSERT INTO pricing_rules (user_type, day_type, start_hour, end_hour, price_per_hour, is_peak) VALUES
('student', 'holiday', 0, 24, 480.00, true);    -- Peak all day: 600 * 0.80 = 480

-- ============================================
-- JUNIOR PRICING (30% off adult)
-- ============================================

-- Junior Weekday
INSERT INTO pricing_rules (user_type, day_type, start_hour, end_hour, price_per_hour, is_peak) VALUES
('junior', 'weekday', 0, 16, 245.00, false),   -- Off-peak: 350 * 0.70 = 245
('junior', 'weekday', 16, 21, 315.00, true),   -- Peak: 450 * 0.70 = 315
('junior', 'weekday', 21, 24, 245.00, false);  -- Off-peak late night

-- Junior Weekend
INSERT INTO pricing_rules (user_type, day_type, start_hour, end_hour, price_per_hour, is_peak) VALUES
('junior', 'weekend', 0, 10, 245.00, false),   -- Off-peak early morning
('junior', 'weekend', 10, 21, 315.00, true),   -- Peak: 450 * 0.70 = 315
('junior', 'weekend', 21, 24, 245.00, false);  -- Off-peak late night

-- Junior Holiday
INSERT INTO pricing_rules (user_type, day_type, start_hour, end_hour, price_per_hour, is_peak) VALUES
('junior', 'holiday', 0, 24, 420.00, true);    -- Peak all day: 600 * 0.70 = 420

-- ============================================
-- SENIOR PRICING (25% off adult)
-- ============================================

-- Senior Weekday
INSERT INTO pricing_rules (user_type, day_type, start_hour, end_hour, price_per_hour, is_peak) VALUES
('senior', 'weekday', 0, 16, 262.50, false),   -- Off-peak: 350 * 0.75 = 262.50
('senior', 'weekday', 16, 21, 337.50, true),   -- Peak: 450 * 0.75 = 337.50
('senior', 'weekday', 21, 24, 262.50, false);  -- Off-peak late night

-- Senior Weekend
INSERT INTO pricing_rules (user_type, day_type, start_hour, end_hour, price_per_hour, is_peak) VALUES
('senior', 'weekend', 0, 10, 262.50, false),   -- Off-peak early morning
('senior', 'weekend', 10, 21, 337.50, true),   -- Peak: 450 * 0.75 = 337.50
('senior', 'weekend', 21, 24, 262.50, false);  -- Off-peak late night

-- Senior Holiday
INSERT INTO pricing_rules (user_type, day_type, start_hour, end_hour, price_per_hour, is_peak) VALUES
('senior', 'holiday', 0, 24, 450.00, true);    -- Peak all day: 600 * 0.75 = 450

-- Verify data inserted
SELECT COUNT(*) as total_pricing_rules FROM pricing_rules;

-- Expected: 28 rows (4 user types × 7 time periods)
-- Adult: 7 rows (3 weekday + 3 weekend + 1 holiday)
-- Student: 7 rows
-- Junior: 7 rows
-- Senior: 7 rows
