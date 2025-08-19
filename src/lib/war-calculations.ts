import { Nation, BattleResult, VictoryType, WarCalculations as IWarCalculations } from '@/types/war'

export default class WarCalculations implements IWarCalculations {
  
  /**
   * Calculate army value for ground battles
   * Formula: Unarmed Soldiers * 1 + Armed Soldiers * 1.75 + Tanks * 40
   */
  calculateArmyValue(soldiers: number, tanks: number, munitions: boolean): number {
    const soldierValue = munitions ? soldiers * 1.75 : soldiers * 1
    return soldierValue + (tanks * 40)
  }

  /**
   * Calculate battle rolls and determine victory type
   * Each side does 3 rolls between 40% and 100% of their strength
   */
  calculateBattleRolls(attackerStrength: number, defenderStrength: number): {
    attackerRolls: number[]
    defenderRolls: number[]
    rollsWon: number
    victoryType: VictoryType
  } {
    const attackerRolls: number[] = []
    const defenderRolls: number[] = []
    let rollsWon = 0

    // Perform 3 rolls
    for (let i = 0; i < 3; i++) {
      // Each roll is between 40% and 100% of strength
      const attackerRoll = attackerStrength * (0.4 + Math.random() * 0.6)
      const defenderRoll = defenderStrength * (0.4 + Math.random() * 0.6)
      
      attackerRolls.push(attackerRoll)
      defenderRolls.push(defenderRoll)
      
      if (attackerRoll > defenderRoll) {
        rollsWon++
      }
    }

    // Determine victory type based on rolls won
    let victoryType: VictoryType
    switch (rollsWon) {
      case 3:
        victoryType = 'immense_triumph'
        break
      case 2:
        victoryType = 'moderate_success'
        break
      case 1:
        victoryType = 'pyrrhic_victory'
        break
      default:
        victoryType = 'utter_failure'
        break
    }

    return {
      attackerRolls,
      defenderRolls,
      rollsWon,
      victoryType
    }
  }

  /**
   * Calculate ground battle damage using P&W formulas
   */
  calculateGroundBattleDamage(
    attacker: Nation,
    defender: Nation,
    soldiers: number,
    tanks: number
  ): BattleResult {
    // Calculate army strengths
    const attackerStrength = this.calculateArmyValue(soldiers, tanks, true) // Assume munitions
    const defenderStrength = this.calculateArmyValue(
      defender.military.soldiers,
      defender.military.tanks,
      defender.resources.munitions > 0
    )

    // Calculate battle outcome
    const battleOutcome = this.calculateBattleRolls(attackerStrength, defenderStrength)
    
    // Calculate resistance damage based on victory type
    let resistanceDamage = 0
    switch (battleOutcome.victoryType) {
      case 'immense_triumph':
        resistanceDamage = 10
        break
      case 'moderate_success':
        resistanceDamage = 7
        break
      case 'pyrrhic_victory':
        resistanceDamage = 4
        break
      case 'utter_failure':
        resistanceDamage = 0
        break
    }

    // Calculate casualties using simplified P&W formulas
    const fortifyFactor = defender.spaceControl.fortified ? 1.25 : 1
    const airSuperiorityFactor = attacker.spaceControl.airSuperiority ? 1 : 0.66

    // Tank casualties (simplified)
    const defTankLoss = Math.min(
      defender.military.tanks,
      Math.floor((attackerStrength * 0.7 + 1) / 1680 + (attackerStrength * 0.7 + 1) / 2250) * 1.33
    )
    
    const attTankLoss = Math.min(
      tanks,
      Math.floor(((defenderStrength * airSuperiorityFactor * 0.7 + 1) / 1800 + (defenderStrength * 0.7 + 1) / 2250) * fortifyFactor * 1.33)
    )

    // Soldier casualties (simplified)
    const defSoldierLoss = Math.min(
      defender.military.soldiers,
      Math.floor((attackerStrength * 0.7 + 1) / 22 + (attackerStrength * 0.7 + 1) / 7.33) * 0.3125
    )
    
    const attSoldierLoss = Math.min(
      soldiers,
      Math.floor(((defenderStrength * airSuperiorityFactor * 0.7 + 1) / 22 + (defenderStrength * 0.7 + 1) / 7.33) * fortifyFactor * 0.3125)
    )

    // Calculate infrastructure damage
    const infraDamage = Math.max(
      0,
      Math.min(
        ((soldiers - (defender.military.soldiers * 0.5)) * 0.000606061 + 
         (tanks - (defender.military.tanks * 0.5)) * 0.01) * 0.95 * (battleOutcome.rollsWon / 3),
        defender.infrastructure * 0.2 + 25
      )
    )

    // Calculate loot
    const maxLoot = Math.min(
      ((soldiers * 0.99) + (tanks * 22.625)) * battleOutcome.rollsWon,
      defender.resources.money * 0.75
    )
    const loot = Math.max(0, Math.min(maxLoot, defender.resources.money - (50000 * defender.cities)))

    // Determine space control changes
    let spaceControlGained: keyof Nation['spaceControl'] | undefined
    if (battleOutcome.victoryType === 'immense_triumph') {
      spaceControlGained = 'groundControl'
    }

    // Remove defender's fortification if they had it and this wasn't an utter failure
    let spaceControlLost: keyof Nation['spaceControl'] | undefined
    if (battleOutcome.victoryType !== 'utter_failure' && defender.spaceControl.fortified) {
      spaceControlLost = 'fortified'
    }

    return {
      victoryType: battleOutcome.victoryType,
      rollsWon: battleOutcome.rollsWon,
      attackerRolls: battleOutcome.attackerRolls,
      defenderRolls: battleOutcome.defenderRolls,
      resistanceDamage,
      infrastructureDamage: infraDamage,
      loot: { money: loot },
      attackerCasualties: {
        soldiers: attSoldierLoss,
        tanks: attTankLoss
      },
      defenderCasualties: {
        soldiers: defSoldierLoss,
        tanks: defTankLoss
      },
      spaceControlGained,
      spaceControlLost
    }
  }

  /**
   * Calculate air battle damage
   */
  calculateAirBattleDamage(
    attacker: Nation,
    defender: Nation,
    aircraft: number,
    target: 'aircraft' | 'soldiers' | 'tanks' | 'ships'
  ): BattleResult {
    const attackerStrength = aircraft
    const defenderStrength = defender.military.aircraft

    const battleOutcome = this.calculateBattleRolls(attackerStrength, defenderStrength)
    
    // Calculate resistance damage
    let resistanceDamage = 0
    switch (battleOutcome.victoryType) {
      case 'immense_triumph':
        resistanceDamage = 12
        break
      case 'moderate_success':
        resistanceDamage = 9
        break
      case 'pyrrhic_victory':
        resistanceDamage = 6
        break
      case 'utter_failure':
        resistanceDamage = 0
        break
    }

    // Calculate target casualties based on P&W formulas
    let targetCasualties: Partial<Nation['military']> = {}
    
    if (target === 'aircraft') {
      // Air vs Air combat
      const defAirLoss = Math.min(defender.military.aircraft, Math.floor(aircraft / 8.6))
      const attAirLoss = Math.min(aircraft, Math.floor(defender.military.aircraft / 17.2))
      
      targetCasualties = { aircraft: defAirLoss }
      
      // Space control for immense triumph
      let spaceControlGained: keyof Nation['spaceControl'] | undefined
      if (battleOutcome.victoryType === 'immense_triumph') {
        spaceControlGained = 'airSuperiority'
      }

      return {
        victoryType: battleOutcome.victoryType,
        rollsWon: battleOutcome.rollsWon,
        attackerRolls: battleOutcome.attackerRolls,
        defenderRolls: battleOutcome.defenderRolls,
        resistanceDamage,
        infrastructureDamage: Math.max(0, Math.min((aircraft - (defenderStrength * 0.5)) * 0.35353535 * 0.95 * (battleOutcome.rollsWon / 3), defender.infrastructure * 0.5 + 100)),
        loot: {},
        attackerCasualties: { aircraft: attAirLoss },
        defenderCasualties: targetCasualties,
        spaceControlGained
      }
    } else {
      // Air vs Ground targets
      if (defender.military.aircraft === 0 && battleOutcome.victoryType === 'immense_triumph') {
        // Non-dogfight airstrike with no enemy aircraft
        switch (target) {
          case 'soldiers':
            targetCasualties = { soldiers: Math.min(defender.military.soldiers, Math.floor(aircraft / 33.3)) }
            break
          case 'tanks':
            targetCasualties = { tanks: Math.min(defender.military.tanks, Math.floor(aircraft / 1.25)) }
            break
          case 'ships':
            targetCasualties = { ships: Math.min(defender.military.ships, Math.floor(aircraft * 0.03)) }
            break
        }
      }

      const attAirLoss = Math.min(aircraft, Math.floor(defender.military.aircraft * 0.5 * 9 * (defenderStrength * 0.7) / 54))

      return {
        victoryType: battleOutcome.victoryType,
        rollsWon: battleOutcome.rollsWon,
        attackerRolls: battleOutcome.attackerRolls,
        defenderRolls: battleOutcome.defenderRolls,
        resistanceDamage,
        infrastructureDamage: Math.max(0, Math.min((aircraft - (defenderStrength * 0.5)) * 0.35353535 * 0.95 * (battleOutcome.rollsWon / 3), defender.infrastructure * 0.5 + 100)),
        loot: {},
        attackerCasualties: { aircraft: attAirLoss },
        defenderCasualties: targetCasualties
      }
    }
  }

  /**
   * Calculate naval battle damage
   */
  calculateNavalBattleDamage(
    attacker: Nation,
    defender: Nation,
    ships: number,
    target: 'ships' | 'infrastructure' | 'ground_control' | 'air_superiority'
  ): BattleResult {
    const attackerStrength = ships
    const defenderStrength = defender.military.ships

    const battleOutcome = this.calculateBattleRolls(attackerStrength, defenderStrength)
    
    // Calculate resistance damage
    let resistanceDamage = 0
    switch (battleOutcome.victoryType) {
      case 'immense_triumph':
        resistanceDamage = 14
        break
      case 'moderate_success':
        resistanceDamage = 11
        break
      case 'pyrrhic_victory':
        resistanceDamage = 8
        break
      case 'utter_failure':
        resistanceDamage = 0
        break
    }

    // Calculate ship casualties (updated May 2025 - 20% more damage)
    let shipDamageMultiplier = 1.2 // 20% more damage
    if (target === 'ships') {
      shipDamageMultiplier *= 1.3 // Additional 30% for ship vs ship
    } else if (target === 'ground_control' || target === 'air_superiority') {
      shipDamageMultiplier *= 0.7 // 30% less damage for special targets
    }

    const defShipLoss = Math.min(defender.military.ships, Math.floor(ships / (7.08 / shipDamageMultiplier)))
    const attShipLoss = Math.min(ships, Math.floor(defender.military.ships * 0.44166666666666666666666666666667 * 12 * (defenderStrength * 0.7) / 35))

    // Infrastructure damage
    let infraDamage = 0
    if (target === 'infrastructure' || target === 'ships') {
      infraDamage = Math.max(0, Math.min(ships - (defenderStrength * 0.5) * 2.625 * 0.95 * (battleOutcome.rollsWon / 3), defender.infrastructure * 0.5 + 25))
      if (target === 'infrastructure') {
        infraDamage *= 1.3 // 30% more infra damage for infra targeting
      } else {
        infraDamage *= 0.7 // 30% less infra damage for ship targeting
      }
    }

    // Space control changes
    let spaceControlGained: keyof Nation['spaceControl'] | undefined
    let spaceControlLost: keyof Nation['spaceControl'] | undefined

    if (battleOutcome.victoryType === 'immense_triumph') {
      if (target === 'ships' || target === 'infrastructure') {
        spaceControlGained = 'blockade'
      } else if (target === 'ground_control' && defender.spaceControl.groundControl) {
        spaceControlLost = 'groundControl'
      } else if (target === 'air_superiority' && defender.spaceControl.airSuperiority) {
        spaceControlLost = 'airSuperiority'
      }
    }

    return {
      victoryType: battleOutcome.victoryType,
      rollsWon: battleOutcome.rollsWon,
      attackerRolls: battleOutcome.attackerRolls,
      defenderRolls: battleOutcome.defenderRolls,
      resistanceDamage,
      infrastructureDamage: infraDamage,
      loot: {},
      attackerCasualties: { ships: attShipLoss },
      defenderCasualties: { ships: defShipLoss },
      spaceControlGained,
      spaceControlLost
    }
  }

  /**
   * Calculate spy operation success
   */
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
  } {
    // Base success calculation (simplified)
    let baseOdds = 0.5 // 50% base
    
    // Spy ratio effect
    const spyRatio = attackingSpies / Math.max(1, defendingSpies)
    baseOdds *= Math.min(2, Math.max(0.1, spyRatio))
    
    // Safety level effect
    const safetyMultiplier = [1.2, 1.0, 0.8][safety - 1] // Safety 1 = 120%, Safety 2 = 100%, Safety 3 = 80%
    baseOdds *= safetyMultiplier
    
    // Policy effects
    let policyMultiplier = 1
    if (policies.tactician) policyMultiplier += 0.15 // +15% success
    if (policies.arcane) policyMultiplier -= 0.15 // -15% enemy success
    if (policies.surveillanceNetwork) policyMultiplier -= 0.1 // -10% enemy success
    
    const finalOdds = Math.min(0.95, Math.max(0.05, baseOdds * policyMultiplier))
    const success = Math.random() < finalOdds
    
    // Calculate spy losses
    const baseLoss = safety === 1 ? 3 : safety === 2 ? 2 : 1
    const spiesLost = success ? Math.floor(baseLoss * 0.5) : baseLoss
    
    // Calculate spy kills
    let spiesKilled = 0
    if (success) {
      spiesKilled = Math.floor(Math.random() * 3) + 1
      if (policies.surveillanceNetwork) {
        spiesKilled = Math.floor(spiesKilled * 0.75) // 25% reduction
      }
    }
    
    return {
      success,
      successChance: finalOdds,
      spiesKilled,
      spiesLost
    }
  }
}
