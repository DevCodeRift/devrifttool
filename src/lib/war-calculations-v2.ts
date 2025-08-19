import { Nation, BattleResult, VictoryType } from '@/types/war-v2'

/**
 * War Calculations V2 - Clean implementation using exact P&W formulas
 * Based on politics-and-war-formulas.md documentation
 */
export class WarCalculationsV2 {
  
  /**
   * Generate random factor between        // Calculate aircraft casualties for non-dogfight
        const attAirLossPerRoll: number[] = []
        const defAirLossPerRoll: number[] = []
        
        for (let i = 0; i < 3; i++) {
          const attackerRoll = battleOutcome.attackerRolls[i]
          const defenderRoll = battleOutcome.defenderRolls[i]
          
          attAirLossPerRoll.push(Math.floor(defenderRoll * 0.015385))
          defAirLossPerRoll.push(Math.floor(attackerRoll * 0.009091))
        }
        
        const attAirLoss = Math.floor(attAirLossPerRoll.reduce((a, b) => a + b, 0) * fortifyFactor)
        const defAirLoss = defAirLossPerRoll.reduce((a, b) => a + b, 0)(P&W RAND function)
   */
  private generateRandFactor(): number {
    return Math.random() * (1.05 - 0.85) + 0.85
  }
  
  /**
   * Calculate army value for ground battles
   * Formula: Unarmed Soldiers × 1 + Armed Soldiers × 1.75 + Tanks × 40
   */
  private calculateArmyValue(soldiers: number, tanks: number, hasMunitions: boolean = true): number {
    const soldierValue = hasMunitions ? soldiers * 1.75 : soldiers * 1
    return soldierValue + (tanks * 40)
  }

  /**
   * Calculate battle roll using exact P&W formula
   */
  private calculateRoll(defending: number, attacking: number): number {
    const minDef = defending * 0.4  // Defender minimum (40%)
    const minAtt = attacking * 0.4  // Attacker minimum (40%)
    
    if (attacking <= minDef || attacking === 0) return 0      // Guaranteed failure
    if (defending < minAtt) return 3                         // Guaranteed success
    
    const defMean = (defending + minDef) * 0.5
    const greater = attacking - defMean
    const lessThan = defMean - minAtt
    
    if (greater <= 0) return 0
    if (lessThan <= 0) return 3
    
    return 3 * greater / (greater + lessThan)  // Returns 0-3 representing victory level
  }

  /**
   * Perform 3 battle rolls and determine victory type
   */
  private performBattleRolls(attackerStrength: number, defenderStrength: number): {
    attackerRolls: number[]
    defenderRolls: number[]
    rollsWon: number
    victoryType: VictoryType
    rollValue: number
  } {
    const attackerRolls: number[] = []
    const defenderRolls: number[] = []
    let rollsWon = 0

    // Perform 3 rolls (each between 40% and 100% of strength)
    for (let i = 0; i < 3; i++) {
      const attackerRoll = attackerStrength * (0.4 + Math.random() * 0.6)
      const defenderRoll = defenderStrength * (0.4 + Math.random() * 0.6)
      
      attackerRolls.push(attackerRoll)
      defenderRolls.push(defenderRoll)
      
      if (attackerRoll > defenderRoll) {
        rollsWon++
      }
    }

    // Calculate the roll value for damage calculations
    const rollValue = this.calculateRoll(defenderStrength, attackerStrength)

    // Determine victory type
    let victoryType: VictoryType
    switch (rollsWon) {
      case 3: victoryType = 'immense_triumph'; break
      case 2: victoryType = 'moderate_success'; break
      case 1: victoryType = 'pyrrhic_victory'; break
      default: victoryType = 'utter_failure'; break
    }

    return { attackerRolls, defenderRolls, rollsWon, victoryType, rollValue }
  }

  /**
   * Calculate maximum military based on cities
   */
  calculateMaxMilitary(cities: number): {
    maxSoldiers: number
    maxTanks: number
    maxAircraft: number
    maxShips: number
  } {
    return {
      maxSoldiers: cities * 5 * 3000,  // 5 barracks × 3000 soldiers per city
      maxTanks: cities * 5 * 250,      // 5 factories × 250 tanks per city  
      maxAircraft: cities * 5 * 15,    // 5 hangars × 15 aircraft per city
      maxShips: cities * 3 * 5         // 3 drydocks × 5 ships per city
    }
  }

  /**
   * GROUND BATTLE - Using exact P&W formulas
   */
  calculateGroundBattle(
    attacker: Nation,
    defender: Nation,
    soldiers: number,
    tanks: number
  ): BattleResult {
    // Calculate army strengths
    const attackerStrength = this.calculateArmyValue(soldiers, tanks, true)
    const defenderStrength = this.calculateArmyValue(defender.soldiers, defender.tanks, true)

    // Perform battle rolls
    const battleOutcome = this.performBattleRolls(attackerStrength, defenderStrength)
    
    // Calculate resistance damage
    let resistanceDamage = 0
    switch (battleOutcome.victoryType) {
      case 'immense_triumph': resistanceDamage = -10; break
      case 'moderate_success': resistanceDamage = -7; break
      case 'pyrrhic_victory': resistanceDamage = -4; break
      case 'utter_failure': resistanceDamage = 0; break
    }

    // Calculate damage factors
    const fortifyFactor = defender.fortified ? 1.25 : 1
    const airSuperiorityFactor = attacker.airSuperiority ? 1 : 0.66
    const roll = battleOutcome.rollValue
    
    const attFactor = (1680 * (3 - roll) + 1800 * roll) / 3
    const defFactor = 1680 + (1800 - attFactor)

    // Calculate strength values for damage calculations
    const attTankStr = tanks * 40
    const attSoldStr = soldiers * 1.75
    const defTankStr = defender.tanks * 40 * airSuperiorityFactor
    const defSoldStr = Math.max(50, defender.soldiers * 1.75)

    // Calculate tank losses using exact P&W formulas
    const defTankLoss = Math.floor(Math.min(
      defender.tanks,
      ((attTankStr * 0.7 + 1) / defFactor + (attSoldStr * 0.7 + 1) / 2250) * 1.33
    ))
    
    const attTankLoss = Math.floor(Math.min(
      tanks,
      ((defTankStr * 0.7 + 1) / attFactor + (defSoldStr * 0.7 + 1) / 2250) * fortifyFactor * 1.33
    ))

    // Calculate soldier losses using exact P&W formulas
    const defSoldierLoss = Math.floor(Math.min(
      defender.soldiers,
      ((attSoldStr * 0.7 + 1) / 22 + (attTankStr * 0.7 + 1) / 7.33) * 0.3125
    ))
    
    const attSoldierLoss = Math.floor(Math.min(
      soldiers,
      ((defSoldStr * 0.7 + 1) / 22 + (defTankStr * 0.7 + 1) / 7.33) * fortifyFactor * 0.3125
    ))

    // Calculate infrastructure damage
    const infraDamage = Math.max(0, Math.min(
      ((soldiers - (defender.soldiers * 0.5)) * 0.000606061 + 
       (tanks - (defender.tanks * 0.5)) * 0.01) * 0.95 * (battleOutcome.rollsWon / 3),
      100 // Simplified for now, no actual infrastructure tracking
    ))

    // Space control changes
    let spaceControlGained: string | undefined
    let spaceControlLost: string | undefined
    
    if (battleOutcome.victoryType === 'immense_triumph') {
      spaceControlGained = 'ground_control'
    }
    if (battleOutcome.victoryType !== 'utter_failure' && defender.fortified) {
      spaceControlLost = 'fortified'
    }

    return {
      victoryType: battleOutcome.victoryType,
      rollsWon: battleOutcome.rollsWon,
      attackerRolls: battleOutcome.attackerRolls,
      defenderRolls: battleOutcome.defenderRolls,
      resistanceDamage,
      infrastructureDamage: infraDamage,
      attackerCasualties: {
        soldiers: attSoldierLoss,
        tanks: attTankLoss,
        aircraft: 0,
        ships: 0
      },
      defenderCasualties: {
        soldiers: defSoldierLoss,
        tanks: defTankLoss,
        aircraft: 0,
        ships: 0
      },
      spaceControlGained,
      spaceControlLost
    }
  }

  /**
   * AIR BATTLE - Using exact P&W formulas
   */
  calculateAirBattle(
    attacker: Nation,
    defender: Nation,
    aircraft: number,
    target: 'aircraft' | 'soldiers' | 'tanks' | 'ships'
  ): BattleResult {
    const attackerStrength = aircraft
    const defenderStrength = defender.aircraft

    const battleOutcome = this.performBattleRolls(attackerStrength, defenderStrength)
    
    // Calculate resistance damage
    let resistanceDamage = 0
    switch (battleOutcome.victoryType) {
      case 'immense_triumph': resistanceDamage = -12; break
      case 'moderate_success': resistanceDamage = -9; break
      case 'pyrrhic_victory': resistanceDamage = -6; break
      case 'utter_failure': resistanceDamage = 0; break
    }

    const fortifyFactor = defender.fortified ? 1.25 : 1
    const randFactor = this.generateRandFactor()

    const defenderCasualties = { soldiers: 0, tanks: 0, aircraft: 0, ships: 0 }
    const attackerCasualties = { soldiers: 0, tanks: 0, aircraft: 0, ships: 0 }

    if (target === 'aircraft') {
      // Dogfight - Air vs Air combat
      let attAirLoss = 0
      let defAirLoss = 0
      
      for (let i = 0; i < 3; i++) {
        const attackerRoll = battleOutcome.attackerRolls[i]
        const defenderRoll = battleOutcome.defenderRolls[i]
        
        attAirLoss += Math.floor(defenderRoll * 0.01)
        defAirLoss += Math.floor(attackerRoll * 0.018337)
      }
      
      attAirLoss = Math.floor(attAirLoss * fortifyFactor)
      attackerCasualties.aircraft = Math.min(aircraft, attAirLoss)
      defenderCasualties.aircraft = Math.min(defender.aircraft, defAirLoss)
    } else {
      // Air vs Ground targets
      switch (target) {
        case 'soldiers':
          const soldiersKilled = Math.round(Math.max(Math.min(
            defender.soldiers,
            Math.min(
              defender.soldiers * 0.75 + 1000,
              (aircraft - defenderStrength * 0.5) * 35 * randFactor
            )
          ), 0))
          defenderCasualties.soldiers = Math.min(defender.soldiers, soldiersKilled)
          break
          
        case 'tanks':
          const tanksKilled = Math.round(Math.max(Math.min(
            defender.tanks,
            Math.min(
              defender.tanks * 0.75 + 10,
              (aircraft - defenderStrength * 0.5) * 1.25 * randFactor
            )
          ), 0))
          defenderCasualties.tanks = Math.min(defender.tanks, tanksKilled)
          break
          
        case 'ships':
          const shipsKilled = Math.round(Math.max(Math.min(
            defender.ships,
            Math.min(
              defender.ships * 0.5 + 4,
              (aircraft - defenderStrength * 0.5) * 0.0285 * randFactor
            )
          ), 0))
          defenderCasualties.ships = Math.min(defender.ships, shipsKilled)
          break
      }

      // Calculate aircraft casualties for non-dogfight
      if (defender.aircraft > 0) {
        let attAirLoss = 0
        let defAirLoss = 0
        
        for (let i = 0; i < 3; i++) {
          const attackerRoll = battleOutcome.attackerRolls[i]
          const defenderRoll = battleOutcome.defenderRolls[i]
          
          attAirLoss += Math.floor(defenderRoll * 0.015385)
          defAirLoss += Math.floor(attackerRoll * 0.009091)
        }
        
        attAirLoss = Math.floor(attAirLoss * fortifyFactor)
        attackerCasualties.aircraft = Math.min(aircraft, attAirLoss)
        defenderCasualties.aircraft = Math.min(defender.aircraft, defAirLoss)
      }
    }

    // Calculate infrastructure damage
    const infraDamage = Math.max(0, Math.min(
      (aircraft - (defenderStrength * 0.5)) * 0.35353535 * randFactor * (battleOutcome.rollsWon / 3),
      100 // Simplified
    ))

    // Space control
    let spaceControlGained: string | undefined
    if (battleOutcome.victoryType === 'immense_triumph' && target === 'aircraft') {
      spaceControlGained = 'air_superiority'
    }

    return {
      victoryType: battleOutcome.victoryType,
      rollsWon: battleOutcome.rollsWon,
      attackerRolls: battleOutcome.attackerRolls,
      defenderRolls: battleOutcome.defenderRolls,
      resistanceDamage,
      infrastructureDamage: infraDamage,
      attackerCasualties,
      defenderCasualties,
      spaceControlGained
    }
  }

  /**
   * NAVAL BATTLE - Using exact P&W formulas
   */
  calculateNavalBattle(
    attacker: Nation,
    defender: Nation,
    ships: number,
    target: 'ships' | 'infrastructure' | 'ground_control' | 'air_superiority'
  ): BattleResult {
    const attackerStrength = ships
    const defenderStrength = defender.ships

    const battleOutcome = this.performBattleRolls(attackerStrength, defenderStrength)
    
    // Calculate resistance damage
    let resistanceDamage = 0
    switch (battleOutcome.victoryType) {
      case 'immense_triumph': resistanceDamage = -14; break
      case 'moderate_success': resistanceDamage = -11; break
      case 'pyrrhic_victory': resistanceDamage = -8; break
      case 'utter_failure': resistanceDamage = 0; break
    }

    const fortifyFactor = defender.fortified ? 1.25 : 1
    let shipDamageMultiplier = 1.2 // Base 20% more damage from May 2025 update
    
    if (target === 'ships') {
      shipDamageMultiplier *= 1.3 // Additional 30% for ship vs ship
    } else if (target === 'ground_control' || target === 'air_superiority') {
      shipDamageMultiplier *= 0.7 // 30% less damage for special targets
    }

    // Calculate ship losses
    const defShipLoss = Math.floor(Math.min(
      defender.ships,
      ships / (7.08 / shipDamageMultiplier)
    ))
    
    const attShipLoss = Math.floor(Math.min(
      ships,
      0.44166666666666666666666666666667 * fortifyFactor * 12 * (defenderStrength * 0.7) / 35
    ))

    // Infrastructure damage
    let infraDamage = 0
    if (target === 'infrastructure' || target === 'ships') {
      infraDamage = Math.max(0, Math.min(
        ships - (defenderStrength * 0.5) * 2.625 * 0.95 * (battleOutcome.rollsWon / 3),
        100 // Simplified
      ))
      if (target === 'infrastructure') {
        infraDamage *= 1.3
      } else {
        infraDamage *= 0.7
      }
    }

    // Space control changes
    let spaceControlGained: string | undefined
    let spaceControlLost: string | undefined

    if (battleOutcome.victoryType === 'immense_triumph') {
      if (target === 'ships' || target === 'infrastructure') {
        spaceControlGained = 'blockade'
      } else if (target === 'ground_control') {
        spaceControlLost = 'ground_control'
      } else if (target === 'air_superiority') {
        spaceControlLost = 'air_superiority'
      }
    }

    return {
      victoryType: battleOutcome.victoryType,
      rollsWon: battleOutcome.rollsWon,
      attackerRolls: battleOutcome.attackerRolls,
      defenderRolls: battleOutcome.defenderRolls,
      resistanceDamage,
      infrastructureDamage: infraDamage,
      attackerCasualties: { soldiers: 0, tanks: 0, aircraft: 0, ships: attShipLoss },
      defenderCasualties: { soldiers: 0, tanks: 0, aircraft: 0, ships: defShipLoss },
      spaceControlGained,
      spaceControlLost
    }
  }

  /**
   * Get MAP cost for different actions
   */
  getMapCost(actionType: string): number {
    switch (actionType) {
      case 'ground_attack': return 3
      case 'airstrike': return 4
      case 'naval_attack': return 4
      default: return 1
    }
  }
}
