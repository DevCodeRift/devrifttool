import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { BattleSettings, Nation } from '@/types/war'

// Ensure supabase admin client is available
if (!supabaseAdmin) {
  throw new Error('Supabase admin client not initialized - check environment variables')
}

const supabase = supabaseAdmin

export interface RoomData {
  id: string
  host_name: string
  settings: BattleSettings
  player_count: number
  max_players: number
  status: 'waiting' | 'in_progress' | 'completed'
  is_private: boolean
  created_at: string
  players: Array<{
    id: string
    playerName: string // Fix: Use camelCase to match frontend interface
    side: 'attacker' | 'defender' | null
    nationData: Nation | null // Fix: Use camelCase to match frontend interface
    isHost: boolean // Fix: Use camelCase to match frontend interface
    isReady: boolean // Fix: Use camelCase to match frontend interface
    isSpectator: boolean // Fix: Use camelCase to match frontend interface
  }>
  spectator_count: number
}

// GET /api/war/rooms - Get all public rooms or specific room
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const includePrivate = searchParams.get('includePrivate') === 'true'

    if (roomId) {
      // Get specific room with players
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_players(*)
        `)
        .eq('id', roomId)
        .single()

      if (roomError || !room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
      }

      // Get spectator count
      const { count: spectatorCount } = await supabase
        .from('spectators')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)

      const roomData: RoomData = {
        id: room.id,
        host_name: room.host_name,
        settings: room.settings,
        player_count: room.player_count,
        max_players: room.max_players,
        status: room.status,
        is_private: room.is_private,
        created_at: room.created_at,
        players: room.room_players.map((p: {
          player_id: string
          player_name: string
          side: 'attacker' | 'defender' | null
          nation_data: Nation | null
          is_host: boolean
          is_ready: boolean
          is_spectator: boolean
        }) => ({
          id: p.player_id,
          playerName: p.player_name, // Fix: Convert snake_case to camelCase
          side: p.side,
          nationData: p.nation_data, // Fix: Convert snake_case to camelCase
          isHost: p.is_host, // Fix: Convert snake_case to camelCase
          isReady: p.is_ready, // Fix: Convert snake_case to camelCase
          isSpectator: p.is_spectator // Fix: Convert snake_case to camelCase
        })),
        spectator_count: spectatorCount || 0
      }

      return NextResponse.json(roomData)
    } else {
      // Get all rooms
      let query = supabase
        .from('active_rooms')
        .select('*')
        .order('created_at', { ascending: false })

      if (!includePrivate) {
        query = query.eq('is_private', false)
      }

      const { data: rooms, error } = await query

      if (error) {
        console.error('Error fetching rooms:', error)
        return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
      }

      return NextResponse.json(rooms || [])
    }
  } catch (error) {
    console.error('Error in GET /api/war/rooms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/war/rooms - Create a new room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, hostName, settings, playerId } = body

    if (!roomId || !hostName || !settings || !playerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create room
    const { error: roomError } = await supabase
      .from('rooms')
      .insert({
        id: roomId,
        host_name: hostName,
        settings,
        is_private: settings.isPrivate || false,
        status: 'waiting'
      })
      .select()
      .single()

    if (roomError) {
      console.error('Error creating room:', roomError)
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
    }

    // Add host as player
    const { error: playerError } = await supabase
      .from('room_players')
      .insert({
        room_id: roomId,
        player_id: playerId,
        player_name: hostName,
        is_host: true
      })

    if (playerError) {
      console.error('Error adding host player:', playerError)
      // Clean up room if player creation failed
      await supabase.from('rooms').delete().eq('id', roomId)
      return NextResponse.json({ error: 'Failed to add host player' }, { status: 500 })
    }

    return NextResponse.json({ success: true, roomId })
  } catch (error) {
    console.error('Error in POST /api/war/rooms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/war/rooms - Update room or player data
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, playerId, action, data } = body

    if (!roomId || !playerId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    switch (action) {
      case 'join_room':
        const { playerName } = data
        
        // Check if player is already in the room
        const { data: existingPlayer } = await supabase
          .from('room_players')
          .select('id')
          .eq('room_id', roomId)
          .eq('player_id', playerId)
          .single()

        if (existingPlayer) {
          // Player is already in the room, return success
          return NextResponse.json({ message: 'Already in room' }, { status: 200 })
        }
        
        // Check if room exists and has space
        const { data: room } = await supabase
          .from('rooms')
          .select('player_count, max_players, status')
          .eq('id', roomId)
          .single()

        if (!room || room.status !== 'waiting' || room.player_count >= room.max_players) {
          return NextResponse.json({ error: 'Room not available' }, { status: 400 })
        }

        // Add player
        const { error: joinError } = await supabase
          .from('room_players')
          .insert({
            room_id: roomId,
            player_id: playerId,
            player_name: playerName,
            is_host: false
          })

        if (joinError) {
          // Check if error is due to unique constraint violation (player already exists)
          if (joinError.code === '23505') {
            return NextResponse.json({ message: 'Already in room' }, { status: 200 })
          }
          return NextResponse.json({ error: 'Failed to join room' }, { status: 500 })
        }

        // Update player count
        await supabase
          .from('rooms')
          .update({ player_count: room.player_count + 1 })
          .eq('id', roomId)

        break

      case 'update_player':
        const { side, nationData, isReady } = data
        
        const updateData: Partial<{
          side: 'attacker' | 'defender' | null
          nation_data: Nation | null
          is_ready: boolean
        }> = {}
        if (side !== undefined) updateData.side = side
        if (nationData !== undefined) updateData.nation_data = nationData
        if (isReady !== undefined) updateData.is_ready = isReady

        const { error: updateError } = await supabase
          .from('room_players')
          .update(updateData)
          .eq('room_id', roomId)
          .eq('player_id', playerId)

        if (updateError) {
          return NextResponse.json({ error: 'Failed to update player' }, { status: 500 })
        }

        break

      case 'start_battle':
        // Update room status to in_progress
        const { error: startError } = await supabase
          .from('rooms')
          .update({ 
            status: 'in_progress',
            started_at: new Date().toISOString()
          })
          .eq('id', roomId)

        if (startError) {
          return NextResponse.json({ error: 'Failed to start battle' }, { status: 500 })
        }

        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/war/rooms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/war/rooms - Leave room or delete room
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const playerId = searchParams.get('playerId')

    if (!roomId || !playerId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Check if player is host
    const { data: player } = await supabase
      .from('room_players')
      .select('is_host')
      .eq('room_id', roomId)
      .eq('player_id', playerId)
      .single()

    if (player?.is_host) {
      // Host leaving - delete entire room
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)

      if (error) {
        return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
      }
    } else {
      // Regular player leaving - remove player and update count
      const { error: removeError } = await supabase
        .from('room_players')
        .delete()
        .eq('room_id', roomId)
        .eq('player_id', playerId)

      if (removeError) {
        return NextResponse.json({ error: 'Failed to leave room' }, { status: 500 })
      }

      // Update player count
      const { data: room } = await supabase
        .from('rooms')
        .select('player_count')
        .eq('id', roomId)
        .single()

      if (room) {
        await supabase
          .from('rooms')
          .update({ player_count: Math.max(0, room.player_count - 1) })
          .eq('id', roomId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/war/rooms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
