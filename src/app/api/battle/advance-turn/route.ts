import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId } = body

    if (!roomId) {
      return NextResponse.json(
        { error: 'Missing roomId' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      )
    }

    // Get current room state
    const { data: room, error: roomError } = await supabase
      .from('battle_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    if (room.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Battle not in progress' },
        { status: 400 }
      )
    }

    // Advance turn and generate MAP for both players
    const newTurn = room.current_turn + 1

    // Get both players
    const { data: players, error: playersError } = await supabase
      .from('battle_room_players')
      .select('*')
      .eq('room_id', roomId)

    if (playersError || !players || players.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid room state' },
        { status: 400 }
      )
    }

    // Generate MAP for both players (add 1 MAP to each player's nations)
    const updatedPlayers = players.map(player => {
      if (player.nation_data && typeof player.nation_data === 'object') {
        const nationData = { ...player.nation_data }
        // Add 1 MAP to the nation
        nationData.military_action_points = (nationData.military_action_points || 0) + 1
        return {
          ...player,
          nation_data: nationData
        }
      }
      return player
    })

    // Update players with new MAP
    for (const player of updatedPlayers) {
      await supabase
        .from('battle_room_players')
        .update({ nation_data: player.nation_data })
        .eq('id', player.id)
    }

    // Update room turn counter
    const { error: updateError } = await supabase
      .from('battle_rooms')
      .update({ 
        current_turn: newTurn,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update room' },
        { status: 500 }
      )
    }

    // Check if max turns reached
    if (newTurn >= room.max_turns) {
      await supabase
        .from('battle_rooms')
        .update({ 
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', roomId)
    }

    return NextResponse.json({
      success: true,
      newTurn,
      playersUpdated: updatedPlayers.length
    })

  } catch (error) {
    console.error('Error advancing turn:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
