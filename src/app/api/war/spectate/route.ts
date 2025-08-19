import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Ensure supabase admin client is available
if (!supabaseAdmin) {
  throw new Error('Supabase admin client not initialized - check environment variables')
}

const supabase = supabaseAdmin

// POST /api/war/spectate - Join as spectator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, spectatorId, spectatorName } = body

    if (!roomId || !spectatorId || !spectatorName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if room exists
    const { data: room } = await supabase
      .from('rooms')
      .select('id, status')
      .eq('id', roomId)
      .single()

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Add spectator
    const { error } = await supabase
      .from('spectators')
      .insert({
        room_id: roomId,
        spectator_id: spectatorId,
        spectator_name: spectatorName
      })

    if (error) {
      console.error('Error adding spectator:', error)
      return NextResponse.json({ error: 'Failed to join as spectator' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/war/spectate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/war/spectate - Leave spectating
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const spectatorId = searchParams.get('spectatorId')

    if (!roomId || !spectatorId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const { error } = await supabase
      .from('spectators')
      .delete()
      .eq('room_id', roomId)
      .eq('spectator_id', spectatorId)

    if (error) {
      console.error('Error removing spectator:', error)
      return NextResponse.json({ error: 'Failed to leave spectating' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/war/spectate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/war/spectate - Get spectators for a room
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId parameter' }, { status: 400 })
    }

    const { data: spectators, error } = await supabase
      .from('spectators')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('Error fetching spectators:', error)
      return NextResponse.json({ error: 'Failed to fetch spectators' }, { status: 500 })
    }

    return NextResponse.json(spectators || [])
  } catch (error) {
    console.error('Error in GET /api/war/spectate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
