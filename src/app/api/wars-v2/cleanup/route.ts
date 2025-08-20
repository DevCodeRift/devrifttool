import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface WarRecord {
  id: string
  name: string
}

export async function POST(_request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Get current time
    const now = new Date()
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000) // 10 minutes ago
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000) // 30 minutes ago

    let deletedLobbies = 0
    let deletedWars = 0

    // 1. Delete lobbies that have not started in 10+ minutes
    const { data: staleLobbyIds, error: lobbiesError } = await supabaseAdmin
      .from('wars')
      .select('id, name')
      .eq('status', 'waiting')
      .lt('created_at', tenMinutesAgo.toISOString())

    if (lobbiesError) {
      console.error('Error finding stale lobbies:', lobbiesError)
    } else if (staleLobbyIds && staleLobbyIds.length > 0) {
      console.log(`Found ${staleLobbyIds.length} stale lobbies to delete:`, staleLobbyIds.map((l: WarRecord) => l.name))

      // Delete participants first (foreign key constraint)
      for (const lobby of staleLobbyIds) {
        const { error: participantError } = await supabaseAdmin
          .from('war_participants')
          .delete()
          .eq('war_id', lobby.id)

        if (participantError) {
          console.error(`Error deleting participants for lobby ${lobby.id}:`, participantError)
        }
      }

      // Delete the lobbies
      const { error: deleteLobbiesError } = await supabaseAdmin
        .from('wars')
        .delete()
        .in('id', staleLobbyIds.map((l: WarRecord) => l.id))

      if (deleteLobbiesError) {
        console.error('Error deleting stale lobbies:', deleteLobbiesError)
      } else {
        deletedLobbies = staleLobbyIds.length
        console.log(`Deleted ${deletedLobbies} stale lobbies`)
      }
    }

    // 2. Delete wars that have gone inactive (no actions from either side in 30+ minutes)
    // First, find wars that are active but have no recent battle actions
    const { data: activeWars, error: activeWarsError } = await supabaseAdmin
      .from('wars')
      .select('id, name, created_at')
      .eq('status', 'active')

    if (activeWarsError) {
      console.error('Error finding active wars:', activeWarsError)
    } else if (activeWars && activeWars.length > 0) {
      const inactiveWarIds = []

      for (const war of activeWars) {
        // Check if there are any battle actions in the last 30 minutes
        const { data: recentActions, error: actionsError } = await supabaseAdmin
          .from('battle_actions')
          .select('id')
          .eq('war_id', war.id)
          .gte('executed_at', thirtyMinutesAgo.toISOString())
          .limit(1)

        if (actionsError) {
          console.error(`Error checking actions for war ${war.id}:`, actionsError)
          continue
        }

        // If no recent actions and war was created more than 30 minutes ago
        const warCreatedAt = new Date(war.created_at)
        if ((!recentActions || recentActions.length === 0) && warCreatedAt < thirtyMinutesAgo) {
          inactiveWarIds.push(war.id)
          console.log(`War "${war.name}" (${war.id}) is inactive - no actions in 30+ minutes`)
        }
      }

      if (inactiveWarIds.length > 0) {
        console.log(`Found ${inactiveWarIds.length} inactive wars to delete`)

        // Delete battle actions first
        for (const warId of inactiveWarIds) {
          const { error: actionsError } = await supabaseAdmin
            .from('battle_actions')
            .delete()
            .eq('war_id', warId)

          if (actionsError) {
            console.error(`Error deleting battle actions for war ${warId}:`, actionsError)
          }
        }

        // Delete participants
        for (const warId of inactiveWarIds) {
          const { error: participantError } = await supabaseAdmin
            .from('war_participants')
            .delete()
            .eq('war_id', warId)

          if (participantError) {
            console.error(`Error deleting participants for war ${warId}:`, participantError)
          }
        }

        // Delete the wars
        const { error: deleteWarsError } = await supabaseAdmin
          .from('wars')
          .delete()
          .in('id', inactiveWarIds)

        if (deleteWarsError) {
          console.error('Error deleting inactive wars:', deleteWarsError)
        } else {
          deletedWars = inactiveWarIds.length
          console.log(`Deleted ${deletedWars} inactive wars`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${deletedLobbies} stale lobbies and ${deletedWars} inactive wars removed`,
      deletedLobbies,
      deletedWars,
      timestamp: now.toISOString()
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to perform cleanup', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check what would be cleaned up (dry run)
export async function GET(_request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const now = new Date()
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

    // Find stale lobbies
    const { data: staleLobbies } = await supabaseAdmin
      .from('wars')
      .select('id, name, created_at')
      .eq('status', 'waiting')
      .lt('created_at', tenMinutesAgo.toISOString())

    // Find potentially inactive wars
    const { data: activeWars, error: activeWarsError } = await supabaseAdmin
      .from('wars')
      .select('id, name, created_at')
      .eq('status', 'active')

    const inactiveWars = []
    if (activeWars && !activeWarsError) {
      for (const war of activeWars) {
        const { data: recentActions } = await supabaseAdmin
          .from('battle_actions')
          .select('id')
          .eq('war_id', war.id)
          .gte('executed_at', thirtyMinutesAgo.toISOString())
          .limit(1)

        const warCreatedAt = new Date(war.created_at)
        if ((!recentActions || recentActions.length === 0) && warCreatedAt < thirtyMinutesAgo) {
          inactiveWars.push(war)
        }
      }
    }

    return NextResponse.json({
      staleLobbies: staleLobbies || [],
      inactiveWars,
      summary: {
        staleLobbiesCount: staleLobbies?.length || 0,
        inactiveWarsCount: inactiveWars.length,
        cutoffTimes: {
          lobbyCutoff: tenMinutesAgo.toISOString(),
          warCutoff: thirtyMinutesAgo.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Cleanup preview error:', error)
    return NextResponse.json(
      { error: 'Failed to preview cleanup', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
