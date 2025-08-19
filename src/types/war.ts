// War simulation types

export type WarState = 'setup' | 'battle' | 'finished'

export type VictoryType = 'immense_triumph' | 'moderate_success' | 'pyrrhic_victory' | 'utter_failure'

export type BattleType = 'ground' | 'air' | 'naval' | 'missile' | 'nuclear' | 'spy'

export type ActionType = 'ground_battle' | 'airstrike' | 'naval_battle' | 'missile_launch' | 
                        'nuclear_attack' | 'spy_operation' | 'fortify' | 'war_declaration' | 'system'

export interface BattleSettings {
  gameMode: 'singleplayer' | 'multiplayer'
  turnDuration: number // in seconds
  maxTurns: number
  isPrivate: boolean
  roomCode?: string
}

export type SpaceControl = {
  groundControl: boolean
  airSuperiority: boolean
  blockade: boolean
  fortified: boolean
}

export type Military = {
  soldiers: number
  tanks: number
  aircraft: number
  ships: number
  missiles: number
  nukes: number
  spies: number
}

export type MilitaryCapacity = {
  maxSoldiers: number
  maxTanks: number
  maxAircraft: number
  maxShips: number
  maxMissiles: number
  maxNukes: number
  maxSpies: number
}

export type Resources = {
  money: number
  food: number
  coal: number
  oil: number
  uranium: number
  lead: number
  iron: number
  bauxite: number
  gasoline: number
  munitions: number
  steel: number
  aluminum: number
}

export type Nation = {
  id: string
  name: string
  leader: string
  cities: number
  score: number
  resistance: number
  maps: number
  maxMaps: number
  military: Military
  militaryCapacity: MilitaryCapacity
  spaceControl: SpaceControl
  resources: Resources
  infrastructure: number
  warPolicy: string
  warType: 'ordinary' | 'attrition' | 'raid'
  isDefender: boolean
  projects: string[]
}

export type BattleResult = {
  victoryType: VictoryType
  rollsWon: number
  attackerRolls: number[]
  defenderRolls: number[]
  resistanceDamage: number
  infrastructureDamage: number
  loot: Partial<Resources>
  attackerCasualties: Partial<Military>
  defenderCasualties: Partial<Military>
  spaceControlGained?: keyof SpaceControl
  spaceControlLost?: keyof SpaceControl
  improvementDestroyed?: string
}

export type BattleLog = {
  id: string
  turn: number
  attacker: string
  defender: string
  action: string
  actionType: ActionType
  result: 'success' | 'failure'
  victoryType?: VictoryType
  message: string
  timestamp: Date
  attackerCasualties: Partial<Military>
  defenderCasualties: Partial<Military>
  resistanceDamage: number
  infrastructureDamage: number
  loot: Partial<Resources>
  spaceControlChanges?: {
    gained?: keyof SpaceControl
    lost?: keyof SpaceControl
  }
  details?: {
    mapsUsed: number
    attackerRolls?: number[]
    defenderRolls?: number[]
    rollsWon?: number
    attackerStrength?: number
    defenderStrength?: number
  }
}

export type PWNation = {
  id: number
  nation_name: string
  leader_name: string
  num_cities: number
  score: number
  soldiers: number
  tanks: number
  aircraft: number
  ships: number
  missiles: number
  nukes: number
  spies: number
}

// Military improvement buildings
export type Buildings = {
  barracks: number
  factories: number
  hangars: number
  drydocks: number
}

// War formulas and calculations
export interface WarCalculations {
  calculateArmyValue(soldiers: number, tanks: number, munitions: boolean): number
  calculateBattleRolls(attackerStrength: number, defenderStrength: number): {
    attackerRolls: number[]
    defenderRolls: number[]
    rollsWon: number
    victoryType: VictoryType
  }
  calculateGroundBattleDamage(
    attacker: Nation,
    defender: Nation,
    soldiers: number,
    tanks: number,
    victoryType: VictoryType,
    rollsWon: number
  ): BattleResult
  calculateAirBattleDamage(
    attacker: Nation,
    defender: Nation,
    aircraft: number,
    target: 'aircraft' | 'soldiers' | 'tanks' | 'ships',
    victoryType: VictoryType,
    rollsWon: number
  ): BattleResult
  calculateNavalBattleDamage(
    attacker: Nation,
    defender: Nation,
    ships: number,
    target: 'ships' | 'infrastructure' | 'ground_control' | 'air_superiority',
    victoryType: VictoryType,
    rollsWon: number
  ): BattleResult
  calculateSpySuccess(
    attackingSpies: number,
    defendingSpies: number,
    safety: 1 | 2 | 3,
    operation: string,
    policies: { arcane: boolean, tactician: boolean, surveillanceNetwork: boolean }
  ): {
    success: boolean
    successChance: number
    spiesKilled: number
    spiesLost: number
  }
}
