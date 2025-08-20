-- Migration: Add last_turn_at column to wars table
-- This enables automatic turn advancement with timer tracking

ALTER TABLE wars ADD COLUMN IF NOT EXISTS last_turn_at TIMESTAMP;

-- Update existing active wars to have last_turn_at set to started_at or current time
UPDATE wars 
SET last_turn_at = COALESCE(started_at, NOW()) 
WHERE status = 'active' AND last_turn_at IS NULL;

-- Comment for documentation
COMMENT ON COLUMN wars.last_turn_at IS 'Timestamp of when the current turn started, used for automatic turn advancement';
