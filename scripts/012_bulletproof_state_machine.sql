-- 012_bulletproof_state_machine.sql
-- Purpose: Add columns for idempotency, self-healing, and n8n job tracking

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS n8n_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS n8n_last_error TEXT,
ADD COLUMN IF NOT EXISTS n8n_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS n8n_response TEXT,
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN bookings.email_sent IS 'Atomic flag to prevent duplicate confirmation emails';
COMMENT ON COLUMN bookings.n8n_attempts IS 'Number of times the n8n trigger was attempted';
