import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { BattleSettings, Nation, Military } from '@/types/war'

// Ensure supabase admin client is available
if (!supabaseAdmin) {
  throw new Error('Supabase admin client not initialized - check environment variables')
}

const supabase = supabaseAdmin

export interface BattleResult {
  roomId: string
  attackerData: {
    playerId: string
    playerName: string
    nation: Nation
    initialMilitary: Military
    finalMilitary: Military
  }
  defenderData: {
    playerId: string
    playerName: string
    nation: Nation
    initialMilitary: Military
    finalMilitary: Military
  }
  settings: BattleSettings
  winner: 'attacker' | 'defender'
  turns: Array<{
    turnNumber: number
    attacker: Military
    defender: Military
    attackerLosses: Military
    defenderLosses: Military
    damage: Record<string, number>
  }>
  completedAt: string
}

// POST /api/war/battles - Log a completed battle
export async function POST(request: NextRequest) {
  try {
    const battleResult: BattleResult = await request.json()

    if (!battleResult.roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 })
    }

    // Create battle record
    const { data: battle, error: battleError } = await supabase
      .from('battles')
      .insert({
        room_id: battleResult.roomId,
        attacker_player_id: battleResult.attackerData.playerId,
        attacker_player_name: battleResult.attackerData.playerName,
        attacker_nation_data: battleResult.attackerData.nation,
        attacker_initial_military: battleResult.attackerData.initialMilitary,
        attacker_final_military: battleResult.attackerData.finalMilitary,
        defender_player_id: battleResult.defenderData.playerId,
        defender_player_name: battleResult.defenderData.playerName,
        defender_nation_data: battleResult.defenderData.nation,
        defender_initial_military: battleResult.defenderData.initialMilitary,
        defender_final_military: battleResult.defenderData.finalMilitary,
        battle_settings: battleResult.settings,
        winner: battleResult.winner,
        total_turns: battleResult.turns.length,
        completed_at: battleResult.completedAt
      })
      .select()
      .single()

    if (battleError) {
      console.error('Error creating battle record:', battleError)
      return NextResponse.json({ error: 'Failed to create battle record' }, { status: 500 })
    }

    // Create battle log entries
    const logEntries = battleResult.turns.map(turn => ({
      battle_id: battle.id,
      turn_number: turn.turnNumber,
      attacker_state: turn.attacker,
      defender_state: turn.defender,
      attacker_losses: turn.attackerLosses,
      defender_losses: turn.defenderLosses,
      damage_dealt: turn.damage
    }))

    const { error: logError } = await supabase
      .from('battle_logs')
      .insert(logEntries)

    if (logError) {
      console.error('Error creating battle logs:', logError)
      return NextResponse.json({ error: 'Failed to create battle logs' }, { status: 500 })
    }

    // Update room status to completed
    await supabase
      .from('rooms')
      .update({ 
        status: 'completed',
        completed_at: battleResult.completedAt
      })
      .eq('id', battleResult.roomId)

    return NextResponse.json({ 
      success: true, 
      battleId: battle.id 
    })
  } catch (error) {
    console.error('Error in POST /api/war/battles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/war/battles - Get battle history and analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const battleId = searchParams.get('battleId')
    const playerId = searchParams.get('playerId')
    const includeDetails = searchParams.get('includeDetails') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    if (battleId) {
      // Get specific battle with logs
      const { data: battle, error: battleError } = await supabase
        .from('battles')
        .select(`
          *,
          battle_logs(*)
        `)
        .eq('id', battleId)
        .single()

      if (battleError || !battle) {
        return NextResponse.json({ error: 'Battle not found' }, { status: 404 })
      }

      return NextResponse.json(battle)
    } else if (playerId) {
      // Get battles for specific player
      let query
      if (includeDetails) {
        query = supabase
          .from('battles')
          .select(`
            *,
            battle_logs(*)
          `)
          .or(`attacker_player_id.eq.${playerId},defender_player_id.eq.${playerId}`)
          .order('completed_at', { ascending: false })
          .limit(limit)
      } else {
        query = supabase
          .from('battles')
          .select('*')
          .or(`attacker_player_id.eq.${playerId},defender_player_id.eq.${playerId}`)
          .order('completed_at', { ascending: false })
          .limit(limit)
      }

      const { data: battles, error } = await query

      if (error) {
        console.error('Error fetching player battles:', error)
        return NextResponse.json({ error: 'Failed to fetch battles' }, { status: 500 })
      }

      return NextResponse.json(battles || [])
    } else {
      // Get recent battles (public leaderboard)
      const { data: battles, error } = await supabase
        .from('battle_statistics')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent battles:', error)
        return NextResponse.json({ error: 'Failed to fetch battles' }, { status: 500 })
      }

      return NextResponse.json(battles || [])
    }
  } catch (error) {
    console.error('Error in GET /api/war/battles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
