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

    console.log('Adding last_turn_at column to wars table...')

    // Add the column using direct SQL
    const { error: addColumnError } = await supabaseAdmin
      .from('wars')
      .select('last_turn_at')
      .limit(1)

    if (addColumnError && addColumnError.message.includes('does not exist')) {
      // Column doesn't exist, add it
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: 'ALTER TABLE wars ADD COLUMN last_turn_at TIMESTAMP;'
      })

      if (error) {
        console.error('Error adding column:', error)
        return NextResponse.json({ error: 'Failed to add column', details: error }, { status: 500 })
      }

      console.log('Column added successfully!')
    } else if (!addColumnError) {
      console.log('Column already exists!')
    } else {
      console.error('Unexpected error checking column:', addColumnError)
      return NextResponse.json({ error: 'Failed to check column', details: addColumnError }, { status: 500 })
    }

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
      message: 'Successfully added last_turn_at column and updated existing wars'
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
