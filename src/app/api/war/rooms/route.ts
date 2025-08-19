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

    if (roomId) {
      // Get specific room with players
      const { data: room, error: roomError } = await supabase
        .from('battle_rooms')
        .select(`
          *,
          battle_room_players(*)
        `)
        .eq('id', roomId)
        .single()

      if (roomError || !room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
      }

      // Get spectator count (for now, assume 0 since we don't have spectators table)
      const spectatorCount = 0

      const roomData: RoomData = {
        id: room.id,
        host_name: room.room_code, // Use room_code as a fallback for host_name
        settings: room.settings,
        player_count: room.battle_room_players?.length || 0,
        max_players: 2, // Default for multiplayer battles
        status: room.status,
        is_private: false, // Default for now
        created_at: room.created_at,
        players: room.battle_room_players?.map((p: {
          player_id: string
          player_name: string
          side: 'attacker' | 'defender' | null
          nation_data: Nation | null
          is_host: boolean
          is_ready: boolean
        }) => ({
          id: p.player_id,
          playerName: p.player_name,
          side: p.side,
          nationData: p.nation_data,
          isHost: p.is_host,
          isReady: p.is_ready,
          isSpectator: false
        })) || [],
        spectator_count: spectatorCount
      }

      return NextResponse.json(roomData)
    } else {
      // Get all waiting rooms first
      const { data: rooms, error: roomsError } = await supabase
        .from('battle_rooms')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError)
        return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
      }

      if (!rooms || rooms.length === 0) {
        return NextResponse.json([])
      }

      // Get players for each room
      const roomIds = rooms.map(room => room.id)
      const { data: players, error: playersError } = await supabase
        .from('battle_room_players')
        .select('*')
        .in('room_id', roomIds)

      if (playersError) {
        console.error('Error fetching players:', playersError)
        return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
      }

      // Transform the data to match the expected format
      const formattedRooms = rooms.map((room: {
        id: string
        room_code: string
        status: string
        settings: BattleSettings
        created_at: string
      }) => {
        const roomPlayers = players?.filter(p => p.room_id === room.id) || []
        const hostPlayer = roomPlayers.find(p => p.is_host)
        
        return {
          id: room.id,
          hostName: hostPlayer?.player_name || 'Unknown Host',
          settings: room.settings,
          playerCount: roomPlayers.length,
          maxPlayers: 2,
          status: room.status,
          isPrivate: false,
          createdAt: room.created_at,
          players: [],
          spectatorCount: 0
        }
      }) || []

      return NextResponse.json(formattedRooms)
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
    const { data: newRoom, error: roomError } = await supabase
      .from('battle_rooms')
      .insert({
        room_code: roomId,
        settings,
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
      .from('battle_room_players')
      .insert({
        room_id: newRoom.id,
        player_id: playerId,
        player_name: hostName,
        is_host: true
      })

    if (playerError) {
      console.error('Error adding host player:', playerError)
      // Clean up room if player creation failed
      await supabase.from('battle_rooms').delete().eq('id', newRoom.id)
      return NextResponse.json({ error: 'Failed to add host player' }, { status: 500 })
    }

    return NextResponse.json({ success: true, roomId: newRoom.id })
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
          .from('battle_room_players')
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
          .from('battle_rooms')
          .select('status')
          .eq('id', roomId)
          .single()

        if (!room || room.status !== 'waiting') {
          return NextResponse.json({ error: 'Room not available' }, { status: 400 })
        }

        // Check current player count
        const { count: playerCount } = await supabase
          .from('battle_room_players')
          .select('id', { count: 'exact' })
          .eq('room_id', roomId)

        if (playerCount && playerCount >= 2) {
          return NextResponse.json({ error: 'Room is full' }, { status: 400 })
        }

        // Add player
        const { error: joinError } = await supabase
          .from('battle_room_players')
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
          .from('battle_room_players')
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
          .from('battle_rooms')
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
      .from('battle_room_players')
      .select('is_host')
      .eq('room_id', roomId)
      .eq('player_id', playerId)
      .single()

    if (player?.is_host) {
      // Host leaving - delete entire room
      const { error } = await supabase
        .from('battle_rooms')
        .delete()
        .eq('id', roomId)

      if (error) {
        return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
      }
    } else {
      // Regular player leaving - remove player
      const { error: removeError } = await supabase
        .from('battle_room_players')
        .delete()
        .eq('room_id', roomId)
        .eq('player_id', playerId)

      if (removeError) {
        return NextResponse.json({ error: 'Failed to leave room' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/war/rooms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
