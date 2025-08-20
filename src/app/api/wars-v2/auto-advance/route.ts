import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const supabase = supabaseAdmin

/**
 * POST /api/wars-v2/auto-advance - Automatically advance turns for wars with expired timers
 */
export async function POST() {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }

    // Find active wars where the turn timer has expired
    const { data: wars, error: warsError } = await supabase
      .from('wars')
      .select('id, name, turn_duration, current_turn, last_turn_at')
      .eq('status', 'active')
      .not('last_turn_at', 'is', null)

    if (warsError) {
      // Check if it's the missing column error
      if (warsError.message.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database migration required',
          message: 'Column last_turn_at does not exist. Please run migration first.',
          advanced: 0
        }, { status: 400 })
      }
      console.error('Error fetching wars for auto-advance:', warsError)
      return NextResponse.json({ error: 'Failed to fetch wars' }, { status: 500 })
    }

    if (!wars || wars.length === 0) {
      return NextResponse.json({ 
        message: 'No active wars to check',
        advanced: 0
      })
    }

    const now = new Date()
    const warsToAdvance = wars.filter(war => {
      if (!war.last_turn_at) return false
      const lastTurnTime = new Date(war.last_turn_at)
      const timeSinceLastTurn = (now.getTime() - lastTurnTime.getTime()) / 1000 // seconds
      return timeSinceLastTurn >= war.turn_duration
    })

    if (warsToAdvance.length === 0) {
      return NextResponse.json({ 
        message: 'No wars ready for turn advancement',
        advanced: 0
      })
    }

    let advancedCount = 0
    const results = []

    for (const war of warsToAdvance) {
      try {
        // Get all non-spectator participants for this war
        const { data: participants, error: participantsError } = await supabase
          .from('war_participants')
          .select('id, current_maps, max_maps')
          .eq('war_id', war.id)
          .eq('is_spectator', false)
          .eq('is_eliminated', false)

        if (participantsError) {
          console.error(`Error fetching participants for war ${war.id}:`, participantsError)
          continue
        }

        if (!participants || participants.length === 0) {
          console.log(`No active participants found for war ${war.id}`)
          continue
        }

        // Give +1 MAP to all participants (up to their max)
        const updates = participants.map(participant => {
          const newMaps = Math.min(participant.current_maps + 1, participant.max_maps)
          return supabase
            .from('war_participants')
            .update({ current_maps: newMaps })
            .eq('id', participant.id)
        })

        await Promise.all(updates)

        // Update war's turn number and last_turn_at
        const { error: warUpdateError } = await supabase
          .from('wars')
          .update({
            current_turn: war.current_turn + 1,
            last_turn_at: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', war.id)

        if (warUpdateError) {
          console.error(`Error updating war ${war.id}:`, warUpdateError)
          continue
        }

        advancedCount++
        results.push({
          warId: war.id,
          warName: war.name,
          newTurn: war.current_turn + 1,
          participantsUpdated: participants.length
        })

        console.log(`Advanced turn for war "${war.name}" (${war.id}) to turn ${war.current_turn + 1}`)
      } catch (error) {
        console.error(`Error processing war ${war.id}:`, error)
      }
    }

    return NextResponse.json({
      message: `Advanced ${advancedCount} war(s)`,
      advanced: advancedCount,
      results
    })

  } catch (error) {
    console.error('Auto-advance API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
