import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { CreateWarRequest, JoinWarRequest, War } from '@/types/war-v2'
import { randomUUID } from 'crypto'

if (!supabaseAdmin) {
  console.error('Supabase admin client not initialized - Environment variables:')
  console.error('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING')
  console.error('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING')
}

const supabase = supabaseAdmin

/**
 * GET /api/wars-v2 - Get all active wars or specific war
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const warId = searchParams.get('warId')

    if (warId) {
      // Get specific war with participants
      const { data: war, error: warError } = await supabase
        .from('wars')
        .select('*')
        .eq('id', warId)
        .single()

      if (warError || !war) {
        return NextResponse.json({ error: 'War not found' }, { status: 404 })
      }

      // Get participants
      const { data: participants, error: participantsError } = await supabase
        .from('war_participants')
        .select('*')
        .eq('war_id', warId)
        .order('joined_at', { ascending: true })

      console.log('Fetched participants for war', warId, ':', participants?.length || 0, 'participants')
      console.log('Participants:', participants?.map(p => ({ playerId: p.player_id, name: p.player_name, isHost: p.is_host })))

      if (participantsError) {
        console.error('Error fetching participants:', participantsError)
        return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
      }

      // Transform to frontend format
      const warData: War = {
        id: war.id,
        name: war.name,
        createdBy: war.created_by,
        status: war.status,
        maxPlayers: war.max_players,
        currentPlayers: war.current_players,
        turnDuration: war.turn_duration,
        currentTurn: war.current_turn,
        participants: participants?.map(p => ({
          id: p.id,
          name: p.nation_name,
          playerId: p.player_id,
          playerName: p.player_name,
          soldiers: p.soldiers,
          tanks: p.tanks,
          aircraft: p.aircraft,
          ships: p.ships,
          cities: p.cities,
          resistance: p.resistance,
          currentMaps: p.current_maps,
          maxMaps: p.max_maps,
          groundControl: p.ground_control,
          airSuperiority: p.air_superiority,
          blockade: p.blockade,
          fortified: p.fortified,
          isHost: p.is_host,
          isSpectator: p.is_spectator,
          isEliminated: p.is_eliminated
        })) || [],
        startedAt: war.started_at ? new Date(war.started_at) : undefined,
        endedAt: war.ended_at ? new Date(war.ended_at) : undefined,
        createdAt: new Date(war.created_at),
        updatedAt: new Date(war.updated_at)
      }

      return NextResponse.json(warData, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    } else {
      // Get all active wars
      const { data: wars, error: warsError } = await supabase
        .from('wars')
        .select(`
          *,
          war_participants(*)
        `)
        .in('status', ['waiting', 'active'])
        .order('created_at', { ascending: false })

      if (warsError) {
        console.error('Error fetching wars:', warsError)
        return NextResponse.json({ error: 'Failed to fetch wars' }, { status: 500 })
      }

      // Transform to frontend format
      const formattedWars = wars?.map(war => ({
        id: war.id,
        name: war.name,
        createdBy: war.created_by,
        status: war.status,
        maxPlayers: war.max_players,
        currentPlayers: war.current_players,
        turnDuration: war.turn_duration,
        currentTurn: war.current_turn,
        participants: war.war_participants?.map((p: {
          id: string
          player_id: string
          player_name: string
          nation_name: string
          soldiers: number
          tanks: number
          aircraft: number
          ships: number
          cities: number
          resistance: number
          current_maps: number
          max_maps: number
          ground_control: boolean
          air_superiority: boolean
          blockade: boolean
          fortified: boolean
          is_host: boolean
          is_spectator: boolean
          is_eliminated: boolean
        }) => ({
          id: p.id,
          name: p.nation_name,
          playerId: p.player_id,
          playerName: p.player_name,
          soldiers: p.soldiers,
          tanks: p.tanks,
          aircraft: p.aircraft,
          ships: p.ships,
          cities: p.cities,
          resistance: p.resistance,
          currentMaps: p.current_maps,
          maxMaps: p.max_maps,
          groundControl: p.ground_control,
          airSuperiority: p.air_superiority,
          blockade: p.blockade,
          fortified: p.fortified,
          isHost: p.is_host,
          isSpectator: p.is_spectator,
          isEliminated: p.is_eliminated
        })) || [],
        createdAt: new Date(war.created_at),
        updatedAt: new Date(war.updated_at)
      })) || []

      return NextResponse.json(formattedWars, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }
  } catch (error) {
    console.error('GET Wars API error:', error)
    console.error('GET Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/wars-v2 - Create new war or join existing war
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }

    const body = await request.json()
    const action = body.action || 'create' // 'create' or 'join'

    if (action === 'create') {
      const { name, maxPlayers, turnDuration, playerName, nationName, nationId }: CreateWarRequest = body

      // Validate input
      if (!name || !playerName || !nationName) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      // Generate player ID (could be user ID or session ID)
      const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Generate UUID for created_by field
      const createdByUuid = randomUUID()

      // Create war
      const { data: war, error: warError } = await supabase
        .from('wars')
        .insert({
          name,
          created_by: createdByUuid,
          max_players: maxPlayers || 2,
          turn_duration: turnDuration || 120,
          current_players: 1
        })
        .select()
        .single()

      if (warError) {
        console.error('Error creating war:', warError)
        return NextResponse.json({ error: 'Failed to create war' }, { status: 500 })
      }

      // Calculate max military based on default cities (10)
      const cities = 10
      const maxSoldiers = cities * 5 * 3000
      const maxTanks = cities * 5 * 250
      const maxAircraft = cities * 5 * 15
      const maxShips = cities * 3 * 5

      // Add creator as first participant
      const { data: participant, error: participantError } = await supabase
        .from('war_participants')
        .insert({
          war_id: war.id,
          player_id: playerId,
          player_name: playerName,
          nation_name: nationName,
          nation_id: nationId,
          soldiers: Math.floor(maxSoldiers * 0.8), // Start with 80% of max
          tanks: Math.floor(maxTanks * 0.8),
          aircraft: Math.floor(maxAircraft * 0.8),
          ships: Math.floor(maxShips * 0.8),
          cities,
          resistance: 100,
          current_maps: 6,
          max_maps: 12,
          is_host: true
        })
        .select()
        .single()

      console.log('Created war participant (host):', {
        warId: war.id,
        playerId,
        playerName,
        participantId: participant?.id
      })

      if (participantError) {
        console.error('Error adding participant:', participantError)
        return NextResponse.json({ error: 'Failed to add participant' }, { status: 500 })
      }

      return NextResponse.json({
        warId: war.id,
        playerId,
        participantId: participant.id,
        message: 'War created successfully'
      })

    } else if (action === 'join') {
      const { warId, playerName, nationName, nationId, asSpectator }: JoinWarRequest = body

      // Validate input
      if (!warId || !playerName || !nationName) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      // Check if war exists and has space
      const { data: war, error: warError } = await supabase
        .from('wars')
        .select('*')
        .eq('id', warId)
        .eq('status', 'waiting')
        .single()

      if (warError || !war) {
        return NextResponse.json({ error: 'War not found or already started' }, { status: 404 })
      }

      if (!asSpectator && war.current_players >= war.max_players) {
        return NextResponse.json({ error: 'War is full' }, { status: 400 })
      }

      // Generate player ID
      const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Calculate military for new participant
      const cities = 10
      const maxSoldiers = cities * 5 * 3000
      const maxTanks = cities * 5 * 250
      const maxAircraft = cities * 5 * 15
      const maxShips = cities * 3 * 5

      // Add participant
      const { data: participant, error: participantError } = await supabase
        .from('war_participants')
        .insert({
          war_id: warId,
          player_id: playerId,
          player_name: playerName,
          nation_name: nationName,
          nation_id: nationId,
          soldiers: asSpectator ? 0 : Math.floor(maxSoldiers * 0.8),
          tanks: asSpectator ? 0 : Math.floor(maxTanks * 0.8),
          aircraft: asSpectator ? 0 : Math.floor(maxAircraft * 0.8),
          ships: asSpectator ? 0 : Math.floor(maxShips * 0.8),
          cities: asSpectator ? 0 : cities,
          resistance: asSpectator ? 0 : 100,
          current_maps: asSpectator ? 0 : 6,
          max_maps: asSpectator ? 0 : 12,
          is_spectator: asSpectator || false
        })
        .select()
        .single()

      console.log('Added war participant (joiner):', {
        warId,
        playerId,
        playerName,
        asSpectator,
        participantId: participant?.id
      })

      if (participantError) {
        console.error('Error adding participant:', participantError)
        return NextResponse.json({ error: 'Failed to join war' }, { status: 500 })
      }

      // Update war player count and potentially start the war
      const newPlayerCount = asSpectator ? war.current_players : war.current_players + 1
      const shouldStart = !asSpectator && newPlayerCount >= 2 // Auto-start when 2+ players

      const { error: updateError } = await supabase
        .from('wars')
        .update({
          current_players: newPlayerCount,
          status: shouldStart ? 'active' : 'waiting',
          started_at: shouldStart ? new Date().toISOString() : undefined
        })
        .eq('id', warId)

      if (updateError) {
        console.error('Error updating war:', updateError)
      }

      return NextResponse.json({
        warId,
        playerId,
        participantId: participant.id,
        message: asSpectator ? 'Joined as spectator' : 'Joined war successfully',
        warStarted: shouldStart
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Wars API error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
