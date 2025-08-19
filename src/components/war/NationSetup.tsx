'use client'

import { useState } from 'react'
import { Nation, PWNation, Military, MilitaryCapacity, Resources, SpaceControl } from '@/types/war'

interface NationSetupProps {
  onWarStart: (nation1: Nation, nation2: Nation) => void
}

export default function NationSetup({ onWarStart }: NationSetupProps) {
  const [nation1Name, setNation1Name] = useState('')
  const [nation2Name, setNation2Name] = useState('')
  const [nation1Data, setNation1Data] = useState<PWNation | null>(null)
  const [nation2Data, setNation2Data] = useState<PWNation | null>(null)
  const [nation1Military, setNation1Military] = useState<'current' | 'max'>('max')
  const [nation2Military, setNation2Military] = useState<'current' | 'max'>('max')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const searchNation = async (nationName: string, nationNumber: 1 | 2) => {
    if (!nationName.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/pw/nation?name=${encodeURIComponent(nationName.trim())}`)
      
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
      setError(`Failed to find nation: ${nationName}`)
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
    if (!nation1Data || !nation2Data) {
      setError('Please search for both nations first')
      return
    }

    const nation1 = createNation(nation1Data, nation1Military, false)
    const nation2 = createNation(nation2Data, nation2Military, true)

    onWarStart(nation1, nation2)
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Nation 1 Setup */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Nation 1 (Attacker)</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nation Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nation1Name}
                  onChange={(e) => setNation1Name(e.target.value)}
                  placeholder="Enter nation name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && searchNation(nation1Name, 1)}
                />
                <button
                  onClick={() => searchNation(nation1Name, 1)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Search
                </button>
              </div>
            </div>

            {nation1Data && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg">{nation1Data.nation_name}</h3>
                <p className="text-gray-600">Leader: {nation1Data.leader_name}</p>
                <p className="text-gray-600">Cities: {nation1Data.num_cities}</p>
                <p className="text-gray-600">Score: {nation1Data.score.toLocaleString()}</p>
                
                <div className="mt-4">
                  <p className="font-medium text-gray-700 mb-2">Current Military:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Soldiers: {nation1Data.soldiers.toLocaleString()}</div>
                    <div>Tanks: {nation1Data.tanks.toLocaleString()}</div>
                    <div>Aircraft: {nation1Data.aircraft.toLocaleString()}</div>
                    <div>Ships: {nation1Data.ships.toLocaleString()}</div>
                    <div>Missiles: {nation1Data.missiles.toLocaleString()}</div>
                    <div>Nukes: {nation1Data.nukes.toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Military Configuration
                  </label>
                  <select
                    value={nation1Military}
                    onChange={(e) => setNation1Military(e.target.value as 'current' | 'max')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="current">Use Current Military</option>
                    <option value="max">Use Maximum Military (Full Barracks/Factories/etc.)</option>
                  </select>
                </div>

                {nation1Military === 'max' && (
                  <div className="mt-2 bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-700 font-medium">Maximum Military Capacity:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-blue-600 mt-1">
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
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Nation 2 (Defender)</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nation Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nation2Name}
                  onChange={(e) => setNation2Name(e.target.value)}
                  placeholder="Enter nation name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && searchNation(nation2Name, 2)}
                />
                <button
                  onClick={() => searchNation(nation2Name, 2)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Search
                </button>
              </div>
            </div>

            {nation2Data && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg">{nation2Data.nation_name}</h3>
                <p className="text-gray-600">Leader: {nation2Data.leader_name}</p>
                <p className="text-gray-600">Cities: {nation2Data.num_cities}</p>
                <p className="text-gray-600">Score: {nation2Data.score.toLocaleString()}</p>
                
                <div className="mt-4">
                  <p className="font-medium text-gray-700 mb-2">Current Military:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Soldiers: {nation2Data.soldiers.toLocaleString()}</div>
                    <div>Tanks: {nation2Data.tanks.toLocaleString()}</div>
                    <div>Aircraft: {nation2Data.aircraft.toLocaleString()}</div>
                    <div>Ships: {nation2Data.ships.toLocaleString()}</div>
                    <div>Missiles: {nation2Data.missiles.toLocaleString()}</div>
                    <div>Nukes: {nation2Data.nukes.toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Military Configuration
                  </label>
                  <select
                    value={nation2Military}
                    onChange={(e) => setNation2Military(e.target.value as 'current' | 'max')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="current">Use Current Military</option>
                    <option value="max">Use Maximum Military (Full Barracks/Factories/etc.)</option>
                  </select>
                </div>

                {nation2Military === 'max' && (
                  <div className="mt-2 bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-700 font-medium">Maximum Military Capacity:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-blue-600 mt-1">
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

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Start War Button */}
      {nation1Data && nation2Data && (
        <div className="text-center">
          <button
            onClick={handleStartWar}
            className="px-8 py-3 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Start War Simulation
          </button>
        </div>
      )}

      {/* Military Building Information */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Military Building Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800">Barracks</h4>
            <p className="text-sm text-gray-600 mt-1">Cost: $3,000</p>
            <p className="text-sm text-gray-600">Capacity: 3,000 soldiers</p>
            <p className="text-sm text-gray-600">Max per city: 5</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800">Factories</h4>
            <p className="text-sm text-gray-600 mt-1">Cost: $15,000 + 5 steel</p>
            <p className="text-sm text-gray-600">Capacity: 250 tanks</p>
            <p className="text-sm text-gray-600">Max per city: 5</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800">Hangars</h4>
            <p className="text-sm text-gray-600 mt-1">Cost: $100,000 + 10 aluminum</p>
            <p className="text-sm text-gray-600">Capacity: 15 aircraft</p>
            <p className="text-sm text-gray-600">Max per city: 5</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800">Drydocks</h4>
            <p className="text-sm text-gray-600 mt-1">Cost: $250,000 + 20 steel</p>
            <p className="text-sm text-gray-600">Capacity: 5 ships</p>
            <p className="text-sm text-gray-600">Max per city: 3</p>
          </div>
        </div>
      </div>
    </div>
  )
}
