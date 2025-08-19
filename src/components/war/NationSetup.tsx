'use client'

import { useState } from 'react'
import { Nation, PWNation, Military, MilitaryCapacity, Resources, SpaceControl, BattleSettings } from '@/types/war'

interface NationSetupProps {
  onWarStart: (nation1: Nation, nation2: Nation, settings: BattleSettings) => void
  onMultiplayerRoom?: (settings: BattleSettings) => void
}

export default function NationSetup({ onWarStart, onMultiplayerRoom }: NationSetupProps) {
  const [nation1Id, setNation1Id] = useState('')
  const [nation2Id, setNation2Id] = useState('')
  const [nation1Data, setNation1Data] = useState<PWNation | null>(null)
  const [nation2Data, setNation2Data] = useState<PWNation | null>(null)
  const [nation1Military, setNation1Military] = useState<'current' | 'max'>('max')
  const [nation2Military, setNation2Military] = useState<'current' | 'max'>('max')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Battle settings
  const [battleSettings, setBattleSettings] = useState<BattleSettings>({
    turnDuration: 60, // 1 minute default
    maxTurns: 60,
    gameMode: 'singleplayer',
    isPrivate: false
  })

  const turnDurationOptions = [
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 120, label: '2 minutes' },
    { value: 300, label: '5 minutes' },
    { value: 600, label: '10 minutes' },
    { value: 900, label: '15 minutes' },
    { value: 1800, label: '30 minutes' }
  ]

  const searchNation = async (nationId: string, nationNumber: 1 | 2) => {
    if (!nationId.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/pw/nation?nationId=${encodeURIComponent(nationId.trim())}`)
      
      if (!response.ok) {
        throw new Error('Nation not found')
      }

      const data: PWNation = await response.json()
      
      if (nationNumber === 1) {
        setNation1Data(data)
      } else {
        setNation2Data(data)
      }
    } catch {
      setError(`Failed to find nation with ID: ${nationId}`)
    } finally {
      setLoading(false)
    }
  }

  const calculateMilitaryCapacity = (cities: number): MilitaryCapacity => {
    // Each city can have max 5 barracks, 5 factories, 5 hangars, 3 drydocks
    // Barracks: 3000 soldiers each, Factories: 250 tanks each
    // Hangars: 15 aircraft each, Drydocks: 5 ships each
    return {
      maxSoldiers: cities * 5 * 3000, // 15,000 per city
      maxTanks: cities * 5 * 250,     // 1,250 per city
      maxAircraft: cities * 5 * 15,   // 75 per city
      maxShips: cities * 3 * 5,       // 15 per city
      maxMissiles: cities * 1,        // 1 per city (if they have missile launch pad)
      maxNukes: cities * 1,           // 1 per city (if they have nuclear facility)
      maxSpies: 60                    // Fixed at 60 regardless of cities
    }
  }

  const createNation = (data: PWNation, militaryType: 'current' | 'max', isDefender: boolean): Nation => {
    const capacity = calculateMilitaryCapacity(data.num_cities)
    
    const military: Military = militaryType === 'max' 
      ? {
          soldiers: capacity.maxSoldiers,
          tanks: capacity.maxTanks,
          aircraft: capacity.maxAircraft,
          ships: capacity.maxShips,
          missiles: capacity.maxMissiles,
          nukes: capacity.maxNukes,
          spies: capacity.maxSpies
        }
      : {
          soldiers: data.soldiers,
          tanks: data.tanks,
          aircraft: data.aircraft,
          ships: data.ships,
          missiles: data.missiles,
          nukes: data.nukes,
          spies: data.spies
        }

    const spaceControl: SpaceControl = {
      groundControl: false,
      airSuperiority: false,
      blockade: false,
      fortified: false
    }

    const resources: Resources = {
      money: 10000000, // 10M starting money
      food: 5000,
      coal: 3000,
      oil: 3000,
      uranium: 1000,
      lead: 2000,
      iron: 3000,
      bauxite: 3000,
      gasoline: 5000,
      munitions: 5000,
      steel: 2000,
      aluminum: 2000
    }

    return {
      id: data.id.toString(),
      name: data.nation_name,
      leader: data.leader_name,
      cities: data.num_cities,
      score: data.score,
      resistance: 100,
      maps: 6, // Default starting MAPs
      maxMaps: 12,
      military,
      militaryCapacity: capacity,
      spaceControl,
      resources,
      infrastructure: data.num_cities * 2000, // Assume 2000 avg infra per city
      warPolicy: 'arcane', // Default policy
      warType: 'raid', // Default war type
      isDefender,
      projects: [] // We'll add project detection later
    }
  }

  const handleStartWar = () => {
    // For multiplayer mode, go to multiplayer room
    if (battleSettings.gameMode === 'multiplayer') {
      if (onMultiplayerRoom) {
        onMultiplayerRoom(battleSettings)
      }
      return
    }

    // For singleplayer mode, need both nations
    if (!nation1Data || !nation2Data) {
      setError('Please search for both nations first')
      return
    }

    const nation1 = createNation(nation1Data, nation1Military, false)
    const nation2 = createNation(nation2Data, nation2Military, true)

    onWarStart(nation1, nation2, battleSettings)
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
        <p className="text-gray-300 text-sm">
          This simulator fetches real nation data from the Politics and War API. 
          Enter nation IDs to load actual military statistics for realistic war simulation.
        </p>
      </div>

      {/* Battle Settings */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-green-400 mb-4">Battle Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Game Mode */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Game Mode
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="singleplayer"
                  checked={battleSettings.gameMode === 'singleplayer'}
                  onChange={(e) => setBattleSettings({
                    ...battleSettings,
                    gameMode: e.target.value as 'singleplayer' | 'multiplayer'
                  })}
                  className="mr-2 text-green-400 focus:ring-green-400"
                />
                <span className="text-gray-300">Singleplayer</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="multiplayer"
                  checked={battleSettings.gameMode === 'multiplayer'}
                  onChange={(e) => setBattleSettings({
                    ...battleSettings,
                    gameMode: e.target.value as 'singleplayer' | 'multiplayer'
                  })}
                  className="mr-2 text-green-400 focus:ring-green-400"
                />
                <span className="text-gray-300">Multiplayer (Real-time)</span>
              </label>
            </div>
          </div>

          {/* Turn Duration */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300 mb-2">
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

        {/* Multiplayer Settings */}
        {battleSettings.gameMode === 'multiplayer' && (
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-green-400/30">
            <h4 className="text-md font-semibold text-green-400 mb-3">Multiplayer Options</h4>
            
            <div className="space-y-4">
              {/* Private Room Toggle */}
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
                <span className="text-gray-300">Private Room</span>
              </label>

              {/* Room Code Input */}
              {battleSettings.isPrivate && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
                  <p className="text-xs text-gray-500 mt-1">
                    Share this code with other players to join your private battle
                  </p>
                </div>
              )}

              {/* Multiplayer Info */}
              <div className="bg-blue-950/30 border border-blue-400/30 p-3 rounded-md">
                <p className="text-sm text-blue-400 font-medium">Multiplayer Features:</p>
                <ul className="text-xs text-blue-300 mt-1 space-y-1">
                  <li>• Real-time turn-based combat</li>
                  <li>• Configurable turn timers</li>
                  <li>• Live battle updates</li>
                  <li>• Spectator mode available</li>
                </ul>
              </div>

              {/* Browse Lobbies Button */}
              <div className="pt-4 border-t border-gray-600">
                <button
                  onClick={() => onMultiplayerRoom && onMultiplayerRoom({ ...battleSettings, roomCode: 'BROWSE_LOBBIES' })}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Browse Public Lobbies
                </button>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Join an existing public room
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nation Setup - Only for Singleplayer */}
      {battleSettings.gameMode === 'singleplayer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Nation 1 Setup */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-green-400 mb-6">Nation 1 (Attacker)</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nation ID
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Find nation IDs at politicsandwar.com - look in the URL when viewing a nation (e.g., /nation/id=12345)
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nation1Id}
                  onChange={(e) => setNation1Id(e.target.value)}
                  placeholder="Enter nation ID..."
                  className="flex-1 px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-900 text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && searchNation(nation1Id, 1)}
                />
                <button
                  onClick={() => searchNation(nation1Id, 1)}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {nation1Data && (
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-white">{nation1Data.nation_name}</h3>
                <p className="text-gray-400">Leader: {nation1Data.leader_name}</p>
                <p className="text-gray-400">Cities: {nation1Data.num_cities}</p>
                <p className="text-gray-400">Score: {nation1Data.score.toLocaleString()}</p>
                
                <div className="mt-4">
                  <p className="font-medium text-gray-300 mb-2">Current Military:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                    <div>Soldiers: {nation1Data.soldiers.toLocaleString()}</div>
                    <div>Tanks: {nation1Data.tanks.toLocaleString()}</div>
                    <div>Aircraft: {nation1Data.aircraft.toLocaleString()}</div>
                    <div>Ships: {nation1Data.ships.toLocaleString()}</div>
                    <div>Missiles: {nation1Data.missiles.toLocaleString()}</div>
                    <div>Nukes: {nation1Data.nukes.toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Military Configuration
                  </label>
                  <select
                    value={nation1Military}
                    onChange={(e) => setNation1Military(e.target.value as 'current' | 'max')}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-900 text-white"
                  >
                    <option value="current">Use Current Military</option>
                    <option value="max">Use Maximum Military (Full Barracks/Factories/etc.)</option>
                  </select>
                </div>

                {nation1Military === 'max' && (
                  <div className="mt-2 bg-green-950/30 border border-green-400/30 p-3 rounded-md">
                    <p className="text-sm text-green-400 font-medium">Maximum Military Capacity:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-green-300 mt-1">
                      <div>Soldiers: {(nation1Data.num_cities * 15000).toLocaleString()}</div>
                      <div>Tanks: {(nation1Data.num_cities * 1250).toLocaleString()}</div>
                      <div>Aircraft: {(nation1Data.num_cities * 75).toLocaleString()}</div>
                      <div>Ships: {(nation1Data.num_cities * 15).toLocaleString()}</div>
                      <div>Missiles: {nation1Data.num_cities.toLocaleString()}</div>
                      <div>Nukes: {nation1Data.num_cities.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Nation 2 Setup */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-green-400 mb-6">Nation 2 (Defender)</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nation ID
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Find nation IDs at politicsandwar.com - look in the URL when viewing a nation (e.g., /nation/id=12345)
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nation2Id}
                  onChange={(e) => setNation2Id(e.target.value)}
                  placeholder="Enter nation ID..."
                  className="flex-1 px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-900 text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && searchNation(nation2Id, 2)}
                />
                <button
                  onClick={() => searchNation(nation2Id, 2)}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {nation2Data && (
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-white">{nation2Data.nation_name}</h3>
                <p className="text-gray-400">Leader: {nation2Data.leader_name}</p>
                <p className="text-gray-400">Cities: {nation2Data.num_cities}</p>
                <p className="text-gray-400">Score: {nation2Data.score.toLocaleString()}</p>
                
                <div className="mt-4">
                  <p className="font-medium text-gray-300 mb-2">Current Military:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                    <div>Soldiers: {nation2Data.soldiers.toLocaleString()}</div>
                    <div>Tanks: {nation2Data.tanks.toLocaleString()}</div>
                    <div>Aircraft: {nation2Data.aircraft.toLocaleString()}</div>
                    <div>Ships: {nation2Data.ships.toLocaleString()}</div>
                    <div>Missiles: {nation2Data.missiles.toLocaleString()}</div>
                    <div>Nukes: {nation2Data.nukes.toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Military Configuration
                  </label>
                  <select
                    value={nation2Military}
                    onChange={(e) => setNation2Military(e.target.value as 'current' | 'max')}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-900 text-white"
                  >
                    <option value="current">Use Current Military</option>
                    <option value="max">Use Maximum Military (Full Barracks/Factories/etc.)</option>
                  </select>
                </div>

                {nation2Military === 'max' && (
                  <div className="mt-2 bg-green-950/30 border border-green-400/30 p-3 rounded-md">
                    <p className="text-sm text-green-400 font-medium">Maximum Military Capacity:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-green-300 mt-1">
                      <div>Soldiers: {(nation2Data.num_cities * 15000).toLocaleString()}</div>
                      <div>Tanks: {(nation2Data.num_cities * 1250).toLocaleString()}</div>
                      <div>Aircraft: {(nation2Data.num_cities * 75).toLocaleString()}</div>
                      <div>Ships: {(nation2Data.num_cities * 15).toLocaleString()}</div>
                      <div>Missiles: {nation2Data.num_cities.toLocaleString()}</div>
                      <div>Nukes: {nation2Data.num_cities.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Start War Button */}
      {(battleSettings.gameMode === 'singleplayer' ? (nation1Data && nation2Data) : true) && (
        <div className="text-center">
          <button
            onClick={handleStartWar}
            className="px-8 py-3 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            {battleSettings.gameMode === 'multiplayer' ? 'Enter Multiplayer Room' : 'Start War Simulation'}
          </button>
        </div>
      )}

      {/* Military Building Information */}
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
