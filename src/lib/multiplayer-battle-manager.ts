import { createClient } from '@supabase/supabase-js'
import { Nation, BattleLog, ActionType, BattleResult, BattleSettings } from '@/types/war'
import WarCalculations from './war-calculations'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export interface MultiplayerBattleRoom {
  id: string
  room_code: string
  status: 'waiting' | 'in_progress' | 'completed' | 'abandoned'
  settings: BattleSettings
  current_turn: number
  max_turns: number
  active_player_id: string | null
  created_at: string
  updated_at: string
  started_at: string | null
  ended_at: string | null
}

export interface BattleRoomPlayer {
  id: string
  room_id: string
  player_id: string
  player_name: string
  side: 'attacker' | 'defender' | null
  nation_data: Nation | null
  is_ready: boolean
  is_host: boolean
  joined_at: string
}

export interface BattleAction {
  id: string
  room_id: string
  player_id: string
  turn_number: number
  action_type: ActionType
  action_data: {
    target?: string
    units?: number
    options?: { [key: string]: unknown }
  }
  result_data: BattleResult | null
  timestamp: string
  sequence_number: number
}

class MultiplayerBattleManager {
  private calculations = new WarCalculations()

  /**
   * Execute a battle action for a multiplayer room
   */
  async executeBattleAction(
    roomId: string,
    playerId: string,
    actionType: ActionType,
    actionData: {
      target?: string
      units?: number
      options?: { [key: string]: unknown }
    }
  ): Promise<{ success: boolean; error?: string; result?: BattleResult }> {
    try {
      // Get current room state
      const { data: room, error: roomError } = await supabase
        .from('battle_rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (roomError || !room) {
        return { success: false, error: 'Room not found' }
      }

      // Check if room is in progress
      if (room.status !== 'in_progress') {
        return { success: false, error: 'Battle not in progress' }
      }

      // Get current player and opponent data
      const { data: players, error: playersError } = await supabase
        .from('battle_room_players')
        .select('*')
        .eq('room_id', roomId)

      if (playersError || !players || players.length !== 2) {
        return { success: false, error: 'Invalid room state' }
      }

      const currentPlayer = players.find(p => p.player_id === playerId)
      const opponent = players.find(p => p.player_id !== playerId)

      if (!currentPlayer || !opponent || !currentPlayer.nation_data || !opponent.nation_data) {
        return { success: false, error: 'Player data not found' }
      }

      const attacker = currentPlayer.nation_data as Nation
      const defender = opponent.nation_data as Nation

      // Validate MAP requirements
      const mapsRequired = this.getMapsRequired(actionType)
      if (attacker.maps < mapsRequired) {
        return { 
          success: false, 
          error: `Not enough MAPs! Required: ${mapsRequired}, Available: ${attacker.maps}` 
        }
      }

      // Execute the battle calculation
      let result: BattleResult | null = null

      switch (actionType) {
        case 'ground_battle': {
          const soldiers = actionData.options?.soldiers as number ?? 0
          const tanks = actionData.options?.tanks as number ?? 0
          
          if (soldiers <= 0 && tanks <= 0) {
            return { success: false, error: 'No soldiers or tanks specified' }
          }
          
          result = this.calculations.calculateGroundBattleDamage(attacker, defender, soldiers, tanks)
          break
        }
        
        case 'airstrike': {
          if (!actionData.target) {
            return { success: false, error: 'No target specified for airstrike' }
          }
          
          result = this.calculations.calculateAirBattleDamage(
            attacker,
            defender,
            actionData.units || attacker.military.aircraft,
            actionData.target as 'aircraft' | 'soldiers' | 'tanks' | 'ships'
          )
          break
        }
        
        case 'naval_battle': {
          if (!actionData.target) {
            return { success: false, error: 'No target specified for naval battle' }
          }
          
          result = this.calculations.calculateNavalBattleDamage(
            attacker,
            defender,
            actionData.units || attacker.military.ships,
            actionData.target as 'ships' | 'infrastructure' | 'ground_control' | 'air_superiority'
          )
          break
        }
        
        case 'fortify': {
          // Handle fortify action
          const updatedAttacker = { ...attacker }
          updatedAttacker.spaceControl.fortified = true
          updatedAttacker.maps -= mapsRequired
          
          // Update player nation data
          await supabase
            .from('battle_room_players')
            .update({ nation_data: updatedAttacker })
            .eq('room_id', roomId)
            .eq('player_id', playerId)

          // Create battle log entry
          await this.addBattleLog(roomId, room.current_turn, attacker.name, defender.name, {
            action: 'FORTIFY',
            actionType: 'fortify',
            result: 'success',
            message: `${attacker.name} fortified their position`,
            attackerCasualties: {},
            defenderCasualties: {},
            resistanceDamage: 0,
            infrastructureDamage: 0,
            loot: {}
          })
          
          return { success: true }
        }
        
        default:
          return { success: false, error: 'Invalid action type' }
      }

      if (!result) {
        return { success: false, error: 'Failed to calculate battle result' }
      }

      // Apply battle results to nations
      const updatedAttacker = { ...attacker }
      const updatedDefender = { ...defender }

      // Apply casualties and updates from result
      if (result.attackerCasualties) {
        Object.entries(result.attackerCasualties).forEach(([key, value]) => {
          if (key in updatedAttacker.military && typeof value === 'number') {
            const militaryKey = key as keyof typeof updatedAttacker.military
            if (typeof updatedAttacker.military[militaryKey] === 'number') {
              (updatedAttacker.military[militaryKey] as number) -= value
            }
          }
        })
      }

      if (result.defenderCasualties) {
        Object.entries(result.defenderCasualties).forEach(([key, value]) => {
          if (key in updatedDefender.military && typeof value === 'number') {
            const militaryKey = key as keyof typeof updatedDefender.military
            if (typeof updatedDefender.military[militaryKey] === 'number') {
              (updatedDefender.military[militaryKey] as number) -= value
            }
          }
        })
      }

      // Apply resistance and infrastructure damage
      updatedDefender.resistance += result.resistanceDamage
      if (result.infrastructureDamage) {
        updatedDefender.infrastructure -= result.infrastructureDamage
      }

      // Apply MAP consumption
      console.log(`🎯 Consuming ${mapsRequired} MAPs from ${attacker.name}. Before: ${attacker.maps}, After: ${attacker.maps - mapsRequired}`)
      updatedAttacker.maps -= mapsRequired

      // Update space control if applicable
      if (result.spaceControlGained) {
        updatedAttacker.spaceControl[result.spaceControlGained] = true
      }
      if (result.spaceControlLost) {
        updatedAttacker.spaceControl[result.spaceControlLost] = false
      }

      // Update both players' nation data
      console.log('🔄 Updating player states in database...')
      console.log(`📊 Attacker data being saved:`, {
        name: updatedAttacker.name,
        maps: updatedAttacker.maps,
        resistance: updatedAttacker.resistance,
        military: updatedAttacker.military
      })
      console.log(`📊 Defender data being saved:`, {
        name: updatedDefender.name,
        maps: updatedDefender.maps,
        resistance: updatedDefender.resistance,
        military: updatedDefender.military
      })

      const updateResults = await Promise.all([
        supabase
          .from('battle_room_players')
          .update({ nation_data: updatedAttacker })
          .eq('room_id', roomId)
          .eq('player_id', playerId),
        supabase
          .from('battle_room_players')
          .update({ nation_data: updatedDefender })
          .eq('room_id', roomId)
          .eq('player_id', opponent.player_id)
      ])

      console.log('✅ Player states updated successfully')
      console.log('📋 Update results:', updateResults.map(r => ({ error: r.error, status: r.status })))

      // Record the action
      await supabase
        .from('battle_actions')
        .insert({
          room_id: roomId,
          player_id: playerId,
          turn_number: room.current_turn,
          action_type: actionType,
          action_data: actionData,
          result_data: result
        })

      // Add battle log entry
      console.log('📝 Creating battle log entry...')
      const logEntry = {
        action: `${actionType.toUpperCase()}${actionData.target ? ` vs ${actionData.target.toUpperCase()}` : ''}`,
        actionType,
        result: 'success',
        victoryType: result.victoryType,
        message: `${attacker.name} executed ${actionType.toUpperCase()} - ${result.victoryType.toUpperCase()}! Resistance damage: ${result.resistanceDamage}`,
        attackerCasualties: result.attackerCasualties || {},
        defenderCasualties: result.defenderCasualties || {},
        resistanceDamage: result.resistanceDamage,
        infrastructureDamage: result.infrastructureDamage || 0,
        loot: result.loot || {}
      }
      console.log('📋 Log entry data:', logEntry)
      
      await this.addBattleLog(roomId, room.current_turn, attacker.name, defender.name, logEntry)
      console.log('✅ Battle log entry created successfully')

      // Check for victory conditions
      const gameEnded = await this.checkVictoryConditions(roomId, updatedAttacker, updatedDefender, room.current_turn, room.max_turns)
      
      // In simultaneous gameplay, don't switch turns - both players can act anytime
      
      return { success: true, result }

    } catch (error) {
      console.error('Error executing battle action:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  /**
   * Switch active player and advance turn if both players have acted
   */
  private async switchTurns(roomId: string, currentPlayerId: string, opponentPlayerId: string) {
    // For now, simply switch to the opponent
    // In the future, we could implement more complex turn mechanics
    await supabase
      .from('battle_rooms')
      .update({ 
        active_player_id: opponentPlayerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)
  }

  /**
   * Check for victory conditions and end game if needed
   */
  private async checkVictoryConditions(
    roomId: string, 
    attacker: Nation, 
    defender: Nation, 
    currentTurn: number, 
    maxTurns: number
  ): Promise<boolean> {
    let winner: string | null = null
    let endReason = ''

    if (attacker.resistance <= 0) {
      winner = defender.name
      endReason = `${defender.name} has reduced their opponent's resistance to 0 and won the war!`
    } else if (defender.resistance <= 0) {
      winner = attacker.name
      endReason = `${attacker.name} has reduced their opponent's resistance to 0 and won the war!`
    } else if (currentTurn >= maxTurns) {
      endReason = 'The war has reached the maximum duration and expired without a winner.'
    }

    if (winner !== null || currentTurn >= maxTurns) {
      await supabase
        .from('battle_rooms')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId)

      // Add final battle log
      await this.addBattleLog(roomId, currentTurn, attacker.name, defender.name, {
        action: 'GAME_END',
        actionType: 'game_end',
        result: winner ? 'victory' : 'draw',
        message: winner ? `🎉 ${winner} Wins! ${endReason}` : `⏱️ War Expired - ${endReason}`,
        attackerCasualties: {},
        defenderCasualties: {},
        resistanceDamage: 0,
        infrastructureDamage: 0,
        loot: {}
      })

      return true
    }

    return false
  }

  /**
   * Add a battle log entry
   */
  private async addBattleLog(
    roomId: string,
    turnNumber: number,
    attackerName: string,
    defenderName: string,
    logData: {
      action: string
      actionType: string
      result: string
      victoryType?: string
      message: string
      attackerCasualties: { [key: string]: number }
      defenderCasualties: { [key: string]: number }
      resistanceDamage: number
      infrastructureDamage: number
      loot: { [key: string]: number }
    }
  ) {
    console.log(`📜 Inserting battle log for room ${roomId}, turn ${turnNumber}:`, logData)
    
    const insertResult = await supabase
      .from('battle_logs')
      .insert({
        room_id: roomId,
        turn_number: turnNumber,
        attacker_name: attackerName,
        defender_name: defenderName,
        ...logData
      })
    
    if (insertResult.error) {
      console.error('❌ Failed to insert battle log:', insertResult.error)
    } else {
      console.log('✅ Battle log inserted successfully')
    }
    
    return insertResult
  }

  /**
   * Get MAP requirements for different action types
   */
  private getMapsRequired(actionType: ActionType): number {
    switch (actionType) {
      case 'ground_battle': return 3
      case 'airstrike': return 4
      case 'naval_battle': return 5
      case 'missile_launch': return 8
      case 'nuclear_attack': return 12
      case 'fortify': return 3
      case 'spy_operation': return 0
      default: return 0
    }
  }

  /**
   * Subscribe to room updates for real-time synchronization
   */
  subscribeToRoom(roomId: string, callback: (room: MultiplayerBattleRoom) => void) {
    return supabase
      .channel(`battle_room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_rooms',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          callback(payload.new as MultiplayerBattleRoom)
        }
      )
      .subscribe()
  }

  /**
   * Subscribe to battle logs for real-time updates
   */
  subscribeToBattleLogs(roomId: string, callback: (logs: BattleLog[]) => void) {
    return supabase
      .channel(`battle_logs_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'battle_logs',
          filter: `room_id=eq.${roomId}`
        },
        async () => {
          // Fetch updated logs
          const { data: logs } = await supabase
            .from('battle_logs')
            .select('*')
            .eq('room_id', roomId)
            .order('timestamp', { ascending: true })

          if (logs) {
            const battleLogs: BattleLog[] = logs.map(log => ({
              id: log.id,
              turn: log.turn_number,
              attacker: log.attacker_name,
              defender: log.defender_name,
              action: log.action,
              actionType: log.action_type as ActionType,
              result: log.result,
              victoryType: log.victory_type,
              message: log.message,
              timestamp: new Date(log.timestamp),
              attackerCasualties: log.attacker_casualties,
              defenderCasualties: log.defender_casualties,
              resistanceDamage: log.resistance_damage,
              infrastructureDamage: log.infrastructure_damage,
              loot: log.loot
            }))
            callback(battleLogs)
          }
        }
      )
      .subscribe()
  }

  /**
   * Subscribe to player updates for real-time nation state sync
   */
  subscribeToPlayers(roomId: string, callback: (players: BattleRoomPlayer[]) => void) {
    return supabase
      .channel(`battle_players_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'battle_room_players',
          filter: `room_id=eq.${roomId}`
        },
        async () => {
          // Fetch updated players
          const { data: players } = await supabase
            .from('battle_room_players')
            .select('*')
            .eq('room_id', roomId)

          if (players) {
            callback(players as BattleRoomPlayer[])
          }
        }
      )
      .subscribe()
  }
}

export const multiplayerBattleManager = new MultiplayerBattleManager()
