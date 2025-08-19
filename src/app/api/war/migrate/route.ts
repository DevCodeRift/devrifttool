import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// This endpoint applies database migrations for war simulator
export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 })
    }

    console.log('Applying database migration: fix_duplicate_players')

    // Remove duplicate players (keep the most recent one)
    const { error: deleteError } = await supabaseAdmin.rpc('execute_sql', {
      sql: `
        DELETE FROM room_players a 
        USING room_players b
        WHERE a.room_id = b.room_id 
          AND a.player_id = b.player_id 
          AND a.id < b.id;
      `
    })

    if (deleteError) {
      console.error('Failed to remove duplicates:', deleteError)
      // Continue anyway, the constraint might still work
    }

    // Try to add unique constraint (will succeed if it doesn't already exist)
    const { error: constraintError } = await supabaseAdmin.rpc('execute_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'unique_room_player'
          ) THEN
            ALTER TABLE room_players 
            ADD CONSTRAINT unique_room_player 
            UNIQUE (room_id, player_id);
          END IF;
        END $$;
      `
    })

    if (constraintError) {
      console.error('Failed to add constraint:', constraintError)
      return NextResponse.json({ 
        error: 'Failed to apply database migration',
        details: constraintError.message 
      }, { status: 500 })
    }

    console.log('Database migration applied successfully')
    return NextResponse.json({ 
      success: true,
      message: 'Database migration applied successfully' 
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Failed to apply migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
