'use client'

import { useState, useRef, useEffect } from 'react'
import { BattleLog, ActionType, Nation } from '@/types/war'
import { multiplayerBattleManager, MultiplayerBattleRoom, BattleRoomPlayer } from '@/lib/multiplayer-battle-manager'
import NationStatus from './NationStatus'
import BattleActions from './BattleActions'
import BattleLogDisplay from './BattleLogDisplay'

// Player interface for API response
interface ApiPlayer {
  id: string
  playerName: string
  side: 'attacker' | 'defender' | null
  nationData: Nation | null
  isHost: boolean
  isReady: boolean
  isSpectator: boolean
}

interface MultiplayerBattleInterfaceProps {
  roomId: string
  playerId: string
  onBackToRoom: () => void
}

export default function MultiplayerBattleInterface({
  roomId,
  playerId,
  onBackToRoom
}: MultiplayerBattleInterfaceProps) {
  const [room, setRoom] = useState<MultiplayerBattleRoom | null>(null)
  const [players, setPlayers] = useState<BattleRoomPlayer[]>([])
  const [battleLog, setBattleLog] = useState<BattleLog[]>([])
  const [error, setError] = useState('')
  const [nextMapTime, setNextMapTime] = useState(30) // Countdown to next MAP generation
  const [totalTurns, setTotalTurns] = useState(0) // Track how many MAP cycles have occurred
  const battleLogRef = useRef<HTMLDivElement>(null)

  // Get current player and opponent
  const currentPlayer = players.find(p => p.player_id === playerId)
  const opponent = players.find(p => p.player_id !== playerId)
  const isAttacker = currentPlayer?.side === 'attacker'

  // Auto-scroll battle log to bottom when new entries are added
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight
    }
  }, [battleLog])

  // MAP generation countdown timer - both players get MAP simultaneously
  useEffect(() => {
    if (!room || room.status === 'completed') return

    const timer = setInterval(() => {
      setNextMapTime(prev => {
        if (prev <= 1) {
          // Time for next MAP generation! Call the server to advance the turn
          advanceTurn()
          
          return room.settings?.turnDuration || 30 // Reset based on room settings
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, room?.settings?.turnDuration])

  // Function to advance the turn server-side
  const advanceTurn = async () => {
    if (!room) return
    
    try {
      const response = await fetch('/api/battle/advance-turn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: room.id
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Turn advanced:', result)
        // The room update will come through the subscription
      } else {
        console.error('Failed to advance turn:', response.status)
      }
    } catch (error) {
      console.error('Error advancing turn:', error)
    }
  }

  // Reset timer when room changes or starts
  useEffect(() => {
    if (room?.status === 'in_progress') {
      setNextMapTime(room.settings?.turnDuration || 30)
      setTotalTurns(room.current_turn || 0)
    }
  }, [room?.status, room?.current_turn, room?.settings?.turnDuration])

  // Subscribe to room updates
  useEffect(() => {
    if (!roomId) return

    console.log('Looking up database room for roomId:', roomId)

    let cleanup: (() => void) | undefined

    // Check if roomId is already a UUID (database room ID) or a room code
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId)
    
    if (isUUID) {
      // roomId is already a database UUID, use it directly
      console.log('RoomId is already a database UUID, fetching initial data and subscribing:', roomId)
      
      // First, fetch the initial room and player data using the existing endpoint
      const fetchInitialData = async () => {
        try {
          const response = await fetch(`/api/war/rooms?roomId=${roomId}`)
          if (response.ok) {
            const data = await response.json()
            console.log('Initial data fetched:', data)
            
            // Set room data
            setRoom({
              id: data.id,
              room_code: data.room_code || roomId,
              status: data.status,
              settings: data.settings,
              current_turn: 0, // Start at turn 0
              max_turns: data.settings?.maxTurns || 60,
              active_player_id: null,
              created_at: data.created_at,
              updated_at: data.updated_at || data.created_at,
              started_at: null,
              ended_at: null
            })
            
            // Set players data - transform from API format to expected format
            if (data.players) {
              const transformedPlayers = data.players.map((p: ApiPlayer) => ({
                id: p.id,
                room_id: roomId,
                player_id: p.id,
                player_name: p.playerName,
                side: p.side,
                nation_data: p.nationData,
                is_ready: p.isReady,
                is_host: p.isHost,
                joined_at: new Date().toISOString()
              }))
              console.log('Transformed players:', transformedPlayers)
              setPlayers(transformedPlayers)
            }
            
            // Initialize empty battle log for new battles
            setBattleLog([])
          } else {
            console.error('Failed to fetch room data:', response.status)
            setError('Failed to load battle room')
          }
        } catch (error) {
          console.error('Error fetching initial data:', error)
          setError('Failed to load battle data')
        }
      }

      fetchInitialData()
      
      // Then set up subscriptions for real-time updates
      const roomSubscription = multiplayerBattleManager.subscribeToRoom(roomId, (updatedRoom) => {
        console.log('Room updated via subscription:', updatedRoom)
        setRoom(updatedRoom)
      })

      const playersSubscription = multiplayerBattleManager.subscribeToPlayers(roomId, (updatedPlayers) => {
        console.log('Players updated via subscription:', updatedPlayers)
        console.log('📊 Player MAPs after update:', updatedPlayers.map(p => ({
          name: p.nation_data?.name,
          maps: p.nation_data?.maps,
          maxMaps: p.nation_data?.maxMaps,
          resistance: p.nation_data?.resistance
        })))
        setPlayers(updatedPlayers)
      })

      const logsSubscription = multiplayerBattleManager.subscribeToBattleLogs(roomId, (logs) => {
        console.log('Battle logs updated via subscription:', logs)
        setBattleLog(logs)
      })

      // Store cleanup function
      cleanup = () => {
        roomSubscription.unsubscribe()
        playersSubscription.unsubscribe()
        logsSubscription.unsubscribe()
      }
    } else {
      // roomId is a room code, look up the database room
      const lookupDatabaseRoom = async () => {
        try {
          const response = await fetch(`/api/war/rooms?roomId=${roomId}`)
          if (response.ok) {
            const data = await response.json()
            if (data && data.id) {
              const databaseRoomId = data.id
              console.log('Found database room ID:', databaseRoomId, 'for room code:', roomId)
              
              // Now subscribe to the actual database room
              const roomSubscription = multiplayerBattleManager.subscribeToRoom(databaseRoomId, (updatedRoom) => {
                console.log('Room updated:', updatedRoom)
                setRoom(updatedRoom)
              })

              const playersSubscription = multiplayerBattleManager.subscribeToPlayers(databaseRoomId, (updatedPlayers) => {
                console.log('Players updated:', updatedPlayers)
                setPlayers(updatedPlayers)
              })

              const logsSubscription = multiplayerBattleManager.subscribeToBattleLogs(databaseRoomId, (logs) => {
                console.log('Battle logs updated:', logs)
                setBattleLog(logs)
              })

              // Store cleanup function
              cleanup = () => {
                roomSubscription.unsubscribe()
                playersSubscription.unsubscribe()
                logsSubscription.unsubscribe()
              }
            } else {
              console.error('Room not found in database for roomId:', roomId)
              setError('Battle room not found')
            }
          } else {
            console.error('Failed to lookup room:', response.status)
            setError('Failed to load battle room')
          }
        } catch (error) {
          console.error('Error looking up database room:', error)
          setError('Failed to connect to battle room')
        }
      }

      lookupDatabaseRoom()
    }
    
    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [roomId])

  const executeAction = async (
    actionType: ActionType,
    target?: string,
    units?: number,
    options?: { soldiers?: number; tanks?: number; [key: string]: unknown }
  ) => {
    if (!currentPlayer?.nation_data) {
      setError('Nation data not available')
      return
    }

    setError('')

    try {
      const response = await fetch('/api/battle/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          playerId,
          actionType,
          actionData: {
            target,
            units,
            options
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to execute action')
        return
      }

      // Action was successful, UI will update via real-time subscriptions
      console.log('Action executed successfully:', data)

    } catch (error) {
      console.error('Error executing action:', error)
      setError('Failed to execute action')
    }
  }

  if (!room || !currentPlayer || !opponent) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Loading Battle...</h2>
            <p className="text-gray-400">Connecting to multiplayer battle room</p>
          </div>
        </div>
      </div>
    )
  }

  const nation1 = isAttacker ? currentPlayer.nation_data! : opponent.nation_data!
  const nation2 = isAttacker ? opponent.nation_data! : currentPlayer.nation_data!
  const activeNation = isAttacker ? 1 : 2 // Both players can act simultaneously now
  const warOver = room.status === 'completed'

  // Determine winner from battle log - check if game ended
  const winner = warOver && room.status === 'completed' ?
    (nation1.resistance <= 0 ? nation2.name : 
     nation2.resistance <= 0 ? nation1.name : null) : null

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">
              Multiplayer War: {nation1.name} vs {nation2.name}
            </h1>
            <button
              onClick={onBackToRoom}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Back to Room
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Turn</h3>
              <p className="text-2xl text-blue-400">{room.current_turn} / {room.max_turns}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Game Status</h3>
              <p className="text-2xl text-green-400">
                Turn {totalTurns} - Both players active
              </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Your Role</h3>
              <p className="text-2xl text-purple-400">
                {isAttacker ? 'Attacker' : 'Defender'}
              </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Next MAP Generation</h3>
              <p className={`text-2xl font-bold ${
                nextMapTime <= 5 
                  ? 'text-red-400 animate-pulse' 
                  : nextMapTime <= 10 
                  ? 'text-yellow-400' 
                  : 'text-green-400'
              }`}>
                {nextMapTime}s
              </p>
              {nextMapTime <= 10 && (
                <div className="mt-2 text-xs text-yellow-300">
                  MAP generation soon!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-800 border border-red-600 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* War Status */}
        {warOver && (
          <div className="mb-6 p-6 bg-red-800 border-2 border-red-600 rounded-lg text-center">
            <h3 className="text-2xl font-bold mb-2">
              {winner ? `🎉 ${winner} Wins!` : '⏱️ War Expired - No Winner'}
            </h3>
            <p className="text-red-200">
              {winner ? `${winner} has won the war!` : 'The war has ended without a winner.'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Nation Status */}
          <div className="xl:col-span-2 space-y-6">
            <NationStatus 
              nation1={nation1} 
              nation2={nation2} 
              activeNation={activeNation}
            />
            
            {!warOver && currentPlayer.nation_data && (
              <BattleActions
                attacker={currentPlayer.nation_data}
                defender={opponent.nation_data!}
                onExecuteAction={executeAction}
              />
            )}

            {!warOver && !currentPlayer.nation_data && (
              <div className="bg-gray-800 p-6 rounded-lg text-center">
                <h3 className="text-xl font-semibold mb-2">Setting up your nation...</h3>
                <p className="text-gray-400">Please complete nation setup to begin fighting</p>
              </div>
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
    </div>
  )
}
