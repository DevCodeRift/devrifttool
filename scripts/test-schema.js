// Test script to check current database schema
const { createClient } = require('@supabase/supabase-js')

// These should match your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-url-here'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-key-here'

async function checkSchema() {
  console.log('🔍 Checking current database schema...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Check room_id columns in all tables
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type, character_maximum_length')
      .or('table_name.in.(rooms,room_players,battles,spectators),column_name.like.%room_id%')
      .order('table_name')
    
    if (error) {
      console.error('❌ Error checking schema:', error)
      return
    }
    
    console.log('📊 Current schema:')
    console.table(data)
    
    // Try to insert a test room with long ID
    const testRoomId = 'room_1755612889432_test123'
    console.log(`\n🧪 Testing insertion with room ID: ${testRoomId} (${testRoomId.length} chars)`)
    
    const { data: insertData, error: insertError } = await supabase
      .from('rooms')
      .insert({
        id: testRoomId,
        host_name: 'Test Host',
        settings: { turnDuration: 60, gameMode: 'multiplayer' },
        player_count: 1,
        max_players: 2
      })
      .select()
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError)
    } else {
      console.log('✅ Insert successful:', insertData)
      
      // Clean up test data
      await supabase.from('rooms').delete().eq('id', testRoomId)
      console.log('🧹 Test data cleaned up')
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

checkSchema()
