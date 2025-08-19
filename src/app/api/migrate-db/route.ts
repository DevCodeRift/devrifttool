import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = supabaseAdmin
    
    if (!supabase) {
      throw new Error('Supabase admin client not available')
    }
    
    console.log('Starting database migration for multiplayer battle tables...')
    
    // Step 1: Drop existing conflicting tables
    const dropQueries = [
      'DROP TABLE IF EXISTS battle_logs CASCADE',
      'DROP TABLE IF EXISTS battle_actions CASCADE', 
      'DROP TABLE IF EXISTS battle_room_players CASCADE',
      'DROP TABLE IF EXISTS battle_rooms CASCADE',
      'DROP TABLE IF EXISTS rooms CASCADE',
      'DROP TABLE IF EXISTS room_players CASCADE'
    ]
    
    for (const query of dropQueries) {
      console.log(`Executing: ${query}`)
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error && !error.message.includes('does not exist')) {
        console.error(`Error dropping table: ${error.message}`)
      }
    }
    
    // Step 2: Create tables in correct order
    
    // Create battle_rooms first (parent table)
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
        )
      `
    })
    
    if (roomsError) {
      throw new Error(`Failed to create battle_rooms: ${roomsError.message}`)
    }
    
    // Create battle_room_players (references battle_rooms)
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
        )
      `
    })
    
    if (playersError) {
      throw new Error(`Failed to create battle_room_players: ${playersError.message}`)
    }
    
    // Create battle_actions
    console.log('Creating battle_actions table...')
    const { error: actionsError } = await supabase.rpc('exec_sql', {
      sql: `
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
        )
      `
    })
    
    if (actionsError) {
      throw new Error(`Failed to create battle_actions: ${actionsError.message}`)
    }
    
    // Create battle_logs
    console.log('Creating battle_logs table...')
    const { error: logsError } = await supabase.rpc('exec_sql', {
      sql: `
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
        )
      `
    })
    
    if (logsError) {
      throw new Error(`Failed to create battle_logs: ${logsError.message}`)
    }
    
    // Step 3: Create indexes
    console.log('Creating indexes...')
    const indexes = [
      'CREATE INDEX idx_battle_rooms_room_code ON battle_rooms(room_code)',
      'CREATE INDEX idx_battle_rooms_status ON battle_rooms(status)',
      'CREATE INDEX idx_battle_room_players_room_id ON battle_room_players(room_id)',
      'CREATE INDEX idx_battle_room_players_player_id ON battle_room_players(player_id)',
      'CREATE INDEX idx_battle_actions_room_id ON battle_actions(room_id)',
      'CREATE INDEX idx_battle_logs_room_id ON battle_logs(room_id)'
    ]
    
    for (const indexQuery of indexes) {
      const { error } = await supabase.rpc('exec_sql', { sql: indexQuery })
      if (error) {
        console.warn(`Index creation warning: ${error.message}`)
      }
    }
    
    // Step 4: Enable RLS and create policies
    console.log('Setting up RLS policies...')
    const rlsQueries = [
      'ALTER TABLE battle_rooms ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE battle_room_players ENABLE ROW LEVEL SECURITY', 
      'ALTER TABLE battle_actions ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE battle_logs ENABLE ROW LEVEL SECURITY',
      
      `CREATE POLICY "Public access to battle rooms" ON battle_rooms FOR ALL USING (true)`,
      `CREATE POLICY "Public access to battle room players" ON battle_room_players FOR ALL USING (true)`,
      `CREATE POLICY "Public access to battle actions" ON battle_actions FOR ALL USING (true)`,
      `CREATE POLICY "Public access to battle logs" ON battle_logs FOR ALL USING (true)`
    ]
    
    for (const query of rlsQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error && !error.message.includes('already exists')) {
        console.warn(`RLS setup warning: ${error.message}`)
      }
    }
    
    console.log('✅ Database migration completed successfully!')
    
    return NextResponse.json({ 
      success: true,
      message: 'Database migration completed successfully'
    })
    
  } catch (error: unknown) {
    console.error('❌ Migration failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    )
  }
}
