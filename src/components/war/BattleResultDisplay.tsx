'use client'

import { BattleResult } from '@/types/war-v2'

interface BattleResultDisplayProps {
  battleResult: BattleResult
  attackerName: string
  defenderName: string
  actionType: string
  target?: string
}

export default function BattleResultDisplay({ 
  battleResult, 
  attackerName, 
  defenderName, 
  actionType,
  target 
}: BattleResultDisplayProps) {
  const getVictoryIcon = (victoryType: string) => {
    switch (victoryType) {
      case 'immense_triumph': return 'Victory'
      case 'moderate_success': return 'Success'
      case 'pyrrhic_victory': return 'Pyrrhic'
      case 'utter_failure': return 'Defeat'
      default: return 'Unknown'
    }
  }

  const getVictoryColor = (victoryType: string) => {
    switch (victoryType) {
      case 'immense_triumph': return 'text-yellow-400 bg-yellow-500/20'
      case 'moderate_success': return 'text-green-400 bg-green-500/20'
      case 'pyrrhic_victory': return 'text-orange-400 bg-orange-500/20'
      case 'utter_failure': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const formatVictoryType = (victoryType: string) => {
    return victoryType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatActionType = (actionType: string) => {
    switch (actionType) {
      case 'ground_attack': return 'Ground Strike'
      case 'airstrike': return 'Airstrike'
      case 'naval_attack': return 'Naval Attack'
      default: return actionType
    }
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30 mb-4">
      {/* Battle Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getVictoryIcon(battleResult.victoryType)}</span>
          <div>
            <h3 className="text-xl font-bold text-white">
              {formatActionType(actionType)} {target && `on ${target}`}
            </h3>
            <p className="text-slate-300">
              {attackerName} → {defenderName}
            </p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-lg border ${getVictoryColor(battleResult.victoryType)}`}>
          <div className="text-lg font-bold">
            {formatVictoryType(battleResult.victoryType)}
          </div>
          <div className="text-sm opacity-80">
            {battleResult.rollsWon}/3 rolls won
          </div>
        </div>
      </div>

      {/* Battle Rolls */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <h4 className="text-green-400 font-semibold mb-2">🗡️ Attacker Rolls</h4>
          <div className="space-y-1">
            {battleResult.attackerRolls.map((roll, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>Roll {index + 1}:</span>
                <span className="font-mono text-green-300">{roll.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-4">
          <h4 className="text-blue-400 font-semibold mb-2">Defender Rolls</h4>
          <div className="space-y-1">
            {battleResult.defenderRolls.map((roll, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>Roll {index + 1}:</span>
                <span className="font-mono text-blue-300">{roll.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Casualties */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <h4 className="text-red-400 font-semibold mb-3">Attacker Casualties</h4>
          <div className="space-y-2 text-sm">
            {battleResult.attackerCasualties.soldiers > 0 && (
              <div className="flex justify-between">
                <span>🪖 Soldiers:</span>
                <span className="text-red-300 font-mono">{battleResult.attackerCasualties.soldiers.toLocaleString()}</span>
              </div>
            )}
            {battleResult.attackerCasualties.tanks > 0 && (
              <div className="flex justify-between">
                <span>🚗 Tanks:</span>
                <span className="text-red-300 font-mono">{battleResult.attackerCasualties.tanks.toLocaleString()}</span>
              </div>
            )}
            {battleResult.attackerCasualties.aircraft > 0 && (
              <div className="flex justify-between">
                <span>Aircraft:</span>
                <span className="text-red-300 font-mono">{battleResult.attackerCasualties.aircraft.toLocaleString()}</span>
              </div>
            )}
            {battleResult.attackerCasualties.ships > 0 && (
              <div className="flex justify-between">
                <span>Ships:</span>
                <span className="text-red-300 font-mono">{battleResult.attackerCasualties.ships.toLocaleString()}</span>
              </div>
            )}
            {Object.values(battleResult.attackerCasualties).every(val => val === 0) && (
              <div className="text-green-400 italic">No casualties</div>
            )}
          </div>
        </div>

        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <h4 className="text-red-400 font-semibold mb-3">Defender Casualties</h4>
          <div className="space-y-2 text-sm">
            {battleResult.defenderCasualties.soldiers > 0 && (
              <div className="flex justify-between">
                <span>🪖 Soldiers:</span>
                <span className="text-red-300 font-mono">{battleResult.defenderCasualties.soldiers.toLocaleString()}</span>
              </div>
            )}
            {battleResult.defenderCasualties.tanks > 0 && (
              <div className="flex justify-between">
                <span>🚗 Tanks:</span>
                <span className="text-red-300 font-mono">{battleResult.defenderCasualties.tanks.toLocaleString()}</span>
              </div>
            )}
            {battleResult.defenderCasualties.aircraft > 0 && (
              <div className="flex justify-between">
                <span>Aircraft:</span>
                <span className="text-red-300 font-mono">{battleResult.defenderCasualties.aircraft.toLocaleString()}</span>
              </div>
            )}
            {battleResult.defenderCasualties.ships > 0 && (
              <div className="flex justify-between">
                <span>Ships:</span>
                <span className="text-red-300 font-mono">{battleResult.defenderCasualties.ships.toLocaleString()}</span>
              </div>
            )}
            {Object.values(battleResult.defenderCasualties).every(val => val === 0) && (
              <div className="text-green-400 italic">No casualties</div>
            )}
          </div>
        </div>
      </div>

      {/* Damage and Effects */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <h4 className="text-purple-400 font-semibold mb-2">💔 Resistance Damage</h4>
          <div className="text-2xl font-mono text-purple-300">
            {battleResult.resistanceDamage}%
          </div>
        </div>

        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
          <h4 className="text-orange-400 font-semibold mb-2">🏗️ Infrastructure</h4>
          <div className="text-2xl font-mono text-orange-300">
            -{battleResult.infrastructureDamage.toFixed(1)}%
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-blue-400 font-semibold mb-2">Space Control</h4>
          <div className="text-sm">
            {battleResult.spaceControlGained && (
              <div className="text-green-400">
                +{battleResult.spaceControlGained.replace('_', ' ')}
              </div>
            )}
            {battleResult.spaceControlLost && (
              <div className="text-red-400">
                -{battleResult.spaceControlLost.replace('_', ' ')}
              </div>
            )}
            {!battleResult.spaceControlGained && !battleResult.spaceControlLost && (
              <div className="text-gray-400 italic">No changes</div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Calculation Breakdown */}
      {battleResult.calculationDetails && (
        <div className="bg-slate-900/50 border border-slate-500/30 rounded-lg p-4">
          <h4 className="text-slate-300 font-semibold mb-3 flex items-center">
            🧮 Detailed Calculations
            <button 
              className="ml-2 text-xs bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded"
              onClick={() => {
                const element = document.getElementById(`calculations-${Date.now()}`)
                if (element) {
                  element.classList.toggle('hidden')
                }
              }}
            >
              Toggle
            </button>
          </h4>
          
          <div id={`calculations-${Date.now()}`} className="hidden space-y-3 text-sm">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-cyan-400 font-medium mb-2">Strength Values</h5>
                <div className="space-y-1 text-xs font-mono">
                  <div>Attacker: {battleResult.calculationDetails.attackerStrength}</div>
                  <div>Defender: {battleResult.calculationDetails.defenderStrength}</div>
                  <div>Roll Value: {battleResult.calculationDetails.rollValue.toFixed(3)}</div>
                </div>
              </div>
              
              <div>
                <h5 className="text-yellow-400 font-medium mb-2">Modifiers</h5>
                <div className="space-y-1 text-xs">
                  <div>Fortified: {battleResult.calculationDetails.modifiers.fortified ? 'Yes' : 'No'}</div>
                  <div>Air Superiority: {battleResult.calculationDetails.modifiers.airSuperiority ? 'Yes' : 'No'}</div>
                  <div>Ground Control: {battleResult.calculationDetails.modifiers.groundControl ? 'Yes' : 'No'}</div>
                  <div>Blockade: {battleResult.calculationDetails.modifiers.blockade ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="text-red-400 font-medium mb-2">📐 Damage Formulas</h5>
              <div className="space-y-2 text-xs font-mono bg-slate-800/50 p-3 rounded">
                <div className="break-all">{battleResult.calculationDetails.damageCalculations.soldierLossFormula}</div>
                <div className="break-all">{battleResult.calculationDetails.damageCalculations.tankLossFormula}</div>
                <div className="break-all">{battleResult.calculationDetails.damageCalculations.resistanceFormula}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
