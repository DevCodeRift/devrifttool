'use client'

import { useState, useRef, useEffect } from 'react'
import { Nation, BattleLog, BattleResult, ActionType } from '@/types/war'
import WarCalculations from '@/lib/war-calculations'
import NationStatus from './NationStatus'
import BattleActions from './BattleActions'
import BattleLogDisplay from './BattleLogDisplay'

interface BattleInterfaceProps {
  nation1: Nation
  nation2: Nation
  battleLog: BattleLog[]
  setBattleLog: (log: BattleLog[]) => void
  currentTurn: number
  setCurrentTurn: (turn: number) => void
  maxTurns: number
  onReset: () => void
  setNation1: (nation: Nation) => void
  setNation2: (nation: Nation) => void
}

export default function BattleInterface({
  nation1,
  nation2,
  battleLog,
  setBattleLog,
  currentTurn,
  setCurrentTurn,
  maxTurns,
  onReset,
  setNation1,
  setNation2
}: BattleInterfaceProps) {
  const [activeNation, setActiveNation] = useState<1 | 2>(1)
  const [warOver, setWarOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const battleLogRef = useRef<HTMLDivElement>(null)
  const calculations = new WarCalculations()

  // Auto-scroll battle log to bottom when new entries are added
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight
    }
  }, [battleLog])

  // Check for war end conditions
  useEffect(() => {
    if (nation1.resistance <= 0) {
      setWarOver(true)
      setWinner(nation2.name)
    } else if (nation2.resistance <= 0) {
      setWarOver(true)
      setWinner(nation1.name)
    } else if (currentTurn >= maxTurns) {
      setWarOver(true)
      setWinner(null) // War expired
    }
  }, [nation1.resistance, nation2.resistance, currentTurn, maxTurns, nation1.name, nation2.name])

  const executeAction = async (
    actionType: ActionType,
    target?: string,
    units?: number
  ) => {
    if (warOver) return

    const attacker = activeNation === 1 ? nation1 : nation2
    const defender = activeNation === 1 ? nation2 : nation1
    const setAttacker = activeNation === 1 ? setNation1 : setNation2
    const setDefender = activeNation === 1 ? setNation2 : setNation1

    // Check if attacker has enough MAPs
    let mapsRequired = 0
    switch (actionType) {
      case 'ground_battle':
        mapsRequired = 3
        break
      case 'airstrike':
        mapsRequired = 4
        break
      case 'naval_battle':
        mapsRequired = 5
        break
      case 'missile_launch':
        mapsRequired = 8
        break
      case 'nuclear_attack':
        mapsRequired = 12
        break
      case 'fortify':
        mapsRequired = 3
        break
      case 'spy_operation':
        mapsRequired = 0
        break
      default:
        mapsRequired = 0
    }

    if (attacker.maps < mapsRequired) {
      addBattleLog({
        id: Date.now().toString(),
        turn: currentTurn,
        attacker: attacker.name,
        defender: defender.name,
        action: actionType,
        actionType,
        result: 'failure',
        message: `Not enough MAPs! Required: ${mapsRequired}, Available: ${attacker.maps}`,
        timestamp: new Date(),
        attackerCasualties: {},
        defenderCasualties: {},
        resistanceDamage: 0,
        infrastructureDamage: 0,
        loot: {}
      })
      return
    }

    let result: BattleResult | null = null

    try {
      // Execute the action based on type
      switch (actionType) {
        case 'ground_battle':
          result = calculations.calculateGroundBattleDamage(
            attacker,
            defender,
            units || attacker.military.soldiers,
            units || attacker.military.tanks
          )
          break
        
        case 'airstrike':
          result = calculations.calculateAirBattleDamage(
            attacker,
            defender,
            units || attacker.military.aircraft,
            target as 'aircraft' | 'soldiers' | 'tanks' | 'ships'
          )
          break
        
        case 'naval_battle':
          result = calculations.calculateNavalBattleDamage(
            attacker,
            defender,
            units || attacker.military.ships,
            target as 'ships' | 'infrastructure' | 'ground_control' | 'air_superiority'
          )
          break
        
        case 'fortify':
          // Handle fortify action
          const updatedAttacker = { ...attacker }
          updatedAttacker.spaceControl.fortified = true
          updatedAttacker.maps -= mapsRequired
          setAttacker(updatedAttacker)
          
          addBattleLog({
            id: Date.now().toString(),
            turn: currentTurn,
            attacker: attacker.name,
            defender: defender.name,
            action: 'Fortify',
            actionType,
            result: 'success',
            message: `${attacker.name} has fortified their positions! Enemy attacks will deal 25% more casualties to attackers.`,
            timestamp: new Date(),
            attackerCasualties: {},
            defenderCasualties: {},
            resistanceDamage: 0,
            infrastructureDamage: 0,
            loot: {},
            details: { mapsUsed: mapsRequired }
          })
          return
        
        default:
          throw new Error('Action not implemented yet')
      }

      if (result) {
        // Apply battle results
        const updatedAttacker = { ...attacker }
        const updatedDefender = { ...defender }

        // Reduce MAPs
        updatedAttacker.maps -= mapsRequired

        // Apply casualties
        if (result.attackerCasualties.soldiers) {
          updatedAttacker.military.soldiers = Math.max(0, updatedAttacker.military.soldiers - result.attackerCasualties.soldiers)
        }
        if (result.attackerCasualties.tanks) {
          updatedAttacker.military.tanks = Math.max(0, updatedAttacker.military.tanks - result.attackerCasualties.tanks)
        }
        if (result.attackerCasualties.aircraft) {
          updatedAttacker.military.aircraft = Math.max(0, updatedAttacker.military.aircraft - result.attackerCasualties.aircraft)
        }
        if (result.attackerCasualties.ships) {
          updatedAttacker.military.ships = Math.max(0, updatedAttacker.military.ships - result.attackerCasualties.ships)
        }

        if (result.defenderCasualties.soldiers) {
          updatedDefender.military.soldiers = Math.max(0, updatedDefender.military.soldiers - result.defenderCasualties.soldiers)
        }
        if (result.defenderCasualties.tanks) {
          updatedDefender.military.tanks = Math.max(0, updatedDefender.military.tanks - result.defenderCasualties.tanks)
        }
        if (result.defenderCasualties.aircraft) {
          updatedDefender.military.aircraft = Math.max(0, updatedDefender.military.aircraft - result.defenderCasualties.aircraft)
        }
        if (result.defenderCasualties.ships) {
          updatedDefender.military.ships = Math.max(0, updatedDefender.military.ships - result.defenderCasualties.ships)
        }

        // Apply resistance damage
        updatedDefender.resistance = Math.max(0, updatedDefender.resistance - result.resistanceDamage)

        // Apply infrastructure damage
        updatedDefender.infrastructure = Math.max(0, updatedDefender.infrastructure - result.infrastructureDamage)

        // Apply loot
        if (result.loot.money) {
          updatedAttacker.resources.money += result.loot.money
          updatedDefender.resources.money = Math.max(0, updatedDefender.resources.money - result.loot.money)
        }

        // Apply space control changes
        if (result.spaceControlGained) {
          updatedAttacker.spaceControl[result.spaceControlGained] = true
          // Remove corresponding control from defender
          if (result.spaceControlGained === 'groundControl') {
            updatedDefender.spaceControl.groundControl = false
          } else if (result.spaceControlGained === 'airSuperiority') {
            updatedDefender.spaceControl.airSuperiority = false
          } else if (result.spaceControlGained === 'blockade') {
            updatedDefender.spaceControl.blockade = false
          }
        }

        if (result.spaceControlLost) {
          updatedAttacker.spaceControl[result.spaceControlLost] = false
        }

        // Update nations
        setAttacker(updatedAttacker)
        setDefender(updatedDefender)

        // Add to battle log
        const victoryTypeText = result.victoryType.replace('_', ' ').toUpperCase()
        const actionText = actionType.replace('_', ' ').toUpperCase()
        
        addBattleLog({
          id: Date.now().toString(),
          turn: currentTurn,
          attacker: attacker.name,
          defender: defender.name,
          action: `${actionText}${target ? ` vs ${target.toUpperCase()}` : ''}`,
          actionType,
          result: 'success',
          victoryType: result.victoryType,
          message: `${attacker.name} executed ${actionText} - ${victoryTypeText}! Resistance damage: ${result.resistanceDamage}`,
          timestamp: new Date(),
          attackerCasualties: result.attackerCasualties,
          defenderCasualties: result.defenderCasualties,
          resistanceDamage: result.resistanceDamage,
          infrastructureDamage: result.infrastructureDamage,
          loot: result.loot,
          spaceControlChanges: {
            gained: result.spaceControlGained,
            lost: result.spaceControlLost
          },
          details: {
            mapsUsed: mapsRequired,
            attackerRolls: result.attackerRolls,
            defenderRolls: result.defenderRolls,
            rollsWon: result.rollsWon
          }
        })
      }
    } catch (error) {
      addBattleLog({
        id: Date.now().toString(),
        turn: currentTurn,
        attacker: attacker.name,
        defender: defender.name,
        action: actionType,
        actionType,
        result: 'failure',
        message: `Failed to execute ${actionType}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        attackerCasualties: {},
        defenderCasualties: {},
        resistanceDamage: 0,
        infrastructureDamage: 0,
        loot: {}
      })
    }
  }

  const addBattleLog = (log: BattleLog) => {
    setBattleLog([...battleLog, log])
  }

  const switchActiveNation = () => {
    setActiveNation(activeNation === 1 ? 2 : 1)
  }

  const advanceTurn = () => {
    if (currentTurn < maxTurns && !warOver) {
      const newTurn = currentTurn + 1
      setCurrentTurn(newTurn)
      
      // Regenerate MAPs for both nations
      const updatedNation1 = { ...nation1 }
      const updatedNation2 = { ...nation2 }
      
      updatedNation1.maps = Math.min(updatedNation1.maxMaps, updatedNation1.maps + 1)
      updatedNation2.maps = Math.min(updatedNation2.maxMaps, updatedNation2.maps + 1)
      
      setNation1(updatedNation1)
      setNation2(updatedNation2)
      
      addBattleLog({
        id: Date.now().toString(),
        turn: newTurn,
        attacker: 'System',
        defender: 'System',
        action: 'Turn Advance',
        actionType: 'system',
        result: 'success',
        message: `Turn ${newTurn} begins. Both nations regenerate 1 MAP.`,
        timestamp: new Date(),
        attackerCasualties: {},
        defenderCasualties: {},
        resistanceDamage: 0,
        infrastructureDamage: 0,
        loot: {}
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* War Status Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            War: {nation1.name} vs {nation2.name}
          </h2>
          <div className="text-right">
            <p className="text-lg font-semibold">Turn {currentTurn} / {maxTurns}</p>
            <p className="text-sm text-gray-600">
              {Math.floor((currentTurn - 1) / 12)} days, {((currentTurn - 1) % 12) * 2} hours
            </p>
          </div>
        </div>

        {warOver && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-bold text-red-800">
              {winner ? `🎉 ${winner} Wins!` : '⏱️ War Expired - No Winner'}
            </h3>
            <p className="text-red-700">
              {winner 
                ? `${winner} has reduced their opponent's resistance to 0 and won the war!`
                : 'The war has reached the maximum duration of 60 turns (5 days) and expired without a winner.'
              }
            </p>
          </div>
        )}

        <div className="flex justify-center space-x-4">
          {!warOver && (
            <>
              <button
                onClick={switchActiveNation}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Switch to {activeNation === 1 ? nation2.name : nation1.name}
              </button>
              <button
                onClick={advanceTurn}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Advance Turn
              </button>
            </>
          )}
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Reset Simulation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Nation Status */}
        <div className="xl:col-span-2 space-y-6">
          <NationStatus 
            nation1={nation1} 
            nation2={nation2} 
            activeNation={activeNation}
          />
          
          {!warOver && (
            <BattleActions
              attacker={activeNation === 1 ? nation1 : nation2}
              defender={activeNation === 1 ? nation2 : nation1}
              onExecuteAction={executeAction}
            />
          )}
        </div>

        {/* Battle Log */}
        <div className="xl:col-span-1">
          <BattleLogDisplay 
            battleLog={battleLog}
            ref={battleLogRef}
          />
        </div>
      </div>
    </div>
  )
}
