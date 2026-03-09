-- 013_booking_dashboard_view.sql
-- Purpose: Provides a premium view for the admin dashboard with calculated payment states.

-- Drop existing view to allow column name changes (Postgres restriction on CREATE OR REPLACE VIEW)
DROP VIEW IF EXISTS booking_dashboard;

CREATE VIEW booking_dashboard AS
SELECT 
    b.*,
    CASE 
        WHEN b.status = 'cancelled' THEN 'Cancelled'
        WHEN b.amount_paid >= b.total_price - 0.01 THEN 'Fully Paid'
        WHEN b.amount_paid > 0 THEN 'Partial (Deposit)'
        ELSE 'Awaiting Info/Payment'
    END as payment_state,
    (b.total_price - b.amount_paid) as balance_due
FROM bookings b;

COMMENT ON VIEW booking_dashboard IS 'Calculated view for Admin and Success pages';
