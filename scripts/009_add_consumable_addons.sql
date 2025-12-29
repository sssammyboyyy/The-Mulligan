-- Add consumable add-on fields to bookings table for Water, Gloves, and Balls
-- Each add-on has a quantity and custom price field (price remembers last used via admin UI)

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS addon_water_qty INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS addon_water_price DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS addon_gloves_qty INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS addon_gloves_price DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS addon_balls_qty INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS addon_balls_price DECIMAL(10, 2) DEFAULT 0;

-- Add comments explaining the add-ons
COMMENT ON COLUMN bookings.addon_water_qty IS 'Number of water bottles purchased';
COMMENT ON COLUMN bookings.addon_water_price IS 'Price per water bottle (customizable by admin)';
COMMENT ON COLUMN bookings.addon_gloves_qty IS 'Number of gloves purchased';
COMMENT ON COLUMN bookings.addon_gloves_price IS 'Price per glove (customizable by admin)';
COMMENT ON COLUMN bookings.addon_balls_qty IS 'Number of ball sleeves purchased';
COMMENT ON COLUMN bookings.addon_balls_price IS 'Price per ball sleeve (customizable by admin)';
