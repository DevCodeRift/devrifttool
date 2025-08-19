import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

if (!supabaseAdmin) {
  throw new Error('Supabase admin client not initialized')
}

const supabase = supabaseAdmin

/**
 * POST /api/wars-v2/advance-turn - Advance turn and regenerate MAPs for all active wars
 */
export async function POST(request: NextRequest) {
  try {
    const { warId } = await request.json()

    if (warId) {
      // Advance specific war
      const result = await advanceWarTurn(warId)
      return NextResponse.json(result)
    } else {
      // Advance all active wars (for cron job)
      const { data: activeWars } = await supabase
        .from('wars')
        .select('id')
        .eq('status', 'active')

      const results = []
      for (const war of activeWars || []) {
        const result = await advanceWarTurn(war.id)
        results.push({ warId: war.id, result })
      }

      return NextResponse.json({
        success: true,
        message: `Advanced ${results.length} wars`,
        results
      })
    }
  } catch (error) {
    console.error('Advance turn error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function advanceWarTurn(warId: string) {
  try {
    // Get current war
    const { data: war, error: warError } = await supabase
      .from('wars')
      .select('*')
      .eq('id', warId)
      .eq('status', 'active')
      .single()

    if (warError || !war) {
      return { error: 'War not found or not active' }
    }

    // Advance turn
    const newTurn = war.current_turn + 1
    
    const { error: warUpdateError } = await supabase
      .from('wars')
      .update({ current_turn: newTurn })
      .eq('id', warId)

    if (warUpdateError) {
      console.error('Error updating war turn:', warUpdateError)
      return { error: 'Failed to update war turn' }
    }

    // Regenerate MAPs for all active participants (+1 MAP per turn, max 12)
    const { data: participants } = await supabase
      .from('war_participants')
      .select('id, current_maps, max_maps')
      .eq('war_id', warId)
      .eq('is_spectator', false)
      .eq('is_eliminated', false)

    const mapUpdates = []
    for (const participant of participants || []) {
      const newMaps = Math.min(participant.max_maps, participant.current_maps + 1)
      
      if (newMaps !== participant.current_maps) {
        mapUpdates.push(
          supabase
            .from('war_participants')
            .update({ current_maps: newMaps })
            .eq('id', participant.id)
        )
      }
    }

    // Execute all MAP updates
    if (mapUpdates.length > 0) {
      await Promise.all(mapUpdates)
    }

    // Check if war should end due to turn limit (60 turns = 5 days)
    if (newTurn >= 60) {
      await supabase
        .from('wars')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', warId)

      return {
        success: true,
        turn: newTurn,
        mapRegenerated: mapUpdates.length,
        warEnded: true,
        message: 'War ended due to turn limit'
      }
    }

    return {
      success: true,
      turn: newTurn,
      mapRegenerated: mapUpdates.length,
      warEnded: false,
      message: `Turn advanced to ${newTurn}, regenerated MAPs for ${mapUpdates.length} participants`
    }

  } catch (error) {
    console.error('Error advancing war turn:', error)
    return { error: 'Failed to advance turn' }
  }
}
