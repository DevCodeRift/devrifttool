import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

if (!supabaseAdmin) {
  throw new Error('Supabase admin client not initialized')
}

const supabase = supabaseAdmin

/**
 * GET /api/wars-v2/battle-log - Get battle log for a war or player
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const warId = searchParams.get('warId')
    const playerId = searchParams.get('playerId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!warId && !playerId) {
      return NextResponse.json({ error: 'Either warId or playerId is required' }, { status: 400 })
    }

    let query = supabase
      .from('battle_actions')
      .select(`
        *,
        attacker:war_participants!attacker_id(
          player_name,
          nation_name
        ),
        defender:war_participants!defender_id(
          player_name,
          nation_name
        ),
        war:wars!war_id(
          name,
          status
        )
      `)
      .order('executed_at', { ascending: false })
      .limit(limit)

    if (warId) {
      query = query.eq('war_id', warId)
    } else if (playerId) {
      // Get battles where player was attacker or defender
      const { data: playerParticipations } = await supabase
        .from('war_participants')
        .select('id')
        .eq('player_id', playerId)
      
      if (playerParticipations && playerParticipations.length > 0) {
        const participantIds = playerParticipations.map(p => p.id)
        query = query.or(`attacker_id.in.(${participantIds.join(',')}),defender_id.in.(${participantIds.join(',')})`)
      } else {
        return NextResponse.json([]) // No battles for this player
      }
    }

    const { data: battleActions, error } = await query

    if (error) {
      console.error('Error fetching battle log:', error)
      return NextResponse.json({ error: 'Failed to fetch battle log' }, { status: 500 })
    }

    // Transform data for frontend
    const formattedBattleLog = battleActions?.map(action => ({
      id: action.id,
      warId: action.war_id,
      warName: action.war?.name,
      turnNumber: action.turn_number,
      actionType: action.action_type,
      target: action.target,
      
      // Participants
      attackerName: action.attacker?.nation_name,
      attackerPlayerName: action.attacker?.player_name,
      defenderName: action.defender?.nation_name,
      defenderPlayerName: action.defender?.player_name,
      
      // Military used
      militaryUsed: {
        soldiers: action.soldiers_used,
        tanks: action.tanks_used,
        aircraft: action.aircraft_used,
        ships: action.ships_used,
        maps: action.maps_used
      },
      
      // Pre-action state
      preActionState: {
        attacker: {
          soldiers: action.att_pre_soldiers,
          tanks: action.att_pre_tanks,
          aircraft: action.att_pre_aircraft,
          ships: action.att_pre_ships,
          resistance: action.att_pre_resistance,
          maps: action.att_pre_maps
        },
        defender: {
          soldiers: action.def_pre_soldiers,
          tanks: action.def_pre_tanks,
          aircraft: action.def_pre_aircraft,
          ships: action.def_pre_ships,
          resistance: action.def_pre_resistance
        }
      },
      
      // Battle results
      victoryType: action.victory_type,
      rollsWon: action.rolls_won,
      rolls: {
        attacker: [action.attacker_roll_1, action.attacker_roll_2, action.attacker_roll_3],
        defender: [action.defender_roll_1, action.defender_roll_2, action.defender_roll_3]
      },
      
      // Casualties
      casualties: {
        attacker: {
          soldiers: action.att_soldiers_lost,
          tanks: action.att_tanks_lost,
          aircraft: action.att_aircraft_lost,
          ships: action.att_ships_lost
        },
        defender: {
          soldiers: action.def_soldiers_lost,
          tanks: action.def_tanks_lost,
          aircraft: action.def_aircraft_lost,
          ships: action.def_ships_lost
        }
      },
      
      // Damage
      resistanceDamage: action.resistance_damage,
      infrastructureDamage: action.infrastructure_damage,
      spaceControlGained: action.space_control_gained,
      spaceControlLost: action.space_control_lost,
      
      // Timestamp
      executedAt: action.executed_at,
      
      // Post-action state (calculated)
      postActionState: {
        attacker: {
          soldiers: action.att_pre_soldiers - action.att_soldiers_lost,
          tanks: action.att_pre_tanks - action.att_tanks_lost,
          aircraft: action.att_pre_aircraft - action.att_aircraft_lost,
          ships: action.att_pre_ships - action.att_ships_lost,
          resistance: action.att_pre_resistance, // Attacker resistance doesn't change in attacks
          maps: action.att_pre_maps - action.maps_used
        },
        defender: {
          soldiers: action.def_pre_soldiers - action.def_soldiers_lost,
          tanks: action.def_pre_tanks - action.def_tanks_lost,
          aircraft: action.def_pre_aircraft - action.def_aircraft_lost,
          ships: action.def_pre_ships - action.def_ships_lost,
          resistance: Math.max(0, action.def_pre_resistance + action.resistance_damage) // resistance_damage is negative
        }
      }
    })) || []

    return NextResponse.json(formattedBattleLog)

  } catch (error) {
    console.error('Battle log API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
