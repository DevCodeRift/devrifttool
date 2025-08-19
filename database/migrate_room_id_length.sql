-- Migration: Update room ID column to allow longer values
-- This fixes the "value too long for type character varying(10)" error

-- Update the rooms table to allow longer room IDs
ALTER TABLE rooms ALTER COLUMN id TYPE VARCHAR(50);

-- Update foreign key references in other tables
ALTER TABLE room_players ALTER COLUMN room_id TYPE VARCHAR(50);
ALTER TABLE battles ALTER COLUMN room_id TYPE VARCHAR(50);
ALTER TABLE spectators ALTER COLUMN room_id TYPE VARCHAR(50);

-- Confirm the changes
\d rooms;
