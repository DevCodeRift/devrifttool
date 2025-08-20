import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST method to run migration',
    endpoint: '/api/migrate-timer'
  })
}

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }

    console.log('Checking if last_turn_at column exists...')

    // Try to select from wars with last_turn_at to check if column exists
    const { error: testError } = await supabaseAdmin
      .from('wars')
      .select('id, last_turn_at')
      .limit(1)

    if (testError && testError.message.includes('does not exist')) {
      console.log('Column does not exist, manual fix needed')
      return NextResponse.json({ 
        error: 'Column last_turn_at does not exist',
        message: 'Please run: ALTER TABLE wars ADD COLUMN last_turn_at TIMESTAMP; manually in your database',
        sql: 'ALTER TABLE wars ADD COLUMN last_turn_at TIMESTAMP;'
      }, { status: 400 })
    } else if (testError) {
      console.error('Unexpected error:', testError)
      return NextResponse.json({ error: 'Database error', details: testError }, { status: 500 })
    }

    console.log('Column exists! Updating existing active wars...')

    // Update existing active wars
    const { error: updateError } = await supabaseAdmin
      .from('wars')
      .update({ last_turn_at: new Date().toISOString() })
      .eq('status', 'active')
      .is('last_turn_at', null)

    if (updateError) {
      console.error('Error updating existing wars:', updateError)
      return NextResponse.json({ error: 'Failed to update existing wars', details: updateError }, { status: 500 })
    }

    console.log('Migration completed successfully!')
    return NextResponse.json({ 
      success: true,
      message: 'Column exists and active wars updated successfully'
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
