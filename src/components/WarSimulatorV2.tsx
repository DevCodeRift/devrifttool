'use client'

import { useState, useEffect } from 'react'
import { War, Nation, ActionType, ExecuteActionRequest } from '@/types/war-v2'

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

  const loadWars = async () => {
    try {
      const response = await fetch('/api/wars-v2')
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

  // Update current player participant when war changes
  useEffect(() => {
    if (currentWar && playerId) {
      const participant = currentWar.participants.find(p => p.playerId === playerId)
      setPlayerParticipant(participant || null)
    }
  }, [currentWar, playerId])

  const loadWar = async (warId: string) => {
    try {
      const response = await fetch(`/api/wars-v2?warId=${warId}`)
      if (response.ok) {
        const war = await response.json()
        setCurrentWar(war)
      }
    } catch (error) {
      console.error('Error loading war:', error)
    }
  }

  const createWar = async () => {
    const name = prompt('War name:')
    const playerName = prompt('Your player name:')
    const nationName = prompt('Your nation name:')
    
    if (!name || !playerName || !nationName) return

    setLoading(true)
    try {
      const response = await fetch('/api/wars-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name,
          maxPlayers: parseInt(prompt('Max players (2-10):') || '2'),
          turnDuration: parseInt(prompt('Turn duration in seconds (60-300):') || '120'),
          playerName,
          nationName
        })
      })

      if (response.ok) {
        const result = await response.json()
        setPlayerId(result.playerId)
        setMessage('War created successfully!')
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
    const playerName = prompt('Your player name:')
    const nationName = prompt('Your nation name:')
    
    if (!playerName || !nationName) return

    setLoading(true)
    try {
      const response = await fetch('/api/wars-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          warId,
          playerName,
          nationName,
          asSpectator
        })
      })

      if (response.ok) {
        const result = await response.json()
        setPlayerId(result.playerId)
        setMessage(result.message)
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
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Politics & War Simulator V2</h1>
        
        {message && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded">
            {message}
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={createWar}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded mr-4 disabled:opacity-50"
          >
            Create New War
          </button>
        </div>

        <div className="grid gap-4">
          <h2 className="text-xl font-bold">Active Wars</h2>
          {wars.length === 0 ? (
            <p className="text-gray-600">No active wars found</p>
          ) : (
            wars.map(war => (
              <div key={war.id} className="border border-gray-300 rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{war.name}</h3>
                    <p className="text-sm text-gray-600">
                      Status: {war.status} | Players: {war.currentPlayers}/{war.maxPlayers} | Turn: {war.currentTurn}
                    </p>
                    <div className="mt-2">
                      <p className="text-sm font-medium">Participants:</p>
                      {war.participants.map(p => (
                        <span key={p.id} className="text-xs bg-gray-200 px-2 py-1 rounded mr-2">
                          {p.playerName} ({p.name}) - Resistance: {p.resistance}
                          {p.isSpectator && ' (Spectator)'}
                          {p.isEliminated && ' (Eliminated)'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadWar(war.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      View
                    </button>
                    {war.status === 'waiting' && (
                      <>
                        <button
                          onClick={() => joinWar(war.id)}
                          disabled={loading}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          Join
                        </button>
                        <button
                          onClick={() => joinWar(war.id, true)}
                          disabled={loading}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          Spectate
                        </button>
                      </>
                    )}
                    {war.status === 'active' && (
                      <button
                        onClick={() => joinWar(war.id, true)}
                        disabled={loading}
                        className="bg-gray-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                      >
                        Spectate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{currentWar.name}</h1>
          <p className="text-gray-600">
            Status: {currentWar.status} | Turn: {currentWar.currentTurn} | 
            Players: {currentWar.participants.filter(p => !p.isSpectator).length}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentWar(null)}
            className="bg-gray-600 text-white px-4 py-2 rounded"
          >
            Back to Wars
          </button>
          {currentWar.status === 'active' && (
            <button
              onClick={advanceTurn}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Advance Turn
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded">
          {message}
        </div>
      )}

      {/* Participants Grid */}
      <div className="grid gap-4 mb-6">
        <h2 className="text-xl font-bold">Participants</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentWar.participants.map(participant => (
            <div 
              key={participant.id} 
              className={`border rounded p-4 ${
                participant.playerId === playerId ? 'border-blue-500 bg-blue-50' : 
                participant.isEliminated ? 'border-red-300 bg-red-50' :
                participant.isSpectator ? 'border-gray-300 bg-gray-50' : 'border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{participant.name}</h3>
                  <p className="text-sm text-gray-600">{participant.playerName}</p>
                  {participant.playerId === playerId && (
                    <span className="text-xs bg-blue-200 px-2 py-1 rounded">You</span>
                  )}
                  {participant.isHost && (
                    <span className="text-xs bg-yellow-200 px-2 py-1 rounded ml-1">Host</span>
                  )}
                  {participant.isSpectator && (
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded ml-1">Spectator</span>
                  )}
                  {participant.isEliminated && (
                    <span className="text-xs bg-red-200 px-2 py-1 rounded ml-1">Eliminated</span>
                  )}
                </div>
              </div>
              
              {!participant.isSpectator && (
                <>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Resistance:</span>
                      <span className={participant.resistance <= 20 ? 'text-red-600 font-bold' : ''}>{participant.resistance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MAPs:</span>
                      <span>{participant.currentMaps}/{participant.maxMaps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cities:</span>
                      <span>{participant.cities}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Soldiers:</span>
                      <span>{participant.soldiers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tanks:</span>
                      <span>{participant.tanks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aircraft:</span>
                      <span>{participant.aircraft.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ships:</span>
                      <span>{participant.ships.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Space Control */}
                  {(participant.groundControl || participant.airSuperiority || participant.blockade || participant.fortified) && (
                    <div className="mt-2 text-xs">
                      <p className="font-medium">Space Control:</p>
                      {participant.groundControl && <span className="bg-green-200 px-1 rounded mr-1">Ground</span>}
                      {participant.airSuperiority && <span className="bg-blue-200 px-1 rounded mr-1">Air</span>}
                      {participant.blockade && <span className="bg-purple-200 px-1 rounded mr-1">Blockade</span>}
                      {participant.fortified && <span className="bg-orange-200 px-1 rounded mr-1">Fortified</span>}
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
        <div className="border border-gray-300 rounded p-4">
          <h3 className="text-lg font-bold mb-4">Battle Actions</h3>
          
          {/* Action Inputs */}
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Soldiers</label>
              <input
                type="number"
                min="0"
                max={playerParticipant.soldiers}
                value={actionInputs.soldiers}
                onChange={e => setActionInputs(prev => ({ ...prev, soldiers: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tanks</label>
              <input
                type="number"
                min="0"
                max={playerParticipant.tanks}
                value={actionInputs.tanks}
                onChange={e => setActionInputs(prev => ({ ...prev, tanks: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Aircraft</label>
              <input
                type="number"
                min="0"
                max={playerParticipant.aircraft}
                value={actionInputs.aircraft}
                onChange={e => setActionInputs(prev => ({ ...prev, aircraft: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ships</label>
              <input
                type="number"
                min="0"
                max={playerParticipant.ships}
                value={actionInputs.ships}
                onChange={e => setActionInputs(prev => ({ ...prev, ships: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
          </div>

          {/* Target Selection for Airstrikes/Naval */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Target (for airstrikes/naval)</label>
            <select
              value={selectedTarget}
              onChange={e => setSelectedTarget(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Select target...</option>
              <option value="aircraft">Aircraft</option>
              <option value="soldiers">Soldiers</option>
              <option value="tanks">Tanks</option>
              <option value="ships">Ships</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="ground_control">Ground Control</option>
              <option value="air_superiority">Air Superiority</option>
            </select>
          </div>

          {/* Targets */}
          <div className="space-y-2">
            <h4 className="font-medium">Available Targets:</h4>
            {currentWar.participants
              .filter(p => !p.isSpectator && !p.isEliminated && p.id !== playerParticipant.id)
              .map(target => (
                <div key={target.id} className="flex gap-2 items-center">
                  <span className="flex-1">{target.name} ({target.playerName})</span>
                  <button
                    onClick={() => executeAction('ground_attack', target.id)}
                    disabled={loading || playerParticipant.currentMaps < 3 || (actionInputs.soldiers + actionInputs.tanks) === 0}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    Ground Attack (3 MAPs)
                  </button>
                  <button
                    onClick={() => executeAction('airstrike', target.id)}
                    disabled={loading || playerParticipant.currentMaps < 4 || actionInputs.aircraft === 0 || !selectedTarget}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    Airstrike (4 MAPs)
                  </button>
                  <button
                    onClick={() => executeAction('naval_attack', target.id)}
                    disabled={loading || playerParticipant.currentMaps < 4 || actionInputs.ships === 0 || !selectedTarget}
                    className="bg-purple-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    Naval Attack (4 MAPs)
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
