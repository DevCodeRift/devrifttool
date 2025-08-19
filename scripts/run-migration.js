const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables (you'll need to set these)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'

async function runMigration() {
  console.log('🔧 Running database migration to fix room_id column lengths...')
  
  if (supabaseUrl.includes('placeholder') || supabaseServiceKey.includes('placeholder')) {
    console.error('❌ Please set your Supabase environment variables first!')
    console.log('   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url')
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-key')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Read migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'migrate_room_id_length.sql'), 
      'utf8'
    )

    // Split into individual statements (basic approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('\\d'))

    console.log(`📝 Executing ${statements.length} migration statements...`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement) {
        console.log(`   ${i + 1}. ${statement.substring(0, 50)}...`)
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement 
        })
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error)
          return
        }
      }
    }

    console.log('✅ Migration completed successfully!')
    console.log('🎉 Room creation should now work with longer room IDs!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

// Alternative: Direct SQL execution if rpc doesn't work
async function runMigrationDirect() {
  console.log('🔧 Running migration with direct SQL execution...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const migrations = [
    "ALTER TABLE room_players DROP CONSTRAINT IF EXISTS room_players_room_id_fkey",
    "ALTER TABLE battles DROP CONSTRAINT IF EXISTS battles_room_id_fkey", 
    "ALTER TABLE spectators DROP CONSTRAINT IF EXISTS spectators_room_id_fkey",
    "ALTER TABLE room_players ALTER COLUMN room_id TYPE VARCHAR(50)",
    "ALTER TABLE battles ALTER COLUMN room_id TYPE VARCHAR(50)",
    "ALTER TABLE spectators ALTER COLUMN room_id TYPE VARCHAR(50)",
    "ALTER TABLE room_players ADD CONSTRAINT room_players_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE",
    "ALTER TABLE battles ADD CONSTRAINT battles_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id)",
    "ALTER TABLE spectators ADD CONSTRAINT spectators_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE"
  ]

  for (let i = 0; i < migrations.length; i++) {
    const sql = migrations[i]
    console.log(`   ${i + 1}. ${sql}`)
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql })
      
      if (error) {
        console.log(`     ⚠️  ${error.message}`)
        // Continue with other statements
      } else {
        console.log(`     ✅ Success`)
      }
    } catch (err) {
      console.log(`     ⚠️  ${err.message}`)
    }
  }

  console.log('✅ Migration attempt completed!')
}

if (require.main === module) {
  runMigrationDirect()
}
