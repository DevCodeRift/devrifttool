-- Recreate Multiplayer Battle System Tables
-- This script drops existing tables and recreates them with the correct structure

-- Drop existing tables and their dependencies in reverse order
DROP TABLE IF EXISTS battle_logs CASCADE;
DROP TABLE IF EXISTS battle_actions CASCADE;
DROP TABLE IF EXISTS battle_room_players CASCADE;
DROP TABLE IF EXISTS battle_rooms CASCADE;

-- Drop any conflicting tables that might exist
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS room_players CASCADE;
DROP TABLE IF EXISTS active_rooms CASCADE;
DROP TABLE IF EXISTS spectators CASCADE;

-- Drop existing functions and triggers (if they exist)
-- Note: Triggers will be dropped automatically with CASCADE when tables are dropped
DROP FUNCTION IF EXISTS update_battle_room_timestamp();

-- Now recreate the tables with the correct structure

-- Battle rooms for multiplayer war simulation
CREATE TABLE battle_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_code VARCHAR(50) UNIQUE NOT NULL, -- Increased from 10 to 50 to accommodate generated room IDs
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'abandoned')),
    settings JSONB NOT NULL,
    current_turn INTEGER DEFAULT 1,
    max_turns INTEGER DEFAULT 60,
    active_player_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Battle room players
CREATE TABLE battle_room_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES battle_rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL, -- Can be user_id or temporary player ID
    player_name VARCHAR(100) NOT NULL,
    side VARCHAR(20) CHECK (side IN ('attacker', 'defender')),
    nation_data JSONB, -- Full nation state
    is_ready BOOLEAN DEFAULT false,
    is_host BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, player_id)
);

-- Battle actions log for synchronization
CREATE TABLE battle_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES battle_rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL,
    turn_number INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_data JSONB NOT NULL, -- Contains all action parameters
    result_data JSONB, -- Battle calculation results
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sequence_number SERIAL -- Ensures ordering within a turn
);

-- Battle logs for display
CREATE TABLE battle_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES battle_rooms(id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    attacker_name VARCHAR(100) NOT NULL,
    defender_name VARCHAR(100) NOT NULL,
    action VARCHAR(200) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    result VARCHAR(20) NOT NULL,
    victory_type VARCHAR(20),
    message TEXT NOT NULL,
    attacker_casualties JSONB DEFAULT '{}',
    defender_casualties JSONB DEFAULT '{}',
    resistance_damage INTEGER DEFAULT 0,
    infrastructure_damage INTEGER DEFAULT 0,
    loot JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_battle_rooms_room_code ON battle_rooms(room_code);
CREATE INDEX idx_battle_rooms_status ON battle_rooms(status);
CREATE INDEX idx_battle_room_players_room_id ON battle_room_players(room_id);
CREATE INDEX idx_battle_room_players_player_id ON battle_room_players(player_id);
CREATE INDEX idx_battle_actions_room_id ON battle_actions(room_id);
CREATE INDEX idx_battle_actions_turn ON battle_actions(room_id, turn_number);
CREATE INDEX idx_battle_logs_room_id ON battle_logs(room_id);

-- Enable Row Level Security
ALTER TABLE battle_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for battle rooms (public access for now, can be restricted later)
CREATE POLICY "Anyone can view battle rooms" ON battle_rooms
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create battle rooms" ON battle_rooms
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Players can update their battle rooms" ON battle_rooms
    FOR UPDATE USING (true);

-- RLS Policies for battle room players
CREATE POLICY "Anyone can view battle room players" ON battle_room_players
    FOR SELECT USING (true);

CREATE POLICY "Anyone can join battle rooms" ON battle_room_players
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Players can update their own data" ON battle_room_players
    FOR UPDATE USING (true);

-- RLS Policies for battle actions
CREATE POLICY "Anyone can view battle actions" ON battle_actions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can record battle actions" ON battle_actions
    FOR INSERT WITH CHECK (true);

-- RLS Policies for battle logs
CREATE POLICY "Anyone can view battle logs" ON battle_logs
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create battle logs" ON battle_logs
    FOR INSERT WITH CHECK (true);

-- Function to update room updated_at timestamp
CREATE OR REPLACE FUNCTION update_battle_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_battle_rooms_timestamp
    BEFORE UPDATE ON battle_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_battle_room_timestamp();

-- Create a view for active rooms (for backward compatibility with existing API)
CREATE VIEW active_rooms AS
SELECT 
    br.id,
    br.room_code,
    br.status,
    br.settings,
    br.current_turn,
    br.max_turns,
    br.created_at,
    br.updated_at,
    COUNT(brp.id) as player_count,
    MAX(CASE WHEN brp.is_host = true THEN brp.player_name END) as host_name
FROM battle_rooms br
LEFT JOIN battle_room_players brp ON br.id = brp.room_id
WHERE br.status IN ('waiting', 'in_progress')
GROUP BY br.id, br.room_code, br.status, br.settings, br.current_turn, br.max_turns, br.created_at, br.updated_at;
