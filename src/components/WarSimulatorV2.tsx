'use client'

import { useState, useEffect } from 'react'
import { War, Nation, ActionType, ExecuteActionRequest } from '@/types/war-v2'

// Type for nation data from P&W API
interface NationData {
  nation_name: string
  leader_name: string
  cities: number
  score: number
  soldiers: number
  tanks: number
  aircraft: number
  ships: number
}

export default function WarSimulatorV2() {
  const [wars, setWars] = useState<War[]>([])
  const [currentWar, setCurrentWar] = useState<War | null>(null)
  const [playerId, setPlayerId] = useState<string>('')
  const [playerParticipant, setPlayerParticipant] = useState<Nation | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [actionInputs, setActionInputs] = useState({
    soldiers: 0,
    tanks: 0,
    aircraft: 0,
    ships: 0
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    warName: '',
    maxPlayers: 2,
    turnDuration: 120,
    playerName: '',
    nationName: '',
    nationId: '',
    isSpectator: false
  })
  const [nationData, setNationData] = useState<NationData | null>(null)
  const [validatingNation, setValidatingNation] = useState(false)
  const [militaryType, setMilitaryType] = useState<'current' | 'maximum'>('current')

  const loadWars = async () => {
    try {
      const response = await fetch('/api/wars-v2', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setWars(data)
        
        // Update current war if viewing one
        if (currentWar) {
          const updatedWar = data.find((w: War) => w.id === currentWar.id)
          if (updatedWar) {
            setCurrentWar(updatedWar)
          }
        }
      }
    } catch (err) {
      console.error('Error loading wars:', err)
    }
  }

  // Load wars on component mount
  useEffect(() => {
    loadWars()
    const interval = setInterval(loadWars, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Poll current war for real-time updates
  useEffect(() => {
    if (!currentWar) return

    const interval = setInterval(() => {
      loadWar(currentWar.id)
    }, 3000) // Refresh current war every 3 seconds for real-time updates

    return () => clearInterval(interval)
  }, [currentWar?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update current player participant when war changes
  useEffect(() => {
    if (currentWar && playerId) {
      const participant = currentWar.participants.find(p => p.playerId === playerId)
      setPlayerParticipant(participant || null)
    }
  }, [currentWar, playerId])

  const loadWar = async (warId: string) => {
    try {
      const response = await fetch(`/api/wars-v2?warId=${warId}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const war = await response.json()
        setCurrentWar(war)
      }
    } catch (error) {
      console.error('Error loading war:', error)
    }
  }

  const validateNationId = async (nationId: string) => {
    if (!nationId || nationId.length < 3) {
      setNationData(null)
      return
    }

    setValidatingNation(true)
    try {
      const response = await fetch(`/api/pnw/nation?id=${nationId}`)
      if (response.ok) {
        const data = await response.json()
        setNationData(data)
        setFormData(prev => ({
          ...prev,
          nationName: data.nation_name || '',
          playerName: data.leader_name || prev.playerName
        }))
      } else {
        setNationData(null)
      }
    } catch (error) {
      console.error('Error validating nation:', error)
      setNationData(null)
    }
    setValidatingNation(false)
  }

  const calculateMaximumMilitary = (cities: number) => {
    // Maximum military assuming 5 barracks, 5 factories, 5 hangars, 3 drydocks per city
    const maxSoldiers = cities * 5 * 3000  // 5 barracks * 3000 soldiers each
    const maxTanks = cities * 5 * 250      // 5 factories * 250 tanks each  
    const maxAircraft = cities * 5 * 15    // 5 hangars * 15 aircraft each
    const maxShips = cities * 3 * 5        // 3 drydocks * 5 ships each
    
    return {
      soldiers: maxSoldiers,
      tanks: maxTanks,
      aircraft: maxAircraft,
      ships: maxShips
    }
  }

  const getMilitaryForDisplay = () => {
    if (!nationData) return null
    
    if (militaryType === 'current') {
      return {
        soldiers: nationData.soldiers,
        tanks: nationData.tanks,
        aircraft: nationData.aircraft,
        ships: nationData.ships
      }
    } else {
      return calculateMaximumMilitary(nationData.cities)
    }
  }

  const resetForm = () => {
    setFormData({
      warName: '',
      maxPlayers: 2,
      turnDuration: 120,
      playerName: '',
      nationName: '',
      nationId: '',
      isSpectator: false
    })
    setNationData(null)
    setShowCreateForm(false)
    setShowJoinForm(null)
  }

  const createWar = async () => {
    if (!formData.warName || !formData.playerName || !formData.nationName) {
      setMessage('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Get the military values based on user selection
      const military = getMilitaryForDisplay()
      
      const response = await fetch('/api/wars-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: formData.warName,
          maxPlayers: formData.maxPlayers,
          turnDuration: formData.turnDuration,
          playerName: formData.playerName,
          nationName: formData.nationName,
          nationId: formData.nationId || undefined,
          customMilitary: military // Send the selected military values
        })
      })

      if (response.ok) {
        const result = await response.json()
        setPlayerId(result.playerId)
        setMessage('War created successfully!')
        resetForm()
        loadWars()
        loadWar(result.warId)
      } else {
        const error = await response.json()
        setMessage(`Error: ${error.error}`)
      }
    } catch {
      setMessage('Error creating war')
    }
    setLoading(false)
  }

  const joinWar = async (warId: string, asSpectator = false) => {
    if (!formData.playerName || !formData.nationName) {
      setMessage('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Get the military values based on user selection
      const military = getMilitaryForDisplay()
      
      const response = await fetch('/api/wars-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          warId,
          playerName: formData.playerName,
          nationName: formData.nationName,
          nationId: formData.nationId || undefined,
          asSpectator,
          customMilitary: military // Send the selected military values
        })
      })

      if (response.ok) {
        const result = await response.json()
        setPlayerId(result.playerId)
        setMessage(result.message)
        resetForm()
        loadWars()
        loadWar(warId)
      } else {
        const error = await response.json()
        setMessage(`Error: ${error.error}`)
      }
    } catch {
      setMessage('Error joining war')
    }
    setLoading(false)
  }

  const executeAction = async (actionType: ActionType, defenderId: string) => {
    if (!currentWar || !playerId) return

    const request: ExecuteActionRequest = {
      warId: currentWar.id,
      defenderId,
      actionType,
      target: selectedTarget || undefined,
      soldiersUsed: actionInputs.soldiers || undefined,
      tanksUsed: actionInputs.tanks || undefined,
      aircraftUsed: actionInputs.aircraft || undefined,
      shipsUsed: actionInputs.ships || undefined
    }

    setLoading(true)
    try {
      const response = await fetch('/api/wars-v2/actions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Player-ID': playerId
        },
        body: JSON.stringify(request)
      })

      if (response.ok) {
        const result = await response.json()
        setMessage(result.message)
        setActionInputs({ soldiers: 0, tanks: 0, aircraft: 0, ships: 0 })
        setSelectedTarget('')
        loadWar(currentWar.id)
      } else {
        const error = await response.json()
        setMessage(`Error: ${error.error}`)
      }
    } catch {
      setMessage('Error executing action')
    }
    setLoading(false)
  }

  const advanceTurn = async () => {
    if (!currentWar) return

    setLoading(true)
    try {
      const response = await fetch('/api/wars-v2/advance-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warId: currentWar.id })
      })

      if (response.ok) {
        const result = await response.json()
        setMessage(result.message)
        loadWar(currentWar.id)
      }
    } catch {
      setMessage('Error advancing turn')
    }
    setLoading(false)
  }

  if (!currentWar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 tracking-wider">
              🌍 Politics & War Simulator V2
            </h1>
            <p className="text-blue-200 text-lg">
              Experience realistic warfare with exact P&W battle mechanics
            </p>
          </div>
          
          {/* Message Display */}
          {message && (
            <div className="mb-8 max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-blue-100 text-center font-medium">{message}</p>
              </div>
            </div>
          )}

          {/* Create War Section */}
          <div className="mb-12">
            {!showCreateForm ? (
              <div className="text-center">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto border border-slate-600/30">
                  <h2 className="text-2xl font-bold text-white mb-4">Start New War</h2>
                  <p className="text-slate-300 mb-6">Create a multiplayer war room for unlimited players</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 
                             text-white font-bold px-8 py-3 rounded-lg transition-all duration-200 
                             shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    🚀 Create War Room
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-8 border border-slate-600/30">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">🛠️ Create New War</h2>
                    <button
                      onClick={resetForm}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid gap-6">
                    {/* War Settings */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">🏛️ War Name</label>
                        <input
                          type="text"
                          value={formData.warName}
                          onChange={(e) => setFormData(prev => ({ ...prev, warName: e.target.value }))}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white 
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          placeholder="Enter war name..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">👥 Max Players</label>
                        <select
                          value={formData.maxPlayers}
                          onChange={(e) => setFormData(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white 
                                   focus:border-blue-400 focus:outline-none transition-colors"
                        >
                          {[2,3,4,5,6,7,8,9,10].map(n => (
                            <option key={n} value={n}>{n} Players</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Nation Information */}
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-4">🏛️ Your Nation</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">🎭 Player Name</label>
                          <input
                            type="text"
                            value={formData.playerName}
                            onChange={(e) => setFormData(prev => ({ ...prev, playerName: e.target.value }))}
                            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white 
                                     focus:border-blue-400 focus:outline-none transition-colors"
                            placeholder="Your name..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">🆔 Nation ID (Optional)</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.nationId}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, nationId: e.target.value }))
                                validateNationId(e.target.value)
                              }}
                              className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white 
                                       focus:border-blue-400 focus:outline-none transition-colors"
                              placeholder="P&W Nation ID..."
                            />
                            {validatingNation && (
                              <div className="absolute right-3 top-3">
                                <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {nationData ? (
                        <div className="mt-4 space-y-3">
                          <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                            <p className="text-green-300 font-medium">✅ Nation Found: {nationData.nation_name}</p>
                            <p className="text-green-200 text-sm">Leader: {nationData.leader_name}</p>
                            <p className="text-green-200 text-sm">Cities: {nationData.cities} | Score: {nationData.score?.toLocaleString()}</p>
                          </div>
                          
                          {/* Military Type Selection */}
                          <div className="p-3 bg-slate-800/50 border border-slate-600/30 rounded-lg">
                            <label className="block text-sm font-medium text-slate-300 mb-2">⚔️ Military Configuration</label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setMilitaryType('current')}
                                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                                  militaryType === 'current'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                              >
                                Current Military
                              </button>
                              <button
                                type="button"
                                onClick={() => setMilitaryType('maximum')}
                                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                                  militaryType === 'maximum'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                              >
                                Maximum Military
                              </button>
                            </div>
                            
                            {/* Military Display */}
                            {(() => {
                              const military = getMilitaryForDisplay()
                              return military ? (
                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">🪖 Soldiers:</span>
                                    <span className="text-green-400 font-medium">{military.soldiers.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">🚗 Tanks:</span>
                                    <span className="text-blue-400 font-medium">{military.tanks.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">✈️ Aircraft:</span>
                                    <span className="text-purple-400 font-medium">{military.aircraft.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">🚢 Ships:</span>
                                    <span className="text-cyan-400 font-medium">{military.ships.toLocaleString()}</span>
                                  </div>
                                </div>
                              ) : null
                            })()}
                            
                            {militaryType === 'maximum' && (
                              <p className="mt-2 text-xs text-slate-400">
                                * Assumes 5 barracks, 5 factories, 5 hangars, 3 drydocks per city
                              </p>
                            )}
                          </div>
                        </div>
                      ) : formData.nationId ? (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                          <p className="text-red-300">❌ Nation not found or invalid ID</p>
                        </div>
                      ) : null}

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">🏛️ Nation Name</label>
                        <input
                          type="text"
                          value={formData.nationName}
                          onChange={(e) => setFormData(prev => ({ ...prev, nationName: e.target.value }))}
                          className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white 
                                   focus:border-blue-400 focus:outline-none transition-colors"
                          placeholder="Nation name..."
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button
                        onClick={resetForm}
                        className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-6 py-3 rounded-lg 
                                 transition-colors duration-200 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createWar}
                        disabled={loading || !formData.warName || !formData.playerName || !formData.nationName}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 
                                 text-white px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 
                                 disabled:cursor-not-allowed font-medium shadow-lg"
                      >
                        {loading ? '⚡ Creating...' : '🚀 Create War'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Wars */}
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">🎯 Active War Rooms</h2>
            {wars.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">⚔️</div>
                <p className="text-slate-300 text-xl">No active wars found</p>
                <p className="text-slate-400 mt-2">Create the first war room to get started!</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {wars.map(war => (
                  <div key={war.id} className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30 
                                               hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
                    {/* War Header */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-2">{war.name}</h3>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className={`px-3 py-1 rounded-full font-medium ${
                          war.status === 'active' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                          war.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                          'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        }`}>
                          {war.status === 'active' ? '🔥 Active' :
                           war.status === 'waiting' ? '⏳ Waiting' : '✅ Completed'}
                        </span>
                        <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                          👥 {war.currentPlayers}/{war.maxPlayers}
                        </span>
                        <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
                          🎯 Turn {war.currentTurn}
                        </span>
                      </div>
                    </div>

                    {/* Participants */}
                    <div className="mb-4">
                      <p className="text-slate-300 font-medium mb-2">🏛️ Nations:</p>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {war.participants.map(p => (
                          <div key={p.id} className="text-xs bg-slate-700/50 px-3 py-1 rounded-lg flex justify-between items-center">
                            <span className="text-slate-200">
                              {p.playerName} ({p.name})
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-red-400">❤️ {p.resistance}</span>
                              {p.isSpectator && <span className="text-gray-400">👁️</span>}
                              {p.isEliminated && <span className="text-red-500">💀</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => loadWar(war.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg 
                                 transition-colors duration-200 font-medium text-sm"
                      >
                        👁️ View
                      </button>
                      {war.status === 'waiting' && (
                        <>
                          <button
                            onClick={() => setShowJoinForm(war.id)}
                            disabled={loading}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg 
                                     transition-colors duration-200 disabled:opacity-50 font-medium text-sm"
                          >
                            ⚔️ Join
                          </button>
                          <button
                            onClick={() => {
                              setFormData(prev => ({ ...prev, isSpectator: true }))
                              setShowJoinForm(war.id)
                            }}
                            disabled={loading}
                            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg 
                                     transition-colors duration-200 disabled:opacity-50 font-medium text-sm"
                          >
                            👁️ Spectate
                          </button>
                        </>
                      )}
                      {war.status === 'active' && (
                        <button
                          onClick={() => {
                            setFormData(prev => ({ ...prev, isSpectator: true }))
                            setShowJoinForm(war.id)
                          }}
                          disabled={loading}
                          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg 
                                   transition-colors duration-200 disabled:opacity-50 font-medium text-sm"
                        >
                          👁️ Spectate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Join War Form Modal */}
          {showJoinForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full border border-slate-600">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {formData.isSpectator ? '👁️ Join as Spectator' : '⚔️ Join War'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">🎭 Player Name</label>
                    <input
                      type="text"
                      value={formData.playerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, playerName: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white 
                               focus:border-blue-400 focus:outline-none transition-colors"
                      placeholder="Your name..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">🆔 Nation ID (Optional)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.nationId}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, nationId: e.target.value }))
                          validateNationId(e.target.value)
                        }}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white 
                                 focus:border-blue-400 focus:outline-none transition-colors"
                        placeholder="P&W Nation ID..."
                      />
                      {validatingNation && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {nationData ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                        <p className="text-green-300 font-medium">✅ Nation Found: {nationData.nation_name}</p>
                        <p className="text-green-200 text-sm">Leader: {nationData.leader_name}</p>
                        <p className="text-green-200 text-sm">Cities: {nationData.cities} | Score: {nationData.score?.toLocaleString()}</p>
                      </div>
                      
                      {/* Military Type Selection */}
                      <div className="p-3 bg-slate-800/50 border border-slate-600/30 rounded-lg">
                        <label className="block text-sm font-medium text-slate-300 mb-2">⚔️ Military Configuration</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setMilitaryType('current')}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                              militaryType === 'current'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            Current Military
                          </button>
                          <button
                            type="button"
                            onClick={() => setMilitaryType('maximum')}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                              militaryType === 'maximum'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            Maximum Military
                          </button>
                        </div>
                        
                        {/* Military Display */}
                        {(() => {
                          const military = getMilitaryForDisplay()
                          return military ? (
                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-400">🪖 Soldiers:</span>
                                <span className="text-green-400 font-medium">{military.soldiers.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">🚗 Tanks:</span>
                                <span className="text-blue-400 font-medium">{military.tanks.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">✈️ Aircraft:</span>
                                <span className="text-purple-400 font-medium">{military.aircraft.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">🚢 Ships:</span>
                                <span className="text-cyan-400 font-medium">{military.ships.toLocaleString()}</span>
                              </div>
                            </div>
                          ) : null
                        })()}
                        
                        {militaryType === 'maximum' && (
                          <p className="mt-2 text-xs text-slate-400">
                            * Assumes 5 barracks, 5 factories, 5 hangars, 3 drydocks per city
                          </p>
                        )}
                      </div>
                    </div>
                  ) : formData.nationId ? (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <p className="text-red-300">❌ Nation not found or invalid ID</p>
                    </div>
                  ) : null}

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">🏛️ Nation Name</label>
                    <input
                      type="text"
                      value={formData.nationName}
                      onChange={(e) => setFormData(prev => ({ ...prev, nationName: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white 
                               focus:border-blue-400 focus:outline-none transition-colors"
                      placeholder="Nation name..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={resetForm}
                      className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg 
                               transition-colors duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => joinWar(showJoinForm, formData.isSpectator)}
                      disabled={loading || !formData.playerName || !formData.nationName}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 
                               text-white px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 
                               disabled:cursor-not-allowed font-medium shadow-lg"
                    >
                      {loading ? '⚡ Joining...' : formData.isSpectator ? '👁️ Spectate' : '⚔️ Join War'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* War Room Header */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 mb-8 border border-slate-600/30">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">⚔️ {currentWar.name}</h1>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className={`px-3 py-1 rounded-full font-medium ${
                  currentWar.status === 'active' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                  currentWar.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                  'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                }`}>
                  {currentWar.status === 'active' ? '🔥 Active Battle' :
                   currentWar.status === 'waiting' ? '⏳ Waiting for Players' : '✅ Completed'}
                </span>
                <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
                  🎯 Turn {currentWar.currentTurn}
                </span>
                <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                  👥 {currentWar.participants.filter(p => !p.isSpectator).length} Nations
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentWar(null)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg 
                         transition-colors duration-200 font-medium"
              >
                ← Back to Wars
              </button>
              <button
                onClick={() => loadWar(currentWar.id)}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg 
                         transition-colors duration-200 font-medium disabled:opacity-50"
              >
                🔄 Refresh
              </button>
              {currentWar.status === 'active' && (
                <button
                  onClick={advanceTurn}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 
                           text-white px-6 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 
                           font-medium shadow-lg"
                >
                  {loading ? '⏳' : '⏭️'} Advance Turn
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 
                          rounded-lg p-4 backdrop-blur-sm max-w-2xl mx-auto">
              <p className="text-blue-100 text-center font-medium">{message}</p>
            </div>
          </div>
        )}

        {/* Nations Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">🏛️ Nations in War</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentWar.participants.map(participant => (
              <div 
                key={participant.id} 
                className={`bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 hover:shadow-xl ${
                  participant.playerId === playerId ? 'border-blue-500/70 shadow-blue-500/20 shadow-lg' : 
                  participant.isEliminated ? 'border-red-500/50 bg-red-900/20' :
                  participant.isSpectator ? 'border-gray-500/30 opacity-75' : 'border-slate-600/30 hover:border-slate-500/50'
                }`}
              >
                {/* Nation Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">{participant.name}</h3>
                    {participant.playerId === playerId && (
                      <span className="text-xs bg-blue-500/30 text-blue-200 px-2 py-1 rounded-full border border-blue-500/50">
                        👤 You
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm mb-2">🎭 {participant.playerName}</p>
                  
                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-1">
                    {participant.isHost && (
                      <span className="text-xs bg-yellow-500/30 text-yellow-200 px-2 py-1 rounded-full border border-yellow-500/50">
                        👑 Host
                      </span>
                    )}
                    {participant.isSpectator && (
                      <span className="text-xs bg-gray-500/30 text-gray-300 px-2 py-1 rounded-full border border-gray-500/50">
                        👁️ Spectator
                      </span>
                    )}
                    {participant.isEliminated && (
                      <span className="text-xs bg-red-500/30 text-red-300 px-2 py-1 rounded-full border border-red-500/50">
                        💀 Eliminated
                      </span>
                    )}
                  </div>
                </div>
                
                {!participant.isSpectator && (
                  <>
                    {/* Core Stats */}
                    <div className="space-y-3 mb-4">
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-300 font-medium">💗 Resistance</span>
                          <span className={`font-bold text-lg ${
                            participant.resistance <= 20 ? 'text-red-400' : 
                            participant.resistance <= 50 ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {participant.resistance}%
                          </span>
                        </div>
                        <div className={`h-2 bg-slate-600 rounded-full overflow-hidden`}>
                          <div 
                            className={`h-full transition-all duration-500 ${
                              participant.resistance <= 20 ? 'bg-red-500' : 
                              participant.resistance <= 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${participant.resistance}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-slate-700/50 rounded-lg p-2">
                          <div className="text-slate-400">⚡ MAPs</div>
                          <div className="text-white font-bold">{participant.currentMaps}/{participant.maxMaps}</div>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-2">
                          <div className="text-slate-400">🏙️ Cities</div>
                          <div className="text-white font-bold">{participant.cities}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Military Forces */}
                    <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
                      <h4 className="text-slate-300 font-medium mb-3">🛡️ Military Forces</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">🪖 Soldiers:</span>
                          <span className="text-green-400 font-medium">{participant.soldiers.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">🚗 Tanks:</span>
                          <span className="text-blue-400 font-medium">{participant.tanks.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">✈️ Aircraft:</span>
                          <span className="text-purple-400 font-medium">{participant.aircraft.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">🚢 Ships:</span>
                          <span className="text-cyan-400 font-medium">{participant.ships.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Space Control */}
                    {(participant.groundControl || participant.airSuperiority || participant.blockade || participant.fortified) && (
                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <h4 className="text-slate-300 font-medium mb-2">🎯 Space Control</h4>
                        <div className="flex flex-wrap gap-1">
                          {participant.groundControl && (
                            <span className="bg-green-500/30 text-green-300 px-2 py-1 rounded-full text-xs border border-green-500/50">
                              🌍 Ground
                            </span>
                          )}
                          {participant.airSuperiority && (
                            <span className="bg-blue-500/30 text-blue-300 px-2 py-1 rounded-full text-xs border border-blue-500/50">
                              ✈️ Air
                            </span>
                          )}
                          {participant.blockade && (
                            <span className="bg-purple-500/30 text-purple-300 px-2 py-1 rounded-full text-xs border border-purple-500/50">
                              🚢 Blockade
                            </span>
                          )}
                          {participant.fortified && (
                            <span className="bg-orange-500/30 text-orange-300 px-2 py-1 rounded-full text-xs border border-orange-500/50">
                              🏰 Fortified
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Battle Actions */}
        {playerParticipant && !playerParticipant.isSpectator && !playerParticipant.isEliminated && currentWar.status === 'active' && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-600/30">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">⚔️ Battle Command Center</h3>
            
            {/* Action Inputs */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">🪖 Soldiers</label>
                <input
                  type="number"
                  min="0"
                  max={playerParticipant.soldiers}
                  value={actionInputs.soldiers}
                  onChange={e => setActionInputs(prev => ({ ...prev, soldiers: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white 
                           focus:border-blue-400 focus:outline-none transition-colors"
                  placeholder="0"
                />
                <p className="text-xs text-slate-400 mt-1">Max: {playerParticipant.soldiers.toLocaleString()}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">🚗 Tanks</label>
                <input
                  type="number"
                  min="0"
                  max={playerParticipant.tanks}
                  value={actionInputs.tanks}
                  onChange={e => setActionInputs(prev => ({ ...prev, tanks: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white 
                           focus:border-blue-400 focus:outline-none transition-colors"
                  placeholder="0"
                />
                <p className="text-xs text-slate-400 mt-1">Max: {playerParticipant.tanks.toLocaleString()}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">✈️ Aircraft</label>
                <input
                  type="number"
                  min="0"
                  max={playerParticipant.aircraft}
                  value={actionInputs.aircraft}
                  onChange={e => setActionInputs(prev => ({ ...prev, aircraft: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white 
                           focus:border-blue-400 focus:outline-none transition-colors"
                  placeholder="0"
                />
                <p className="text-xs text-slate-400 mt-1">Max: {playerParticipant.aircraft.toLocaleString()}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">🚢 Ships</label>
                <input
                  type="number"
                  min="0"
                  max={playerParticipant.ships}
                  value={actionInputs.ships}
                  onChange={e => setActionInputs(prev => ({ ...prev, ships: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white 
                           focus:border-blue-400 focus:outline-none transition-colors"
                  placeholder="0"
                />
                <p className="text-xs text-slate-400 mt-1">Max: {playerParticipant.ships.toLocaleString()}</p>
              </div>
            </div>

            {/* Target Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">🎯 Target Selection (for airstrikes/naval)</label>
              <select
                value={selectedTarget}
                onChange={e => setSelectedTarget(e.target.value)}
                className="w-full md:w-auto bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white 
                         focus:border-blue-400 focus:outline-none transition-colors"
              >
                <option value="">Select target...</option>
                <option value="aircraft">✈️ Aircraft</option>
                <option value="soldiers">🪖 Soldiers</option>
                <option value="tanks">🚗 Tanks</option>
                <option value="ships">🚢 Ships</option>
                <option value="infrastructure">🏭 Infrastructure</option>
                <option value="ground_control">🌍 Ground Control</option>
                <option value="air_superiority">☁️ Air Superiority</option>
              </select>
            </div>

            {/* Available Targets */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-white mb-4">🎯 Available Enemy Nations:</h4>
              {currentWar.participants
                .filter(p => !p.isSpectator && !p.isEliminated && p.id !== playerParticipant.id)
                .map(target => (
                  <div key={target.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1">
                        <h5 className="text-white font-medium">{target.name}</h5>
                        <p className="text-slate-400 text-sm">🎭 {target.playerName}</p>
                        <p className="text-slate-400 text-sm">💗 Resistance: {target.resistance}%</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => executeAction('ground_attack', target.id)}
                          disabled={loading || playerParticipant.currentMaps < 3 || (actionInputs.soldiers + actionInputs.tanks) === 0}
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 
                                   text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed 
                                   transition-all duration-200 font-medium shadow-lg"
                        >
                          ⚔️ Ground Attack (3 MAPs)
                        </button>
                        <button
                          onClick={() => executeAction('airstrike', target.id)}
                          disabled={loading || playerParticipant.currentMaps < 4 || actionInputs.aircraft === 0 || !selectedTarget}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 
                                   text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed 
                                   transition-all duration-200 font-medium shadow-lg"
                        >
                          ✈️ Airstrike (4 MAPs)
                        </button>
                        <button
                          onClick={() => executeAction('naval_attack', target.id)}
                          disabled={loading || playerParticipant.currentMaps < 4 || actionInputs.ships === 0 || !selectedTarget}
                          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 
                                   text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed 
                                   transition-all duration-200 font-medium shadow-lg"
                        >
                          🚢 Naval Attack (4 MAPs)
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
