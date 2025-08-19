-- War Simulator V2 - Clean Architecture
-- Supports multiple concurrent wars with any player count

-- Drop existing tables if they exist
DROP TABLE IF EXISTS battle_actions CASCADE;
DROP TABLE IF EXISTS war_participants CASCADE;
DROP TABLE IF EXISTS wars CASCADE;

-- Wars table - each war can have multiple participants
CREATE TABLE wars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL, -- Player who created the war
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, active, completed
    max_players INTEGER NOT NULL DEFAULT 2,
    current_players INTEGER NOT NULL DEFAULT 0,
    turn_duration INTEGER NOT NULL DEFAULT 120, -- seconds per MAP regeneration
    current_turn INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- War participants - links players to wars with their nation data
CREATE TABLE war_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    war_id UUID NOT NULL REFERENCES wars(id) ON DELETE CASCADE,
    player_id VARCHAR(255) NOT NULL, -- Can be user ID or guest ID
    player_name VARCHAR(255) NOT NULL,
    nation_name VARCHAR(255) NOT NULL,
    nation_id INTEGER, -- P&W nation ID if imported
    
    -- Current military counts
    soldiers INTEGER NOT NULL DEFAULT 0,
    tanks INTEGER NOT NULL DEFAULT 0,
    aircraft INTEGER NOT NULL DEFAULT 0,
    ships INTEGER NOT NULL DEFAULT 0,
    
    -- Nation stats
    cities INTEGER NOT NULL DEFAULT 10,
    resistance INTEGER NOT NULL DEFAULT 100,
    current_maps INTEGER NOT NULL DEFAULT 6,
    max_maps INTEGER NOT NULL DEFAULT 12,
    
    -- Space control
    ground_control BOOLEAN DEFAULT FALSE,
    air_superiority BOOLEAN DEFAULT FALSE,
    blockade BOOLEAN DEFAULT FALSE,
    fortified BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_host BOOLEAN DEFAULT FALSE,
    is_spectator BOOLEAN DEFAULT FALSE,
    is_eliminated BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(war_id, player_id)
);

-- Battle actions log - stores every action taken for AI training
CREATE TABLE battle_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    war_id UUID NOT NULL REFERENCES wars(id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    
    -- Action details
    attacker_id UUID NOT NULL REFERENCES war_participants(id),
    defender_id UUID NOT NULL REFERENCES war_participants(id),
    action_type VARCHAR(50) NOT NULL, -- ground_attack, airstrike, naval_attack
    target VARCHAR(50), -- For airstrikes: aircraft, soldiers, tanks, ships
    
    -- Military used in attack
    soldiers_used INTEGER DEFAULT 0,
    tanks_used INTEGER DEFAULT 0,
    aircraft_used INTEGER DEFAULT 0,
    ships_used INTEGER DEFAULT 0,
    maps_used INTEGER NOT NULL,
    
    -- Pre-action military counts (for AI training)
    att_pre_soldiers INTEGER NOT NULL,
    att_pre_tanks INTEGER NOT NULL,
    att_pre_aircraft INTEGER NOT NULL,
    att_pre_ships INTEGER NOT NULL,
    att_pre_resistance INTEGER NOT NULL,
    att_pre_maps INTEGER NOT NULL,
    
    def_pre_soldiers INTEGER NOT NULL,
    def_pre_tanks INTEGER NOT NULL,
    def_pre_aircraft INTEGER NOT NULL,
    def_pre_ships INTEGER NOT NULL,
    def_pre_resistance INTEGER NOT NULL,
    
    -- Battle results
    victory_type VARCHAR(50) NOT NULL, -- immense_triumph, moderate_success, pyrrhic_victory, utter_failure
    rolls_won INTEGER NOT NULL,
    attacker_roll_1 DECIMAL(10,2),
    attacker_roll_2 DECIMAL(10,2),
    attacker_roll_3 DECIMAL(10,2),
    defender_roll_1 DECIMAL(10,2),
    defender_roll_2 DECIMAL(10,2),
    defender_roll_3 DECIMAL(10,2),
    
    -- Casualties
    att_soldiers_lost INTEGER DEFAULT 0,
    att_tanks_lost INTEGER DEFAULT 0,
    att_aircraft_lost INTEGER DEFAULT 0,
    att_ships_lost INTEGER DEFAULT 0,
    
    def_soldiers_lost INTEGER DEFAULT 0,
    def_tanks_lost INTEGER DEFAULT 0,
    def_aircraft_lost INTEGER DEFAULT 0,
    def_ships_lost INTEGER DEFAULT 0,
    
    -- Damage dealt
    resistance_damage INTEGER NOT NULL,
    infrastructure_damage DECIMAL(10,2) DEFAULT 0,
    
    -- Space control changes
    space_control_gained VARCHAR(50),
    space_control_lost VARCHAR(50),
    
    -- Timestamp
    executed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_wars_status ON wars(status);
CREATE INDEX idx_wars_created_by ON wars(created_by);
CREATE INDEX idx_war_participants_war_id ON war_participants(war_id);
CREATE INDEX idx_war_participants_player_id ON war_participants(player_id);
CREATE INDEX idx_battle_actions_war_id ON battle_actions(war_id);
CREATE INDEX idx_battle_actions_turn ON battle_actions(war_id, turn_number);
CREATE INDEX idx_battle_actions_attacker ON battle_actions(attacker_id);
CREATE INDEX idx_battle_actions_defender ON battle_actions(defender_id);

-- Functions to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wars_updated_at BEFORE UPDATE ON wars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
