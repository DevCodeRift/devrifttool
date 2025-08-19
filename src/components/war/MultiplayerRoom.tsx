'use client'

import { useState, useEffect } from 'react'
import { BattleSettings, Nation, PWNation } from '@/types/war'
import { realTimeRoomManager, Room, RoomPlayer } from '@/lib/realtime-room-manager'

interface MultiplayerRoomProps {
  battleSettings: BattleSettings
  onStartBattle: (nation1: Nation, nation2: Nation, settings: BattleSettings) => void
  onBackToSetup: () => void
}

export default function MultiplayerRoom({
  battleSettings,
  onStartBattle,
  onBackToSetup
}: MultiplayerRoomProps) {
  const [roomData, setRoomData] = useState<Room | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<RoomPlayer | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [playerId] = useState(() => realTimeRoomManager.generatePlayerId())
  const [nationId, setNationId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [initializing, setInitializing] = useState(false)
  const [selectingSide, setSelectingSide] = useState(false)

  // Initialize room or join existing room
  useEffect(() => {
    initializeRoom()
  }, [])

  // Subscribe to room updates
  useEffect(() => {
    if (!roomData) return

    const unsubscribe = realTimeRoomManager.subscribeToRoom(roomData.id, (updatedRoom) => {
      console.log('Room update received:', {
        roomId: updatedRoom.id,
        playerCount: updatedRoom.players.length,
        players: updatedRoom.players.map(p => ({
          id: p.id,
          playerName: p.playerName,
          side: p.side,
          hasNation: !!p.nationData,
          isReady: p.isReady
        }))
      })
      
      setRoomData(updatedRoom)
      
      // Update current player data
      const updatedCurrentPlayer = updatedRoom.players.find(p => p.id === playerId)
      if (updatedCurrentPlayer) {
        console.log('Current player updated:', {
          id: updatedCurrentPlayer.id,
          playerName: updatedCurrentPlayer.playerName,
          side: updatedCurrentPlayer.side,
          hasNation: !!updatedCurrentPlayer.nationData,
          isReady: updatedCurrentPlayer.isReady
        })
        setCurrentPlayer(updatedCurrentPlayer)
      }
    })

    return unsubscribe
  }, [roomData?.id, playerId])

  const initializeRoom = async () => {
    // Prevent multiple simultaneous initialization attempts
    if (initializing) {
      console.log('Room initialization already in progress, skipping...')
      return
    }

    setInitializing(true)
    
    try {
      if (battleSettings.roomCode && battleSettings.roomCode !== 'BROWSE_LOBBIES') {
        // Try to join existing room
        await joinRoom(battleSettings.roomCode)
      } else {
        // Create new room
        await createRoom()
      }
    } catch {
      setError('Failed to initialize room')
    } finally {
      setInitializing(false)
    }
  }

  const createRoom = async () => {
    const roomId = realTimeRoomManager.generateRoomId()
    const playerName = `Player-${playerId.slice(-6)}`
    
    const room = await realTimeRoomManager.createRoom(roomId, playerName, battleSettings, playerId)
    
    if (room) {
      setRoomData(room)
      const hostPlayer = room.players.find(p => p.isHost)
      if (hostPlayer) {
        setCurrentPlayer(hostPlayer)
        setIsHost(true)
      }
    } else {
      setError('Failed to create room')
    }

    console.log('Created room:', roomId)
  }

  const joinRoom = async (roomCode: string) => {
    const existingRoom = await realTimeRoomManager.getRoom(roomCode)
    if (!existingRoom) {
      setError('Room not found')
      return
    }

    if (existingRoom.playerCount >= existingRoom.maxPlayers) {
      setError('Room is full')
      return
    }

    const playerName = `Player-${playerId.slice(-6)}`
    const success = await realTimeRoomManager.joinRoom(roomCode, playerId, playerName)
    
    if (success) {
      const updatedRoom = await realTimeRoomManager.getRoom(roomCode)
      if (updatedRoom) {
        setRoomData(updatedRoom)
        const joinedPlayer = updatedRoom.players.find(p => p.id === playerId)
        if (joinedPlayer) {
          setCurrentPlayer(joinedPlayer)
          setIsHost(false)
        }
      }
      console.log('Successfully joined room:', roomCode)
    } else {
      setError('Failed to join room')
      console.error('Failed to join room:', roomCode)
    }
  }

  const selectSide = async (side: 'attacker' | 'defender') => {
    if (!currentPlayer || !roomData || selectingSide) return

    // Check if side is already taken
    const sideOccupied = roomData.players.some(p => p.id !== currentPlayer.id && p.side === side)
    if (sideOccupied) {
      setError(`${side} side is already taken`)
      return
    }

    setSelectingSide(true)
    setError('')

    try {
      const success = await realTimeRoomManager.updatePlayer(roomData.id, playerId, {
        side,
        isReady: false
      })

      if (success) {
        // Immediately refresh room data for instant feedback
        const updatedRoom = await realTimeRoomManager.getRoom(roomData.id)
        if (updatedRoom) {
          setRoomData(updatedRoom)
          const updatedPlayer = updatedRoom.players.find(p => p.id === playerId)
          if (updatedPlayer) {
            setCurrentPlayer(updatedPlayer)
          }
        }
      } else {
        setError('Failed to select side')
      }
    } catch {
      setError('Failed to select side')
    } finally {
      setSelectingSide(false)
    }
  }

  const searchNation = async (nationId: string) => {
    if (!nationId.trim()) {
      setError('Please enter a nation ID')
      return
    }

    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      console.log('Searching for nation:', nationId)
      const response = await fetch(`/api/pw/nation?nationId=${nationId}`)
      
      console.log('Nation API response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.log('Nation API error:', errorData)
        
        if (response.status === 503) {
          throw new Error('Politics and War API not configured. Please check server configuration.')
        } else if (response.status === 404) {
          throw new Error(`Nation with ID ${nationId} not found. Please check the nation ID.`)
        } else if (response.status === 400) {
          throw new Error('Invalid nation ID format. Please enter a valid number.')
        } else {
          throw new Error(errorData.error || `Server error (${response.status})`)
        }
      }

      const data: PWNation = await response.json()
      console.log('Nation data received:', data)
      
      if (!data.nation_name) {
        throw new Error('Invalid nation data received from server')
      }
      
      // Create nation object (simplified version of the full createNation logic)
      const nation: Nation = {
        id: data.id.toString(),
        name: data.nation_name,
        leader: data.leader_name,
        cities: data.num_cities,
        score: data.score,
        resistance: 100,
        maps: 12,
        maxMaps: 12,
        military: {
          soldiers: data.soldiers,
          tanks: data.tanks,
          aircraft: data.aircraft,
          ships: data.ships,
          missiles: data.missiles,
          nukes: data.nukes,
          spies: data.spies
        },
        militaryCapacity: {
          maxSoldiers: data.num_cities * 15000,
          maxTanks: data.num_cities * 1250,
          maxAircraft: data.num_cities * 75,
          maxShips: data.num_cities * 15,
          maxMissiles: data.num_cities,
          maxNukes: data.num_cities,
          maxSpies: data.num_cities * 60
        },
        spaceControl: {
          groundControl: false,
          airSuperiority: false,
          blockade: false,
          fortified: false
        },
        resources: {
          money: 1000000,
          food: 10000,
          coal: 5000,
          oil: 5000,
          uranium: 1000,
          lead: 3000,
          iron: 3000,
          bauxite: 3000,
          gasoline: 5000,
          munitions: 5000,
          steel: 3000,
          aluminum: 3000
        },
        infrastructure: data.num_cities * 2000,
        warPolicy: 'Attrition',
        warType: 'ordinary',
        isDefender: currentPlayer?.side === 'defender',
        projects: []
      }

      if (currentPlayer && roomData) {
        console.log('Updating player with nation data:', {
          roomId: roomData.id,
          playerId,
          nationName: nation.name,
          nationData: nation
        })
        
        const success = await realTimeRoomManager.updatePlayer(roomData.id, playerId, {
          nationData: nation,
          isReady: false
        })

        if (success) {
          console.log('Successfully updated player nation data')
          // Clear the nation ID input after successful search
          setNationId('')
          // Clear any previous errors and show success message
          setError('')
          setSuccessMessage(`Successfully loaded nation: ${nation.name}`)
          
          // Immediately refresh room data for instant feedback
          const updatedRoom = await realTimeRoomManager.getRoom(roomData.id)
          if (updatedRoom) {
            setRoomData(updatedRoom)
            const updatedPlayer = updatedRoom.players.find(p => p.id === playerId)
            if (updatedPlayer) {
              setCurrentPlayer(updatedPlayer)
            }
          }
          
          // Clear success message after 3 seconds
          setTimeout(() => setSuccessMessage(''), 3000)
        } else {
          setError('Failed to update nation data')
        }
      } else {
        console.warn('Cannot update nation data: missing currentPlayer or roomData', {
          hasCurrentPlayer: !!currentPlayer,
          hasRoomData: !!roomData
        })
        setError('Unable to update nation data: not properly connected to room')
      }

    } catch (err) {
      console.error('Nation search error:', err)
      setError(`Failed to load nation data: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleReady = async () => {
    if (!currentPlayer || !roomData) return

    const success = await realTimeRoomManager.updatePlayer(roomData.id, playerId, {
      isReady: !currentPlayer.isReady
    })

    if (!success) {
      setError('Failed to update ready status')
    }
  }

  const startBattle = async () => {
    if (!isHost || !roomData) return

    const attacker = roomData.players.find(p => p.side === 'attacker')
    const defender = roomData.players.find(p => p.side === 'defender')

    if (!attacker?.nationData || !defender?.nationData) {
      setError('Both players must select nations')
      return
    }

    if (!attacker.isReady || !defender.isReady) {
      setError('Both players must be ready')
      return
    }

    const success = await realTimeRoomManager.startBattle(roomData.id, playerId)
    if (success) {
      onStartBattle(attacker.nationData, defender.nationData, roomData.settings)
    } else {
      setError('Failed to start battle')
    }
  }

  const canStartBattle = () => {
    if (!isHost || !roomData) return false
    
    const attacker = roomData.players.find(p => p.side === 'attacker')
    const defender = roomData.players.find(p => p.side === 'defender')
    
    return attacker?.nationData && defender?.nationData && 
           attacker.isReady && defender.isReady
  }

  const leaveRoom = async () => {
    if (roomData) {
      await realTimeRoomManager.leaveRoom(roomData.id, playerId)
    }
    onBackToSetup()
  }

  if (!roomData || !currentPlayer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
          <p className="text-gray-300 mt-4">Initializing room...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Room Header */}
      <div className="bg-gray-800/50 border border-green-400/30 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-green-400">
              {isHost ? 'Hosting Room' : 'Joined Room'}: {roomData.id}
            </h3>
            <p className="text-gray-300 text-sm">
              Turn Duration: {roomData.settings.turnDuration}s | 
              Players: {roomData.players.length}/{roomData.maxPlayers}
            </p>
          </div>
          <button
            onClick={leaveRoom}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-950/50 border border-green-500/30 rounded-lg p-4">
          <p className="text-green-400">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Side Selection & Nation Setup */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-green-400 mb-4">Your Setup</h3>
          
          {/* Side Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Choose Your Side
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => selectSide('attacker')}
                disabled={selectingSide || roomData.players.some(p => p.id !== currentPlayer.id && p.side === 'attacker')}
                className={`p-3 rounded-lg border transition-colors ${
                  currentPlayer.side === 'attacker'
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'bg-gray-900 border-gray-600 text-gray-300 hover:border-red-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {selectingSide ? 'Selecting...' : 'Attacker'}
              </button>
              <button
                onClick={() => selectSide('defender')}
                disabled={selectingSide || roomData.players.some(p => p.id !== currentPlayer.id && p.side === 'defender')}
                className={`p-3 rounded-lg border transition-colors ${
                  currentPlayer.side === 'defender'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-900 border-gray-600 text-gray-300 hover:border-blue-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {selectingSide ? 'Selecting...' : 'Defender'}
              </button>
            </div>
          </div>

          {/* Nation Search */}
          {currentPlayer.side && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nation ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nationId}
                    onChange={(e) => setNationId(e.target.value)}
                    placeholder="Enter nation ID (try '1' for test)..."
                    className="flex-1 px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-900 text-white placeholder-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && searchNation(nationId)}
                  />
                  <button
                    onClick={() => searchNation(nationId)}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? '🔍' : 'Search'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Enter a Politics and War nation ID. Try &quot;1&quot; to test with nation Avalon.
                </p>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{error}</p>
                  <button
                    onClick={() => setError('')}
                    className="mt-2 text-xs text-red-400 hover:text-red-300"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-900/50 border border-green-500 rounded-lg p-3">
                  <p className="text-green-300 text-sm">{successMessage}</p>
                  <button
                    onClick={() => setSuccessMessage('')}
                    className="mt-2 text-xs text-green-400 hover:text-green-300"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {currentPlayer.nationData && (
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white">{currentPlayer.nationData.name}</h4>
                  <p className="text-gray-400">Leader: {currentPlayer.nationData.leader}</p>
                  <p className="text-gray-400">Cities: {currentPlayer.nationData.cities}</p>
                  <p className="text-gray-400">Score: {currentPlayer.nationData.score.toLocaleString()}</p>
                </div>
              )}

              {/* Ready button shows when player has selected a side */}
              {currentPlayer.side && (
                <div>
                  {/* Debug info */}
                  <div className="mb-2 text-xs text-gray-500">
                    Debug: Side={currentPlayer.side}, HasNation={!!currentPlayer.nationData}, Ready={currentPlayer.isReady}
                  </div>
                  <button
                    onClick={toggleReady}
                    disabled={!currentPlayer.nationData}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      currentPlayer.isReady
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : currentPlayer.nationData
                          ? 'bg-gray-600 text-white hover:bg-gray-700'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {!currentPlayer.nationData 
                      ? 'Select a Nation First'
                      : currentPlayer.isReady 
                        ? 'Ready!' 
                        : 'Mark as Ready'
                    }
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Players Status */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-green-400">Players</h3>
            <div className="flex gap-2">
              {/* Debug info */}
              <span className="text-xs text-gray-500">
                ({roomData.players.length} players)
              </span>
              <button
                onClick={async () => {
                  if (roomData) {
                    const updated = await realTimeRoomManager.getRoom(roomData.id)
                    if (updated) setRoomData(updated)
                  }
                }}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Attacker Slot */}
            <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-4">
              <h4 className="text-red-400 font-semibold mb-2">Attacker</h4>
              {(() => {
                const attacker = roomData.players.find(p => p.side === 'attacker')
                if (attacker) {
                  return (
                    <div>
                      <p className="text-white">{attacker.playerName} {attacker.isHost && '(Host)'}</p>
                      {attacker.nationData && (
                        <p className="text-gray-300 text-sm">{attacker.nationData.name}</p>
                      )}
                      <div className="flex items-center mt-2">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          attacker.isReady ? 'bg-green-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-sm text-gray-400">
                          {attacker.isReady ? 'Ready' : 'Not Ready'}
                        </span>
                      </div>
                    </div>
                  )
                }
                return <p className="text-gray-500">Waiting for player...</p>
              })()}
            </div>

            {/* Defender Slot */}
            <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-blue-400 font-semibold mb-2">Defender</h4>
              {(() => {
                const defender = roomData.players.find(p => p.side === 'defender')
                if (defender) {
                  return (
                    <div>
                      <p className="text-white">{defender.playerName} {defender.isHost && '(Host)'}</p>
                      {defender.nationData && (
                        <p className="text-gray-300 text-sm">{defender.nationData.name}</p>
                      )}
                      <div className="flex items-center mt-2">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          defender.isReady ? 'bg-green-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-sm text-gray-400">
                          {defender.isReady ? 'Ready' : 'Not Ready'}
                        </span>
                      </div>
                    </div>
                  )
                }
                return <p className="text-gray-500">Waiting for player...</p>
              })()}
            </div>
          </div>

          {/* Start Battle Button (Host Only) */}
          {isHost && (
            <button
              onClick={startBattle}
              disabled={!canStartBattle()}
              className="w-full mt-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {canStartBattle() ? 'Start Battle!' : 'Waiting for both players to be ready...'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
