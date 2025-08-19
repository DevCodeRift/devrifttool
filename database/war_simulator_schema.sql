-- War Simulator Database Schema
-- This creates tables for multiplayer rooms, players, battles, and battle logs

-- Rooms table - stores multiplayer game rooms
CREATE TABLE rooms (
  id VARCHAR(50) PRIMARY KEY,
  host_name VARCHAR(50) NOT NULL,
  settings JSONB NOT NULL, -- Store BattleSettings as JSON
  player_count INTEGER NOT NULL DEFAULT 1,
  max_players INTEGER NOT NULL DEFAULT 2,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- 'waiting', 'in_progress', 'completed'
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Players table - stores players in rooms
CREATE TABLE room_players (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(50) REFERENCES rooms(id) ON DELETE CASCADE,
  player_id VARCHAR(50) NOT NULL, -- Browser/session identifier
  player_name VARCHAR(50) NOT NULL,
  side VARCHAR(10) CHECK (side IN ('attacker', 'defender')) NULL,
  nation_data JSONB NULL, -- Store Nation object as JSON
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  is_spectator BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battles table - stores completed battles
CREATE TABLE battles (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(50) REFERENCES rooms(id),
  attacker_player_id VARCHAR(50) NOT NULL,
  attacker_player_name VARCHAR(50) NOT NULL,
  attacker_nation_data JSONB NOT NULL, -- Nation object
  attacker_initial_military JSONB NOT NULL,
  attacker_final_military JSONB NOT NULL,
  defender_player_id VARCHAR(50) NOT NULL,
  defender_player_name VARCHAR(50) NOT NULL,
  defender_nation_data JSONB NOT NULL, -- Nation object
  defender_initial_military JSONB NOT NULL,
  defender_final_military JSONB NOT NULL,
  battle_settings JSONB NOT NULL,
  winner VARCHAR(10) CHECK (winner IN ('attacker', 'defender', 'draw')) NULL,
  total_turns INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battle logs table - stores all battle actions for analysis
CREATE TABLE battle_logs (
  id SERIAL PRIMARY KEY,
  battle_id INTEGER REFERENCES battles(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  attacker_state JSONB NOT NULL,
  defender_state JSONB NOT NULL,
  attacker_losses JSONB NOT NULL,
  defender_losses JSONB NOT NULL,
  damage_dealt JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spectators table - tracks who's watching battles
CREATE TABLE spectators (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(50) REFERENCES rooms(id) ON DELETE CASCADE,
  spectator_id VARCHAR(50) NOT NULL, -- Browser/session identifier
  spectator_name VARCHAR(50) NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_created_at ON rooms(created_at);
CREATE INDEX idx_room_players_room_id ON room_players(room_id);
CREATE INDEX idx_battles_room_id ON battles(room_id);
CREATE INDEX idx_battle_logs_battle_id ON battle_logs(battle_id);
CREATE INDEX idx_spectators_room_id ON spectators(room_id);

-- Views for analytics
CREATE VIEW battle_statistics AS
SELECT 
  b.id,
  b.room_id,
  b.winner,
  b.total_turns,
  b.completed_at,
  b.attacker_player_name,
  b.defender_player_name,
  (b.attacker_nation_data->>'name') as attacker_nation_name,
  (b.defender_nation_data->>'name') as defender_nation_name,
  (b.attacker_nation_data->>'cities')::integer as attacker_cities,
  (b.defender_nation_data->>'cities')::integer as defender_cities,
  (b.attacker_nation_data->>'score')::integer as attacker_score,
  (b.defender_nation_data->>'score')::integer as defender_score
FROM battles b
WHERE b.completed_at IS NOT NULL;

-- View for current active rooms
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
