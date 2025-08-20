// War Simulator V2 Types - Clean and simple

export type VictoryType = 'immense_triumph' | 'moderate_success' | 'pyrrhic_victory' | 'utter_failure'

export type ActionType = 'ground_attack' | 'airstrike' | 'naval_attack'

export type WarStatus = 'waiting' | 'active' | 'completed'

export interface Nation {
  id: string
  name: string
  playerId: string
  playerName: string
  
  // Military counts
  soldiers: number
  tanks: number
  aircraft: number
  ships: number
  
  // Stats
  cities: number
  resistance: number
  currentMaps: number
  maxMaps: number
  
  // Space control
  groundControl: boolean
  airSuperiority: boolean
  blockade: boolean
  fortified: boolean
  
  // Status
  isHost: boolean
  isSpectator: boolean
  isEliminated: boolean
}

export interface MilitaryCapacity {
  maxSoldiers: number
  maxTanks: number
  maxAircraft: number
  maxShips: number
}

export interface BattleResult {
  victoryType: VictoryType
  rollsWon: number
  attackerRolls: number[]
  defenderRolls: number[]
  resistanceDamage: number
  infrastructureDamage: number
  attackerCasualties: {
    soldiers: number
    tanks: number
    aircraft: number
    ships: number
  }
  defenderCasualties: {
    soldiers: number
    tanks: number
    aircraft: number
    ships: number
  }
  spaceControlGained?: string
  spaceControlLost?: string
  
  // Detailed calculation breakdown
  calculationDetails?: {
    attackerStrength: number
    defenderStrength: number
    fortificationBonus: number
    airSuperiorityFactor: number
    rollValue: number
    strengthFactors: {
      attFactor: number
      defFactor: number
    }
    damageCalculations: {
      tankLossFormula: string
      soldierLossFormula: string
      resistanceFormula: string
    }
    modifiers: {
      fortified: boolean
      airSuperiority: boolean
      groundControl: boolean
      blockade: boolean
    }
  }
}

export interface War {
  id: string
  name: string
  createdBy: string
  status: WarStatus
  maxPlayers: number
  currentPlayers: number
  turnDuration: number // seconds
  currentTurn: number
  participants: Nation[]
  startedAt?: Date
  endedAt?: Date
  lastTurnAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface BattleAction {
  id: string
  warId: string
  turnNumber: number
  
  // Action details
  attackerId: string
  defenderId: string
  actionType: ActionType
  target?: string // For airstrikes
  
  // Military used
  soldiersUsed: number
  tanksUsed: number
  aircraftUsed: number
  shipsUsed: number
  mapsUsed: number
  
  // Pre-action state (for AI training)
  attackerPreState: {
    soldiers: number
    tanks: number
    aircraft: number
    ships: number
    resistance: number
    maps: number
  }
  defenderPreState: {
    soldiers: number
    tanks: number
    aircraft: number
    ships: number
    resistance: number
  }
  
  // Results
  result: BattleResult
  executedAt: Date
}

export interface CreateWarRequest {
  name: string
  maxPlayers: number
  turnDuration: number
  playerName: string
  nationName: string
  nationId?: number // P&W nation ID if importing
  customMilitary?: {
    soldiers: number
    tanks: number
    aircraft: number
    ships: number
    cities?: number
  }
}

export interface JoinWarRequest {
  warId: string
  playerName: string
  nationName: string
  nationId?: number
  asSpectator?: boolean
  customMilitary?: {
    soldiers: number
    tanks: number
    aircraft: number
    ships: number
    cities?: number
  }
}

export interface ExecuteActionRequest {
  warId: string
  defenderId: string
  actionType: ActionType
  target?: string
  soldiersUsed?: number
  tanksUsed?: number
  aircraftUsed?: number
  shipsUsed?: number
}
