-- Fix the room_code column length issue
-- The application generates room codes like: room_1755631218667_9ug8axppx (28+ characters)
-- But the current schema limits it to VARCHAR(10)

-- Update the room_code column to allow longer codes
ALTER TABLE battle_rooms ALTER COLUMN room_code TYPE VARCHAR(50);

-- Verify the change
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'battle_rooms' 
AND column_name = 'room_code';
