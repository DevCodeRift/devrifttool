-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
-- This will fix the multiplayer battle schema

-- Step 1: Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS battle_logs CASCADE;
DROP TABLE IF EXISTS battle_actions CASCADE;
DROP TABLE IF EXISTS battle_room_players CASCADE;
DROP TABLE IF EXISTS battle_rooms CASCADE;

-- Also drop any old conflicting tables
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS room_players CASCADE;
DROP TABLE IF EXISTS active_rooms CASCADE;
DROP TABLE IF EXISTS spectators CASCADE;

-- Step 2: Create tables in correct order

-- Create battle_rooms (parent table)
CREATE TABLE battle_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_code VARCHAR(10) UNIQUE NOT NULL,
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

-- Create battle_room_players (references battle_rooms.id)
CREATE TABLE battle_room_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES battle_rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    side VARCHAR(20) CHECK (side IN ('attacker', 'defender')),
    nation_data JSONB,
    is_ready BOOLEAN DEFAULT false,
    is_host BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, player_id)
);

-- Create battle_actions (references battle_rooms.id)
CREATE TABLE battle_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES battle_rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL,
    turn_number INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_data JSONB NOT NULL,
    result_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sequence_number SERIAL
);

-- Create battle_logs (references battle_rooms.id)
CREATE TABLE battle_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES battle_rooms(id) ON DELETE CASCADE,
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

-- Step 3: Create indexes for performance
CREATE INDEX idx_battle_rooms_room_code ON battle_rooms(room_code);
CREATE INDEX idx_battle_rooms_status ON battle_rooms(status);
CREATE INDEX idx_battle_room_players_room_id ON battle_room_players(room_id);
CREATE INDEX idx_battle_room_players_player_id ON battle_room_players(player_id);
CREATE INDEX idx_battle_actions_room_id ON battle_actions(room_id);
CREATE INDEX idx_battle_actions_turn ON battle_actions(room_id, turn_number);
CREATE INDEX idx_battle_logs_room_id ON battle_logs(room_id);

-- Step 4: Enable Row Level Security
ALTER TABLE battle_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_logs ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies (allowing public access for now)
CREATE POLICY "Public access to battle rooms" ON battle_rooms FOR ALL USING (true);
CREATE POLICY "Public access to battle room players" ON battle_room_players FOR ALL USING (true);
CREATE POLICY "Public access to battle actions" ON battle_actions FOR ALL USING (true);
CREATE POLICY "Public access to battle logs" ON battle_logs FOR ALL USING (true);

-- Step 6: Create update timestamp function
CREATE OR REPLACE FUNCTION update_battle_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger for automatic timestamp updates
CREATE TRIGGER update_battle_rooms_timestamp
    BEFORE UPDATE ON battle_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_battle_room_timestamp();

-- Step 8: Verify tables were created successfully
SELECT 
    'Table created: ' || tablename as status,
    schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'battle_%'
ORDER BY tablename;
