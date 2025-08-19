-- Simple diagnostic query to check if the battle_rooms table structure matches expectations
-- Run this in Supabase SQL Editor to verify the table structure

-- Check the exact column names and types
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'battle_rooms' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'battle_rooms';

-- Test insert (temporarily disable RLS for testing)
-- Note: Run this only for testing, re-enable RLS after
ALTER TABLE battle_rooms DISABLE ROW LEVEL SECURITY;

-- Try a test insert
INSERT INTO battle_rooms (room_code, settings, status) 
VALUES ('test-manual-insert', '{"turnDuration": 60, "gameMode": "test"}', 'waiting')
RETURNING *;

-- Clean up test data
DELETE FROM battle_rooms WHERE room_code = 'test-manual-insert';

-- Re-enable RLS
ALTER TABLE battle_rooms ENABLE ROW LEVEL SECURITY;
