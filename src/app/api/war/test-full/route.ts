import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Supabase admin client not available',
        environment: process.env.NODE_ENV,
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }, { status: 500 })
    }

    console.log('Testing full room creation flow...')

    // Step 1: Create a test room
    const testRoomCode = `test-full-${Date.now()}`
    const { data: roomResult, error: roomError } = await supabaseAdmin
      .from('battle_rooms')
      .insert({
        room_code: testRoomCode,
        settings: { turnDuration: 60, gameMode: 'multiplayer' },
        status: 'waiting'
      })
      .select()
      .single()

    if (roomError) {
      return NextResponse.json({
        step: 'room_creation_failed',
        error: roomError.message,
        code: roomError.code,
        details: roomError.details
      }, { status: 500 })
    }

    console.log('Room created:', roomResult)

    // Step 2: Test battle_room_players table
    const { data: playerResult, error: playerError } = await supabaseAdmin
      .from('battle_room_players')
      .insert({
        room_id: roomResult.id,
        player_id: 'test-player-123',
        player_name: 'TestHost',
        is_host: true
      })
      .select()
      .single()

    if (playerError) {
      // Clean up the room first
      await supabaseAdmin.from('battle_rooms').delete().eq('id', roomResult.id)
      
      return NextResponse.json({
        step: 'player_creation_failed',
        error: playerError.message,
        code: playerError.code,
        details: playerError.details,
        roomCreated: true,
        roomCleanedUp: true
      }, { status: 500 })
    }

    console.log('Player created:', playerResult)

    // Clean up test data
    await supabaseAdmin.from('battle_rooms').delete().eq('id', roomResult.id)

    return NextResponse.json({
      success: true,
      message: 'Full room creation flow tested successfully',
      roomCreated: !!roomResult,
      playerCreated: !!playerResult,
      testRoomCode,
      cleanedUp: true
    })

  } catch (error) {
    console.error('Full test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
