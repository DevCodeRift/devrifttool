'use client'

import { useState } from 'react'
import { BattleSettings } from '@/types/war'

interface NationSetupProps {
  onWarStart?: (settings: BattleSettings) => void
  onMultiplayerRoom?: (settings: BattleSettings) => void
}

export default function NationSetup({ onWarStart, onMultiplayerRoom }: NationSetupProps) {
  const [error] = useState('')
  
  // Battle settings - default to multiplayer only
  const [battleSettings, setBattleSettings] = useState<BattleSettings>({
    turnDuration: 60, // 1 minute default
    maxTurns: 60,
    gameMode: 'multiplayer',
    isPrivate: false
  })

  const handleStartWar = () => {
    // Try both callbacks for compatibility
    if (onMultiplayerRoom) {
      onMultiplayerRoom(battleSettings)
    } else if (onWarStart) {
      onWarStart(battleSettings)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-950/50 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      <div className="bg-gray-800/50 border border-green-400/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-400 mb-2">
          Politics and War Integration
        </h3>
        <p className="text-gray-100 text-sm">
          This simulator fetches real nation data from the Politics and War API. 
          Enter nation IDs to load actual military statistics for realistic war simulation.
        </p>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-green-400 mb-4">Battle Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-100 mb-2">
              Turn Duration
            </label>
            <select
              value={battleSettings.turnDuration}
              onChange={(e) => setBattleSettings({
                ...battleSettings,
                turnDuration: parseInt(e.target.value)
              })}
              className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-900 text-white"
            >
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={120}>2 minutes</option>
              <option value={300}>5 minutes</option>
              <option value={600}>10 minutes</option>
              <option value={900}>15 minutes</option>
              <option value={1800}>30 minutes</option>
            </select>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-green-400/30">
          <h4 className="text-md font-semibold text-green-400 mb-3">Multiplayer Options</h4>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={battleSettings.isPrivate}
                onChange={(e) => setBattleSettings({
                  ...battleSettings,
                  isPrivate: e.target.checked,
                  roomCode: e.target.checked ? battleSettings.roomCode : undefined
                })}
                className="mr-2 text-green-400 focus:ring-green-400"
              />
              <span className="text-gray-100">Private Room</span>
            </label>

            {battleSettings.isPrivate && (
              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={battleSettings.roomCode || ''}
                  onChange={(e) => setBattleSettings({
                    ...battleSettings,
                    roomCode: e.target.value
                  })}
                  placeholder="Enter room code..."
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-900 text-white placeholder-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Share this code with other players to join your private battle
                </p>
              </div>
            )}

            <div className="bg-blue-950/30 border border-blue-400/30 p-3 rounded-md">
              <p className="text-sm text-blue-300 font-medium">Multiplayer Features:</p>
              <ul className="text-xs text-blue-200 mt-1 space-y-1">
                <li>• Real-time turn-based combat</li>
                <li>• Configurable turn timers</li>
                <li>• Live battle updates</li>
                <li>• Spectator mode available</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-gray-600">
              <button
                onClick={() => onMultiplayerRoom && onMultiplayerRoom({ ...battleSettings, roomCode: 'BROWSE_LOBBIES' })}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Browse Public Lobbies
              </button>
              <p className="text-xs text-gray-400 mt-1 text-center">
                Join an existing public room
              </p>
            </div>

            <div className="pt-3">
              <button
                onClick={handleStartWar}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Create Lobby
              </button>
              <p className="text-xs text-gray-400 mt-1 text-center">
                Create a new multiplayer room
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-green-400 mb-4">Military Building Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-200">Barracks</h4>
            <p className="text-sm text-gray-400 mt-1">Cost: $3,000</p>
            <p className="text-sm text-gray-400">Capacity: 3,000 soldiers</p>
            <p className="text-sm text-gray-400">Max per city: 5</p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-200">Factories</h4>
            <p className="text-sm text-gray-400 mt-1">Cost: $15,000 + 5 steel</p>
            <p className="text-sm text-gray-400">Capacity: 250 tanks</p>
            <p className="text-sm text-gray-400">Max per city: 5</p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-200">Hangars</h4>
            <p className="text-sm text-gray-400 mt-1">Cost: $100,000 + 10 aluminum</p>
            <p className="text-sm text-gray-400">Capacity: 15 aircraft</p>
            <p className="text-sm text-gray-400">Max per city: 5</p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-200">Drydocks</h4>
            <p className="text-sm text-gray-400 mt-1">Cost: $250,000 + 20 steel</p>
            <p className="text-sm text-gray-400">Capacity: 5 ships</p>
            <p className="text-sm text-gray-400">Max per city: 3</p>
          </div>
        </div>
      </div>
    </div>
  )
}