'use client'

import { useState, useEffect } from 'react'
import { realTimeRoomManager, Room } from '@/lib/realtime-room-manager'

interface LobbyBrowserProps {
  onJoinRoom: (roomId: string) => void
  onBackToSetup: () => void
}

export default function LobbyBrowser({ onJoinRoom, onBackToSetup }: LobbyBrowserProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch real rooms from backend
  useEffect(() => {
    fetchRooms()
  }, [])

  // Subscribe to room list updates
  useEffect(() => {
    const unsubscribe = realTimeRoomManager.subscribeToRoomList((updatedRooms) => {
      setRooms(updatedRooms)
    })

    return unsubscribe
  }, [])

  const fetchRooms = async () => {
    setRefreshing(true)
    
    try {
      const publicRooms = await realTimeRoomManager.getRooms()
      setRooms(publicRooms)
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    return `${Math.floor(seconds / 3600)}h`
  }

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
          <p className="text-gray-300 mt-4">Loading lobbies...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/50 border border-green-400/30 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-green-400">
              Public Lobbies
            </h3>
            <p className="text-gray-300 text-sm">
              Join an existing room or go back to create your own
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchRooms}
              disabled={refreshing}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={onBackToSetup}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Setup
            </button>
          </div>
        </div>
      </div>

      {/* Rooms List */}
      <div className="space-y-4">
        {rooms.filter(room => room.status === 'waiting').length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h4 className="text-lg font-semibold text-gray-300 mb-2">No Open Lobbies</h4>
              <p className="text-gray-500">Be the first to create a public room!</p>
            </div>
            <button
              onClick={onBackToSetup}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Room
            </button>
          </div>
        ) : (
          <>
            {rooms
              .filter(room => room.status === 'waiting')
              .map(room => (
                <div
                  key={room.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-green-400/50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h4 className="text-lg font-semibold text-white">{room.id}</h4>
                        <div className="flex items-center text-sm text-gray-400">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          <span>Waiting for players</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Host:</span>
                          <p className="text-gray-300">{room.hostName}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Players:</span>
                          <p className="text-gray-300">{room.playerCount}/{room.maxPlayers}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Turn Duration:</span>
                          <p className="text-gray-300">{formatDuration(room.settings.turnDuration)}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Created:</span>
                          <p className="text-gray-300">{formatTimeAgo(room.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <button
                        onClick={() => onJoinRoom(room.id)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Join Room
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </>
        )}
      </div>

      {/* In Progress Rooms (for reference) */}
      {rooms.filter(room => room.status === 'in_progress').length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-400">Battles in Progress</h4>
          {rooms
            .filter(room => room.status === 'in_progress')
            .map(room => (
              <div
                key={room.id}
                className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 opacity-75"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h4 className="text-lg font-semibold text-gray-300">{room.id}</h4>
                      <div className="flex items-center text-sm text-gray-500">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                        <span>Battle in progress</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Host:</span>
                        <p className="text-gray-400">{room.hostName}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Players:</span>
                        <p className="text-gray-400">{room.playerCount}/{room.maxPlayers}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Turn Duration:</span>
                        <p className="text-gray-400">{formatDuration(room.settings.turnDuration)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Started:</span>
                        <p className="text-gray-400">{formatTimeAgo(room.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <button
                      disabled
                      className="px-6 py-2 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
                    >
                      In Progress
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
