'use client'

import { useState, useRef, useEffect } from 'react'
import { BattleLog, ActionType } from '@/types/war'
import { multiplayerBattleManager, MultiplayerBattleRoom, BattleRoomPlayer } from '@/lib/multiplayer-battle-manager'
import NationStatus from './NationStatus'
import BattleActions from './BattleActions'
import BattleLogDisplay from './BattleLogDisplay'

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
  const battleLogRef = useRef<HTMLDivElement>(null)

  // Get current player and opponent
  const currentPlayer = players.find(p => p.player_id === playerId)
  const opponent = players.find(p => p.player_id !== playerId)
  const isMyTurn = room?.active_player_id === playerId
  const isAttacker = currentPlayer?.side === 'attacker'

  // Auto-scroll battle log to bottom when new entries are added
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight
    }
  }, [battleLog])

  // Subscribe to room updates
  useEffect(() => {
    if (!roomId) return

    const roomSubscription = multiplayerBattleManager.subscribeToRoom(roomId, (updatedRoom) => {
      setRoom(updatedRoom)
    })

    const playersSubscription = multiplayerBattleManager.subscribeToPlayers(roomId, (updatedPlayers) => {
      setPlayers(updatedPlayers)
    })

    const logsSubscription = multiplayerBattleManager.subscribeToBattleLogs(roomId, (logs) => {
      setBattleLog(logs)
    })

    return () => {
      roomSubscription.unsubscribe()
      playersSubscription.unsubscribe()
      logsSubscription.unsubscribe()
    }
  }, [roomId])

  const executeAction = async (
    actionType: ActionType,
    target?: string,
    units?: number,
    options?: { soldiers?: number; tanks?: number; [key: string]: unknown }
  ) => {
    if (!isMyTurn) {
      setError("It's not your turn!")
      return
    }

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
  const activeNation = isMyTurn ? (isAttacker ? 1 : 2) : (isAttacker ? 2 : 1)
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Turn</h3>
              <p className="text-2xl text-blue-400">{room.current_turn} / {room.max_turns}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Active Player</h3>
              <p className="text-2xl text-green-400">
                {isMyTurn ? 'Your Turn' : `${opponent.player_name}\\'s Turn`}
              </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Your Role</h3>
              <p className="text-2xl text-purple-400">
                {isAttacker ? 'Attacker' : 'Defender'}
              </p>
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
            
            {!warOver && isMyTurn && currentPlayer.nation_data && (
              <BattleActions
                attacker={currentPlayer.nation_data}
                defender={opponent.nation_data!}
                onExecuteAction={executeAction}
              />
            )}

            {!warOver && !isMyTurn && (
              <div className="bg-gray-800 p-6 rounded-lg text-center">
                <h3 className="text-xl font-semibold mb-2">Waiting for {opponent.player_name}</h3>
                <p className="text-gray-400">It&apos;s their turn to make a move</p>
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
