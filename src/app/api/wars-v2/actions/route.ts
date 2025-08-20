import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { WarCalculationsV2 } from '@/lib/war-calculations-v2'
import { ExecuteActionRequest, Nation } from '@/types/war-v2'

if (!supabaseAdmin) {
  throw new Error('Supabase admin client not initialized')
}

const supabase = supabaseAdmin
const warCalc = new WarCalculationsV2()

/**
 * POST /api/wars-v2/actions - Execute a battle action
 */
export async function POST(request: NextRequest) {
  try {
    const { warId, defenderId, actionType, target, soldiersUsed, tanksUsed, aircraftUsed, shipsUsed }: ExecuteActionRequest = await request.json()

    // Get attacker from request headers or body (in real app, from session)
    const attackerPlayerId = request.headers.get('X-Player-ID') || 'unknown'

    // Validate input
    if (!warId || !defenderId || !actionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get war and participants
    const { data: war, error: warError } = await supabase
      .from('wars')
      .select('*')
      .eq('id', warId)
      .eq('status', 'active')
      .single()

    if (warError || !war) {
      return NextResponse.json({ error: 'War not found or not active' }, { status: 404 })
    }

    // Get attacker
    const { data: attacker, error: attackerError } = await supabase
      .from('war_participants')
      .select('*')
      .eq('war_id', warId)
      .eq('player_id', attackerPlayerId)
      .single()

    if (attackerError || !attacker) {
      return NextResponse.json({ error: 'Attacker not found in this war' }, { status: 404 })
    }

    // Get defender
    const { data: defender, error: defenderError } = await supabase
      .from('war_participants')
      .select('*')
      .eq('id', defenderId)
      .eq('war_id', warId)
      .single()

    if (defenderError || !defender) {
      return NextResponse.json({ error: 'Defender not found' }, { status: 404 })
    }

    // Check if attacker is eliminated or spectator
    if (attacker.is_eliminated || attacker.is_spectator) {
      return NextResponse.json({ error: 'Cannot attack as eliminated player or spectator' }, { status: 400 })
    }

    // Check if defender is eliminated
    if (defender.is_eliminated) {
      return NextResponse.json({ error: 'Cannot attack eliminated player' }, { status: 400 })
    }

    // Validate MAP cost
    const mapCost = warCalc.getMapCost(actionType)
    if (attacker.current_maps < mapCost) {
      return NextResponse.json({ error: `Insufficient MAPs. Need ${mapCost}, have ${attacker.current_maps}` }, { status: 400 })
    }

    // Validate military units
    const usedSoldiers = soldiersUsed || 0
    const usedTanks = tanksUsed || 0
    const usedAircraft = aircraftUsed || 0
    const usedShips = shipsUsed || 0

    if (actionType === 'ground_attack') {
      if (usedSoldiers + usedTanks === 0) {
        return NextResponse.json({ error: 'Must use soldiers and/or tanks for ground attack' }, { status: 400 })
      }
      if (usedSoldiers > attacker.soldiers || usedTanks > attacker.tanks) {
        return NextResponse.json({ error: 'Insufficient military units' }, { status: 400 })
      }
    } else if (actionType === 'airstrike') {
      if (usedAircraft === 0) {
        return NextResponse.json({ error: 'Must use aircraft for airstrike' }, { status: 400 })
      }
      if (usedAircraft > attacker.aircraft) {
        return NextResponse.json({ error: 'Insufficient aircraft' }, { status: 400 })
      }
      if (!target || !['aircraft', 'soldiers', 'tanks', 'ships'].includes(target)) {
        return NextResponse.json({ error: 'Invalid airstrike target' }, { status: 400 })
      }
    } else if (actionType === 'naval_attack') {
      if (usedShips === 0) {
        return NextResponse.json({ error: 'Must use ships for naval attack' }, { status: 400 })
      }
      if (usedShips > attacker.ships) {
        return NextResponse.json({ error: 'Insufficient ships' }, { status: 400 })
      }
      if (!target || !['ships', 'infrastructure', 'ground_control', 'air_superiority'].includes(target)) {
        return NextResponse.json({ error: 'Invalid naval target' }, { status: 400 })
      }
    }

    // Create Nation objects for calculations
    const attackerNation: Nation = {
      id: attacker.id,
      name: attacker.nation_name,
      playerId: attacker.player_id,
      playerName: attacker.player_name,
      soldiers: attacker.soldiers,
      tanks: attacker.tanks,
      aircraft: attacker.aircraft,
      ships: attacker.ships,
      cities: attacker.cities,
      resistance: attacker.resistance,
      currentMaps: attacker.current_maps,
      maxMaps: attacker.max_maps,
      groundControl: attacker.ground_control,
      airSuperiority: attacker.air_superiority,
      blockade: attacker.blockade,
      fortified: attacker.fortified,
      isHost: attacker.is_host,
      isSpectator: attacker.is_spectator,
      isEliminated: attacker.is_eliminated
    }

    const defenderNation: Nation = {
      id: defender.id,
      name: defender.nation_name,
      playerId: defender.player_id,
      playerName: defender.player_name,
      soldiers: defender.soldiers,
      tanks: defender.tanks,
      aircraft: defender.aircraft,
      ships: defender.ships,
      cities: defender.cities,
      resistance: defender.resistance,
      currentMaps: defender.current_maps,
      maxMaps: defender.max_maps,
      groundControl: defender.ground_control,
      airSuperiority: defender.air_superiority,
      blockade: defender.blockade,
      fortified: defender.fortified,
      isHost: defender.is_host,
      isSpectator: defender.is_spectator,
      isEliminated: defender.is_eliminated
    }

    // Calculate battle result
    let battleResult
    if (actionType === 'ground_attack') {
      battleResult = warCalc.calculateGroundBattle(attackerNation, defenderNation, usedSoldiers, usedTanks)
    } else if (actionType === 'airstrike') {
      const airTarget = target as 'aircraft' | 'soldiers' | 'tanks' | 'ships'
      battleResult = warCalc.calculateAirBattle(attackerNation, defenderNation, usedAircraft, airTarget)
    } else if (actionType === 'naval_attack') {
      const navalTarget = target as 'ships' | 'infrastructure' | 'ground_control' | 'air_superiority'
      battleResult = warCalc.calculateNavalBattle(attackerNation, defenderNation, usedShips, navalTarget)
    } else {
      return NextResponse.json({ error: 'Invalid action type' }, { status: 400 })
    }

    // Store battle action for AI training
    const { data: battleAction, error: battleActionError } = await supabase
      .from('battle_actions')
      .insert({
        war_id: warId,
        turn_number: war.current_turn,
        attacker_id: attacker.id,
        defender_id: defender.id,
        action_type: actionType,
        target,
        soldiers_used: usedSoldiers,
        tanks_used: usedTanks,
        aircraft_used: usedAircraft,
        ships_used: usedShips,
        maps_used: mapCost,
        
        // Pre-action state
        att_pre_soldiers: attacker.soldiers,
        att_pre_tanks: attacker.tanks,
        att_pre_aircraft: attacker.aircraft,
        att_pre_ships: attacker.ships,
        att_pre_resistance: attacker.resistance,
        att_pre_maps: attacker.current_maps,
        
        def_pre_soldiers: defender.soldiers,
        def_pre_tanks: defender.tanks,
        def_pre_aircraft: defender.aircraft,
        def_pre_ships: defender.ships,
        def_pre_resistance: defender.resistance,
        
        // Battle results
        victory_type: battleResult.victoryType,
        rolls_won: battleResult.rollsWon,
        attacker_roll_1: battleResult.attackerRolls[0],
        attacker_roll_2: battleResult.attackerRolls[1],
        attacker_roll_3: battleResult.attackerRolls[2],
        defender_roll_1: battleResult.defenderRolls[0],
        defender_roll_2: battleResult.defenderRolls[1],
        defender_roll_3: battleResult.defenderRolls[2],
        
        // Casualties
        att_soldiers_lost: battleResult.attackerCasualties.soldiers,
        att_tanks_lost: battleResult.attackerCasualties.tanks,
        att_aircraft_lost: battleResult.attackerCasualties.aircraft,
        att_ships_lost: battleResult.attackerCasualties.ships,
        
        def_soldiers_lost: battleResult.defenderCasualties.soldiers,
        def_tanks_lost: battleResult.defenderCasualties.tanks,
        def_aircraft_lost: battleResult.defenderCasualties.aircraft,
        def_ships_lost: battleResult.defenderCasualties.ships,
        
        // Damage
        resistance_damage: battleResult.resistanceDamage,
        infrastructure_damage: battleResult.infrastructureDamage,
        
        // Space control
        space_control_gained: battleResult.spaceControlGained,
        space_control_lost: battleResult.spaceControlLost
      })
      .select()
      .single()

    if (battleActionError) {
      console.error('Error storing battle action:', battleActionError)
      return NextResponse.json({ error: 'Failed to store battle action' }, { status: 500 })
    }

    // Update attacker
    const newAttackerSoldiers = Math.max(0, attacker.soldiers - battleResult.attackerCasualties.soldiers)
    const newAttackerTanks = Math.max(0, attacker.tanks - battleResult.attackerCasualties.tanks)
    const newAttackerAircraft = Math.max(0, attacker.aircraft - battleResult.attackerCasualties.aircraft)
    const newAttackerShips = Math.max(0, attacker.ships - battleResult.attackerCasualties.ships)
    const newAttackerMaps = Math.max(0, attacker.current_maps - mapCost)

    // Update space control for attacker
    const attackerUpdates: {
      soldiers: number
      tanks: number
      aircraft: number
      ships: number
      current_maps: number
      fortified: boolean
      ground_control?: boolean
      air_superiority?: boolean
      blockade?: boolean
    } = {
      soldiers: newAttackerSoldiers,
      tanks: newAttackerTanks,
      aircraft: newAttackerAircraft,
      ships: newAttackerShips,
      current_maps: newAttackerMaps,
      fortified: false // Remove fortification when attacking
    }

    if (battleResult.spaceControlGained) {
      if (battleResult.spaceControlGained === 'ground_control') attackerUpdates.ground_control = true
      if (battleResult.spaceControlGained === 'air_superiority') attackerUpdates.air_superiority = true
      if (battleResult.spaceControlGained === 'blockade') attackerUpdates.blockade = true
    }

    const { error: attackerUpdateError } = await supabase
      .from('war_participants')
      .update(attackerUpdates)
      .eq('id', attacker.id)

    if (attackerUpdateError) {
      console.error('Error updating attacker:', attackerUpdateError)
    }

    // Update defender
    const newDefenderSoldiers = Math.max(0, defender.soldiers - battleResult.defenderCasualties.soldiers)
    const newDefenderTanks = Math.max(0, defender.tanks - battleResult.defenderCasualties.tanks)
    const newDefenderAircraft = Math.max(0, defender.aircraft - battleResult.defenderCasualties.aircraft)
    const newDefenderShips = Math.max(0, defender.ships - battleResult.defenderCasualties.ships)
    const newDefenderResistance = Math.max(0, defender.resistance + battleResult.resistanceDamage) // resistanceDamage is negative

    // Update space control for defender
    const defenderUpdates: {
      soldiers: number
      tanks: number
      aircraft: number
      ships: number
      resistance: number
      is_eliminated?: boolean
      fortified?: boolean
      ground_control?: boolean
      air_superiority?: boolean
    } = {
      soldiers: newDefenderSoldiers,
      tanks: newDefenderTanks,
      aircraft: newDefenderAircraft,
      ships: newDefenderShips,
      resistance: newDefenderResistance
    }

    if (battleResult.spaceControlLost) {
      if (battleResult.spaceControlLost === 'fortified') defenderUpdates.fortified = false
      if (battleResult.spaceControlLost === 'ground_control') defenderUpdates.ground_control = false
      if (battleResult.spaceControlLost === 'air_superiority') defenderUpdates.air_superiority = false
    }

    // Check if defender is eliminated
    if (newDefenderResistance <= 0) {
      defenderUpdates.is_eliminated = true
      defenderUpdates.resistance = 0
    }

    const { error: defenderUpdateError } = await supabase
      .from('war_participants')
      .update(defenderUpdates)
      .eq('id', defender.id)

    if (defenderUpdateError) {
      console.error('Error updating defender:', defenderUpdateError)
    }

    // Check if war should end (only one non-spectator left)
    const { data: remainingPlayers } = await supabase
      .from('war_participants')
      .select('id')
      .eq('war_id', warId)
      .eq('is_spectator', false)
      .eq('is_eliminated', false)

    if (remainingPlayers && remainingPlayers.length <= 1) {
      await supabase
        .from('wars')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', warId)
    }

    return NextResponse.json({
      success: true,
      battleResult,
      actionId: battleAction.id,
      attackerCasualties: battleResult.attackerCasualties,
      defenderCasualties: battleResult.defenderCasualties,
      resistanceDamage: battleResult.resistanceDamage,
      defenderEliminated: newDefenderResistance <= 0,
      message: `${battleResult.victoryType.replace('_', ' ')} - ${battleResult.rollsWon}/3 rolls won`,
      detailedResult: {
        attackerName: attacker.nation_name,
        defenderName: defender.nation_name,
        actionType,
        target,
        preActionState: {
          attacker: {
            soldiers: attacker.soldiers,
            tanks: attacker.tanks,
            aircraft: attacker.aircraft,
            ships: attacker.ships,
            resistance: attacker.resistance,
            maps: attacker.current_maps
          },
          defender: {
            soldiers: defender.soldiers,
            tanks: defender.tanks,
            aircraft: defender.aircraft,
            ships: defender.ships,
            resistance: defender.resistance
          }
        },
        postActionState: {
          attacker: {
            soldiers: newAttackerSoldiers,
            tanks: newAttackerTanks,
            aircraft: newAttackerAircraft,
            ships: newAttackerShips,
            maps: newAttackerMaps
          },
          defender: {
            soldiers: newDefenderSoldiers,
            tanks: newDefenderTanks,
            aircraft: newDefenderAircraft,
            ships: newDefenderShips,
            resistance: newDefenderResistance,
            eliminated: newDefenderResistance <= 0
          }
        }
      }
    })

  } catch (error) {
    console.error('Battle action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
