'use client'

import { useState, useEffect, useCallback } from 'react'

interface BattleLogEntry {
  id: string
  warId: string
  warName: string
  turnNumber: number
  actionType: string
  target?: string
  attackerName: string
  attackerPlayerName: string
  defenderName: string
  defenderPlayerName: string
  militaryUsed: {
    soldiers: number
    tanks: number
    aircraft: number
    ships: number
    maps: number
  }
  preActionState: {
    attacker: {
      soldiers: number
      tanks: number
      aircraft: number
      ships: number
      resistance: number
      maps: number
    }
    defender: {
      soldiers: number
      tanks: number
      aircraft: number
      ships: number
      resistance: number
    }
  }
  postActionState: {
    attacker: {
      soldiers: number
      tanks: number
      aircraft: number
      ships: number
      resistance: number
      maps: number
    }
    defender: {
      soldiers: number
      tanks: number
      aircraft: number
      ships: number
      resistance: number
    }
  }
  victoryType: string
  rollsWon: number
  rolls: {
    attacker: number[]
    defender: number[]
  }
  casualties: {
    attacker: {
      soldiers: number
      tanks: number
      aircraft: number
      ships: number
    }
    defender: {
      soldiers: number
      tanks: number
      aircraft: number
      ships: number
    }
  }
  resistanceDamage: number
  infrastructureDamage: number
  spaceControlGained?: string
  spaceControlLost?: string
  executedAt: string
}

interface ComprehensiveBattleLogProps {
  warId?: string
  playerId?: string
  limit?: number
}

export default function ComprehensiveBattleLog({ warId, playerId, limit = 50 }: ComprehensiveBattleLogProps) {
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())

  const loadBattleLog = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (warId) params.append('warId', warId)
      if (playerId) params.append('playerId', playerId)
      params.append('limit', limit.toString())

      const response = await fetch(`/api/wars-v2/battle-log?${params}`)
      if (response.ok) {
        const data = await response.json()
        setBattleLog(data)
      } else {
        setError('Failed to load battle log')
      }
    } catch {
      setError('Error loading battle log')
    }
    setLoading(false)
  }, [warId, playerId, limit])

  useEffect(() => {
    loadBattleLog()
  }, [loadBattleLog])

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries)
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId)
    } else {
      newExpanded.add(entryId)
    }
    setExpandedEntries(newExpanded)
  }

  const formatActionType = (actionType: string) => {
    switch (actionType) {
      case 'ground_attack': return 'Ground Strike'
      case 'airstrike': return 'Airstrike'
      case 'naval_attack': return 'Naval Attack'
      default: return actionType
    }
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'ground_attack': return '⚔️'
      case 'airstrike': return '✈️'
      case 'naval_attack': return '🚢'
      default: return '💥'
    }
  }

  const getVictoryIcon = (victoryType: string) => {
    switch (victoryType) {
      case 'immense_triumph': return '🏆'
      case 'moderate_success': return '✅'
      case 'pyrrhic_victory': return '⚡'
      case 'utter_failure': return '💀'
      default: return '❓'
    }
  }

  const getVictoryColor = (victoryType: string) => {
    switch (victoryType) {
      case 'immense_triumph': return 'text-yellow-400'
      case 'moderate_success': return 'text-green-400'
      case 'pyrrhic_victory': return 'text-orange-400'
      case 'utter_failure': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const formatVictoryType = (victoryType: string) => {
    return victoryType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30">
        <div className="text-center text-slate-300">Loading battle log...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
        <div className="text-red-400">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">📜 Comprehensive Battle Log</h2>
        <div className="text-slate-400 text-sm">
          {battleLog.length} entries
        </div>
      </div>

      {battleLog.length === 0 ? (
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30 text-center">
          <div className="text-slate-400">No battle actions found</div>
        </div>
      ) : (
        <div className="space-y-3">
          {battleLog.map((entry) => {
            const isExpanded = expandedEntries.has(entry.id)
            
            return (
              <div 
                key={entry.id} 
                className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-600/30 overflow-hidden"
              >
                {/* Entry Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                  onClick={() => toggleExpanded(entry.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{getActionIcon(entry.actionType)}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-semibold">
                            {formatActionType(entry.actionType)}
                            {entry.target && ` on ${entry.target}`}
                          </span>
                          <span className={`text-sm ${getVictoryColor(entry.victoryType)}`}>
                            {getVictoryIcon(entry.victoryType)} {formatVictoryType(entry.victoryType)}
                          </span>
                        </div>
                        <div className="text-slate-300 text-sm">
                          {entry.attackerName} → {entry.defenderName}
                        </div>
                        <div className="text-slate-400 text-xs">
                          Turn {entry.turnNumber} • {formatTimestamp(entry.executedAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-slate-300 mb-1">
                        {entry.rollsWon}/3 rolls won
                      </div>
                      <div className="text-xs text-slate-400">
                        {isExpanded ? '▼' : '▶'} {isExpanded ? 'Hide' : 'Details'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-600/30 bg-slate-900/50">
                    <div className="p-4 space-y-4">
                      {/* Military Used */}
                      <div>
                        <h4 className="text-slate-300 font-semibold mb-2">⚔️ Military Used</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                          {entry.militaryUsed.soldiers > 0 && (
                            <div className="bg-slate-700/50 rounded p-2">
                              <div className="text-slate-400">Soldiers</div>
                              <div className="text-white font-mono">{entry.militaryUsed.soldiers.toLocaleString()}</div>
                            </div>
                          )}
                          {entry.militaryUsed.tanks > 0 && (
                            <div className="bg-slate-700/50 rounded p-2">
                              <div className="text-slate-400">Tanks</div>
                              <div className="text-white font-mono">{entry.militaryUsed.tanks.toLocaleString()}</div>
                            </div>
                          )}
                          {entry.militaryUsed.aircraft > 0 && (
                            <div className="bg-slate-700/50 rounded p-2">
                              <div className="text-slate-400">Aircraft</div>
                              <div className="text-white font-mono">{entry.militaryUsed.aircraft.toLocaleString()}</div>
                            </div>
                          )}
                          {entry.militaryUsed.ships > 0 && (
                            <div className="bg-slate-700/50 rounded p-2">
                              <div className="text-slate-400">Ships</div>
                              <div className="text-white font-mono">{entry.militaryUsed.ships.toLocaleString()}</div>
                            </div>
                          )}
                          <div className="bg-slate-700/50 rounded p-2">
                            <div className="text-slate-400">MAPs Used</div>
                            <div className="text-purple-300 font-mono">{entry.militaryUsed.maps}</div>
                          </div>
                        </div>
                      </div>

                      {/* Battle Rolls */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-green-400 font-semibold mb-2">🗡️ Attacker Rolls</h4>
                          <div className="space-y-1 text-sm">
                            {entry.rolls.attacker.map((roll, index) => (
                              <div key={index} className="flex justify-between bg-slate-700/50 rounded p-2">
                                <span>Roll {index + 1}:</span>
                                <span className="font-mono text-green-300">{roll?.toFixed(2) || 'N/A'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-blue-400 font-semibold mb-2">🛡️ Defender Rolls</h4>
                          <div className="space-y-1 text-sm">
                            {entry.rolls.defender.map((roll, index) => (
                              <div key={index} className="flex justify-between bg-slate-700/50 rounded p-2">
                                <span>Roll {index + 1}:</span>
                                <span className="font-mono text-blue-300">{roll?.toFixed(2) || 'N/A'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Before/After Comparison */}
                      <div>
                        <h4 className="text-slate-300 font-semibold mb-2">📊 Military State Comparison</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-600">
                                <th className="text-left py-2">Nation</th>
                                <th className="text-center py-2">Soldiers</th>
                                <th className="text-center py-2">Tanks</th>
                                <th className="text-center py-2">Aircraft</th>
                                <th className="text-center py-2">Ships</th>
                                <th className="text-center py-2">Resistance</th>
                                <th className="text-center py-2">MAPs</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-slate-700">
                                <td className="py-2 text-green-400">{entry.attackerName} (Before)</td>
                                <td className="text-center font-mono">{entry.preActionState.attacker.soldiers.toLocaleString()}</td>
                                <td className="text-center font-mono">{entry.preActionState.attacker.tanks.toLocaleString()}</td>
                                <td className="text-center font-mono">{entry.preActionState.attacker.aircraft.toLocaleString()}</td>
                                <td className="text-center font-mono">{entry.preActionState.attacker.ships.toLocaleString()}</td>
                                <td className="text-center font-mono">{entry.preActionState.attacker.resistance}%</td>
                                <td className="text-center font-mono">{entry.preActionState.attacker.maps}</td>
                              </tr>
                              <tr className="border-b border-slate-700">
                                <td className="py-2 text-green-300">{entry.attackerName} (After)</td>
                                <td className="text-center font-mono">
                                  {entry.postActionState.attacker.soldiers.toLocaleString()}
                                  {entry.casualties.attacker.soldiers > 0 && (
                                    <span className="text-red-400 text-xs ml-1">(-{entry.casualties.attacker.soldiers.toLocaleString()})</span>
                                  )}
                                </td>
                                <td className="text-center font-mono">
                                  {entry.postActionState.attacker.tanks.toLocaleString()}
                                  {entry.casualties.attacker.tanks > 0 && (
                                    <span className="text-red-400 text-xs ml-1">(-{entry.casualties.attacker.tanks.toLocaleString()})</span>
                                  )}
                                </td>
                                <td className="text-center font-mono">
                                  {entry.postActionState.attacker.aircraft.toLocaleString()}
                                  {entry.casualties.attacker.aircraft > 0 && (
                                    <span className="text-red-400 text-xs ml-1">(-{entry.casualties.attacker.aircraft.toLocaleString()})</span>
                                  )}
                                </td>
                                <td className="text-center font-mono">
                                  {entry.postActionState.attacker.ships.toLocaleString()}
                                  {entry.casualties.attacker.ships > 0 && (
                                    <span className="text-red-400 text-xs ml-1">(-{entry.casualties.attacker.ships.toLocaleString()})</span>
                                  )}
                                </td>
                                <td className="text-center font-mono">{entry.postActionState.attacker.resistance}%</td>
                                <td className="text-center font-mono">
                                  {entry.postActionState.attacker.maps}
                                  <span className="text-purple-400 text-xs ml-1">(-{entry.militaryUsed.maps})</span>
                                </td>
                              </tr>
                              <tr className="border-b border-slate-700">
                                <td className="py-2 text-blue-400">{entry.defenderName} (Before)</td>
                                <td className="text-center font-mono">{entry.preActionState.defender.soldiers.toLocaleString()}</td>
                                <td className="text-center font-mono">{entry.preActionState.defender.tanks.toLocaleString()}</td>
                                <td className="text-center font-mono">{entry.preActionState.defender.aircraft.toLocaleString()}</td>
                                <td className="text-center font-mono">{entry.preActionState.defender.ships.toLocaleString()}</td>
                                <td className="text-center font-mono">{entry.preActionState.defender.resistance}%</td>
                                <td className="text-center">-</td>
                              </tr>
                              <tr>
                                <td className="py-2 text-blue-300">{entry.defenderName} (After)</td>
                                <td className="text-center font-mono">
                                  {entry.postActionState.defender.soldiers.toLocaleString()}
                                  {entry.casualties.defender.soldiers > 0 && (
                                    <span className="text-red-400 text-xs ml-1">(-{entry.casualties.defender.soldiers.toLocaleString()})</span>
                                  )}
                                </td>
                                <td className="text-center font-mono">
                                  {entry.postActionState.defender.tanks.toLocaleString()}
                                  {entry.casualties.defender.tanks > 0 && (
                                    <span className="text-red-400 text-xs ml-1">(-{entry.casualties.defender.tanks.toLocaleString()})</span>
                                  )}
                                </td>
                                <td className="text-center font-mono">
                                  {entry.postActionState.defender.aircraft.toLocaleString()}
                                  {entry.casualties.defender.aircraft > 0 && (
                                    <span className="text-red-400 text-xs ml-1">(-{entry.casualties.defender.aircraft.toLocaleString()})</span>
                                  )}
                                </td>
                                <td className="text-center font-mono">
                                  {entry.postActionState.defender.ships.toLocaleString()}
                                  {entry.casualties.defender.ships > 0 && (
                                    <span className="text-red-400 text-xs ml-1">(-{entry.casualties.defender.ships.toLocaleString()})</span>
                                  )}
                                </td>
                                <td className="text-center font-mono">
                                  {entry.postActionState.defender.resistance}%
                                  {entry.resistanceDamage < 0 && (
                                    <span className="text-purple-400 text-xs ml-1">({entry.resistanceDamage})</span>
                                  )}
                                </td>
                                <td className="text-center">-</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Additional Effects */}
                      {(entry.infrastructureDamage > 0 || entry.spaceControlGained || entry.spaceControlLost) && (
                        <div>
                          <h4 className="text-slate-300 font-semibold mb-2">🎯 Additional Effects</h4>
                          <div className="grid md:grid-cols-3 gap-3 text-sm">
                            {entry.infrastructureDamage > 0 && (
                              <div className="bg-orange-900/20 border border-orange-500/30 rounded p-2">
                                <div className="text-orange-400">Infrastructure Damage</div>
                                <div className="text-orange-300 font-mono">-{entry.infrastructureDamage.toFixed(1)}%</div>
                              </div>
                            )}
                            {entry.spaceControlGained && (
                              <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
                                <div className="text-green-400">Space Control Gained</div>
                                <div className="text-green-300">{entry.spaceControlGained.replace('_', ' ')}</div>
                              </div>
                            )}
                            {entry.spaceControlLost && (
                              <div className="bg-red-900/20 border border-red-500/30 rounded p-2">
                                <div className="text-red-400">Space Control Lost</div>
                                <div className="text-red-300">{entry.spaceControlLost.replace('_', ' ')}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
