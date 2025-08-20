'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ComprehensiveBattleLog from '@/components/war/ComprehensiveBattleLog'

interface WarHistoryEntry {
  id: string
  name: string
  status: string
  maxPlayers: number
  currentPlayers: number
  turnDuration: number
  currentTurn: number
  createdBy: string
  startedAt?: string
  endedAt?: string
  createdAt: string
  participants: {
    id: string
    name: string
    playerName: string
    isHost: boolean
    isSpectator: boolean
    isEliminated: boolean
  }[]
}

export default function WarHistoryPage() {
  const { data: session } = useSession()
  const [wars, setWars] = useState<WarHistoryEntry[]>([])
  const [selectedWar, setSelectedWar] = useState<string | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'my-wars' | 'completed' | 'active'>('all')

  useEffect(() => {
    loadWarHistory()
  }, [])

  const loadWarHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/wars-v2')
      if (response.ok) {
        const data = await response.json()
        setWars(data)
      }
    } catch (error) {
      console.error('Error loading war history:', error)
    }
    setLoading(false)
  }

  const getFilteredWars = () => {
    if (!session?.user?.email) return wars

    return wars.filter(war => {
      switch (filter) {
        case 'my-wars':
          return war.participants.some(p => p.playerName === session.user?.email || p.playerName === session.user?.name)
        case 'completed':
          return war.status === 'completed'
        case 'active':
          return war.status === 'active'
        default:
          return true
      }
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20'
      case 'completed': return 'text-blue-400 bg-blue-500/20'
      case 'waiting': return 'text-yellow-400 bg-yellow-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '⚔️'
      case 'completed': return '🏆'
      case 'waiting': return '⏳'
      default: return '❓'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-wider">
            📚 War History & Battle Archives
          </h1>
          <p className="text-blue-200 text-lg">
            Complete battle logs and war statistics
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { key: 'all', label: '🌍 All Wars', count: wars.length },
              { key: 'my-wars', label: '👤 My Wars', count: getFilteredWars().length },
              { key: 'active', label: '⚔️ Active', count: wars.filter(w => w.status === 'active').length },
              { key: 'completed', label: '🏆 Completed', count: wars.filter(w => w.status === 'completed').length }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  filter === filterOption.key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                {filterOption.label}
                <span className="ml-2 text-sm opacity-75">({filterOption.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected War/Player Battle Log */}
        {(selectedWar || selectedPlayer) && (
          <div className="mb-8">
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  {selectedWar ? '⚔️ War Battle Log' : '👤 Player Battle History'}
                </h2>
                <button
                  onClick={() => {
                    setSelectedWar(null)
                    setSelectedPlayer(null)
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕ Close
                </button>
              </div>
              <ComprehensiveBattleLog 
                warId={selectedWar || undefined} 
                playerId={selectedPlayer || undefined}
                limit={100} 
              />
            </div>
          </div>
        )}

        {/* Wars List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-slate-300 py-8">
              Loading war history...
            </div>
          ) : getFilteredWars().length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              No wars found for the selected filter.
            </div>
          ) : (
            getFilteredWars().map(war => (
              <div
                key={war.id}
                className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{getStatusIcon(war.status)}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{war.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <span>Turn {war.currentTurn}</span>
                        <span>•</span>
                        <span>{war.currentPlayers}/{war.maxPlayers} players</span>
                        <span>•</span>
                        <span>Created {formatDate(war.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(war.status)}`}>
                      {war.status.toUpperCase()}
                    </div>
                    <button
                      onClick={() => setSelectedWar(war.id)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      📜 View Battle Log
                    </button>
                  </div>
                </div>

                {/* Participants */}
                <div>
                  <h4 className="text-slate-300 font-medium mb-3">👥 Participants</h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {war.participants.map(participant => (
                      <div
                        key={participant.id}
                        className={`bg-slate-700/50 rounded-lg p-3 border transition-all duration-200 ${
                          participant.isEliminated 
                            ? 'border-red-500/30 bg-red-900/20' 
                            : participant.isSpectator 
                            ? 'border-gray-500/30 opacity-75'
                            : 'border-slate-600/30 hover:border-slate-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-medium">{participant.name}</span>
                              {participant.isHost && <span className="text-yellow-400 text-xs">👑 Host</span>}
                              {participant.isSpectator && <span className="text-gray-400 text-xs">👁️ Spectator</span>}
                              {participant.isEliminated && <span className="text-red-400 text-xs">💀 Eliminated</span>}
                            </div>
                            <div className="text-slate-400 text-sm">{participant.playerName}</div>
                          </div>
                          <button
                            onClick={() => setSelectedPlayer(participant.playerName)}
                            className="text-slate-400 hover:text-blue-400 transition-colors text-sm"
                            title="View player battle history"
                          >
                            📊
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* War Timeline */}
                {(war.startedAt || war.endedAt) && (
                  <div className="mt-4 pt-4 border-t border-slate-600/30">
                    <h4 className="text-slate-300 font-medium mb-2">⏰ Timeline</h4>
                    <div className="flex items-center space-x-6 text-sm text-slate-400">
                      <div>Created: {formatDate(war.createdAt)}</div>
                      {war.startedAt && <div>Started: {formatDate(war.startedAt)}</div>}
                      {war.endedAt && <div>Ended: {formatDate(war.endedAt)}</div>}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
