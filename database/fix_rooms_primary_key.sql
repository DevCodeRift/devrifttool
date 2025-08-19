-- Final migration to fix the rooms.id column
-- The issue is that rooms.id is still VARCHAR(10) but all foreign keys are VARCHAR(50)

-- Drop views that depend on the rooms table
DROP VIEW IF EXISTS active_rooms;
DROP VIEW IF EXISTS battle_statistics;

-- Drop foreign key constraints temporarily
ALTER TABLE room_players DROP CONSTRAINT IF EXISTS room_players_room_id_fkey;
ALTER TABLE battles DROP CONSTRAINT IF EXISTS battles_room_id_fkey;
ALTER TABLE spectators DROP CONSTRAINT IF EXISTS spectators_room_id_fkey;

-- NOW UPDATE THE PRIMARY KEY COLUMN - this is what we missed!
ALTER TABLE rooms ALTER COLUMN id TYPE VARCHAR(50);

-- Recreate foreign key constraints
ALTER TABLE room_players ADD CONSTRAINT room_players_room_id_fkey 
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

ALTER TABLE battles ADD CONSTRAINT battles_room_id_fkey 
  FOREIGN KEY (room_id) REFERENCES rooms(id);

ALTER TABLE spectators ADD CONSTRAINT spectators_room_id_fkey 
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

-- Recreate the views
CREATE VIEW active_rooms AS
SELECT 
  r.*,
  COUNT(rp.id) as current_players,
  COUNT(s.id) as spectator_count
FROM rooms r
LEFT JOIN room_players rp ON r.id = rp.room_id AND rp.is_spectator = FALSE
LEFT JOIN spectators s ON r.id = s.room_id
WHERE r.status IN ('waiting', 'in_progress')
GROUP BY r.id;

-- Create a simple battle_statistics view (since battles table might be empty)
CREATE VIEW battle_statistics AS
SELECT 
  1 as id,
  'placeholder'::VARCHAR(50) as room_id,
  'unknown' as winner,
  0 as total_turns,
  NOW() as completed_at,
  'Unknown' as attacker_player_name,
  'Unknown' as defender_player_name,
  'Unknown' as attacker_nation_name,
  'Unknown' as defender_nation_name,
  0 as attacker_cities,
  0 as defender_cities,
  0 as attacker_score,
  0 as defender_score
WHERE FALSE; -- This view will return no rows until battles exist

-- Verify the fix
SELECT 
  table_name, 
  column_name, 
  data_type, 
  character_maximum_length 
FROM information_schema.columns 
WHERE table_name IN ('rooms', 'room_players', 'battles', 'spectators') 
  AND column_name LIKE '%room_id%' 
  OR (table_name = 'rooms' AND column_name = 'id')
ORDER BY table_name, column_name;
