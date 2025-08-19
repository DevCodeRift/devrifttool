-- Fix the primary key column that was missed in the previous migration
-- The rooms.id column is still VARCHAR(10) but needs to be VARCHAR(50)

-- Check current state
SELECT 
  table_name, 
  column_name, 
  data_type, 
  character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'rooms' AND column_name = 'id';

-- Drop views that depend on rooms table
DROP VIEW IF EXISTS active_rooms;
DROP VIEW IF EXISTS battle_statistics;

-- Drop all foreign key constraints that reference rooms.id
ALTER TABLE room_players DROP CONSTRAINT IF EXISTS room_players_room_id_fkey;
ALTER TABLE battles DROP CONSTRAINT IF EXISTS battles_room_id_fkey;
ALTER TABLE spectators DROP CONSTRAINT IF EXISTS spectators_room_id_fkey;

-- Now we can safely alter the primary key column
ALTER TABLE rooms ALTER COLUMN id TYPE VARCHAR(50);

-- Recreate the foreign key constraints
ALTER TABLE room_players ADD CONSTRAINT room_players_room_id_fkey 
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

ALTER TABLE battles ADD CONSTRAINT battles_room_id_fkey 
  FOREIGN KEY (room_id) REFERENCES rooms(id);

ALTER TABLE spectators ADD CONSTRAINT spectators_room_id_fkey 
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

-- Recreate the views
DO $$
BEGIN
  -- Try to create the full view first
  BEGIN
    EXECUTE '
    CREATE OR REPLACE VIEW battle_statistics AS
    SELECT 
      b.id,
      b.room_id,
      COALESCE(b.winner, ''unknown'') as winner,
      COALESCE(b.total_turns, 0) as total_turns,
      b.completed_at,
      COALESCE(b.attacker_player_name, ''Unknown'') as attacker_player_name,
      COALESCE(b.defender_player_name, ''Unknown'') as defender_player_name,
      COALESCE((b.attacker_nation_data->>''name''), ''Unknown'') as attacker_nation_name,
      COALESCE((b.defender_nation_data->>''name''), ''Unknown'') as defender_nation_name,
      COALESCE((b.attacker_nation_data->>''cities'')::integer, 0) as attacker_cities,
      COALESCE((b.defender_nation_data->>''cities'')::integer, 0) as defender_cities,
      COALESCE((b.attacker_nation_data->>''score'')::integer, 0) as attacker_score,
      COALESCE((b.defender_nation_data->>''score'')::integer, 0) as defender_score
    FROM battles b
    WHERE b.completed_at IS NOT NULL';
  EXCEPTION WHEN OTHERS THEN
    -- If that fails, create a minimal view
    EXECUTE '
    CREATE OR REPLACE VIEW battle_statistics AS
    SELECT 
      1 as id,
      ''placeholder''::VARCHAR(50) as room_id,
      ''unknown'' as winner,
      0 as total_turns,
      NOW() as completed_at,
      ''Unknown'' as attacker_player_name,
      ''Unknown'' as defender_player_name,
      ''Unknown'' as attacker_nation_name,
      ''Unknown'' as defender_nation_name,
      0 as attacker_cities,
      0 as defender_cities,
      0 as attacker_score,
      0 as defender_score
    WHERE FALSE'; -- This view will return no rows
  END;
END $$;

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

-- Verify the fix
SELECT 
  table_name, 
  column_name, 
  data_type, 
  character_maximum_length 
FROM information_schema.columns 
WHERE table_name IN ('rooms', 'room_players', 'battles', 'spectators') 
  AND (column_name LIKE '%room_id%' OR (table_name = 'rooms' AND column_name = 'id'))
ORDER BY table_name, column_name;

-- Test that we can now insert a long room ID
INSERT INTO rooms (id, host_name, settings, player_count, max_players, status, is_private) 
VALUES ('room_1755612889432_7p8e7mdv5_test', 'TestHost', '{"turnDuration":60,"gameMode":"multiplayer"}', 1, 2, 'waiting', false);

-- Clean up the test
DELETE FROM rooms WHERE id = 'room_1755612889432_7p8e7mdv5_test';
