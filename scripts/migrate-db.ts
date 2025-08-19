// Database migration script to fix multiplayer schema
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('Starting database migration...')
  
  try {
    // Drop existing tables in reverse dependency order
    console.log('Dropping existing tables...')
    
    const dropQueries = [
      'DROP TABLE IF EXISTS battle_logs CASCADE;',
      'DROP TABLE IF EXISTS battle_actions CASCADE;',
      'DROP TABLE IF EXISTS battle_room_players CASCADE;',
      'DROP TABLE IF EXISTS battle_rooms CASCADE;',
      'DROP TABLE IF EXISTS rooms CASCADE;',
      'DROP TABLE IF EXISTS room_players CASCADE;',
      'DROP TABLE IF EXISTS active_rooms CASCADE;',
      'DROP TABLE IF EXISTS spectators CASCADE;'
    ]
    
    for (const query of dropQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.log(`Note: ${query} - ${error.message}`)
      }
    }
    
    // Create battle_rooms table
    console.log('Creating battle_rooms table...')
    const { error: roomsError } = await supabase.rpc('exec_sql', { 
      sql: `
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
      `
    })
    
    if (roomsError) {
      throw roomsError
    }
    
    // Create battle_room_players table
    console.log('Creating battle_room_players table...')
    const { error: playersError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    })
    
    if (playersError) {
      throw playersError
    }
    
    // Create other tables...
    console.log('Creating remaining tables...')
    const remainingTables = [
      `CREATE TABLE battle_actions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        room_id UUID NOT NULL REFERENCES battle_rooms(id) ON DELETE CASCADE,
        player_id UUID NOT NULL,
        turn_number INTEGER NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        action_data JSONB NOT NULL,
        result_data JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        sequence_number SERIAL
      );`,
      
      `CREATE TABLE battle_logs (
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
      );`
    ]
    
    for (const query of remainingTables) {
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        throw error
      }
    }
    
    console.log('✅ Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Check if we're running this as a script
if (require.main === module) {
  runMigration()
}

export { runMigration }
