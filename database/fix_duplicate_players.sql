-- Fix duplicate players issue
-- Add unique constraint to prevent same player from joining same room multiple times

-- First, remove any existing duplicate players (keep the most recent one)
DELETE FROM room_players a 
USING room_players b
WHERE a.room_id = b.room_id 
  AND a.player_id = b.player_id 
  AND a.id < b.id;

-- Add unique constraint to prevent future duplicates
ALTER TABLE room_players 
ADD CONSTRAINT unique_room_player 
UNIQUE (room_id, player_id);

-- Add index for better performance on room/player lookups
CREATE INDEX IF NOT EXISTS idx_room_players_room_player 
ON room_players (room_id, player_id);
