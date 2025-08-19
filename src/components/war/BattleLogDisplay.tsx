'use client'

import { forwardRef } from 'react'
import { BattleLog } from '@/types/war'

interface BattleLogDisplayProps {
  battleLog: BattleLog[]
}

const BattleLogDisplay = forwardRef<HTMLDivElement, BattleLogDisplayProps>(
  ({ battleLog }, ref) => {
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    }

    const getResultIcon = (result: 'success' | 'failure') => {
      return result === 'success' ? '✅' : '❌'
    }

    const getVictoryTypeColor = (victoryType?: string) => {
      switch (victoryType) {
        case 'immense_triumph':
          return 'text-green-600 font-bold'
        case 'moderate_success':
          return 'text-blue-600 font-semibold'
        case 'pyrrhic_victory':
          return 'text-yellow-600'
        case 'utter_failure':
          return 'text-red-600'
        default:
          return 'text-gray-600'
      }
    }

    const formatCasualties = (casualties: Record<string, number>) => {
      const parts = []
      if (casualties.soldiers) parts.push(`${casualties.soldiers.toLocaleString()} soldiers`)
      if (casualties.tanks) parts.push(`${casualties.tanks.toLocaleString()} tanks`)
      if (casualties.aircraft) parts.push(`${casualties.aircraft.toLocaleString()} aircraft`)
      if (casualties.ships) parts.push(`${casualties.ships.toLocaleString()} ships`)
      if (casualties.missiles) parts.push(`${casualties.missiles.toLocaleString()} missiles`)
      if (casualties.nukes) parts.push(`${casualties.nukes.toLocaleString()} nukes`)
      if (casualties.spies) parts.push(`${casualties.spies.toLocaleString()} spies`)
      return parts.join(', ')
    }

    const formatLoot = (loot: Record<string, number>) => {
      const parts = []
      if (loot.money) parts.push(`$${loot.money.toLocaleString()}`)
      if (loot.food) parts.push(`${loot.food.toLocaleString()} food`)
      if (loot.munitions) parts.push(`${loot.munitions.toLocaleString()} munitions`)
      if (loot.gasoline) parts.push(`${loot.gasoline.toLocaleString()} gasoline`)
      if (loot.steel) parts.push(`${loot.steel.toLocaleString()} steel`)
      if (loot.aluminum) parts.push(`${loot.aluminum.toLocaleString()} aluminum`)
      return parts.join(', ')
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Battle Log</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{battleLog.length} entries</p>
        </div>
        
        <div 
          ref={ref}
          className="h-96 overflow-y-auto p-4 space-y-4"
        >
          {battleLog.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No battle actions yet. Start the war to see battle logs here.
            </div>
          ) : (
            battleLog.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border-l-4 ${
                  log.actionType === 'system' 
                    ? 'bg-gray-50 border-l-gray-400'
                    : log.result === 'success'
                    ? 'bg-green-50 border-l-green-400'
                    : 'bg-red-50 border-l-red-400'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        Turn {log.turn}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(log.timestamp)}
                      </span>
                      <span className="text-sm">
                        {getResultIcon(log.result)}
                      </span>
                    </div>
                    
                    <div className="mt-1">
                      <span className="text-sm font-semibold text-blue-600">
                        {log.attacker}
                      </span>
                      <span className="text-sm text-gray-600 mx-1">→</span>
                      <span className="text-sm font-semibold text-red-600">
                        {log.defender}
                      </span>
                    </div>
                  </div>

                  {log.victoryType && (
                    <div className={`text-xs px-2 py-1 rounded ${getVictoryTypeColor(log.victoryType)} bg-white border`}>
                      {log.victoryType.replace('_', ' ').toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Action and Message */}
                <div className="mb-2">
                  <div className="font-medium text-sm text-gray-900 mb-1">
                    {log.action}
                  </div>
                  <div className="text-sm text-gray-700">
                    {log.message}
                  </div>
                </div>

                {/* Battle Details */}
                {log.details && (
                  <div className="text-xs text-gray-600 mb-2">
                    <div className="grid grid-cols-2 gap-2">
                      {log.details.mapsUsed && (
                        <div>MAPs Used: {log.details.mapsUsed}</div>
                      )}
                      {log.details.rollsWon !== undefined && (
                        <div>Rolls Won: {log.details.rollsWon}/3</div>
                      )}
                      {log.details.attackerStrength && (
                        <div>Attacker Strength: {log.details.attackerStrength.toLocaleString()}</div>
                      )}
                      {log.details.defenderStrength && (
                        <div>Defender Strength: {log.details.defenderStrength.toLocaleString()}</div>
                      )}
                    </div>
                    
                    {log.details.attackerRolls && log.details.defenderRolls && (
                      <div className="mt-1">
                        <div>Attacker Rolls: {log.details.attackerRolls.map(r => Math.floor(r).toLocaleString()).join(', ')}</div>
                        <div>Defender Rolls: {log.details.defenderRolls.map(r => Math.floor(r).toLocaleString()).join(', ')}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Casualties and Damage */}
                {(Object.keys(log.attackerCasualties).length > 0 || 
                  Object.keys(log.defenderCasualties).length > 0 || 
                  log.resistanceDamage > 0 || 
                  log.infrastructureDamage > 0) && (
                  <div className="text-xs space-y-1 pt-2 border-t border-gray-200">
                    {Object.keys(log.attackerCasualties).length > 0 && (
                      <div className="text-red-600">
                        Attacker Losses: {formatCasualties(log.attackerCasualties)}
                      </div>
                    )}
                    
                    {Object.keys(log.defenderCasualties).length > 0 && (
                      <div className="text-red-600">
                        Defender Losses: {formatCasualties(log.defenderCasualties)}
                      </div>
                    )}
                    
                    {log.resistanceDamage > 0 && (
                      <div className="text-orange-600">
                        Resistance Damage: -{log.resistanceDamage}
                      </div>
                    )}
                    
                    {log.infrastructureDamage > 0 && (
                      <div className="text-purple-600">
                        Infrastructure Damage: -{log.infrastructureDamage.toLocaleString()}
                      </div>
                    )}
                    
                    {Object.keys(log.loot).length > 0 && (
                      <div className="text-green-600">
                        Loot: {formatLoot(log.loot)}
                      </div>
                    )}
                  </div>
                )}

                {/* Space Control Changes */}
                {log.spaceControlChanges && (
                  <div className="text-xs pt-2 border-t border-gray-200">
                    {log.spaceControlChanges.gained && (
                      <div className="text-blue-600">
                        ✅ Gained: {log.spaceControlChanges.gained.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </div>
                    )}
                    {log.spaceControlChanges.lost && (
                      <div className="text-red-600">
                        ❌ Lost: {log.spaceControlChanges.lost.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }
)

BattleLogDisplay.displayName = 'BattleLogDisplay'

export default BattleLogDisplay
