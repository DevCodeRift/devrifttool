/**
 * Database Setup Test
 * This script tests the Supabase connection and checks if tables exist
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Manually load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envLines = envContent.split('\n')

const env = {}
envLines.forEach(line => {
  const match = line.match(/^([^#][^=]*?)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Testing Supabase Connection...\n')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Please check your .env.local file for:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testDatabase() {
  try {
    console.log('📡 Testing connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      if (error.message.includes('relation "rooms" does not exist')) {
        console.log('❌ Database tables not found!')
        console.log('\n📋 Setup Required:')
        console.log('1. Go to your Supabase project dashboard')
        console.log('2. Navigate to SQL Editor')
        console.log('3. Run the war_simulator_schema.sql script')
        console.log('4. The script is located at: database/war_simulator_schema.sql')
        console.log('\n💡 After running the schema, restart this test.')
        return false
      } else {
        console.error('❌ Database error:', error.message)
        return false
      }
    }
    
    console.log('✅ Connection successful!')
    
    // Test all required tables
    const tables = ['rooms', 'room_players', 'battles', 'battle_logs', 'spectators']
    console.log('\n🔍 Checking tables...')
    
    for (const table of tables) {
      try {
        await supabase.from(table).select('*', { count: 'exact', head: true })
        console.log(`✅ ${table} - OK`)
      } catch (err) {
        console.log(`❌ ${table} - Missing`)
        return false
      }
    }
    
    // Test views
    console.log('\n🔍 Checking views...')
    try {
      await supabase.from('active_rooms').select('*').limit(1)
      console.log('✅ active_rooms view - OK')
    } catch (err) {
      console.log('❌ active_rooms view - Missing')
      return false
    }
    
    try {
      await supabase.from('battle_statistics').select('*').limit(1)
      console.log('✅ battle_statistics view - OK')
    } catch (err) {
      console.log('❌ battle_statistics view - Missing')
      return false
    }
    
    console.log('\n🎉 Database setup is complete!')
    console.log('🚀 Your war simulator backend is ready for multiplayer!')
    
    return true
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

// Run the test
testDatabase().then(success => {
  if (success) {
    console.log('\n✅ All tests passed!')
    console.log('You can now start creating multiplayer rooms.')
  } else {
    console.log('\n❌ Setup incomplete.')
    console.log('Please follow the setup steps above.')
  }
  process.exit(success ? 0 : 1)
})
